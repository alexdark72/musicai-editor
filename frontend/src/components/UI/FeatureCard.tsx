import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  color,
}) => {
  return (
    <Card
      component={motion.div}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      sx={{
        height: '100%',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        '&:hover': {
          border: `1px solid ${color}`,
          boxShadow: `0 8px 32px rgba(${hexToRgb(color)}, 0.3)`,
        },
        transition: 'all 0.3s ease',
      }}
    >
      <CardContent sx={{ p: 3, textAlign: 'center' }}>
        <Box
          sx={
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${color}20, ${color}40)`,
            border: `2px solid ${color}`,
            mx: 'auto',
            mb: 2,
            '& svg': {
              fontSize: 32,
              color: color,
            },
          }
        >
          {icon}
        </Box>
        
        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          sx={{ fontWeight: 600 }}
        >
          {title}
        </Typography>
        
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.6 }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

// Utility per convertire hex in rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `${r}, ${g}, ${b}`;
  }
  return '99, 102, 241'; // fallback
};

export default FeatureCard;