import React from 'react';
import { Paper, Box, Typography, Icon } from '@mui/material';

const MetricCard = ({ title, value, icon, color }) => {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        height: '100%',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative accent */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          backgroundColor: color || '#3B82F6'
        }}
      />
      
      {/* Icon */}
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${color}22` || '#3B82F622',
          mb: 2
        }}
      >
        <Icon sx={{ color: color || '#3B82F6' }}>{icon}</Icon>
      </Box>
      
      {/* Title */}
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      
      {/* Value */}
      <Typography variant="h4" component="div" fontWeight="bold">
        {value}
      </Typography>
    </Paper>
  );
};

export default MetricCard; 