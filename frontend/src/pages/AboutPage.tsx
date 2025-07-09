import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
} from '@mui/material';
import {
  OpenSource,
  Security,
  Speed,
  CloudOff,
  MusicNote,
  Code,
  GitHub,
  Favorite,
  CheckCircle,
  Star,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const AboutPage: React.FC = () => {
  const features = [
    {
      icon: <MusicNote />,
      title: 'Separazione AI Avanzata',
      description: 'Tecnologia Demucs per separare audio in 16 tracce distinte con qualità professionale.',
    },
    {
      icon: <OpenSource />,
      title: '100% Open Source',
      description: 'Codice completamente aperto sotto licenza MIT. Nessun vendor lock-in.',
    },
    {
      icon: <Security />,
      title: 'Privacy Garantita',
      description: 'I tuoi file vengono eliminati automaticamente dopo 24 ore. Zero tracciamento.',
    },
    {
      icon: <Speed />,
      title: 'GPU Accelerato',
      description: 'Elaborazione ultra-veloce con supporto NVIDIA CUDA per prestazioni ottimali.',
    },
    {
      icon: <CloudOff />,
      title: 'Self-Hostable',
      description: 'Installa sul tuo server per controllo completo e accesso perpetuo.',
    },
    {
      icon: <Code />,
      title: 'API Completa',
      description: 'Integra facilmente nelle tue applicazioni con la nostra API RESTful.',
    },
  ];

  const techStack = [
    { name: 'React', category: 'Frontend' },
    { name: 'TypeScript', category: 'Frontend' },
    { name: 'Material-UI', category: 'Frontend' },
    { name: 'Wavesurfer.js', category: 'Audio' },
    { name: 'FastAPI', category: 'Backend' },
    { name: 'Python', category: 'Backend' },
    { name: 'Demucs', category: 'AI' },
    { name: 'PyTorch', category: 'AI' },
    { name: 'Docker', category: 'DevOps' },
    { name: 'Redis', category: 'Cache' },
  ];

  const principles = [
    'Nessuna limitazione artificiale o paywall',
    'Codice completamente trasparente e auditabile',
    'Privacy e sicurezza dei dati al primo posto',
    'Prestazioni ottimizzate per hardware consumer',
    'Interfaccia intuitiva e accessibile',
    'Documentazione completa e supporto community',
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #6366f1, #ec4899)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              mb: 2,
            }}
          >
            MusicAI Editor
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
            Editor musicale open-source con AI per separazione audio professionale
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Chip icon={<OpenSource />} label="Open Source" color="primary" />
            <Chip icon={<Security />} label="Privacy First" color="success" />
            <Chip icon={<Speed />} label="GPU Accelerated" color="warning" />
            <Chip icon={<CloudOff />} label="Self-Hostable" color="info" />
          </Box>
        </Box>
      </motion.div>

      {/* Mission Statement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Paper sx={{ p: 4, mb: 6, background: 'rgba(99, 102, 241, 0.1)' }}>
          <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
            La Nostra Missione
          </Typography>
          <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, textAlign: 'center' }}>
            Democratizzare l'accesso agli strumenti di produzione musicale professionale attraverso 
            l'intelligenza artificiale. Crediamo che la creatività musicale non debba essere limitata 
            da barriere economiche o tecnologiche. Per questo abbiamo creato una piattaforma 
            completamente gratuita, open-source e self-hostable che mette il potere dell'AI 
            nelle mani di ogni musicista, produttore e appassionato.
          </Typography>
        </Paper>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Typography variant="h4" sx={{ mb: 4, textAlign: 'center' }}>
          Caratteristiche Principali
        </Typography>
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} key={index}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card sx={{ height: '100%', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        {feature.icon}
                      </Avatar>
                      <Typography variant="h6">
                        {feature.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* Tech Stack */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Paper sx={{ p: 4, mb: 6 }}>
          <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
            Stack Tecnologico
          </Typography>
          <Grid container spacing={2}>
            {techStack.map((tech, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <Chip
                    label={tech.name}
                    variant="outlined"
                    sx={{ mb: 1, width: '100%' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {tech.category}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </motion.div>

      {/* Principles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4, height: '100%' }}>
              <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Star color="primary" />
                I Nostri Principi
              </Typography>
              <List>
                {principles.map((principle, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary={principle} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4, height: '100%' }}>
              <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Favorite color="error" />
                Perché Open Source?
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Crediamo nella trasparenza e nella collaborazione. L'open source garantisce:
              </Typography>
              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Sicurezza attraverso la trasparenza del codice" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Miglioramenti continui dalla community" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Nessun vendor lock-in o dipendenza" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Accesso perpetuo al software" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))',
          }}
        >
          <Typography variant="h4" sx={{ mb: 2 }}>
            Unisciti alla Community
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            Contribuisci al progetto, segnala bug, proponi nuove funzionalità o semplicemente 
            condividi la tua esperienza con la community.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<GitHub />}
              href="https://github.com/musicai-editor"
              target="_blank"
            >
              GitHub Repository
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="/help"
            >
              Documentazione
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default AboutPage;