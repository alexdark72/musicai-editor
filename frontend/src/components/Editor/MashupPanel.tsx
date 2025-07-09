import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  LinearProgress,
} from '@mui/material';
import {
  MusicNote,
  Speed,
  Tune,
  AutoFixHigh,
  PlayArrow,
  Stop,
  Download,
  Add,
  Remove,
  Refresh,
  Settings,
  VolumeUp,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Types
import { AudioTrack, MashupSettings } from '../../store/appStore';
import { useAppStore } from '../../store/appStore';
import { apiService } from '../../services/api';

interface MashupPanelProps {
  tracks: AudioTrack[];
  mashupSettings: MashupSettings;
  sessionId: string | null;
  disabled?: boolean;
}

interface MashupJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result_url?: string;
  error?: string;
}

const MashupPanel: React.FC<MashupPanelProps> = ({
  tracks,
  mashupSettings,
  sessionId,
  disabled = false,
}) => {
  const {
    updateMashupSettings,
    updateTrack,
  } = useAppStore();

  const [mashupJob, setMashupJob] = useState<MashupJob | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Auto-select tracks when they become available
  useEffect(() => {
    if (tracks.length > 0 && selectedTracks.length === 0) {
      // Auto-select vocal and instrumental tracks for mashup
      const autoSelect = tracks
        .filter(track => 
          track.category === 'vocals' || 
          track.category === 'instruments'
        )
        .slice(0, 4) // Limit to 4 tracks
        .map(track => track.id);
      setSelectedTracks(autoSelect);
    }
  }, [tracks, selectedTracks.length]);

  const handleSettingChange = (key: keyof MashupSettings, value: any) => {
    updateMashupSettings({ [key]: value });
  };

  const handleTrackSelection = (trackId: string, selected: boolean) => {
    if (selected) {
      setSelectedTracks(prev => [...prev, trackId]);
    } else {
      setSelectedTracks(prev => prev.filter(id => id !== trackId));
    }
  };

  const getSelectedTracksData = () => {
    return tracks.filter(track => selectedTracks.includes(track.id));
  };

  const createMashup = async () => {
    if (!sessionId || selectedTracks.length < 2) {
      return;
    }

    setIsCreating(true);
    try {
      const selectedTracksData = getSelectedTracksData();
      const response = await apiService.createMashup(sessionId, {
        tracks: selectedTracksData.map(track => ({
          id: track.id,
          name: track.name,
          volume: track.volume,
          pan: track.pan,
        })),
        settings: mashupSettings,
      });

      setMashupJob({
        id: response.job_id,
        status: 'pending',
        progress: 0,
      });

      // Poll for job status
      pollMashupStatus(response.job_id);
    } catch (error) {
      console.error('Failed to create mashup:', error);
      setMashupJob({
        id: 'error',
        status: 'failed',
        progress: 0,
        error: 'Errore nella creazione del mashup',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const pollMashupStatus = async (jobId: string) => {
    const poll = async () => {
      try {
        const status = await apiService.getMashupStatus(jobId);
        setMashupJob(status);

        if (status.status === 'completed' && status.result_url) {
          setPreviewUrl(status.result_url);
        } else if (status.status === 'processing' || status.status === 'pending') {
          setTimeout(poll, 2000); // Poll every 2 seconds
        }
      } catch (error) {
        console.error('Failed to poll mashup status:', error);
        setMashupJob(prev => prev ? {
          ...prev,
          status: 'failed',
          error: 'Errore nel controllo dello stato',
        } : null);
      }
    };

    poll();
  };

  const downloadMashup = () => {
    if (previewUrl) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = `mashup_${Date.now()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetMashup = () => {
    setMashupJob(null);
    setPreviewUrl(null);
    setIsCreating(false);
  };

  const canCreateMashup = selectedTracks.length >= 2 && !disabled && !isCreating;

  return (
    <Box sx={{ width: 350, height: '100%', overflow: 'auto' }}>
      <Paper
        sx={{
          height: '100%',
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoFixHigh /> Mashup AI
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Crea mashup intelligenti con allineamento automatico
          </Typography>
        </Box>

        <Box sx={{ p: 2 }}>
          {/* Track Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <MusicNote fontSize="small" />
              Selezione Tracce ({selectedTracks.length}/8)
            </Typography>
            
            {tracks.length > 0 ? (
              <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                {tracks.map((track) => (
                  <ListItem key={track.id} dense>
                    <Checkbox
                      checked={selectedTracks.includes(track.id)}
                      onChange={(e) => handleTrackSelection(track.id, e.target.checked)}
                      disabled={!selectedTracks.includes(track.id) && selectedTracks.length >= 8}
                    />
                    <ListItemText
                      primary={track.name}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={track.category}
                            size="small"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                          {track.volume !== 1 && (
                            <Chip
                              label={`Vol: ${Math.round(track.volume * 100)}%`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                Carica e separa un file audio per iniziare
              </Alert>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Mashup Settings */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings fontSize="small" />
              Impostazioni
            </Typography>

            {/* Target BPM */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                BPM Target
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={mashupSettings.targetBPM}
                onChange={(e) => handleSettingChange('targetBPM', parseInt(e.target.value) || 120)}
                inputProps={{ min: 60, max: 200 }}
                disabled={disabled}
              />
            </Box>

            {/* Target Key */}
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Tonalità Target</InputLabel>
                <Select
                  value={mashupSettings.targetKey}
                  onChange={(e) => handleSettingChange('targetKey', e.target.value)}
                  disabled={disabled}
                >
                  <MenuItem value="auto">Auto (Rilevamento)</MenuItem>
                  <MenuItem value="C">C Major</MenuItem>
                  <MenuItem value="C#">C# Major</MenuItem>
                  <MenuItem value="D">D Major</MenuItem>
                  <MenuItem value="D#">D# Major</MenuItem>
                  <MenuItem value="E">E Major</MenuItem>
                  <MenuItem value="F">F Major</MenuItem>
                  <MenuItem value="F#">F# Major</MenuItem>
                  <MenuItem value="G">G Major</MenuItem>
                  <MenuItem value="G#">G# Major</MenuItem>
                  <MenuItem value="A">A Major</MenuItem>
                  <MenuItem value="A#">A# Major</MenuItem>
                  <MenuItem value="B">B Major</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Crossfade Duration */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Durata Crossfade: {mashupSettings.crossfadeDuration}s
              </Typography>
              <Slider
                value={mashupSettings.crossfadeDuration}
                onChange={(_, value) => handleSettingChange('crossfadeDuration', value as number)}
                min={0}
                max={10}
                step={0.5}
                disabled={disabled}
                marks={[
                  { value: 0, label: '0s' },
                  { value: 5, label: '5s' },
                  { value: 10, label: '10s' },
                ]}
              />
            </Box>

            {/* Auto Align */}
            <FormControlLabel
              control={
                <Switch
                  checked={mashupSettings.autoAlign}
                  onChange={(e) => handleSettingChange('autoAlign', e.target.checked)}
                  disabled={disabled}
                />
              }
              label="Allineamento Automatico"
            />

            {/* Harmonic Mixing */}
            <FormControlLabel
              control={
                <Switch
                  checked={mashupSettings.harmonicMixing}
                  onChange={(e) => handleSettingChange('harmonicMixing', e.target.checked)}
                  disabled={disabled}
                />
              }
              label="Mixaggio Armonico"
            />

            {/* Energy Matching */}
            <FormControlLabel
              control={
                <Switch
                  checked={mashupSettings.energyMatching}
                  onChange={(e) => handleSettingChange('energyMatching', e.target.checked)}
                  disabled={disabled}
                />
              }
              label="Matching Energetico"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Mashup Creation */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Creazione
            </Typography>

            {/* Create Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<AutoFixHigh />}
              onClick={createMashup}
              disabled={!canCreateMashup}
              sx={{ mb: 2 }}
            >
              {isCreating ? 'Creazione...' : `Crea Mashup (${selectedTracks.length} tracce)`}
            </Button>

            {/* Job Status */}
            <AnimatePresence>
              {mashupJob && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert
                    severity={
                      mashupJob.status === 'completed' ? 'success' :
                      mashupJob.status === 'failed' ? 'error' : 'info'
                    }
                    sx={{ mb: 2 }}
                  >
                    <Box>
                      <Typography variant="body2">
                        {mashupJob.status === 'pending' && 'Mashup in coda...'}
                        {mashupJob.status === 'processing' && 'Creazione mashup in corso...'}
                        {mashupJob.status === 'completed' && 'Mashup completato!'}
                        {mashupJob.status === 'failed' && (mashupJob.error || 'Errore nella creazione')}
                      </Typography>
                      
                      {(mashupJob.status === 'processing' || mashupJob.status === 'pending') && (
                        <LinearProgress
                          variant="determinate"
                          value={mashupJob.progress}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Preview & Download */}
            {previewUrl && (
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<PlayArrow />}
                  onClick={() => {
                    const audio = new Audio(previewUrl);
                    audio.play();
                  }}
                  sx={{ flex: 1 }}
                >
                  Anteprima
                </Button>
                
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={downloadMashup}
                  sx={{ flex: 1 }}
                >
                  Download
                </Button>
              </Box>
            )}

            {/* Reset */}
            {mashupJob && (
              <Button
                fullWidth
                variant="text"
                startIcon={<Refresh />}
                onClick={resetMashup}
                size="small"
              >
                Nuovo Mashup
              </Button>
            )}
          </Box>

          {/* Tips */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(99, 102, 241, 0.1)', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              💡 <strong>Suggerimenti:</strong><br/>
              • Seleziona 2-4 tracce per risultati ottimali<br/>
              • L'allineamento automatico sincronizza BPM e tonalità<br/>
              • Il mixaggio armonico mantiene l'armonia musicale
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default MashupPanel;