import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  IconButton,
  Slider,
  Chip,
  Tooltip,
  Checkbox,
} from '@mui/material';
import {
  VolumeUp,
  VolumeOff,
  PlayArrow,
  Pause,
  Download,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Types
import { AudioTrack } from '../../store/appStore';
import { useAppStore } from '../../store/appStore';

interface TrackListProps {
  tracks: AudioTrack[];
  selectedTracks: string[];
  onTrackSelect: (trackId: string) => void;
}

const TrackList: React.FC<TrackListProps> = ({
  tracks,
  selectedTracks,
  onTrackSelect,
}) => {
  const {
    toggleTrackMute,
    toggleTrackSolo,
    setTrackVolume,
    setTrackPan,
    playback,
  } = useAppStore();

  // Nomi delle tracce con icone
  const getTrackInfo = (trackName: string) => {
    const trackMap: { [key: string]: { icon: string; color: string; category: string } } = {
      // Voci
      'vocals': { icon: '🎤', color: '#ec4899', category: 'Voci' },
      'lead_vocals': { icon: '🎤', color: '#ec4899', category: 'Voci' },
      'backing_vocals': { icon: '🎵', color: '#f472b6', category: 'Voci' },
      'choir': { icon: '👥', color: '#fbbf24', category: 'Voci' },
      
      // Strumenti
      'piano': { icon: '🎹', color: '#6366f1', category: 'Strumenti' },
      'synth': { icon: '🎛️', color: '#8b5cf6', category: 'Strumenti' },
      'guitar': { icon: '🎸', color: '#f59e0b', category: 'Strumenti' },
      'electric_guitar': { icon: '⚡', color: '#ef4444', category: 'Strumenti' },
      'acoustic_guitar': { icon: '🎸', color: '#84cc16', category: 'Strumenti' },
      'strings': { icon: '🎻', color: '#06b6d4', category: 'Strumenti' },
      'brass': { icon: '🎺', color: '#f97316', category: 'Strumenti' },
      
      // Ritmica
      'drums': { icon: '🥁', color: '#ef4444', category: 'Ritmica' },
      'kick': { icon: '🥁', color: '#dc2626', category: 'Ritmica' },
      'snare': { icon: '🥁', color: '#f59e0b', category: 'Ritmica' },
      'hihat': { icon: '🥁', color: '#eab308', category: 'Ritmica' },
      'percussion': { icon: '🥁', color: '#84cc16', category: 'Ritmica' },
      'bass': { icon: '🎸', color: '#7c3aed', category: 'Ritmica' },
      
      // Effetti
      'atmosphere': { icon: '🌊', color: '#06b6d4', category: 'Effetti' },
      'noise': { icon: '📻', color: '#64748b', category: 'Effetti' },
      'reverb': { icon: '🔊', color: '#14b8a6', category: 'Effetti' },
      'other': { icon: '🎵', color: '#64748b', category: 'Altri' },
    };
    
    const key = trackName.toLowerCase().replace(/[^a-z]/g, '_');
    return trackMap[key] || { icon: '🎵', color: '#64748b', category: 'Altri' };
  };

  // Raggruppa tracce per categoria
  const groupedTracks = tracks.reduce((groups, track) => {
    const info = getTrackInfo(track.name);
    if (!groups[info.category]) {
      groups[info.category] = [];
    }
    groups[info.category].push({ ...track, ...info });
    return groups;
  }, {} as { [category: string]: (AudioTrack & { icon: string; color: string; category: string })[] });

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (tracks.length === 0) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Typography color="text.secondary" textAlign="center">
          Nessuna traccia disponibile.
          <br />
          Carica un file per iniziare la separazione.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Tracce ({tracks.length})
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestisci volume, pan e solo/mute
        </Typography>
      </Box>

      {/* Track List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <AnimatePresence>
          {Object.entries(groupedTracks).map(([category, categoryTracks]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Category Header */}
              <Box
                sx={{
                  p: 1.5,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, color: 'text.secondary' }}
                >
                  {category} ({categoryTracks.length})
                </Typography>
              </Box>

              {/* Tracks in Category */}
              <List dense sx={{ py: 0 }}>
                {categoryTracks.map((track) => (
                  <motion.div
                    key={track.id}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <ListItem
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        py: 1.5,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        backgroundColor: selectedTracks.includes(track.id)
                          ? 'rgba(99, 102, 241, 0.1)'
                          : 'transparent',
                      }}
                    >
                      {/* Track Header */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Checkbox
                            size="small"
                            checked={selectedTracks.includes(track.id)}
                            onChange={() => onTrackSelect(track.id)}
                          />
                          
                          <span style={{ fontSize: '1.2em' }}>{track.icon}</span>
                          
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: track.color }}
                            >
                              {track.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTime(track.duration)}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {track.solo && (
                            <Chip
                              label="SOLO"
                              size="small"
                              color="warning"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                          
                          {track.muted && (
                            <Chip
                              label="MUTE"
                              size="small"
                              color="error"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Controls */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {/* Mute/Solo Buttons */}
                        <Tooltip title={track.muted ? 'Unmute' : 'Mute'}>
                          <IconButton
                            size="small"
                            onClick={() => toggleTrackMute(track.id)}
                            color={track.muted ? 'error' : 'default'}
                          >
                            {track.muted ? <VolumeOff /> : <VolumeUp />}
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={track.solo ? 'Unsolo' : 'Solo'}>
                          <IconButton
                            size="small"
                            onClick={() => toggleTrackSolo(track.id)}
                            color={track.solo ? 'warning' : 'default'}
                          >
                            {track.solo ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                        </Tooltip>
                        
                        {/* Volume Slider */}
                        <Box sx={{ flex: 1, mx: 1 }}>
                          <Slider
                            size="small"
                            value={track.volume * 100}
                            onChange={(_, value) => setTrackVolume(track.id, (value as number) / 100)}
                            min={0}
                            max={100}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(value) => `${value}%`}
                            sx={{
                              color: track.color,
                              '& .MuiSlider-thumb': {
                                width: 12,
                                height: 12,
                              },
                            }}
                          />
                        </Box>
                        
                        {/* Download Button */}
                        <Tooltip title="Download Track">
                          <IconButton
                            size="small"
                            onClick={() => {
                              // Implementa download
                              window.open(track.url, '_blank');
                            }}
                          >
                            <Download />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      {/* Pan Control */}
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Pan
                        </Typography>
                        <Slider
                          size="small"
                          value={track.pan}
                          onChange={(_, value) => setTrackPan(track.id, value as number)}
                          min={-1}
                          max={1}
                          step={0.1}
                          valueLabelDisplay="auto"
                          valueLabelFormat={(value) => {
                            if (value === 0) return 'Center';
                            return value > 0 ? `R${Math.abs(value * 100).toFixed(0)}` : `L${Math.abs(value * 100).toFixed(0)}`;
                          }}
                          sx={{
                            color: track.color,
                            '& .MuiSlider-thumb': {
                              width: 10,
                              height: 10,
                            },
                          }}
                        />
                      </Box>
                    </ListItem>
                  </motion.div>
                ))}
              </List>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default TrackList;