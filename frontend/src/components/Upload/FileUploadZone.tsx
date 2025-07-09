import React, { useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Paper,
  Alert,
} from '@mui/material';
import {
  CloudUpload,
  AudioFile,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  error?: string;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesSelected,
  isUploading = false,
  uploadProgress = 0,
  maxSize = 100 * 1024 * 1024, // 100MB default
  acceptedTypes = ['audio/mp3', 'audio/wav', 'audio/flac', 'audio/mpeg'],
  error,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          console.error('File troppo grande');
          return;
        }
        if (rejection.errors[0]?.code === 'file-invalid-type') {
          console.error('Tipo di file non supportato');
          return;
        }
      }
      
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.m4a', '.aac'],
    },
    maxSize,
    maxFiles: 1,
    disabled: isUploading,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getZoneColor = () => {
    if (isDragReject || error) return 'error.main';
    if (isDragActive) return 'primary.main';
    if (isUploading) return 'warning.main';
    return 'grey.300';
  };

  const getZoneBackground = () => {
    if (isDragReject || error) return 'rgba(244, 67, 54, 0.1)';
    if (isDragActive) return 'rgba(99, 102, 241, 0.1)';
    if (isUploading) return 'rgba(245, 158, 11, 0.1)';
    return 'rgba(255, 255, 255, 0.05)';
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto' }}>
      <motion.div
        whileHover={{ scale: isUploading ? 1 : 1.02 }}
        whileTap={{ scale: isUploading ? 1 : 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <Paper
          {...getRootProps()}
          sx={{
            p: 4,
            textAlign: 'center',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            border: 2,
            borderStyle: 'dashed',
            borderColor: getZoneColor(),
            backgroundColor: getZoneBackground(),
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              borderColor: isUploading ? getZoneColor() : 'primary.main',
              backgroundColor: isUploading ? getZoneBackground() : 'rgba(99, 102, 241, 0.1)',
            },
          }}
        >
          <input {...getInputProps()} id="file-upload" />
          
          <AnimatePresence mode="wait">
            {isUploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CloudUpload
                  sx={{
                    fontSize: 64,
                    color: 'warning.main',
                    mb: 2,
                    animation: 'pulse 2s infinite',
                  }}
                />
                
                <Typography variant="h6" gutterBottom>
                  Caricamento in corso...
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {uploadProgress}% completato
                </Typography>
                
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                    },
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {isDragActive ? (
                  <>
                    <CheckCircle
                      sx={{
                        fontSize: 64,
                        color: 'primary.main',
                        mb: 2,
                      }}
                    />
                    <Typography variant="h6" color="primary">
                      Rilascia il file qui
                    </Typography>
                  </>
                ) : isDragReject ? (
                  <>
                    <ErrorIcon
                      sx={{
                        fontSize: 64,
                        color: 'error.main',
                        mb: 2,
                      }}
                    />
                    <Typography variant="h6" color="error">
                      File non supportato
                    </Typography>
                  </>
                ) : (
                  <>
                    <AudioFile
                      sx={{
                        fontSize: 64,
                        color: 'text.secondary',
                        mb: 2,
                      }}
                    />
                    
                    <Typography variant="h6" gutterBottom>
                      Trascina un file audio qui
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      oppure clicca per selezionare
                    </Typography>
                    
                    <Button
                      variant="contained"
                      startIcon={<CloudUpload />}
                      sx={{ mb: 3 }}
                    >
                      Seleziona File
                    </Button>
                    
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Formati supportati: MP3, WAV, FLAC, M4A, AAC
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Dimensione massima: {formatFileSize(maxSize)}
                      </Typography>
                    </Box>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Effetto di sfondo animato */}
          {isDragActive && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, transparent 30%, rgba(99, 102, 241, 0.1) 50%, transparent 70%)',
                animation: 'shimmer 2s infinite',
                pointerEvents: 'none',
              }}
            />
          )}
        </Paper>
      </motion.div>
      
      {/* Messaggio di errore */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Suggerimenti */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          💡 <strong>Suggerimento:</strong> Per risultati ottimali, usa file audio di alta qualità (WAV o FLAC)
        </Typography>
      </Box>
      
      {/* CSS per animazioni */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </Box>
  );
};

export default FileUploadZone;