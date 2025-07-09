import React, { useState } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore,
  Tune,
  GraphicEq,
  Speed,
  VolumeUp,
  Compress,
  AutoFixHigh,
  MusicNote,
  Timeline,
  Refresh,
  Save,
  Download,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Types
import { AudioTrack, EditorSettings } from '../../store/appStore';
import { useAppStore } from '../../store/appStore';

interface ToolsPanelProps {
  tracks: AudioTrack[];
  editorSettings: EditorSettings;
  disabled?: boolean;
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({
  tracks,
  editorSettings,
  disabled = false,
}) => {
  const {
    updateEditorSettings,
    updateTrack,
  } = useAppStore();

  const [expandedPanel, setExpandedPanel] = useState<string | false>('audio');

  const handlePanelChange = (panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const handleSettingChange = (key: keyof EditorSettings, value: any) => {
    updateEditorSettings({ [key]: value });
  };

  const applyToAllTracks = (property: string, value: any) => {
    tracks.forEach(track => {
      updateTrack(track.id, { [property]: value });
    });
  };

  const normalizeAllTracks = () => {
    tracks.forEach(track => {
      // Simulate normalization - in real app this would call backend
      updateTrack(track.id, { volume: 0.8 });
    });
  };

  const resetAllEffects = () => {
    tracks.forEach(track => {
      updateTrack(track.id, {
        volume: 1.0,
        pan: 0,
        muted: false,
        solo: false,
      });
    });
  };

  return (
    <Box sx={{ width: 300, height: '100%', overflow: 'auto' }}>
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
            <Tune /> Strumenti
          </Typography>
        </Box>

        <Box sx={{ p: 1 }}>
          {/* Audio Processing */}
          <Accordion
            expanded={expandedPanel === 'audio'}
            onChange={handlePanelChange('audio')}
            sx={{ mb: 1, bgcolor: 'transparent' }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GraphicEq fontSize="small" />
                <Typography>Elaborazione Audio</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Master Volume */}
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Volume Generale
                  </Typography>
                  <Slider
                    value={editorSettings.masterVolume * 100}
                    onChange={(_, value) => handleSettingChange('masterVolume', (value as number) / 100)}
                    min={0}
                    max={150}
                    disabled={disabled}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Box>

                {/* Normalization */}
                <Box>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AutoFixHigh />}
                    onClick={normalizeAllTracks}
                    disabled={disabled || tracks.length === 0}
                  >
                    Normalizza Tutto
                  </Button>
                </Box>

                {/* Reset Effects */}
                <Box>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={resetAllEffects}
                    disabled={disabled || tracks.length === 0}
                  >
                    Reset Effetti
                  </Button>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Tempo & Timing */}
          <Accordion
            expanded={expandedPanel === 'tempo'}
            onChange={handlePanelChange('tempo')}
            sx={{ mb: 1, bgcolor: 'transparent' }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Speed fontSize="small" />
                <Typography>Tempo & Timing</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* BPM Detection */}
                <Box>
                  <Typography variant="body2" gutterBottom>
                    BPM Rilevato
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={editorSettings.detectedBPM || 'N/A'}
                    disabled
                    InputProps={{
                      endAdornment: <Typography variant="caption">BPM</Typography>,
                    }}
                  />
                </Box>

                {/* Tempo Adjustment */}
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Regolazione Tempo
                  </Typography>
                  <Slider
                    value={editorSettings.tempoAdjustment}
                    onChange={(_, value) => handleSettingChange('tempoAdjustment', value as number)}
                    min={0.5}
                    max={2.0}
                    step={0.01}
                    disabled={disabled}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}x`}
                    marks={[
                      { value: 0.5, label: '0.5x' },
                      { value: 1.0, label: '1x' },
                      { value: 2.0, label: '2x' },
                    ]}
                  />
                </Box>

                {/* Beat Sync */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={editorSettings.beatSync}
                      onChange={(e) => handleSettingChange('beatSync', e.target.checked)}
                      disabled={disabled}
                    />
                  }
                  label="Sincronizzazione Beat"
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Key & Pitch */}
          <Accordion
            expanded={expandedPanel === 'pitch'}
            onChange={handlePanelChange('pitch')}
            sx={{ mb: 1, bgcolor: 'transparent' }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MusicNote fontSize="small" />
                <Typography>Tonalità & Pitch</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Key Detection */}
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Tonalità Rilevata
                  </Typography>
                  <Chip
                    label={editorSettings.detectedKey || 'N/A'}
                    variant="outlined"
                    size="small"
                  />
                </Box>

                {/* Pitch Shift */}
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Trasposizione (Semitoni)
                  </Typography>
                  <Slider
                    value={editorSettings.pitchShift}
                    onChange={(_, value) => handleSettingChange('pitchShift', value as number)}
                    min={-12}
                    max={12}
                    step={1}
                    disabled={disabled}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: -12, label: '-12' },
                      { value: 0, label: '0' },
                      { value: 12, label: '+12' },
                    ]}
                  />
                </Box>

                {/* Auto-Tune */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={editorSettings.autoTune}
                      onChange={(e) => handleSettingChange('autoTune', e.target.checked)}
                      disabled={disabled}
                    />
                  }
                  label="Auto-Tune"
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Effects */}
          <Accordion
            expanded={expandedPanel === 'effects'}
            onChange={handlePanelChange('effects')}
            sx={{ mb: 1, bgcolor: 'transparent' }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Compress fontSize="small" />
                <Typography>Effetti</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Reverb */}
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Riverbero
                  </Typography>
                  <Slider
                    value={editorSettings.reverb}
                    onChange={(_, value) => handleSettingChange('reverb', value as number)}
                    min={0}
                    max={100}
                    disabled={disabled}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Box>

                {/* Compression */}
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Compressione
                  </Typography>
                  <Slider
                    value={editorSettings.compression}
                    onChange={(_, value) => handleSettingChange('compression', value as number)}
                    min={0}
                    max={100}
                    disabled={disabled}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Box>

                {/* EQ Presets */}
                <Box>
                  <FormControl fullWidth size="small">
                    <InputLabel>Preset EQ</InputLabel>
                    <Select
                      value={editorSettings.eqPreset}
                      onChange={(e) => handleSettingChange('eqPreset', e.target.value)}
                      disabled={disabled}
                    >
                      <MenuItem value="flat">Flat</MenuItem>
                      <MenuItem value="bass_boost">Bass Boost</MenuItem>
                      <MenuItem value="vocal_enhance">Vocal Enhance</MenuItem>
                      <MenuItem value="bright">Bright</MenuItem>
                      <MenuItem value="warm">Warm</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Export Options */}
          <Accordion
            expanded={expandedPanel === 'export'}
            onChange={handlePanelChange('export')}
            sx={{ mb: 1, bgcolor: 'transparent' }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Download fontSize="small" />
                <Typography>Esportazione</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Export Format */}
                <FormControl fullWidth size="small">
                  <InputLabel>Formato</InputLabel>
                  <Select
                    value={editorSettings.exportFormat}
                    onChange={(e) => handleSettingChange('exportFormat', e.target.value)}
                  >
                    <MenuItem value="wav">WAV (Lossless)</MenuItem>
                    <MenuItem value="flac">FLAC (Lossless)</MenuItem>
                    <MenuItem value="mp3">MP3 (320kbps)</MenuItem>
                    <MenuItem value="aac">AAC (256kbps)</MenuItem>
                  </Select>
                </FormControl>

                {/* Sample Rate */}
                <FormControl fullWidth size="small">
                  <InputLabel>Sample Rate</InputLabel>
                  <Select
                    value={editorSettings.sampleRate}
                    onChange={(e) => handleSettingChange('sampleRate', e.target.value)}
                  >
                    <MenuItem value={44100}>44.1 kHz</MenuItem>
                    <MenuItem value={48000}>48 kHz</MenuItem>
                    <MenuItem value={96000}>96 kHz</MenuItem>
                    <MenuItem value={192000}>192 kHz</MenuItem>
                  </Select>
                </FormControl>

                {/* Bit Depth */}
                <FormControl fullWidth size="small">
                  <InputLabel>Bit Depth</InputLabel>
                  <Select
                    value={editorSettings.bitDepth}
                    onChange={(e) => handleSettingChange('bitDepth', e.target.value)}
                  >
                    <MenuItem value={16}>16-bit</MenuItem>
                    <MenuItem value={24}>24-bit</MenuItem>
                    <MenuItem value={32}>32-bit</MenuItem>
                  </Select>
                </FormControl>

                <Divider sx={{ my: 1 }} />

                {/* Export Actions */}
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Save />}
                  disabled={disabled || tracks.length === 0}
                  sx={{ mb: 1 }}
                >
                  Salva Progetto
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Download />}
                  disabled={disabled || tracks.length === 0}
                >
                  Esporta Mix
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Paper>
    </Box>
  );
};

export default ToolsPanel;