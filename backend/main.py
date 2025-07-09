from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import os
import uuid
import asyncio
from typing import List, Optional
import redis
import json
from datetime import datetime, timedelta
import logging
from pathlib import Path

from audio_processor import AudioProcessor
from models.demucs_model import DemucsModel
from utils.file_manager import FileManager
from utils.audio_utils import AudioUtils

# Configurazione logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MusicAI Editor API",
    description="API per separazione audio AI con 16 tracce",
    version="1.0.0"
)

# CORS per permettere richieste dal frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In produzione, specificare domini specifici
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inizializzazione servizi
redis_client = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
audio_processor = AudioProcessor()
file_manager = FileManager()
demucs_model = DemucsModel()

@app.on_event("startup")
async def startup_event():
    """Inizializzazione dell'applicazione"""
    logger.info("Avvio MusicAI Editor API...")
    
    # Carica modello Demucs
    await demucs_model.load_model()
    
    # Crea directory temporanee
    os.makedirs("/app/temp_files", exist_ok=True)
    os.makedirs("/app/models", exist_ok=True)
    
    logger.info("API avviata con successo!")

@app.get("/")
async def root():
    return {"message": "MusicAI Editor API", "version": "1.0.0", "status": "running"}

@app.get("/health")
async def health_check():
    """Controllo stato dell'API"""
    try:
        # Test connessione Redis
        redis_client.ping()
        redis_status = "connected"
    except:
        redis_status = "disconnected"
    
    return {
        "status": "healthy",
        "redis": redis_status,
        "gpu_available": demucs_model.gpu_available,
        "model_loaded": demucs_model.is_loaded
    }

@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    """Upload di file audio per elaborazione"""
    
    # Validazione formato file
    allowed_formats = [".mp3", ".wav", ".flac"]
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_formats:
        raise HTTPException(
            status_code=400, 
            detail=f"Formato non supportato. Formati accettati: {', '.join(allowed_formats)}"
        )
    
    # Generazione ID univoco per la sessione
    session_id = str(uuid.uuid4())
    
    try:
        # Salvataggio file temporaneo
        file_path = await file_manager.save_uploaded_file(file, session_id)
        
        # Analisi preliminare del file
        audio_info = await AudioUtils.analyze_audio(file_path)
        
        # Salvataggio metadati in Redis
        session_data = {
            "session_id": session_id,
            "original_filename": file.filename,
            "file_path": file_path,
            "audio_info": audio_info,
            "status": "uploaded",
            "created_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(hours=24)).isoformat()
        }
        
        redis_client.setex(
            f"session:{session_id}", 
            86400,  # 24 ore
            json.dumps(session_data)
        )
        
        logger.info(f"File caricato: {file.filename} (Session: {session_id})")
        
        return {
            "session_id": session_id,
            "filename": file.filename,
            "audio_info": audio_info,
            "status": "uploaded"
        }
        
    except Exception as e:
        logger.error(f"Errore upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Errore durante l'upload: {str(e)}")

@app.post("/separate/{session_id}")
async def separate_audio(session_id: str, background_tasks: BackgroundTasks):
    """Avvia separazione audio in 16 tracce"""
    
    # Recupera dati sessione
    session_data = redis_client.get(f"session:{session_id}")
    if not session_data:
        raise HTTPException(status_code=404, detail="Sessione non trovata")
    
    session_data = json.loads(session_data)
    
    if session_data["status"] != "uploaded":
        raise HTTPException(status_code=400, detail="File già in elaborazione o completato")
    
    # Aggiorna stato a "processing"
    session_data["status"] = "processing"
    session_data["processing_started_at"] = datetime.now().isoformat()
    
    redis_client.setex(
        f"session:{session_id}", 
        86400,
        json.dumps(session_data)
    )
    
    # Avvia elaborazione in background
    background_tasks.add_task(process_audio_separation, session_id)
    
    logger.info(f"Avviata separazione per sessione: {session_id}")
    
    return {
        "session_id": session_id,
        "status": "processing",
        "message": "Separazione audio avviata"
    }

