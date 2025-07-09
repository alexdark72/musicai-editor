import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  Edit,
  Info,
  Help,
  GitHub,
  CloudUpload,
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [githubMenuAnchor, setGithubMenuAnchor] = useState<null | HTMLElement>(null);

  const navigationItems = [
    { label: 'Home', path: '/', icon: <Home /> },
    { label: 'Editor', path: '/editor', icon: <Edit /> },
    { label: 'About', path: '/about', icon: <Info /> },
    { label: 'Help', path: '/help', icon: <Help /> },
  ];

  const handleGithubMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setGithubMenuAnchor(event.currentTarget);
  };

  const handleGithubMenuClose = () => {
    setGithubMenuAnchor(null);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const MobileDrawer = () => (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={handleMobileMenuToggle}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          background: 'rgba(26, 26, 46, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
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
      </Box>
      
      <List>
        {navigationItems.map((item) => (
          <ListItem
            key={item.path}
            component={Link}
            to={item.path}
            onClick={handleMobileMenuToggle}
            sx={{
              color: isActivePath(item.path) ? 'primary.main' : 'text.primary',
              backgroundColor: isActivePath(item.path) ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
        
        <ListItem
          component="a"
          href="https://github.com/musicai-editor"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleMobileMenuToggle}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
            <GitHub />
          </ListItemIcon>
          <ListItemText primary="GitHub" />
        </ListItem>
      </List>
    </Drawer>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'rgba(15, 15, 35, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMobileMenuToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                textDecoration: 'none',
                background: 'linear-gradient(45deg, #6366f1 30%, #ec4899 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
                fontSize: { xs: '1.1rem', md: '1.25rem' },
              }}
            >
              MusicAI Editor
            </Typography>
          </motion.div>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {navigationItems.map((item) => (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    color: isActivePath(item.path) ? 'primary.main' : 'text.primary',
                    backgroundColor: isActivePath(item.path) ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    },
                    borderRadius: 2,
                    px: 2,
                  }}
                >
                  {item.label}
                </Button>
              ))}
              
              {/* GitHub Menu */}
              <IconButton
                color="inherit"
                onClick={handleGithubMenuOpen}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  },
                }}
              >
                <GitHub />
              </IconButton>
              
              <Menu
                anchorEl={githubMenuAnchor}
                open={Boolean(githubMenuAnchor)}
                onClose={handleGithubMenuClose}
                PaperProps={{
                  sx: {
                    background: 'rgba(26, 26, 46, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <MenuItem
                  component="a"
                  href="https://github.com/musicai-editor"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleGithubMenuClose}
                >
                  Repository
                </MenuItem>
                <MenuItem
                  component="a"
                  href="https://github.com/musicai-editor/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleGithubMenuClose}
                >
                  Issues
                </MenuItem>
                <MenuItem
                  component="a"
                  href="https://github.com/musicai-editor/wiki"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleGithubMenuClose}
                >
                  Documentation
                </MenuItem>
              </Menu>
              
              {/* Upload Button */}
              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                onClick={() => navigate('/')}
                sx={{
                  ml: 2,
                  background: 'linear-gradient(45deg, #6366f1 30%, #ec4899 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #4f46e5 30%, #db2777 90%)',
                  },
                }}
              >
                Upload
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      {/* Mobile Drawer */}
      {isMobile && <MobileDrawer />}
    </>
  );
};

export default Navbar;