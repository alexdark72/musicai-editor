import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import { motion } from 'framer-motion';

interface StatsCardProps {
  value: string;
  label: string;
  description: string;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  value,
  label,
  description,
  color,
}) => {
  return (
    <Card
      component={motion.div}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${color}15, ${color}25)`,
        border: `1px solid ${color}30`,
        textAlign: 'center',
        '&:hover': {
          border: `1px solid ${color}`,
          boxShadow: `0 8px 32px rgba(${hexToRgb(color)}, 0.3)`,
        },
        transition: 'all 0.3s ease',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="h3"
          component="div"
          sx={{
            fontWeight: 700,
            color: color,
            mb: 1,
            fontSize: { xs: '2rem', md: '2.5rem' },
          }}
        >
          {value}
        </Typography>
        
        <Typography
          variant="h6"
          component="div"
          gutterBottom
          sx={{ fontWeight: 600 }}
        >
          {label}
        </Typography>
        
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.4 }}
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

export default StatsCard;