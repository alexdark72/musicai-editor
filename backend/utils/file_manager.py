import os
import shutil
import zipfile
from pathlib import Path
from typing import Dict, List
import aiofiles
from fastapi import UploadFile
import logging
from datetime import datetime, timedelta
import asyncio

logger = logging.getLogger(__name__)

class FileManager:
    """Gestione file temporanei e cleanup automatico"""
    
    def __init__(self, temp_dir: str = "/app/temp_files"):
        self.temp_dir = Path(temp_dir)
        self.temp_dir.mkdir(exist_ok=True)
        
        # Avvia task di cleanup automatico
        asyncio.create_task(self._auto_cleanup_task())
    
    async def save_uploaded_file(self, file: UploadFile, session_id: str) -> str:
        """Salva file caricato dall'utente"""
        
        # Crea directory sessione
        session_dir = self.temp_dir / session_id
        session_dir.mkdir(exist_ok=True)
        
        # Determina percorso file
        file_ext = Path(file.filename).suffix
        file_path = session_dir / f"original{file_ext}"
        
        try:
            # Salva file in modo asincrono
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            logger.info(f"File salvato: {file_path} ({len(content)} bytes)")
            return str(file_path)
            
        except Exception as e:
            logger.error(f"Errore salvataggio file: {str(e)}")
            # Cleanup in caso di errore
            if file_path.exists():
                file_path.unlink()
            raise
    
    async def create_stems_archive(self, session_id: str, stems_paths: Dict[str, str]) -> str:
        """Crea archivio ZIP con tutte le tracce separate"""
        
        session_dir = self.temp_dir / session_id
        zip_path = session_dir / "stems_archive.zip"
        
        try:
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for stem_name, stem_path in stems_paths.items():
                    if os.path.exists(stem_path):
                        # Aggiungi file allo ZIP con nome pulito
                        arcname = f"{stem_name}.wav"
                        zipf.write(stem_path, arcname)
                        logger.debug(f"Aggiunto a ZIP: {stem_name}")
            
            logger.info(f"Archivio ZIP creato: {zip_path}")
            return str(zip_path)
            
        except Exception as e:
            logger.error(f"Errore creazione archivio: {str(e)}")
            if zip_path.exists():
                zip_path.unlink()
            raise
    
    async def cleanup_session(self, session_id: str) -> bool:
        """Elimina tutti i file di una sessione"""
        
        session_dir = self.temp_dir / session_id
        
        if not session_dir.exists():
            logger.warning(f"Directory sessione non trovata: {session_id}")
            return False
        
        try:
            # Elimina ricorsivamente tutta la directory
            shutil.rmtree(session_dir)
            logger.info(f"Sessione pulita: {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Errore cleanup sessione {session_id}: {str(e)}")
            return False
    
    async def get_session_size(self, session_id: str) -> int:
        """Calcola dimensione totale file di una sessione"""
        
        session_dir = self.temp_dir / session_id
        
        if not session_dir.exists():
            return 0
        
        total_size = 0
        
        try:
            for file_path in session_dir.rglob('*'):
                if file_path.is_file():
                    total_size += file_path.stat().st_size
            
            return total_size
            
        except Exception as e:
            logger.error(f"Errore calcolo dimensione sessione {session_id}: {str(e)}")
            return 0
    
    async def list_session_files(self, session_id: str) -> List[Dict[str, any]]:
        """Lista tutti i file di una sessione"""
        
        session_dir = self.temp_dir / session_id
        files_info = []
        
        if not session_dir.exists():
            return files_info
        
        try:
            for file_path in session_dir.rglob('*'):
                if file_path.is_file():
                    stat = file_path.stat()
                    files_info.append({
                        "name": file_path.name,
                        "path": str(file_path.relative_to(session_dir)),
                        "size": stat.st_size,
                        "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
                    })
            
            return files_info
            
        except Exception as e:
            logger.error(f"Errore lista file sessione {session_id}: {str(e)}")
            return []
    
    async def _auto_cleanup_task(self):
        """Task automatico per pulizia file scaduti"""
        
        while True:
            try:
                await self._cleanup_expired_sessions()
                # Esegui cleanup ogni ora
                await asyncio.sleep(3600)
                
            except Exception as e:
                logger.error(f"Errore auto-cleanup: {str(e)}")
                await asyncio.sleep(300)  # Riprova dopo 5 minuti
    
    async def _cleanup_expired_sessions(self):
        """Elimina sessioni scadute (>24 ore)"""
        
        if not self.temp_dir.exists():
            return
        
        current_time = datetime.now()
        cutoff_time = current_time - timedelta(hours=24)
        
        cleaned_count = 0
        
        try:
            for session_dir in self.temp_dir.iterdir():
                if session_dir.is_dir():
                    # Controlla data creazione directory
                    created_time = datetime.fromtimestamp(session_dir.stat().st_ctime)
                    
                    if created_time < cutoff_time:
                        try:
                            shutil.rmtree(session_dir)
                            cleaned_count += 1
                            logger.info(f"Sessione scaduta eliminata: {session_dir.name}")
                            
                        except Exception as e:
                            logger.error(f"Errore eliminazione sessione scaduta {session_dir.name}: {str(e)}")
            
            if cleaned_count > 0:
                logger.info(f"Auto-cleanup completato: {cleaned_count} sessioni eliminate")
                
        except Exception as e:
            logger.error(f"Errore durante auto-cleanup: {str(e)}")
    
    async def get_disk_usage(self) -> Dict[str, any]:
        """Statistiche utilizzo disco"""
        
        try:
            # Dimensione totale directory temporanea
            total_size = 0
            file_count = 0
            session_count = 0
            
            if self.temp_dir.exists():
                for item in self.temp_dir.iterdir():
                    if item.is_dir():
                        session_count += 1
                        for file_path in item.rglob('*'):
                            if file_path.is_file():
                                total_size += file_path.stat().st_size
                                file_count += 1
            
            # Spazio disponibile su disco
            disk_usage = shutil.disk_usage(self.temp_dir)
            
            return {
                "temp_dir_size": total_size,
                "temp_dir_size_mb": round(total_size / (1024 * 1024), 2),
                "file_count": file_count,
                "session_count": session_count,
                "disk_total": disk_usage.total,
                "disk_used": disk_usage.used,
                "disk_free": disk_usage.free,
                "disk_free_mb": round(disk_usage.free / (1024 * 1024), 2),
                "disk_usage_percent": round((disk_usage.used / disk_usage.total) * 100, 2)
            }
            
        except Exception as e:
            logger.error(f"Errore calcolo utilizzo disco: {str(e)}")
            return {}
    
    def validate_file_type(self, filename: str) -> bool:
        """Valida tipo di file supportato"""
        
        allowed_extensions = {".mp3", ".wav", ".flac", ".m4a", ".aac"}
        file_ext = Path(filename).suffix.lower()
        
        return file_ext in allowed_extensions
    
    def get_safe_filename(self, filename: str) -> str:
        """Genera nome file sicuro"""
        
        # Rimuovi caratteri pericolosi
        safe_chars = "-_.() abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        safe_filename = ''.join(c for c in filename if c in safe_chars)
        
        # Limita lunghezza
        if len(safe_filename) > 100:
            name, ext = os.path.splitext(safe_filename)
            safe_filename = name[:95] + ext
        
        return safe_filename or "audio_file"
    
    async def create_backup(self, session_id: str) -> str:
        """Crea backup di una sessione"""
        
        session_dir = self.temp_dir / session_id
        backup_path = self.temp_dir / f"backup_{session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
        
        if not session_dir.exists():
            raise FileNotFoundError(f"Sessione non trovata: {session_id}")
        
        try:
            with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file_path in session_dir.rglob('*'):
                    if file_path.is_file():
                        arcname = str(file_path.relative_to(session_dir))
                        zipf.write(file_path, arcname)
            
            logger.info(f"Backup creato: {backup_path}")
            return str(backup_path)
            
        except Exception as e:
            logger.error(f"Errore creazione backup: {str(e)}")
            if backup_path.exists():
                backup_path.unlink()
            raise