import React from 'react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  SkipPrevious,
  SkipNext,
  Repeat,
  RepeatOne,
  VolumeUp,
  VolumeDown,
  VolumeOff,
  Speed,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Types
import { AudioTrack, PlaybackState } from '../../store/appStore';
import { useAppStore } from '../../store/appStore';

interface PlaybackControlsProps {
  playback: PlaybackState;
  tracks: AudioTrack[];
  disabled?: boolean;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  playback,
  tracks,
  disabled = false,
}) => {
  const {
    setPlaying,
    setCurrentTime,
    setVolume,
    setPlaybackRate,
    toggleLoop,
  } = useAppStore();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (disabled) return;
    setPlaying(!playback.isPlaying);
  };

  const handleStop = () => {
    if (disabled) return;
    setPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (value: number) => {
    if (disabled) return;
    setCurrentTime(value);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value / 100);
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
  };

  const getVolumeIcon = () => {
    if (playback.volume === 0) return <VolumeOff />;
    if (playback.volume < 0.5) return <VolumeDown />;
    return <VolumeUp />;
  };

  const playbackRates = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <Box
      sx={{
        p: 2,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.02)',
      }}
    >
      {/* Main Controls Row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        {/* Transport Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Previous">
            <span>
              <IconButton
                disabled={disabled}
                onClick={() => setCurrentTime(Math.max(0, playback.currentTime - 10))}
              >
                <SkipPrevious />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Stop">
            <span>
              <IconButton
                disabled={disabled}
                onClick={handleStop}
                color={playback.currentTime > 0 ? 'primary' : 'default'}
              >
                <Stop />
              </IconButton>
            </span>
          </Tooltip>
          
          <motion.div
            whileHover={{ scale: disabled ? 1 : 1.1 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
          >
            <Tooltip title={playback.isPlaying ? 'Pause' : 'Play'}>
              <span>
                <IconButton
                  disabled={disabled}
                  onClick={handlePlayPause}
                  size="large"
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '&:disabled': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.3)',
                    },
                  }}
                >
                  {playback.isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
              </span>
            </Tooltip>
          </motion.div>
          
          <Tooltip title="Next">
            <span>
              <IconButton
                disabled={disabled}
                onClick={() => setCurrentTime(Math.min(playback.duration, playback.currentTime + 10))}
              >
                <SkipNext />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title={playback.loop ? 'Disable Loop' : 'Enable Loop'}>
            <IconButton
              onClick={toggleLoop}
              color={playback.loop ? 'primary' : 'default'}
            >
              <Repeat />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Time Display */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', minWidth: 60 }}>
            {formatTime(playback.currentTime)}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            /
          </Typography>
          
          <Typography variant="body2" sx={{ fontFamily: 'monospace', minWidth: 60 }}>
            {formatTime(playback.duration)}
          </Typography>
        </Box>

        {/* Volume & Speed Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Playback Rate */}
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select
              value={playback.playbackRate}
              onChange={(e) => handlePlaybackRateChange(e.target.value as number)}
              sx={{ fontSize: '0.875rem' }}
            >
              {playbackRates.map((rate) => (
                <MenuItem key={rate} value={rate}>
                  {rate}x
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Volume Control */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
            <IconButton
              size="small"
              onClick={() => setVolume(playback.volume === 0 ? 0.8 : 0)}
            >
              {getVolumeIcon()}
            </IconButton>
            
            <Slider
              size="small"
              value={playback.volume * 100}
              onChange={(_, value) => handleVolumeChange(value as number)}
              min={0}
              max={100}
              sx={{ width: 80 }}
            />
            
            <Typography variant="caption" sx={{ minWidth: 30 }}>
              {Math.round(playback.volume * 100)}%
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Progress Bar */}
      <Box sx={{ width: '100%' }}>
        <Slider
          value={playback.currentTime}
          onChange={(_, value) => handleSeek(value as number)}
          min={0}
          max={playback.duration || 100}
          disabled={disabled || playback.duration === 0}
          sx={
            height: 8,
            '& .MuiSlider-thumb': {
              width: 16,
              height: 16,
              '&:hover': {
                boxShadow: '0 0 0 8px rgba(99, 102, 241, 0.16)',
              },
            },
            '& .MuiSlider-track': {
              background: 'linear-gradient(90deg, #6366f1, #ec4899)',
            },
            '& .MuiSlider-rail': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }
        />
      </Box>

      {/* Status Info */}
      <Box
        sx={
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 1,
          fontSize: '0.75rem',
          color: 'text.secondary',
        }
      >
        <span>
          {disabled ? 'Carica un file per iniziare' : `${tracks.length} tracce caricate`}
        </span>
        
        <span>
          {playback.isPlaying ? '▶️ Riproduzione' : '⏸️ In pausa'}
        </span>
        
        <span>
          {playback.loop ? '🔁 Loop attivo' : ''}
        </span>
      </Box>
    </Box>
  );
};

export default PlaybackControls;