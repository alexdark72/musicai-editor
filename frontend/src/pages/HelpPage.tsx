import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Alert,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  ExpandMore,
  Help,
  PlayArrow,
  Upload,
  Download,
  Settings,
  MusicNote,
  Speed,
  Security,
  Code,
  Search,
  CheckCircle,
  Warning,
  Error,
  Info,
  GitHub,
  Book,
  VideoLibrary,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const HelpPage: React.FC = () => {
  const [expanded, setExpanded] = useState<string | false>('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const handleChange = (panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded ? panel : false);
  };

  const faqData = [
    {
      id: 'getting-started',
      title: 'Come Iniziare',
      icon: <PlayArrow />,
      content: {
        steps: [
          'Carica un file audio (MP3, WAV, FLAC) trascinandolo nella zona di upload',
          'Attendi che l\'AI separi automaticamente il brano in 16 tracce',
          'Usa l\'editor per regolare volume, pan e altri parametri',
          'Scarica le tracce singole o crea un mashup con l\'AI',
        ],
        tips: [
          'File di qualità superiore producono risultati migliori',
          'La separazione richiede 30-60 secondi per brani di 3-4 minuti',
          'Usa cuffie o monitor da studio per valutare la qualità',
        ],
      },
    },
    {
      id: 'audio-separation',
      title: 'Separazione Audio',
      icon: <MusicNote />,
      content: {
        description: 'Il nostro sistema AI separa automaticamente l\'audio in 16 tracce distinte:',
        categories: [
          {
            name: 'Voci',
            tracks: ['Lead Vocal', 'Backing Vocals', 'Cori'],
          },
          {
            name: 'Strumenti',
            tracks: ['Piano', 'Synth', 'Chitarra Elettrica', 'Chitarra Acustica', 'Archi', 'Fiati'],
          },
          {
            name: 'Ritmica',
            tracks: ['Kick', 'Snare', 'Hi-Hat', 'Percussioni', 'Basso'],
          },
          {
            name: 'Effetti',
            tracks: ['Atmosfere', 'Rumori'],
          },
        ],
        quality: [
          'Tecnologia Demucs-Hybrid per qualità professionale',
          'Elaborazione a 44.1kHz/24-bit o superiore',
          'Preservazione della fase audio originale',
        ],
      },
    },
    {
      id: 'editor-features',
      title: 'Funzionalità Editor',
      icon: <Settings />,
      content: {
        features: [
          {
            name: 'Controlli Traccia',
            description: 'Volume, pan, mute, solo per ogni traccia',
          },
          {
            name: 'Waveform Interattiva',
            description: 'Zoom, navigazione, visualizzazione spettrale',
          },
          {
            name: 'Effetti Audio',
            description: 'EQ, compressione, riverbero, normalizzazione',
          },
          {
            name: 'Sincronizzazione',
            description: 'Beat matching, allineamento BPM, correzione pitch',
          },
        ],
      },
    },
    {
      id: 'mashup-ai',
      title: 'Mashup AI',
      icon: <Speed />,
      content: {
        description: 'Crea mashup intelligenti con allineamento automatico:',
        features: [
          'Rilevamento automatico di BPM e tonalità',
          'Allineamento armonico tra tracce diverse',
          'Crossfade intelligente basato sull\'energia',
          'Suggerimenti di mixaggio AI-powered',
        ],
        steps: [
          'Seleziona 2-4 tracce dal pannello Mashup',
          'Configura BPM target e tonalità desiderata',
          'Attiva allineamento automatico e mixaggio armonico',
          'Clicca "Crea Mashup" e attendi l\'elaborazione',
        ],
      },
    },
    {
      id: 'export-download',
      title: 'Esportazione e Download',
      icon: <Download />,
      content: {
        formats: [
          'WAV (Lossless) - Qualità studio',
          'FLAC (Lossless) - Compressione senza perdite',
          'MP3 (320kbps) - Compatibilità universale',
          'AAC (256kbps) - Ottimizzato per streaming',
        ],
        options: [
          'Download singola traccia',
          'Download tutte le tracce (ZIP)',
          'Esporta mix finale',
          'Salva progetto per modifiche future',
        ],
      },
    },
    {
      id: 'privacy-security',
      title: 'Privacy e Sicurezza',
      icon: <Security />,
      content: {
        privacy: [
          'I file vengono eliminati automaticamente dopo 24 ore',
          'Nessun tracciamento o raccolta dati personali',
          'Elaborazione completamente anonima',
          'Conformità GDPR garantita',
        ],
        security: [
          'Connessioni HTTPS crittografate',
          'Codice open-source auditabile',
          'Nessun storage permanente sui server',
          'Possibilità di self-hosting per controllo totale',
        ],
      },
    },
    {
      id: 'troubleshooting',
      title: 'Risoluzione Problemi',
      icon: <Help />,
      content: {
        common: [
          {
            problem: 'Upload fallito',
            solutions: [
              'Verifica che il file sia sotto i 100MB',
              'Controlla il formato (MP3, WAV, FLAC supportati)',
              'Prova a ricaricare la pagina',
            ],
          },
          {
            problem: 'Separazione lenta',
            solutions: [
              'La velocità dipende dal carico del server',
              'File più lunghi richiedono più tempo',
              'Considera il self-hosting per prestazioni dedicate',
            ],
          },
          {
            problem: 'Qualità audio scarsa',
            solutions: [
              'Usa file sorgente di alta qualità (WAV/FLAC)',
              'Evita file già compressi multiple volte',
              'Alcuni generi musicali si separano meglio di altri',
            ],
          },
        ],
      },
    },
    {
      id: 'self-hosting',
      title: 'Self-Hosting',
      icon: <Code />,
      content: {
        description: 'Installa MusicAI Editor sul tuo server per controllo completo:',
        requirements: [
          'Docker e Docker Compose',
          'GPU NVIDIA con CUDA (raccomandato)',
          'Minimo 8GB RAM, 16GB raccomandati',
          'Spazio disco: 10GB per modelli AI',
        ],
        steps: [
          'git clone https://github.com/musicai-editor/musicai-editor',
          'cd musicai-editor',
          'docker-compose up -d',
          'Apri http://localhost:3000',
        ],
      },
    },
  ];

  const filteredFaq = faqData.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(item.content).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
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
            Centro Assistenza
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
            Guide, FAQ e documentazione per MusicAI Editor
          </Typography>

          {/* Search */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Cerca nella documentazione..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 600, mx: 'auto' }}
          />
        </Box>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setExpanded('getting-started')}>
              <CardContent>
                <PlayArrow color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Guida Rapida</Typography>
                <Typography variant="body2" color="text.secondary">
                  Inizia subito
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center' }}>
              <CardContent>
                <GitHub color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">GitHub</Typography>
                <Typography variant="body2" color="text.secondary">
                  Codice sorgente
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center' }}>
              <CardContent>
                <Book color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">API Docs</Typography>
                <Typography variant="body2" color="text.secondary">
                  Documentazione API
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center' }}>
              <CardContent>
                <VideoLibrary color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Tutorial</Typography>
                <Typography variant="body2" color="text.secondary">
                  Video guide
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      {/* FAQ Accordions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {filteredFaq.map((faq, index) => (
          <Accordion
            key={faq.id}
            expanded={expanded === faq.id}
            onChange={handleChange(faq.id)}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {faq.icon}
                <Typography variant="h6">{faq.title}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ p: 2 }}>
                {/* Getting Started */}
                {faq.id === 'getting-started' && (
                  <>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Passi per Iniziare:
                    </Typography>
                    <List>
                      {faq.content.steps?.map((step, i) => (
                        <ListItem key={i}>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText primary={`${i + 1}. ${step}`} />
                        </ListItem>
                      ))}
                    </List>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>💡 Suggerimenti:</Typography>
                      <List dense>
                        {faq.content.tips?.map((tip, i) => (
                          <ListItem key={i} sx={{ py: 0 }}>
                            <ListItemText primary={`• ${tip}`} />
                          </ListItem>
                        ))}
                      </List>
                    </Alert>
                  </>
                )}

                {/* Audio Separation */}
                {faq.id === 'audio-separation' && (
                  <>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      {faq.content.description}
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      {faq.content.categories?.map((category, i) => (
                        <Grid item xs={12} sm={6} key={i}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                              {category.name}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {category.tracks.map((track, j) => (
                                <Chip key={j} label={track} size="small" variant="outlined" />
                              ))}
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                    <Alert severity="success">
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>🎵 Qualità Professionale:</Typography>
                      <List dense>
                        {faq.content.quality?.map((item, i) => (
                          <ListItem key={i} sx={{ py: 0 }}>
                            <ListItemText primary={`• ${item}`} />
                          </ListItem>
                        ))}
                      </List>
                    </Alert>
                  </>
                )}

                {/* Editor Features */}
                {faq.id === 'editor-features' && (
                  <Grid container spacing={2}>
                    {faq.content.features?.map((feature, i) => (
                      <Grid item xs={12} sm={6} key={i}>
                        <Paper sx={{ p: 2, height: '100%' }}>
                          <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                            {feature.name}
                          </Typography>
                          <Typography variant="body2">
                            {feature.description}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {/* Mashup AI */}
                {faq.id === 'mashup-ai' && (
                  <>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {faq.content.description}
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 1 }}>Funzionalità:</Typography>
                    <List>
                      {faq.content.features?.map((feature, i) => (
                        <ListItem key={i}>
                          <ListItemIcon>
                            <CheckCircle color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={feature} />
                        </ListItem>
                      ))}
                    </List>
                    <Typography variant="h6" sx={{ mb: 1, mt: 2 }}>Come Usarlo:</Typography>
                    <List>
                      {faq.content.steps?.map((step, i) => (
                        <ListItem key={i}>
                          <ListItemIcon>
                            <Typography variant="h6" color="primary">{i + 1}</Typography>
                          </ListItemIcon>
                          <ListItemText primary={step} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}

                {/* Export Download */}
                {faq.id === 'export-download' && (
                  <>
                    <Typography variant="h6" sx={{ mb: 2 }}>Formati Supportati:</Typography>
                    <Grid container spacing={1} sx={{ mb: 3 }}>
                      {faq.content.formats?.map((format, i) => (
                        <Grid item xs={12} sm={6} key={i}>
                          <Chip label={format} variant="outlined" sx={{ width: '100%' }} />
                        </Grid>
                      ))}
                    </Grid>
                    <Typography variant="h6" sx={{ mb: 2 }}>Opzioni di Download:</Typography>
                    <List>
                      {faq.content.options?.map((option, i) => (
                        <ListItem key={i}>
                          <ListItemIcon>
                            <Download color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={option} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}

                {/* Privacy Security */}
                {faq.id === 'privacy-security' && (
                  <>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>🔒 Privacy:</Typography>
                      <List dense>
                        {faq.content.privacy?.map((item, i) => (
                          <ListItem key={i} sx={{ py: 0 }}>
                            <ListItemText primary={`• ${item}`} />
                          </ListItem>
                        ))}
                      </List>
                    </Alert>
                    <Alert severity="info">
                      <Typography variant="h6" sx={{ mb: 1 }}>🛡️ Sicurezza:</Typography>
                      <List dense>
                        {faq.content.security?.map((item, i) => (
                          <ListItem key={i} sx={{ py: 0 }}>
                            <ListItemText primary={`• ${item}`} />
                          </ListItem>
                        ))}
                      </List>
                    </Alert>
                  </>
                )}

                {/* Troubleshooting */}
                {faq.id === 'troubleshooting' && (
                  <>
                    {faq.content.common?.map((issue, i) => (
                      <Paper key={i} sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" color="error" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Warning /> {issue.problem}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Soluzioni:</Typography>
                        <List dense>
                          {issue.solutions.map((solution, j) => (
                            <ListItem key={j} sx={{ py: 0 }}>
                              <ListItemIcon>
                                <CheckCircle color="success" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={solution} />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    ))}
                  </>
                )}

                {/* Self Hosting */}
                {faq.id === 'self-hosting' && (
                  <>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {faq.content.description}
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 1 }}>Requisiti di Sistema:</Typography>
                    <List>
                      {faq.content.requirements?.map((req, i) => (
                        <ListItem key={i}>
                          <ListItemIcon>
                            <Info color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={req} />
                        </ListItem>
                      ))}
                    </List>
                    <Typography variant="h6" sx={{ mb: 1, mt: 2 }}>Installazione:</Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'grey.100' }}>
                      <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {faq.content.steps?.join('\n')}
                      </Typography>
                    </Paper>
                  </>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </motion.div>

      {/* Contact Support */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Paper sx={{ p: 4, mt: 4, textAlign: 'center', background: 'rgba(99, 102, 241, 0.1)' }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Hai ancora bisogno di aiuto?
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Non hai trovato quello che cercavi? Contatta la community o segnala un problema.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<GitHub />} href="https://github.com/musicai-editor/issues" target="_blank">
              Segnala Bug
            </Button>
            <Button variant="outlined" href="https://github.com/musicai-editor/discussions" target="_blank">
              Community Forum
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default HelpPage;