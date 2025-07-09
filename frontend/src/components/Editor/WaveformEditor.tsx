import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Slider,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  FitScreen,
  GridOn,
  GridOff,
} from '@mui/icons-material';
import WaveSurfer from 'wavesurfer.js';
import { motion } from 'framer-motion';

// Types
import { AudioTrack, PlaybackState, EditorState } from '../../store/appStore';
import { useAppStore } from '../../store/appStore';

interface WaveformEditorProps {
  tracks: AudioTrack[];
  playback: PlaybackState;
  editor: EditorState;
  disabled?: boolean;
}

const WaveformEditor: React.FC<WaveformEditorProps> = ({
  tracks,
  playback,
  editor,
  disabled = false,
}) => {
  const {
    setZoom,
    setCurrentTime,
    setPlaying,
    toggleSnapToGrid,
    setViewRange,
  } = useAppStore();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inizializza WaveSurfer
  useEffect(() => {
    if (!containerRef.current || disabled || tracks.length === 0) return;

    try {
      // Cleanup precedente istanza
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }

      // Crea nuova istanza WaveSurfer
      const wavesurfer = WaveSurfer.create({
        container: containerRef.current,
        waveColor: '#6366f1',
        progressColor: '#ec4899',
        cursorColor: '#ffffff',
        barWidth: 2,
        barRadius: 1,
        responsive: true,
        height: 80,
        normalize: true,
        backend: 'WebAudio',
        mediaControls: false,
        interact: true,
        scrollParent: true,
        minPxPerSec: 50,
      });

      wavesurferRef.current = wavesurfer;

      // Event listeners
      wavesurfer.on('ready', () => {
        setIsInitialized(true);
        setError(null);
      });

      wavesurfer.on('error', (err) => {
        console.error('WaveSurfer error:', err);
        setError('Errore nel caricamento dell\'audio');
      });

      wavesurfer.on('audioprocess', (time) => {
        setCurrentTime(time);
      });

      wavesurfer.on('seek', (progress) => {
        const time = progress * wavesurfer.getDuration();
        setCurrentTime(time);
      });

      wavesurfer.on('play', () => {
        setPlaying(true);
      });

      wavesurfer.on('pause', () => {
        setPlaying(false);
      });

      // Carica il primo track disponibile
      const firstTrack = tracks.find(track => track.url);
      if (firstTrack) {
        wavesurfer.load(firstTrack.url);
      }

    } catch (err) {
      console.error('Errore inizializzazione WaveSurfer:', err);
      setError('Errore nell\'inizializzazione dell\'editor');
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [tracks, disabled]);

  // Sincronizza playback state
  useEffect(() => {
    if (!wavesurferRef.current || !isInitialized) return;

    if (playback.isPlaying) {
      wavesurferRef.current.play();
    } else {
      wavesurferRef.current.pause();
    }
  }, [playback.isPlaying, isInitialized]);

  // Sincronizza current time
  useEffect(() => {
    if (!wavesurferRef.current || !isInitialized) return;

    const currentWaveTime = wavesurferRef.current.getCurrentTime();
    if (Math.abs(currentWaveTime - playback.currentTime) > 0.1) {
      wavesurferRef.current.seekTo(playback.currentTime / wavesurferRef.current.getDuration());
    }
  }, [playback.currentTime, isInitialized]);

  // Gestione zoom
  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(newZoom * 50); // Converti in px per secondo
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(editor.zoom * 1.5, 10);
    handleZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(editor.zoom / 1.5, 0.1);
    handleZoomChange(newZoom);
  };

  const handleFitToScreen = () => {
    if (wavesurferRef.current) {
      const duration = wavesurferRef.current.getDuration();
      const containerWidth = containerRef.current?.clientWidth || 800;
      const optimalZoom = containerWidth / duration / 50;
      handleZoomChange(optimalZoom);
    }
  };

  if (disabled) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <Typography color="text.secondary">
          Carica un file audio per iniziare
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Waveform Editor
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Zoom Controls */}
          <Tooltip title="Zoom Out">
            <IconButton
              size="small"
              onClick={handleZoomOut}
              disabled={editor.zoom <= 0.1}
            >
              <ZoomOut />
            </IconButton>
          </Tooltip>
          
          <Box sx={{ width: 100, mx: 1 }}>
            <Slider
              size="small"
              value={editor.zoom}
              min={0.1}
              max={10}
              step={0.1}
              onChange={(_, value) => handleZoomChange(value as number)}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value.toFixed(1)}x`}
            />
          </Box>
          
          <Tooltip title="Zoom In">
            <IconButton
              size="small"
              onClick={handleZoomIn}
              disabled={editor.zoom >= 10}
            >
              <ZoomIn />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Fit to Screen">
            <IconButton size="small" onClick={handleFitToScreen}>
              <FitScreen />
            </IconButton>
          </Tooltip>
          
          {/* Grid Toggle */}
          <Tooltip title={editor.snapToGrid ? 'Disable Grid' : 'Enable Grid'}>
            <IconButton
              size="small"
              onClick={toggleSnapToGrid}
              color={editor.snapToGrid ? 'primary' : 'default'}
            >
              {editor.snapToGrid ? <GridOn /> : <GridOff />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Waveform Container */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ height: '100%', padding: '16px' }}
        >
          <div
            ref={containerRef}
            style={{
              width: '100%',
              height: '100%',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          />
        </motion.div>
        
        {/* Grid Overlay */}
        {editor.snapToGrid && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              background: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent ${editor.gridSize * 50}px,
                rgba(255, 255, 255, 0.1) ${editor.gridSize * 50}px,
                rgba(255, 255, 255, 0.1) ${editor.gridSize * 50 + 1}px
              )`,
            }}
          />
        )}
        
        {/* Loading Overlay */}
        {!isInitialized && !error && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(5px)',
            }}
          >
            <Typography color="text.secondary">
              Caricamento waveform...
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Info Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '0.75rem',
          color: 'text.secondary',
        }}
      >
        <span>
          Tempo: {Math.floor(playback.currentTime / 60)}:{(playback.currentTime % 60).toFixed(1).padStart(4, '0')}
        </span>
        <span>
          Durata: {Math.floor(playback.duration / 60)}:{(playback.duration % 60).toFixed(1).padStart(4, '0')}
        </span>
        <span>
          Zoom: {editor.zoom.toFixed(1)}x
        </span>
      </Box>
    </Box>
  );
};

export default WaveformEditor;