async def process_audio_separation(session_id: str):
    """Elaborazione separazione audio (background task)"""
    try:
        # Recupera dati sessione
        session_data = json.loads(redis_client.get(f"session:{session_id}"))
        file_path = session_data["file_path"]
        
        logger.info(f"Inizio elaborazione separazione: {session_id}")
        
        # Separazione con Demucs (16 stems)
        stems_paths = await demucs_model.separate_audio(file_path, session_id)
        
        # Aggiorna stato completato
        session_data["status"] = "completed"
        session_data["stems_paths"] = stems_paths
        session_data["processing_completed_at"] = datetime.now().isoformat()
        
        redis_client.setex(
            f"session:{session_id}", 
            86400,
            json.dumps(session_data)
        )
        
        logger.info(f"Separazione completata: {session_id}")
        
    except Exception as e:
        logger.error(f"Errore durante separazione {session_id}: {str(e)}")
        
        # Aggiorna stato errore
        session_data = json.loads(redis_client.get(f"session:{session_id}"))
        session_data["status"] = "error"
        session_data["error"] = str(e)
        
        redis_client.setex(
            f"session:{session_id}", 
            86400,
            json.dumps(session_data)
        )

@app.get("/status/{session_id}")
async def get_status(session_id: str):
    """Controllo stato elaborazione"""
    
    session_data = redis_client.get(f"session:{session_id}")
    if not session_data:
        raise HTTPException(status_code=404, detail="Sessione non trovata")
    
    session_data = json.loads(session_data)
    
    return {
        "session_id": session_id,
        "status": session_data["status"],
        "created_at": session_data.get("created_at"),
        "processing_started_at": session_data.get("processing_started_at"),
        "processing_completed_at": session_data.get("processing_completed_at"),
        "error": session_data.get("error")
    }

@app.get("/download/{session_id}/stems")
async def download_stems(session_id: str):
    """Download di tutte le tracce separate"""
    
    session_data = redis_client.get(f"session:{session_id}")
    if not session_data:
        raise HTTPException(status_code=404, detail="Sessione non trovata")
    
    session_data = json.loads(session_data)
    
    if session_data["status"] != "completed":
        raise HTTPException(status_code=400, detail="Elaborazione non completata")
    
    # Crea archivio ZIP con tutte le tracce
    zip_path = await file_manager.create_stems_archive(session_id, session_data["stems_paths"])
    
    return FileResponse(
        zip_path,
        media_type="application/zip",
        filename=f"stems_{session_id}.zip"
    )

@app.get("/download/{session_id}/stem/{stem_name}")
async def download_single_stem(session_id: str, stem_name: str):
    """Download di una singola traccia"""
    
    session_data = redis_client.get(f"session:{session_id}")
    if not session_data:
        raise HTTPException(status_code=404, detail="Sessione non trovata")
    
    session_data = json.loads(session_data)
    
    if session_data["status"] != "completed":
        raise HTTPException(status_code=400, detail="Elaborazione non completata")
    
    stems_paths = session_data["stems_paths"]
    
    if stem_name not in stems_paths:
        raise HTTPException(status_code=404, detail="Traccia non trovata")
    
    stem_path = stems_paths[stem_name]
    
    return FileResponse(
        stem_path,
        media_type="audio/wav",
        filename=f"{stem_name}_{session_id}.wav"
    )

@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Eliminazione manuale sessione e file"""
    
    try:
        # Elimina file temporanei
        await file_manager.cleanup_session(session_id)
        
        # Elimina dati da Redis
        redis_client.delete(f"session:{session_id}")
        
        logger.info(f"Sessione eliminata: {session_id}")
        
        return {"message": "Sessione eliminata con successo"}
        
    except Exception as e:
        logger.error(f"Errore eliminazione sessione {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Errore durante l'eliminazione")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)