import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  CloudUpload,
  MusicNote,
  Speed,
  Security,
  OpenSource,
  AutoAwesome,
  Equalizer,
  Download,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

// Components
import FileUploadZone from '../components/Upload/FileUploadZone';
import FeatureCard from '../components/UI/FeatureCard';
import StatsCard from '../components/UI/StatsCard';

// Services
import { AudioAPI } from '../services/api';
import { useAppStore } from '../store/appStore';

// Animazioni Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { setLoading, addSeparationJob, setCurrentJob } = useAppStore();
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Gestione upload file
  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Validazione file
    if (!file.type.startsWith('audio/')) {
      toast.error('Seleziona un file audio valido (MP3, WAV, FLAC)');
      return;
    }
    
    if (file.size > 100 * 1024 * 1024) { // 100MB
      toast.error('File troppo grande. Dimensione massima: 100MB');
      return;
    }
    
    setIsUploading(true);
    setLoading(true);
    
    try {
      // Upload del file
      const uploadResponse = await AudioAPI.uploadAudio(file, setUploadProgress);
      
      toast.success('File caricato con successo!');
      
      // Avvia separazione automaticamente
      const separationResponse = await AudioAPI.startSeparation(uploadResponse.session_id);
      
      // Crea job nel store
      const newJob = {
        id: separationResponse.job_id,
        status: 'pending' as const,
        progress: 0,
        originalFile: file,
        tracks: [],
        createdAt: new Date(),
        estimatedTime: separationResponse.estimated_time,
      };
      
      addSeparationJob(newJob);
      setCurrentJob(newJob);
      
      // Naviga all'editor
      navigate(`/editor/${uploadResponse.session_id}`);
      
    } catch (error: any) {
      console.error('Errore upload:', error);
      toast.error(error.message || 'Errore durante il caricamento del file');
    } finally {
      setIsUploading(false);
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Features principali
  const features = [
    {
      icon: <AutoAwesome />,
      title: 'AI Avanzata',
      description: 'Separazione in 16 tracce con modelli Demucs-Hybrid di ultima generazione',
      color: '#6366f1',
    },
    {
      icon: <Speed />,
      title: 'Veloce',
      description: 'Elaborazione GPU ottimizzata: 3 minuti di audio in meno di 60 secondi',
      color: '#10b981',
    },
    {
      icon: <Security />,
      title: 'Privacy',
      description: 'File cancellati automaticamente dopo 24 ore. Zero tracciamento utente',
      color: '#ec4899',
    },
    {
      icon: <OpenSource />,
      title: 'Open Source',
      description: 'Codice completamente aperto, self-hostable, nessun paywall',
      color: '#f59e0b',
    },
    {
      icon: <Equalizer />,
      title: 'Editor Completo',
      description: 'Interfaccia professionale con waveform interattive e controlli avanzati',
      color: '#8b5cf6',
    },
    {
      icon: <MusicNote />,
      title: 'Mashup AI',
      description: 'Strumenti intelligenti per beat matching e allineamento automatico',
      color: '#06b6d4',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Hero Section */}
        <motion.div variants={itemVariants}>
          <Box textAlign="center" mb={8}>
            <Typography
              variant="h1"
              component="h1"
              gutterBottom
              sx={{
                background: 'linear-gradient(45deg, #6366f1 30%, #ec4899 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3,
              }}
            >
              MusicAI Editor
            </Typography>
            
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
            >
              Software gratuito di editing musicale con AI per separazione avanzata in 16 tracce.
              Nessun paywall, completamente open-source.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 4 }}>
              <Chip label="16 Tracce AI" color="primary" />
              <Chip label="Zero Paywall" color="secondary" />
              <Chip label="Open Source" color="success" />
              <Chip label="Self-Hostable" color="warning" />
            </Box>
          </Box>
        </motion.div>

        {/* Upload Zone */}
        <motion.div variants={itemVariants}>
          <Box mb={8}>
            <FileUploadZone
              onFilesSelected={handleFileUpload}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              maxSize={100 * 1024 * 1024} // 100MB
              acceptedTypes={['audio/mp3', 'audio/wav', 'audio/flac', 'audio/mpeg']}
            />
          </Box>
        </motion.div>

        {/* Features Grid */}
        <motion.div variants={itemVariants}>
          <Box mb={8}>
            <Typography variant="h3" textAlign="center" gutterBottom>
              Funzionalità Avanzate
            </Typography>
            
            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 6, maxWidth: 800, mx: 'auto' }}
            >
              Tecnologia AI all'avanguardia per produttori musicali, DJ e appassionati.
              Tutto quello che serve per creare remix e mashup professionali.
            </Typography>
            
            <Grid container spacing={3}>
              {features.map((feature, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FeatureCard {...feature} />
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Box>
        </motion.div>

        {/* Stats Section */}
        <motion.div variants={itemVariants}>
          <Box mb={8}>
            <Typography variant="h3" textAlign="center" gutterBottom>
              Perché Scegliere MusicAI Editor?
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 4 }}>
              <Grid item xs={12} md={3}>
                <StatsCard
                  value="16"
                  label="Tracce Separate"
                  description="Voci, strumenti, ritmica ed effetti"
                  color="#6366f1"
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <StatsCard
                  value="<60s"
                  label="Tempo Elaborazione"
                  description="Per 3 minuti di audio con GPU"
                  color="#10b981"
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <StatsCard
                  value="100%"
                  label="Gratuito"
                  description="Nessuna limitazione o paywall"
                  color="#ec4899"
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <StatsCard
                  value="24h"
                  label="Privacy"
                  description="File cancellati automaticamente"
                  color="#f59e0b"
                />
              </Grid>
            </Grid>
          </Box>
        </motion.div>

        {/* CTA Section */}
        <motion.div variants={itemVariants}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
              color: 'white',
              textAlign: 'center',
              p: 4,
            }}
          >
            <CardContent>
              <Typography variant="h4" gutterBottom>
                Inizia Subito
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                Carica il tuo primo brano e scopri la potenza dell'AI per la separazione audio.
                Nessuna registrazione richiesta.
              </Typography>
              
              <Button
                variant="contained"
                size="large"
                startIcon={<CloudUpload />}
                onClick={() => document.getElementById('file-upload')?.click()}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                Carica Audio
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </motion.div>
  );
};

export default HomePage;