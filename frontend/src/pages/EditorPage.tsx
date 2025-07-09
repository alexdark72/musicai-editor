import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Alert,
  LinearProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Components
import WaveformEditor from '../components/Editor/WaveformEditor';
import TrackList from '../components/Editor/TrackList';
import PlaybackControls from '../components/Editor/PlaybackControls';
import ToolsPanel from '../components/Editor/ToolsPanel';
import StatusPanel from '../components/Editor/StatusPanel';
import MashupPanel from '../components/Editor/MashupPanel';

// Services & Store
import { AudioAPI, convertStatusToJob } from '../services/api';
import { useAppStore } from '../store/appStore';

// Hooks
import { useQuery, useQueryClient } from 'react-query';
import { useInterval } from 'react-use';

const EditorPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const queryClient = useQueryClient();
  
  const {
    currentJob,
    setCurrentJob,
    updateSeparationJob,
    setLoading,
    playback,
    editor,
  } = useAppStore();
  
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [separationComplete, setSeparationComplete] = useState(false);

  // Query per ottenere informazioni sulla sessione
  const { data: sessionInfo, error: sessionError } = useQuery(
    ['session', sessionId],
    () => sessionId ? AudioAPI.getSessionInfo(sessionId) : null,
    {
      enabled: !!sessionId,
      retry: 2,
      onError: (error: any) => {
        console.error('Errore sessione:', error);
        toast.error('Sessione non trovata o scaduta');
      },
    }
  );

  // Polling per lo stato del job
  useInterval(
    async () => {
      if (!currentJob || !pollingEnabled) return;
      
      try {
        const status = await AudioAPI.getJobStatus(currentJob.id);
        
        // Aggiorna il job nel store
        const updatedJob = convertStatusToJob(
          status,
          currentJob.originalFile,
          currentJob.createdAt
        );
        
        updateSeparationJob(currentJob.id, updatedJob);
        
        // Se completato, ferma il polling
        if (status.status === 'completed') {
          setPollingEnabled(false);
          setSeparationComplete(true);
          toast.success('Separazione completata! 🎵');
        } else if (status.status === 'failed') {
          setPollingEnabled(false);
          toast.error(`Errore: ${status.error || 'Separazione fallita'}`);
        }
        
      } catch (error: any) {
        console.error('Errore polling:', error);
        setPollingEnabled(false);
      }
    },
    pollingEnabled ? 2000 : null // Polling ogni 2 secondi
  );

  // Avvia polling se c'è un job in corso
  useEffect(() => {
    if (currentJob && ['pending', 'processing'].includes(currentJob.status)) {
      setPollingEnabled(true);
    }
  }, [currentJob]);

  // Gestione errori
  if (sessionError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Sessione non trovata o scaduta. Torna alla homepage per caricare un nuovo file.
        </Alert>
      </Container>
    );
  }

  // Loading state
  if (!sessionInfo && sessionId) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography>Caricamento sessione...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            py: 2,
          }}
        >
          <Container maxWidth="xl">
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Editor Musicale AI
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {sessionInfo?.filename || 'Nuovo progetto'} • Sessione: {sessionId}
            </Typography>
          </Container>
        </Box>

        <Container maxWidth="xl" sx={{ py: 2 }}>
          <Grid container spacing={2} sx={{ height: 'calc(100vh - 200px)' }}>
            {/* Pannello sinistro - Tracce */}
            <Grid item xs={12} lg={3}>
              <Paper
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {/* Status Panel */}
                <StatusPanel
                  job={currentJob}
                  sessionInfo={sessionInfo}
                  isProcessing={pollingEnabled}
                />
                
                {/* Track List */}
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                  <TrackList
                    tracks={currentJob?.tracks || []}
                    selectedTracks={editor.selectedTracks}
                    onTrackSelect={(trackId) => {
                      // Gestione selezione tracce
                    }}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Pannello centrale - Waveform Editor */}
            <Grid item xs={12} lg={6}>
              <Paper
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {/* Playback Controls */}
                <PlaybackControls
                  playback={playback}
                  tracks={currentJob?.tracks || []}
                  disabled={!separationComplete}
                />
                
                {/* Waveform Editor */}
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                  <WaveformEditor
                    tracks={currentJob?.tracks || []}
                    playback={playback}
                    editor={editor}
                    disabled={!separationComplete}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Pannello destro - Tools & Mashup */}
            <Grid item xs={12} lg={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                {/* Tools Panel */}
                <Paper
                  sx={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <ToolsPanel
                    tracks={currentJob?.tracks || []}
                    sessionId={sessionId}
                    disabled={!separationComplete}
                  />
                </Paper>
                
                {/* Mashup Panel */}
                <Paper
                  sx={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <MashupPanel
                    tracks={currentJob?.tracks || []}
                    sessionId={sessionId}
                    disabled={!separationComplete}
                  />
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </motion.div>
  );
};

export default EditorPage;