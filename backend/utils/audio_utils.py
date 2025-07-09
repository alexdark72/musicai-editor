import librosa
import numpy as np
import torch
import torchaudio
from typing import Dict, List, Tuple, Optional
import logging
from pathlib import Path
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

class AudioUtils:
    """Utility per analisi e processamento audio"""
    
    @staticmethod
    async def analyze_audio(file_path: str) -> Dict[str, any]:
        """Analisi completa del file audio"""
        
        try:
            # Esegui analisi in thread separato per non bloccare
            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor() as executor:
                analysis = await loop.run_in_executor(
                    executor,
                    AudioUtils._analyze_audio_sync,
                    file_path
                )
            
            return analysis
            
        except Exception as e:
            logger.error(f"Errore analisi audio {file_path}: {str(e)}")
            raise
    
    @staticmethod
    def _analyze_audio_sync(file_path: str) -> Dict[str, any]:
        """Analisi sincrona del file audio"""
        
        # Carica audio con librosa per analisi
        y, sr = librosa.load(file_path, sr=None)
        
        # Informazioni base
        duration = len(y) / sr
        channels = 1  # librosa carica in mono di default
        
        # Carica con torchaudio per info canali originali
        try:
            waveform, original_sr = torchaudio.load(file_path)
            original_channels = waveform.shape[0]
        except:
            original_channels = 1
            original_sr = sr
        
        # Analisi musicale
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
        
        # Estrazione caratteristiche
        features = AudioUtils._extract_audio_features(y, sr)
        
        # Analisi spettrale
        spectral_analysis = AudioUtils._analyze_spectrum(y, sr)
        
        # Rilevamento key/tonalità
        key_analysis = AudioUtils._analyze_key(y, sr)
        
        return {
            "duration": float(duration),
            "sample_rate": int(sr),
            "original_sample_rate": int(original_sr),
            "channels": int(original_channels),
            "tempo": float(tempo),
            "beats_count": len(beats),
            "file_size": Path(file_path).stat().st_size,
            "format": Path(file_path).suffix.lower(),
            "features": features,
            "spectral": spectral_analysis,
            "key": key_analysis
        }
    
    @staticmethod
    def _extract_audio_features(y: np.ndarray, sr: int) -> Dict[str, float]:
        """Estrazione caratteristiche audio"""
        
        try:
            # MFCC (Mel-frequency cepstral coefficients)
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            
            # Spectral features
            spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
            spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
            
            # Zero crossing rate
            zcr = librosa.feature.zero_crossing_rate(y)[0]
            
            # RMS Energy
            rms = librosa.feature.rms(y=y)[0]
            
            # Chroma features
            chroma = librosa.feature.chroma_stft(y=y, sr=sr)
            
            return {
                "mfcc_mean": float(np.mean(mfccs)),
                "mfcc_std": float(np.std(mfccs)),
                "spectral_centroid_mean": float(np.mean(spectral_centroids)),
                "spectral_centroid_std": float(np.std(spectral_centroids)),
                "spectral_rolloff_mean": float(np.mean(spectral_rolloff)),
                "spectral_bandwidth_mean": float(np.mean(spectral_bandwidth)),
                "zero_crossing_rate_mean": float(np.mean(zcr)),
                "rms_mean": float(np.mean(rms)),
                "rms_std": float(np.std(rms)),
                "chroma_mean": float(np.mean(chroma)),
                "dynamic_range": float(np.max(rms) - np.min(rms))
            }
            
        except Exception as e:
            logger.warning(f"Errore estrazione features: {str(e)}")
            return {}
    
    @staticmethod
    def _analyze_spectrum(y: np.ndarray, sr: int) -> Dict[str, any]:
        """Analisi spettrale dettagliata"""
        
        try:
            # FFT
            fft = np.fft.fft(y)
            magnitude = np.abs(fft)
            
            # Frequenze
            freqs = np.fft.fftfreq(len(fft), 1/sr)
            
            # Analisi per bande di frequenza
            bands = {
                "sub_bass": (20, 60),
                "bass": (60, 250),
                "low_mid": (250, 500),
                "mid": (500, 2000),
                "high_mid": (2000, 4000),
                "presence": (4000, 6000),
                "brilliance": (6000, 20000)
            }
            
            band_energies = {}
            
            for band_name, (low_freq, high_freq) in bands.items():
                # Trova indici per la banda di frequenza
                band_mask = (freqs >= low_freq) & (freqs <= high_freq)
                band_energy = np.sum(magnitude[band_mask] ** 2)
                band_energies[f"{band_name}_energy"] = float(band_energy)
            
            # Frequenza dominante
            dominant_freq_idx = np.argmax(magnitude[:len(magnitude)//2])
            dominant_freq = float(freqs[dominant_freq_idx])
            
            return {
                "dominant_frequency": dominant_freq,
                "spectral_energy_total": float(np.sum(magnitude ** 2)),
                **band_energies
            }
            
        except Exception as e:
            logger.warning(f"Errore analisi spettrale: {str(e)}")
            return {}
    
    @staticmethod
    def _analyze_key(y: np.ndarray, sr: int) -> Dict[str, any]:
        """Analisi tonalità e key"""
        
        try:
            # Chroma features per analisi tonale
            chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
            
            # Template per tonalità maggiori e minori
            major_template = np.array([1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1])
            minor_template = np.array([1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0])
            
            # Profilo cromatico medio
            chroma_profile = np.mean(chroma, axis=1)
            
            # Correlazione con template
            major_correlations = []
            minor_correlations = []
            
            for shift in range(12):
                major_shifted = np.roll(major_template, shift)
                minor_shifted = np.roll(minor_template, shift)
                
                major_corr = np.corrcoef(chroma_profile, major_shifted)[0, 1]
                minor_corr = np.corrcoef(chroma_profile, minor_shifted)[0, 1]
                
                major_correlations.append(major_corr if not np.isnan(major_corr) else 0)
                minor_correlations.append(minor_corr if not np.isnan(minor_corr) else 0)
            
            # Trova migliore correlazione
            best_major_idx = np.argmax(major_correlations)
            best_minor_idx = np.argmax(minor_correlations)
            
            best_major_corr = major_correlations[best_major_idx]
            best_minor_corr = minor_correlations[best_minor_idx]
            
            # Note names
            note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
            
            if best_major_corr > best_minor_corr:
                predicted_key = f"{note_names[best_major_idx]} Major"
                confidence = float(best_major_corr)
            else:
                predicted_key = f"{note_names[best_minor_idx]} Minor"
                confidence = float(best_minor_corr)
            
            return {
                "predicted_key": predicted_key,
                "confidence": confidence,
                "chroma_profile": chroma_profile.tolist()
            }
            
        except Exception as e:
            logger.warning(f"Errore analisi key: {str(e)}")
            return {"predicted_key": "Unknown", "confidence": 0.0}
    
    @staticmethod
    async def align_tempo(audio1_path: str, audio2_path: str, target_tempo: Optional[float] = None) -> Tuple[np.ndarray, np.ndarray, float]:
        """Allineamento tempo tra due tracce audio"""
        
        try:
            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor() as executor:
                result = await loop.run_in_executor(
                    executor,
                    AudioUtils._align_tempo_sync,
                    audio1_path, audio2_path, target_tempo
                )
            
            return result
            
        except Exception as e:
            logger.error(f"Errore allineamento tempo: {str(e)}")
            raise
    
    @staticmethod
    def _align_tempo_sync(audio1_path: str, audio2_path: str, target_tempo: Optional[float] = None) -> Tuple[np.ndarray, np.ndarray, float]:
        """Allineamento sincrono del tempo"""
        
        # Carica audio
        y1, sr1 = librosa.load(audio1_path)
        y2, sr2 = librosa.load(audio2_path)
        
        # Analizza tempo
        tempo1, _ = librosa.beat.beat_track(y=y1, sr=sr1)
        tempo2, _ = librosa.beat.beat_track(y=y2, sr=sr2)
        
        # Determina tempo target
        if target_tempo is None:
            target_tempo = (tempo1 + tempo2) / 2
        
        # Calcola fattori di stretch
        stretch_factor1 = tempo1 / target_tempo
        stretch_factor2 = tempo2 / target_tempo
        
        # Applica time stretching
        y1_stretched = librosa.effects.time_stretch(y1, rate=stretch_factor1)
        y2_stretched = librosa.effects.time_stretch(y2, rate=stretch_factor2)
        
        return y1_stretched, y2_stretched, target_tempo
    
    @staticmethod
    async def detect_beats(audio_path: str) -> Dict[str, any]:
        """Rilevamento beat e struttura ritmica"""
        
        try:
            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor() as executor:
                result = await loop.run_in_executor(
                    executor,
                    AudioUtils._detect_beats_sync,
                    audio_path
                )
            
            return result
            
        except Exception as e:
            logger.error(f"Errore rilevamento beat: {str(e)}")
            raise
    
    @staticmethod
    def _detect_beats_sync(audio_path: str) -> Dict[str, any]:
        """Rilevamento sincrono dei beat"""
        
        # Carica audio
        y, sr = librosa.load(audio_path)
        
        # Rilevamento beat
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
        
        # Onset detection
        onset_frames = librosa.onset.onset_detect(y=y, sr=sr)
        onset_times = librosa.frames_to_time(onset_frames, sr=sr)
        
        # Analisi ritmica
        beat_intervals = np.diff(beats)
        
        return {
            "tempo": float(tempo),
            "beats": beats.tolist(),
            "beat_count": len(beats),
            "onsets": onset_times.tolist(),
            "onset_count": len(onset_times),
            "beat_intervals_mean": float(np.mean(beat_intervals)),
            "beat_intervals_std": float(np.std(beat_intervals)),
            "rhythm_regularity": float(1.0 / (1.0 + np.std(beat_intervals)))
        }
    
    @staticmethod
    def normalize_audio(audio: np.ndarray, target_lufs: float = -23.0) -> np.ndarray:
        """Normalizzazione audio secondo standard LUFS"""
        
        try:
            # Calcola RMS
            rms = np.sqrt(np.mean(audio ** 2))
            
            if rms == 0:
                return audio
            
            # Conversione approssimativa LUFS (semplificata)
            current_lufs = 20 * np.log10(rms) - 0.691
            
            # Calcola gain necessario
            gain_db = target_lufs - current_lufs
            gain_linear = 10 ** (gain_db / 20)
            
            # Applica gain con limitazione
            normalized = audio * gain_linear
            
            # Limita per evitare clipping
            peak = np.max(np.abs(normalized))
            if peak > 0.95:
                normalized = normalized * (0.95 / peak)
            
            return normalized
            
        except Exception as e:
            logger.warning(f"Errore normalizzazione: {str(e)}")
            return audio
    
    @staticmethod
    def apply_fade(audio: np.ndarray, sr: int, fade_in: float = 0.1, fade_out: float = 0.1) -> np.ndarray:
        """Applica fade in/out all'audio"""
        
        try:
            fade_in_samples = int(fade_in * sr)
            fade_out_samples = int(fade_out * sr)
            
            result = audio.copy()
            
            # Fade in
            if fade_in_samples > 0 and len(result) > fade_in_samples:
                fade_curve = np.linspace(0, 1, fade_in_samples)
                result[:fade_in_samples] *= fade_curve
            
            # Fade out
            if fade_out_samples > 0 and len(result) > fade_out_samples:
                fade_curve = np.linspace(1, 0, fade_out_samples)
                result[-fade_out_samples:] *= fade_curve
            
            return result
            
        except Exception as e:
            logger.warning(f"Errore applicazione fade: {str(e)}")
            return audio
    
    @staticmethod
    def calculate_similarity(audio1: np.ndarray, audio2: np.ndarray, sr: int) -> float:
        """Calcola similarità tra due tracce audio"""
        
        try:
            # Assicura stessa lunghezza
            min_len = min(len(audio1), len(audio2))
            audio1 = audio1[:min_len]
            audio2 = audio2[:min_len]
            
            # Estrai features
            mfcc1 = librosa.feature.mfcc(y=audio1, sr=sr, n_mfcc=13)
            mfcc2 = librosa.feature.mfcc(y=audio2, sr=sr, n_mfcc=13)
            
            # Calcola correlazione
            correlation = np.corrcoef(
                mfcc1.flatten(),
                mfcc2.flatten()
            )[0, 1]
            
            return float(correlation) if not np.isnan(correlation) else 0.0
            
        except Exception as e:
            logger.warning(f"Errore calcolo similarità: {str(e)}")
            return 0.0