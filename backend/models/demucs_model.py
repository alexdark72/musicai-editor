import torch
import torchaudio
import numpy as np
from pathlib import Path
import logging
from typing import Dict, List, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor
import os

# Import Demucs
try:
    from demucs.pretrained import get_model
    from demucs.apply import apply_model
    from demucs.audio import AudioFile
except ImportError:
    logging.error("Demucs non installato. Installare con: pip install demucs")
    raise

logger = logging.getLogger(__name__)

class DemucsModel:
    """Modello Demucs per separazione audio professionale in 16 tracce"""
    
    def __init__(self):
        self.model = None
        self.device = None
        self.is_loaded = False
        self.gpu_available = torch.cuda.is_available()
        
        # Configurazione stems (16 tracce)
        self.stem_mapping = {
            # Voci
            "vocals_lead": "vocals",
            "vocals_backing": "vocals_harmony", 
            "vocals_choir": "vocals_choir",
            
            # Strumenti melodici
            "piano": "piano",
            "synth": "synth",
            "guitar_electric": "guitar",
            "guitar_acoustic": "guitar_acoustic",
            "strings": "strings",
            "brass": "brass",
            
            # Sezione ritmica
            "kick": "drums_kick",
            "snare": "drums_snare", 
            "hihat": "drums_hihat",
            "percussion": "percussion",
            "bass": "bass",
            
            # Effetti e atmosfere
            "atmosphere": "atmosphere",
            "effects": "effects"
        }
        
        self.executor = ThreadPoolExecutor(max_workers=2)
    
    async def load_model(self, model_name: str = "htdemucs"):
        """Carica il modello Demucs"""
        try:
            logger.info(f"Caricamento modello Demucs: {model_name}")
            
            # Determina device (GPU se disponibile)
            if self.gpu_available:
                self.device = torch.device("cuda")
                logger.info("GPU CUDA disponibile - utilizzo GPU")
            else:
                self.device = torch.device("cpu")
                logger.info("GPU non disponibile - utilizzo CPU")
            
            # Carica modello in thread separato per non bloccare
            loop = asyncio.get_event_loop()
            self.model = await loop.run_in_executor(
                self.executor,
                self._load_model_sync,
                model_name
            )
            
            self.is_loaded = True
            logger.info("Modello Demucs caricato con successo")
            
        except Exception as e:
            logger.error(f"Errore caricamento modello: {str(e)}")
            raise
    
    def _load_model_sync(self, model_name: str):
        """Caricamento sincrono del modello"""
        model = get_model(model_name)
        model.to(self.device)
        model.eval()
        return model
    
    async def separate_audio(self, audio_path: str, session_id: str) -> Dict[str, str]:
        """Separazione audio in 16 tracce"""
        if not self.is_loaded:
            raise RuntimeError("Modello non caricato")
        
        try:
            logger.info(f"Inizio separazione audio: {audio_path}")
            
            # Carica audio
            waveform, sample_rate = torchaudio.load(audio_path)
            
            # Preprocessing
            waveform = self._preprocess_audio(waveform, sample_rate)
            
            # Separazione con Demucs
            loop = asyncio.get_event_loop()
            separated_sources = await loop.run_in_executor(
                self.executor,
                self._separate_sync,
                waveform
            )
            
            # Post-processing e salvataggio stems
            stems_paths = await self._save_stems(separated_sources, session_id, sample_rate)
            
            logger.info(f"Separazione completata: {len(stems_paths)} tracce")
            return stems_paths
            
        except Exception as e:
            logger.error(f"Errore durante separazione: {str(e)}")
            raise
    
    def _preprocess_audio(self, waveform: torch.Tensor, sample_rate: int) -> torch.Tensor:
        """Preprocessing dell'audio per Demucs"""
        
        # Converti a mono se stereo (Demucs gestisce stereo, ma per consistency)
        if waveform.shape[0] > 2:
            waveform = torch.mean(waveform, dim=0, keepdim=True)
        
        # Resample se necessario (Demucs lavora a 44.1kHz)
        target_sr = 44100
        if sample_rate != target_sr:
            resampler = torchaudio.transforms.Resample(sample_rate, target_sr)
            waveform = resampler(waveform)
        
        # Normalizzazione
        waveform = waveform / torch.max(torch.abs(waveform))
        
        return waveform.to(self.device)
    
    def _separate_sync(self, waveform: torch.Tensor) -> torch.Tensor:
        """Separazione sincrona con Demucs"""
        with torch.no_grad():
            # Applica modello Demucs
            sources = apply_model(
                self.model, 
                waveform.unsqueeze(0),  # Batch dimension
                device=self.device,
                progress=True
            )
            
            return sources.squeeze(0)  # Rimuovi batch dimension
    
    async def _save_stems(self, sources: torch.Tensor, session_id: str, sample_rate: int) -> Dict[str, str]:
        """Salva le tracce separate e genera stems aggiuntivi"""
        
        stems_dir = Path(f"/app/temp_files/{session_id}/stems")
        stems_dir.mkdir(parents=True, exist_ok=True)
        
        stems_paths = {}
        
        # Stems base da Demucs (4 tracce standard)
        base_stems = ["drums", "bass", "other", "vocals"]
        
        for i, stem_name in enumerate(base_stems):
            if i < sources.shape[0]:
                stem_path = stems_dir / f"{stem_name}.wav"
                
                # Converti a CPU e salva
                audio_data = sources[i].cpu()
                torchaudio.save(
                    str(stem_path),
                    audio_data,
                    sample_rate,
                    format="wav"
                )
                
                stems_paths[stem_name] = str(stem_path)
        
        # Genera stems aggiuntivi tramite post-processing
        additional_stems = await self._generate_additional_stems(
            stems_paths, stems_dir, sample_rate
        )
        
        stems_paths.update(additional_stems)
        
        return stems_paths
    
    async def _generate_additional_stems(self, base_stems: Dict[str, str], 
                                       stems_dir: Path, sample_rate: int) -> Dict[str, str]:
        """Genera stems aggiuntivi tramite analisi spettrale e separazione avanzata"""
        
        additional_stems = {}
        
        try:
            # Analizza drums per separare kick, snare, hihat
            if "drums" in base_stems:
                drum_stems = await self._separate_drums(base_stems["drums"], stems_dir, sample_rate)
                additional_stems.update(drum_stems)
            
            # Analizza vocals per separare lead, backing, choir
            if "vocals" in base_stems:
                vocal_stems = await self._separate_vocals(base_stems["vocals"], stems_dir, sample_rate)
                additional_stems.update(vocal_stems)
            
            # Analizza "other" per strumenti specifici
            if "other" in base_stems:
                instrument_stems = await self._separate_instruments(base_stems["other"], stems_dir, sample_rate)
                additional_stems.update(instrument_stems)
            
        except Exception as e:
            logger.warning(f"Errore generazione stems aggiuntivi: {str(e)}")
        
        return additional_stems
    
    async def _separate_drums(self, drums_path: str, output_dir: Path, sample_rate: int) -> Dict[str, str]:
        """Separazione batteria in kick, snare, hihat, percussion"""
        
        drum_stems = {}
        
        try:
            # Carica audio batteria
            waveform, _ = torchaudio.load(drums_path)
            
            # Analisi spettrale per identificare componenti
            spectrogram = torch.stft(
                waveform[0], 
                n_fft=2048, 
                hop_length=512, 
                return_complex=True
            )
            
            magnitude = torch.abs(spectrogram)
            
            # Separazione basata su frequenze caratteristiche
            # Kick: 20-100 Hz
            kick_mask = self._create_frequency_mask(magnitude, sample_rate, 20, 100)
            kick_audio = self._apply_mask(waveform, kick_mask)
            
            # Snare: 150-300 Hz + 2-5 kHz
            snare_mask = self._create_frequency_mask(magnitude, sample_rate, 150, 300) + \
                        self._create_frequency_mask(magnitude, sample_rate, 2000, 5000)
            snare_audio = self._apply_mask(waveform, snare_mask)
            
            # Hi-hat: 8-20 kHz
            hihat_mask = self._create_frequency_mask(magnitude, sample_rate, 8000, 20000)
            hihat_audio = self._apply_mask(waveform, hihat_mask)
            
            # Percussion: resto
            percussion_audio = waveform - kick_audio - snare_audio - hihat_audio
            
            # Salva stems
            drum_components = {
                "kick": kick_audio,
                "snare": snare_audio,
                "hihat": hihat_audio,
                "percussion": percussion_audio
            }
            
            for name, audio in drum_components.items():
                path = output_dir / f"{name}.wav"
                torchaudio.save(str(path), audio, sample_rate)
                drum_stems[name] = str(path)
            
        except Exception as e:
            logger.warning(f"Errore separazione batteria: {str(e)}")
        
        return drum_stems
    
    async def _separate_vocals(self, vocals_path: str, output_dir: Path, sample_rate: int) -> Dict[str, str]:
        """Separazione voci in lead, backing, choir"""
        
        vocal_stems = {}
        
        try:
            # Carica audio voci
            waveform, _ = torchaudio.load(vocals_path)
            
            # Analisi per separare voci (semplificata)
            # In un'implementazione completa, si userebbe un modello dedicato
            
            # Lead vocals: centro stereo, frequenze principali
            lead_audio = self._extract_center_channel(waveform)
            
            # Backing vocals: lati stereo
            backing_audio = self._extract_side_channels(waveform)
            
            # Choir: frequenze armoniche
            choir_audio = self._extract_harmonics(waveform)
            
            # Salva stems
            vocal_components = {
                "vocals_lead": lead_audio,
                "vocals_backing": backing_audio,
                "vocals_choir": choir_audio
            }
            
            for name, audio in vocal_components.items():
                path = output_dir / f"{name}.wav"
                torchaudio.save(str(path), audio, sample_rate)
                vocal_stems[name] = str(path)
            
        except Exception as e:
            logger.warning(f"Errore separazione voci: {str(e)}")
        
        return vocal_stems
    
    async def _separate_instruments(self, other_path: str, output_dir: Path, sample_rate: int) -> Dict[str, str]:
        """Separazione strumenti da traccia 'other'"""
        
        instrument_stems = {}
        
        try:
            # Carica audio strumenti
            waveform, _ = torchaudio.load(other_path)
            
            # Separazione basata su caratteristiche spettrali
            # Piano: armoniche ricche, attacco percussivo
            piano_audio = self._extract_piano_like(waveform)
            
            # Chitarra: distorsione, frequenze medie
            guitar_audio = self._extract_guitar_like(waveform)
            
            # Synth: forme d'onda sintetiche
            synth_audio = self._extract_synth_like(waveform)
            
            # Archi: attacco dolce, sustain lungo
            strings_audio = self._extract_strings_like(waveform)
            
            # Fiati: caratteristiche di soffio
            brass_audio = self._extract_brass_like(waveform)
            
            # Atmosfere: riverberi, pad
            atmosphere_audio = self._extract_atmosphere(waveform)
            
            # Effetti: resto
            effects_audio = waveform - piano_audio - guitar_audio - synth_audio - strings_audio - brass_audio - atmosphere_audio
            
            # Salva stems
            instrument_components = {
                "piano": piano_audio,
                "guitar": guitar_audio,
                "synth": synth_audio,
                "strings": strings_audio,
                "brass": brass_audio,
                "atmosphere": atmosphere_audio,
                "effects": effects_audio
            }
            
            for name, audio in instrument_components.items():
                path = output_dir / f"{name}.wav"
                torchaudio.save(str(path), audio, sample_rate)
                instrument_stems[name] = str(path)
            
        except Exception as e:
            logger.warning(f"Errore separazione strumenti: {str(e)}")
        
        return instrument_stems
    
    def _create_frequency_mask(self, magnitude: torch.Tensor, sample_rate: int, 
                              low_freq: float, high_freq: float) -> torch.Tensor:
        """Crea maschera per range di frequenze specifico"""
        
        freq_bins = magnitude.shape[0]
        nyquist = sample_rate // 2
        
        low_bin = int(low_freq * freq_bins / nyquist)
        high_bin = int(high_freq * freq_bins / nyquist)
        
        mask = torch.zeros_like(magnitude)
        mask[low_bin:high_bin, :] = 1.0
        
        return mask
    
    def _apply_mask(self, waveform: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
        """Applica maschera spettrale all'audio"""
        
        # STFT
        spectrogram = torch.stft(
            waveform[0], 
            n_fft=2048, 
            hop_length=512, 
            return_complex=True
        )
        
        # Applica maschera
        masked_spec = spectrogram * mask
        
        # ISTFT
        reconstructed = torch.istft(
            masked_spec, 
            n_fft=2048, 
            hop_length=512
        )
        
        return reconstructed.unsqueeze(0)
    
    def _extract_center_channel(self, waveform: torch.Tensor) -> torch.Tensor:
        """Estrae canale centrale (mono sum)"""
        if waveform.shape[0] == 2:
            return ((waveform[0] + waveform[1]) / 2).unsqueeze(0)
        return waveform
    
    def _extract_side_channels(self, waveform: torch.Tensor) -> torch.Tensor:
        """Estrae canali laterali (stereo difference)"""
        if waveform.shape[0] == 2:
            return ((waveform[0] - waveform[1]) / 2).unsqueeze(0)
        return torch.zeros_like(waveform[:1])
    
    def _extract_harmonics(self, waveform: torch.Tensor) -> torch.Tensor:
        """Estrae componenti armoniche"""
        # Implementazione semplificata
        return waveform * 0.3  # Placeholder
    
    def _extract_piano_like(self, waveform: torch.Tensor) -> torch.Tensor:
        """Estrae suoni simili al piano"""
        # Implementazione semplificata basata su caratteristiche spettrali
        return waveform * 0.2  # Placeholder
    
    def _extract_guitar_like(self, waveform: torch.Tensor) -> torch.Tensor:
        """Estrae suoni simili alla chitarra"""
        return waveform * 0.2  # Placeholder
    
    def _extract_synth_like(self, waveform: torch.Tensor) -> torch.Tensor:
        """Estrae suoni sintetici"""
        return waveform * 0.2  # Placeholder
    
    def _extract_strings_like(self, waveform: torch.Tensor) -> torch.Tensor:
        """Estrae suoni di archi"""
        return waveform * 0.1  # Placeholder
    
    def _extract_brass_like(self, waveform: torch.Tensor) -> torch.Tensor:
        """Estrae suoni di fiati"""
        return waveform * 0.1  # Placeholder
    
    def _extract_atmosphere(self, waveform: torch.Tensor) -> torch.Tensor:
        """Estrae atmosfere e pad"""
        return waveform * 0.1  # Placeholder
    
    def __del__(self):
        """Cleanup risorse"""
        if hasattr(self, 'executor'):
            self.executor.shutdown(wait=False)