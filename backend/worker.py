#!/usr/bin/env python3
"""
AI Worker per elaborazione separazione audio in background
Gestisce code Redis e processa richieste di separazione
"""

import asyncio
import json
import logging
import os
import signal
import sys
from datetime import datetime
from typing import Dict, Optional

import redis
import torch
from pathlib import Path

# Import moduli locali
from models.demucs_model import DemucsModel
from audio_processor import AudioProcessor
from utils.file_manager import FileManager

# Configurazione logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('/app/logs/worker.log')
    ]
)
logger = logging.getLogger(__name__)

class AIWorker:
    """Worker per elaborazione AI in background"""
    
    def __init__(self):
        self.redis_client = None
        self.audio_processor = None
        self.demucs_model = None
        self.file_manager = None
        
        self.running = False
        self.worker_id = f"worker_{os.getpid()}"
        
        # Statistiche worker
        self.stats = {
            "started_at": datetime.now().isoformat(),
            "jobs_processed": 0,
            "jobs_failed": 0,
            "total_processing_time": 0.0,
            "current_job": None,
            "gpu_available": torch.cuda.is_available(),
            "gpu_memory_total": 0,
            "gpu_memory_used": 0
        }
        
        if torch.cuda.is_available():
            self.stats["gpu_memory_total"] = torch.cuda.get_device_properties(0).total_memory
    
    async def initialize(self):
        """Inizializzazione worker"""
        try:
            logger.info(f"Inizializzazione {self.worker_id}...")
            
            # Connessione Redis
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            self.redis_client = redis.Redis.from_url(redis_url)
            
            # Test connessione
            self.redis_client.ping()
            logger.info("Connessione Redis stabilita")
            
            # Inizializza componenti AI
            self.audio_processor = AudioProcessor()
            await self.audio_processor.initialize()
            
            self.demucs_model = self.audio_processor.demucs_model
            self.file_manager = self.audio_processor.file_manager
            
            # Registra worker in Redis
            await self._register_worker()
            
            logger.info(f"{self.worker_id} inizializzato con successo")
            
        except Exception as e:
            logger.error(f"Errore inizializzazione worker: {str(e)}")
            raise
    
    async def start(self):
        """Avvia il worker"""
        self.running = True
        logger.info(f"{self.worker_id} avviato")
        
        # Setup signal handlers
        signal.signal(signal.SIGTERM, self._signal_handler)
        signal.signal(signal.SIGINT, self._signal_handler)
        
        try:
            while self.running:
                await self._process_queue()
                await asyncio.sleep(1)  # Polling interval
                
        except Exception as e:
            logger.error(f"Errore nel loop principale: {str(e)}")
        finally:
            await self._cleanup()
    
    async def _process_queue(self):
        """Processa code di elaborazione"""
        try:
            # Controlla coda prioritaria
            job_data = self.redis_client.blpop(["queue:separation:priority"], timeout=1)
            
            if not job_data:
                # Controlla coda normale
                job_data = self.redis_client.blpop(["queue:separation:normal"], timeout=1)
            
            if job_data:
                queue_name, job_json = job_data
                job = json.loads(job_json)
                
                await self._process_job(job)
                
        except redis.RedisError as e:
            logger.error(f"Errore Redis: {str(e)}")
            await asyncio.sleep(5)  # Attendi prima di riprovare
        except Exception as e:
            logger.error(f"Errore processamento coda: {str(e)}")
    
    async def _process_job(self, job: Dict):
        """Processa singolo job di separazione"""
        session_id = job.get("session_id")
        job_type = job.get("type", "separation")
        
        start_time = asyncio.get_event_loop().time()
        
        try:
            logger.info(f"Inizio elaborazione job: {session_id} (tipo: {job_type})")
            
            # Aggiorna stato in Redis
            self.stats["current_job"] = session_id
            await self._update_job_status(session_id, "processing", {
                "worker_id": self.worker_id,
                "started_at": datetime.now().isoformat()
            })
            
            # Processa in base al tipo
            if job_type == "separation":
                result = await self._process_separation_job(job)
            elif job_type == "mashup":
                result = await self._process_mashup_job(job)
            else:
                raise ValueError(f"Tipo job non supportato: {job_type}")
            
            # Aggiorna stato completato
            processing_time = asyncio.get_event_loop().time() - start_time
            
            await self._update_job_status(session_id, "completed", {
                "result": result,
                "processing_time": processing_time,
                "completed_at": datetime.now().isoformat(),
                "worker_id": self.worker_id
            })
            
            # Aggiorna statistiche
            self.stats["jobs_processed"] += 1
            self.stats["total_processing_time"] += processing_time
            self.stats["current_job"] = None
            
            logger.info(f"Job completato: {session_id} ({processing_time:.2f}s)")
            
        except Exception as e:
            processing_time = asyncio.get_event_loop().time() - start_time
            
            logger.error(f"Errore elaborazione job {session_id}: {str(e)}")
            
            # Aggiorna stato errore
            await self._update_job_status(session_id, "error", {
                "error": str(e),
                "processing_time": processing_time,
                "failed_at": datetime.now().isoformat(),
                "worker_id": self.worker_id
            })
            
            self.stats["jobs_failed"] += 1
            self.stats["current_job"] = None
    
    async def _process_separation_job(self, job: Dict) -> Dict:
        """Processa job di separazione audio"""
        session_id = job["session_id"]
        audio_path = job["audio_path"]
        options = job.get("options", {})
        
        # Elaborazione completa
        result = await self.audio_processor.process_full_separation(
            audio_path, session_id, options
        )
        
        return result
    
    async def _process_mashup_job(self, job: Dict) -> Dict:
        """Processa job di mashup"""
        session_id = job["session_id"]
        audio1_path = job["audio1_path"]
        audio2_path = job["audio2_path"]
        options = job.get("options", {})
        
        # Creazione mashup
        result = await self.audio_processor.create_mashup(
            audio1_path, audio2_path, session_id, options
        )
        
        return result
    
    async def _update_job_status(self, session_id: str, status: str, data: Dict):
        """Aggiorna stato job in Redis"""
        try:
            # Recupera dati esistenti
            existing_data = self.redis_client.get(f"session:{session_id}")
            if existing_data:
                session_data = json.loads(existing_data)
            else:
                session_data = {"session_id": session_id}
            
            # Aggiorna stato
            session_data["status"] = status
            session_data.update(data)
            
            # Salva in Redis
            self.redis_client.setex(
                f"session:{session_id}",
                86400,  # 24 ore
                json.dumps(session_data)
            )
            
        except Exception as e:
            logger.error(f"Errore aggiornamento stato job: {str(e)}")
    
    async def _register_worker(self):
        """Registra worker in Redis"""
        try:
            worker_info = {
                "worker_id": self.worker_id,
                "started_at": self.stats["started_at"],
                "gpu_available": self.stats["gpu_available"],
                "status": "active"
            }
            
            self.redis_client.setex(
                f"worker:{self.worker_id}",
                300,  # 5 minuti TTL
                json.dumps(worker_info)
            )
            
            # Heartbeat task
            asyncio.create_task(self._heartbeat_task())
            
        except Exception as e:
            logger.error(f"Errore registrazione worker: {str(e)}")
    
    async def _heartbeat_task(self):
        """Task heartbeat per mantenere worker registrato"""
        while self.running:
            try:
                # Aggiorna statistiche GPU
                if torch.cuda.is_available():
                    self.stats["gpu_memory_used"] = torch.cuda.memory_allocated(0)
                
                # Aggiorna info worker
                worker_info = {
                    "worker_id": self.worker_id,
                    "started_at": self.stats["started_at"],
                    "last_heartbeat": datetime.now().isoformat(),
                    "stats": self.stats,
                    "status": "active" if self.running else "stopping"
                }
                
                self.redis_client.setex(
                    f"worker:{self.worker_id}",
                    300,  # 5 minuti TTL
                    json.dumps(worker_info)
                )
                
                await asyncio.sleep(60)  # Heartbeat ogni minuto
                
            except Exception as e:
                logger.error(f"Errore heartbeat: {str(e)}")
                await asyncio.sleep(30)
    
    def _signal_handler(self, signum, frame):
        """Handler per segnali di terminazione"""
        logger.info(f"Ricevuto segnale {signum}, arresto worker...")
        self.running = False
    
    async def _cleanup(self):
        """Cleanup risorse worker"""
        try:
            logger.info(f"Cleanup {self.worker_id}...")
            
            # Rimuovi worker da Redis
            self.redis_client.delete(f"worker:{self.worker_id}")
            
            # Cleanup modelli AI
            if hasattr(self.demucs_model, '__del__'):
                del self.demucs_model
            
            # Cleanup GPU memory
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            logger.info(f"{self.worker_id} terminato")
            
        except Exception as e:
            logger.error(f"Errore cleanup: {str(e)}")

async def main():
    """Funzione principale worker"""
    worker = AIWorker()
    
    try:
        await worker.initialize()
        await worker.start()
    except KeyboardInterrupt:
        logger.info("Interruzione da tastiera")
    except Exception as e:
        logger.error(f"Errore fatale worker: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    # Crea directory logs se non esiste
    os.makedirs("/app/logs", exist_ok=True)
    
    # Avvia worker
    asyncio.run(main())