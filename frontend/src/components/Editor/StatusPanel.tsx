import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  Refresh,
  ExpandMore,
  ExpandLess,
  Memory,
  Speed,
  Storage,
  Timer,
  CloudQueue,
  Audiotrack,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Types
import { SeparationJob } from '../../store/appStore';
import { useAppStore } from '../../store/appStore';
import { apiService } from '../../services/api';

interface StatusPanelProps {
  job: SeparationJob | null;
  sessionId: string | null;
}

interface ServerStats {
  cpu_usage: number;
  memory_usage: number;
  gpu_usage?: number;
  disk_usage: number;
  active_jobs: number;
  queue_length: number;
  uptime: number;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ job, sessionId }) => {
  const { updateJob } = useAppStore();
  const [serverStats, setServerStats] = useState<ServerStats | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch server stats periodically
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await apiService.getServerStats();
        setServerStats(stats);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Failed to fetch server stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
      case 'error':
        return 'error';
      case 'processing':
      case 'separating':
        return 'primary';
      case 'queued':
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'failed':
      case 'error':
        return <Error color="error" />;
      case 'processing':
      case 'separating':
        return <CloudQueue color="primary" />;
      case 'queued':
      case 'pending':
        return <Timer color="warning" />;
      default:
        return <Info />;
    }
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const refreshStatus = async () => {
    if (job && sessionId) {
      try {
        const status = await apiService.getJobStatus(sessionId, job.id);
        updateJob(status);
      } catch (error) {
        console.error('Failed to refresh job status:', error);
      }
    }
  };

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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Audiotrack /> Stato
            </Typography>
            <Tooltip title="Aggiorna">
              <IconButton size="small" onClick={refreshStatus}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ p: 2 }}>
          {/* Job Status */}
          {job ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  {getStatusIcon(job.status)}
                  <Typography variant="h6">
                    {job.status === 'completed' && 'Completato'}
                    {job.status === 'processing' && 'Elaborazione'}
                    {job.status === 'separating' && 'Separazione'}
                    {job.status === 'queued' && 'In coda'}
                    {job.status === 'pending' && 'In attesa'}
                    {job.status === 'failed' && 'Errore'}
                    {job.status === 'error' && 'Errore'}
                  </Typography>
                  <Chip
                    label={job.status.toUpperCase()}
                    color={getStatusColor(job.status) as any}
                    size="small"
                  />
                </Box>

                {/* Progress Bar */}
                {(job.status === 'processing' || job.status === 'separating') && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Progresso</Typography>
                      <Typography variant="body2">{Math.round(job.progress)}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={job.progress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #6366f1, #ec4899)',
                        },
                      }}
                    />
                  </Box>
                )}

                {/* Current Step */}
                {job.currentStep && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {job.currentStep}
                  </Typography>
                )}

                {/* Error Message */}
                {job.error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {job.error}
                  </Alert>
                )}

                {/* Job Details */}
                <Box>
                  <Button
                    size="small"
                    onClick={() => setShowDetails(!showDetails)}
                    endIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
                  >
                    Dettagli
                  </Button>
                  
                  <Collapse in={showDetails}>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="ID Job"
                          secondary={job.id}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Creato"
                          secondary={new Date(job.createdAt).toLocaleString()}
                        />
                      </ListItem>
                      {job.startedAt && (
                        <ListItem>
                          <ListItemText
                            primary="Iniziato"
                            secondary={new Date(job.startedAt).toLocaleString()}
                          />
                        </ListItem>
                      )}
                      {job.completedAt && (
                        <ListItem>
                          <ListItemText
                            primary="Completato"
                            secondary={new Date(job.completedAt).toLocaleString()}
                          />
                        </ListItem>
                      )}
                      {job.estimatedTime && (
                        <ListItem>
                          <ListItemText
                            primary="Tempo Stimato"
                            secondary={`${Math.round(job.estimatedTime)} secondi`}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Collapse>
                </Box>
              </Box>
            </motion.div>
          ) : (
            <Alert severity="info" sx={{ mb: 3 }}>
              Nessun job di separazione attivo
            </Alert>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Server Stats */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Stato Server
            </Typography>

            {serverStats ? (
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Speed fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="CPU"
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={serverStats.cpu_usage}
                          sx={{ flexGrow: 1, height: 6 }}
                        />
                        <Typography variant="caption">
                          {serverStats.cpu_usage.toFixed(1)}%
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Memory fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="RAM"
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={serverStats.memory_usage}
                          sx={{ flexGrow: 1, height: 6 }}
                        />
                        <Typography variant="caption">
                          {serverStats.memory_usage.toFixed(1)}%
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>

                {serverStats.gpu_usage !== undefined && (
                  <ListItem>
                    <ListItemIcon>
                      <Memory fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="GPU"
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={serverStats.gpu_usage}
                            sx={{ flexGrow: 1, height: 6 }}
                            color="primary"
                          />
                          <Typography variant="caption">
                            {serverStats.gpu_usage.toFixed(1)}%
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                )}

                <ListItem>
                  <ListItemIcon>
                    <Storage fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Disco"
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={serverStats.disk_usage}
                          sx={{ flexGrow: 1, height: 6 }}
                        />
                        <Typography variant="caption">
                          {serverStats.disk_usage.toFixed(1)}%
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <CloudQueue fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Job Attivi"
                    secondary={`${serverStats.active_jobs} attivi, ${serverStats.queue_length} in coda`}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Timer fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Uptime"
                    secondary={formatUptime(serverStats.uptime)}
                  />
                </ListItem>
              </List>
            ) : (
              <Alert severity="warning">
                Impossibile caricare le statistiche del server
              </Alert>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Ultimo aggiornamento: {lastUpdate.toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default StatusPanel;