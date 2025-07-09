import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Backdrop,
} from '@mui/material';
import { motion } from 'framer-motion';

interface LoadingOverlayProps {
  message?: string;
  progress?: number;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Caricamento in corso...',
  progress,
}) => {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'rgba(15, 15, 35, 0.8)',
        backdropFilter: 'blur(10px)',
      }}
      open={true}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            p: 4,
          }}
        >
          <Box sx={{ position: 'relative', mb: 3 }}>
            <CircularProgress
              size={80}
              thickness={4}
              sx={{
                color: 'primary.main',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                },
              }}
              {...(progress !== undefined && {
                variant: 'determinate',
                value: progress,
              })}
            />
            
            {progress !== undefined && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  component="div"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  {Math.round(progress)}%
                </Typography>
              </Box>
            )}
          </Box>
          
          <Typography
            variant="h6"
            component="div"
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            {message}
          </Typography>
          
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 300 }}
          >
            Questo potrebbe richiedere alcuni minuti...
          </Typography>
        </Box>
      </motion.div>
    </Backdrop>
  );
};

export default LoadingOverlay;