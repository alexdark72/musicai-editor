import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Grid,
  IconButton,
  Divider,
} from '@mui/material';
import {
  GitHub,
  Twitter,
  Email,
  Favorite,
  OpenSource,
  Security,
  Speed,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Features', href: '/#features' },
      { label: 'Editor', href: '/editor' },
      { label: 'API Docs', href: '/help' },
      { label: 'Roadmap', href: 'https://github.com/musicai-editor/roadmap' },
    ],
    resources: [
      { label: 'Documentation', href: '/help' },
      { label: 'GitHub', href: 'https://github.com/musicai-editor' },
      { label: 'Issues', href: 'https://github.com/musicai-editor/issues' },
      { label: 'Contributing', href: 'https://github.com/musicai-editor/contributing' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'MIT License', href: 'https://github.com/musicai-editor/blob/main/LICENSE' },
      { label: 'Open Source', href: '/about#open-source' },
    ],
  };

  const socialLinks = [
    {
      icon: <GitHub />,
      href: 'https://github.com/musicai-editor',
      label: 'GitHub',
    },
    {
      icon: <Twitter />,
      href: 'https://twitter.com/musicai_editor',
      label: 'Twitter',
    },
    {
      icon: <Email />,
      href: 'mailto:hello@musicai-editor.com',
      label: 'Email',
    },
  ];

  const features = [
    {
      icon: <OpenSource sx={{ fontSize: 20 }} />,
      text: '100% Open Source',
    },
    {
      icon: <Security sx={{ fontSize: 20 }} />,
      text: 'Privacy First',
    },
    {
      icon: <Speed sx={{ fontSize: 20 }} />,
      text: 'GPU Accelerated',
    },
  ];

  return (
    <Box
      component="footer"
      sx={{
        background: 'linear-gradient(180deg, rgba(15, 15, 35, 0.8) 0%, rgba(26, 26, 46, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          {/* Brand Section */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Typography
                variant="h6"
                sx={{
                  background: 'linear-gradient(45deg, #6366f1 30%, #ec4899 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                MusicAI Editor
              </Typography>
              
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, lineHeight: 1.6 }}
              >
                Software gratuito di editing musicale con AI per separazione avanzata in 16 tracce.
                Completamente open-source e self-hostable.
              </Typography>
              
              {/* Feature Badges */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                {features.map((feature, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: 'text.secondary',
                    }}
                  >
                    {feature.icon}
                    <Typography variant="caption">
                      {feature.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
              
              {/* Social Links */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {socialLinks.map((social, index) => (
                  <IconButton
                    key={index}
                    component="a"
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'primary.main',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      },
                    }}
                  >
                    {social.icon}
                  </IconButton>
                ))}
              </Box>
            </motion.div>
          </Grid>
          
          {/* Links Sections */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={4}>
              {/* Product Links */}
              <Grid item xs={6} md={4}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 2 }}
                  >
                    Prodotto
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {footerLinks.product.map((link, index) => (
                      <Link
                        key={index}
                        href={link.href}
                        color="text.secondary"
                        underline="none"
                        sx={{
                          fontSize: '0.875rem',
                          '&:hover': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </Box>
                </motion.div>
              </Grid>
              
              {/* Resources Links */}
              <Grid item xs={6} md={4}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 2 }}
                  >
                    Risorse
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {footerLinks.resources.map((link, index) => (
                      <Link
                        key={index}
                        href={link.href}
                        color="text.secondary"
                        underline="none"
                        target={link.href.startsWith('http') ? '_blank' : undefined}
                        rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        sx={{
                          fontSize: '0.875rem',
                          '&:hover': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </Box>
                </motion.div>
              </Grid>
              
              {/* Legal Links */}
              <Grid item xs={12} md={4}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 2 }}
                  >
                    Legale
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {footerLinks.legal.map((link, index) => (
                      <Link
                        key={index}
                        href={link.href}
                        color="text.secondary"
                        underline="none"
                        target={link.href.startsWith('http') ? '_blank' : undefined}
                        rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        sx={{
                          fontSize: '0.875rem',
                          '&:hover': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </Box>
                </motion.div>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        
        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              © {currentYear} MusicAI Editor. Made with{' '}
              <Favorite sx={{ fontSize: 16, color: '#ec4899' }} />{' '}
              for the music community.
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Powered by Demucs AI • MIT License
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Footer;