import asyncio
import logging
from typing import Dict, List, Optional, Tuple
import numpy as np
import torch
from pathlib import Path

from models.demucs_model import DemucsModel
from utils.audio_utils import AudioUtils
from utils.file_manager import FileManager

logger = logging.getLogger(__name__)

class AudioProcessor:
    """Processore audio principale per orchestrare tutte le operazioni"""
    
    def __init__(self):
        self.demucs_model = DemucsModel()
        self.audio_utils = AudioUtils()
        self.file_manager = FileManager()
        
        # Cache per risultati di elaborazione
        self._processing_cache = {}
        
        # Statistiche performance
        self.stats = {
            "total_processed": 0,
            "total_processing_time": 0.0,
            "average_processing_time": 0.0,
            "gpu_utilization": 0.0
        }
    
    async def initialize(self):
        """Inizializzazione del processore"""
        try:
            logger.info("Inizializzazione AudioProcessor...")
            
            # Carica modello Demucs
            await self.demucs_model.load_model()
            
            logger.info("AudioProcessor inizializzato con successo")
            
        except Exception as e:
            logger.error(f"Errore inizializzazione AudioProcessor: {str(e)}")
            raise
    
    async def process_full_separation(self, audio_path: str, session_id: str, 
                                    options: Optional[Dict] = None) -> Dict[str, any]:
        """Elaborazione completa: analisi + separazione + post-processing"""
        
        start_time = asyncio.get_event_loop().time()
        
        try:
            logger.info(f"Avvio elaborazione completa per sessione: {session_id}")
            
            # Opzioni di default
            if options is None:
                options = {}
            
            processing_options = {
                "normalize_output": options.get("normalize_output", True),
                "apply_fade": options.get("apply_fade", True),
                "target_lufs": options.get("target_lufs", -23.0),
                "fade_duration": options.get("fade_duration", 0.1),
                "export_format": options.get("export_format", "wav"),
                "quality": options.get("quality", "high")
            }
            
            # 1. Analisi preliminare
            logger.info(f"Fase 1: Analisi audio - {session_id}")
            audio_analysis = await self.audio_utils.analyze_audio(audio_path)
            
            # 2. Separazione AI
            logger.info(f"Fase 2: Separazione AI - {session_id}")
            stems_paths = await self.demucs_model.separate_audio(audio_path, session_id)
            
            # 3. Post-processing
            logger.info(f"Fase 3: Post-processing - {session_id}")
            processed_stems = await self._post_process_stems(
                stems_paths, session_id, processing_options
            )
            
            # 4. Analisi qualità
            logger.info(f"Fase 4: Analisi qualità - {session_id}")
            quality_analysis = await self._analyze_separation_quality(
                audio_path, processed_stems
            )
            
            # 5. Generazione metadati
            processing_time = asyncio.get_event_loop().time() - start_time
            
            result = {
                "session_id": session_id,
                "status": "completed",
                "processing_time": processing_time,
                "original_analysis": audio_analysis,
                "stems_paths": processed_stems,
                "quality_analysis": quality_analysis,
                "processing_options": processing_options,
                "stems_count": len(processed_stems)
            }
            
            # Aggiorna statistiche
            await self._update_stats(processing_time)
            
            logger.info(f"Elaborazione completata: {session_id} ({processing_time:.2f}s)")
            return result
            
        except Exception as e:
            processing_time = asyncio.get_event_loop().time() - start_time
            logger.error(f"Errore elaborazione {session_id}: {str(e)} (dopo {processing_time:.2f}s)")
            
            return {
                "session_id": session_id,
                "status": "error",
                "error": str(e),
                "processing_time": processing_time
            }
    
    async def _post_process_stems(self, stems_paths: Dict[str, str], 
                                session_id: str, options: Dict) -> Dict[str, str]:
        """Post-processing delle tracce separate"""
        
        processed_stems = {}
        
        try:
            for stem_name, stem_path in stems_paths.items():
                logger.debug(f"Post-processing: {stem_name}")
                
                # Carica audio
                import torchaudio
                waveform, sample_rate = torchaudio.load(stem_path)
                audio_np = waveform.numpy()[0]  # Converti a numpy, primo canale
                
                # Normalizzazione
                if options.get("normalize_output", True):
                    audio_np = self.audio_utils.normalize_audio(
                        audio_np, 
                        target_lufs=options.get("target_lufs", -23.0)
                    )
                
                # Fade in/out
                if options.get("apply_fade", True):
                    fade_duration = options.get("fade_duration", 0.1)
                    audio_np = self.audio_utils.apply_fade(
                        audio_np, sample_rate, fade_duration, fade_duration
                    )
                
                # Salva versione processata
                processed_path = Path(stem_path).parent / f"{stem_name}_processed.wav"
                
                # Converti back a tensor per salvataggio
                processed_tensor = torch.from_numpy(audio_np).unsqueeze(0)
                torchaudio.save(
                    str(processed_path),
                    processed_tensor,
                    sample_rate,
                    format="wav"
                )
                
                processed_stems[stem_name] = str(processed_path)
            
            return processed_stems
            
        except Exception as e:
            logger.error(f"Errore post-processing: {str(e)}")
            # Fallback: ritorna stems originali
            return stems_paths
    
    async def _analyze_separation_quality(self, original_path: str, 
                                        stems_paths: Dict[str, str]) -> Dict[str, any]:
        """Analisi qualità della separazione"""
        
        try:
            quality_metrics = {
                "overall_score": 0.0,
                "stem_qualities": {},
                "separation_artifacts": {},
                "frequency_coverage": {}
            }
            
            # Carica audio originale
            import torchaudio
            original_waveform, sr = torchaudio.load(original_path)
            original_audio = original_waveform.numpy()[0]
            
            stem_scores = []
            
            for stem_name, stem_path in stems_paths.items():
                try:
                    # Carica stem
                    stem_waveform, _ = torchaudio.load(stem_path)
                    stem_audio = stem_waveform.numpy()[0]
                    
                    # Assicura stessa lunghezza
                    min_len = min(len(original_audio), len(stem_audio))
                    original_segment = original_audio[:min_len]
                    stem_segment = stem_audio[:min_len]
                    
                    # Calcola metriche qualità
                    stem_quality = await self._calculate_stem_quality(
                        original_segment, stem_segment, sr
                    )
                    
                    quality_metrics["stem_qualities"][stem_name] = stem_quality
                    stem_scores.append(stem_quality.get("overall_score", 0.0))
                    
                except Exception as e:
                    logger.warning(f"Errore analisi qualità stem {stem_name}: {str(e)}")
                    quality_metrics["stem_qualities"][stem_name] = {"error": str(e)}
            
            # Score complessivo
            if stem_scores:
                quality_metrics["overall_score"] = float(np.mean(stem_scores))
            
            return quality_metrics
            
        except Exception as e:
            logger.error(f"Errore analisi qualità: {str(e)}")
            return {"error": str(e)}
    
    async def _calculate_stem_quality(self, original: np.ndarray, 
                                    stem: np.ndarray, sr: int) -> Dict[str, float]:
        """Calcola metriche di qualità per un singolo stem"""
        
        try:
            # Signal-to-Noise Ratio (approssimato)
            signal_power = np.mean(stem ** 2)
            noise_power = np.mean((original - stem) ** 2)
            
            if noise_power > 0:
                snr = 10 * np.log10(signal_power / noise_power)
            else:
                snr = float('inf')
            
            # Correlazione con originale
            correlation = np.corrcoef(original, stem)[0, 1]
            if np.isnan(correlation):
                correlation = 0.0
            
            # Analisi spettrale
            original_fft = np.fft.fft(original)
            stem_fft = np.fft.fft(stem)
            
            spectral_similarity = np.corrcoef(
                np.abs(original_fft), 
                np.abs(stem_fft)
            )[0, 1]
            
            if np.isnan(spectral_similarity):
                spectral_similarity = 0.0
            
            # Dynamic range
            dynamic_range = 20 * np.log10(np.max(np.abs(stem)) / (np.mean(np.abs(stem)) + 1e-10))
            
            # Score complessivo (weighted average)
            overall_score = (
                0.4 * max(0, min(1, (snr + 20) / 40)) +  # SNR normalizzato
                0.3 * max(0, correlation) +  # Correlazione
                0.2 * max(0, spectral_similarity) +  # Similarità spettrale
                0.1 * max(0, min(1, dynamic_range / 40))  # Dynamic range normalizzato
            )
            
            return {
                "snr": float(snr),
                "correlation": float(correlation),
                "spectral_similarity": float(spectral_similarity),
                "dynamic_range": float(dynamic_range),
                "overall_score": float(overall_score)
            }
            
        except Exception as e:
            logger.warning(f"Errore calcolo qualità stem: {str(e)}")
            return {"error": str(e), "overall_score": 0.0}
    
    async def create_mashup(self, audio1_path: str, audio2_path: str, 
                          session_id: str, mashup_options: Dict) -> Dict[str, any]:
        """Crea mashup automatico tra due tracce"""
        
        try:
            logger.info(f"Creazione mashup per sessione: {session_id}")
            
            # Analizza entrambe le tracce
            analysis1 = await self.audio_utils.analyze_audio(audio1_path)
            analysis2 = await self.audio_utils.analyze_audio(audio2_path)
            
            # Allineamento tempo
            target_tempo = mashup_options.get("target_tempo")
            aligned_audio1, aligned_audio2, final_tempo = await self.audio_utils.align_tempo(
                audio1_path, audio2_path, target_tempo
            )
            
            # Separazione di entrambe le tracce
            stems1 = await self.demucs_model.separate_audio(audio1_path, f"{session_id}_track1")
            stems2 = await self.demucs_model.separate_audio(audio2_path, f"{session_id}_track2")
            
            # Creazione mashup intelligente
            mashup_result = await self._create_intelligent_mashup(
                stems1, stems2, mashup_options, session_id
            )
            
            return {
                "session_id": session_id,
                "status": "completed",
                "mashup_path": mashup_result["mashup_path"],
                "analysis1": analysis1,
                "analysis2": analysis2,
                "final_tempo": final_tempo,
                "mashup_options": mashup_options
            }
            
        except Exception as e:
            logger.error(f"Errore creazione mashup: {str(e)}")
            return {"session_id": session_id, "status": "error", "error": str(e)}
    
    async def _create_intelligent_mashup(self, stems1: Dict[str, str], 
                                       stems2: Dict[str, str], 
                                       options: Dict, session_id: str) -> Dict[str, any]:
        """Creazione intelligente del mashup"""
        
        # Strategia di mixaggio basata su opzioni
        mix_strategy = options.get("strategy", "vocal_instrumental")
        
        if mix_strategy == "vocal_instrumental":
            # Voce da traccia 1, strumentale da traccia 2
            selected_stems = {
                "vocals": stems1.get("vocals"),
                "drums": stems2.get("drums"),
                "bass": stems2.get("bass"),
                "other": stems2.get("other")
            }
        elif mix_strategy == "drums_swap":
            # Scambia solo la batteria
            selected_stems = {
                "vocals": stems1.get("vocals"),
                "drums": stems2.get("drums"),
                "bass": stems1.get("bass"),
                "other": stems1.get("other")
            }
        else:
            # Mix bilanciato
            selected_stems = stems1  # Default
        
        # Combina stems selezionati
        mashup_path = await self._combine_stems(selected_stems, session_id, options)
        
        return {"mashup_path": mashup_path}
    
    async def _combine_stems(self, stems: Dict[str, str], 
                           session_id: str, options: Dict) -> str:
        """Combina stems in un mix finale"""
        
        try:
            import torchaudio
            
            combined_audio = None
            sample_rate = None
            
            for stem_name, stem_path in stems.items():
                if stem_path and Path(stem_path).exists():
                    waveform, sr = torchaudio.load(stem_path)
                    
                    if sample_rate is None:
                        sample_rate = sr
                        combined_audio = waveform
                    else:
                        # Assicura stessa lunghezza
                        min_len = min(combined_audio.shape[1], waveform.shape[1])
                        combined_audio = combined_audio[:, :min_len] + waveform[:, :min_len]
            
            # Normalizza mix finale
            if combined_audio is not None:
                peak = torch.max(torch.abs(combined_audio))
                if peak > 0.95:
                    combined_audio = combined_audio * (0.95 / peak)
                
                # Salva mix finale
                output_path = Path(f"/app/temp_files/{session_id}/mashup_final.wav")
                output_path.parent.mkdir(exist_ok=True)
                
                torchaudio.save(
                    str(output_path),
                    combined_audio,
                    sample_rate,
                    format="wav"
                )
                
                return str(output_path)
            
            raise ValueError("Nessun stem valido trovato per il mix")
            
        except Exception as e:
            logger.error(f"Errore combinazione stems: {str(e)}")
            raise
    
    async def _update_stats(self, processing_time: float):
        """Aggiorna statistiche performance"""
        
        self.stats["total_processed"] += 1
        self.stats["total_processing_time"] += processing_time
        self.stats["average_processing_time"] = (
            self.stats["total_processing_time"] / self.stats["total_processed"]
        )
        
        # GPU utilization (se disponibile)
        if torch.cuda.is_available():
            try:
                self.stats["gpu_utilization"] = torch.cuda.utilization()
            except:
                pass
    
    def get_stats(self) -> Dict[str, any]:
        """Ritorna statistiche correnti"""
        return self.stats.copy()
    
    async def cleanup_session(self, session_id: str):
        """Pulizia risorse sessione"""
        try:
            await self.file_manager.cleanup_session(session_id)
            
            # Rimuovi da cache se presente
            if session_id in self._processing_cache:
                del self._processing_cache[session_id]
                
        except Exception as e:
            logger.error(f"Errore cleanup sessione {session_id}: {str(e)}")