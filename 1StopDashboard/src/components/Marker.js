import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';

const Marker = ({ type, color, name, orderDetails }) => {
  // Fixed marker style - removed absolute positioning and transform that breaks map scaling
  const markerStyle = {
    cursor: 'pointer',
    zIndex: type === 'laundromat' ? 10 : 5,
    transition: 'all 0.2s ease',
    '&:hover': {
      zIndex: 20
    }
  };

  if (type === 'laundromat') {
    return (
      <Tooltip 
        title={
          <div>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{name}</Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {orderDetails?.address || 'Laundromat'}
            </Typography>
          </div>
        }
        arrow
        placement="top"
      >
        <Box
          sx={{
            ...markerStyle,
            width: '30px',
            height: '30px',
            backgroundColor: color,
            clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
            border: '2px solid white',
            boxShadow: '0 3px 5px rgba(0,0,0,0.4)',
            // Proper centering for Google Maps
            position: 'absolute',
            left: '-15px',
            top: '-15px'
          }}
        />
      </Tooltip>
    );
  }

  // Order marker - show laundromat association
  const laundromatName = orderDetails?.laundromatName || 'Unknown Laundromat';
  
  return (
    <Tooltip 
      title={
        <div>
          <Typography variant="subtitle2">
            {orderDetails.customerType} Order
          </Typography>
          <Typography variant="body2">
            ${orderDetails.revenue.toFixed(2)}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {orderDetails.address}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', fontSize: '0.75rem' }}>
            Assigned to: {laundromatName}
          </Typography>
        </div>
      }
      arrow
      placement="top"
    >
      <Box
        sx={{
          ...markerStyle,
          width: '10px',
          height: '10px',
          backgroundColor: color,
          borderRadius: '50%',
          border: '1px solid white',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          opacity: 0.85,
          '&:hover': {
            opacity: 1,
            width: '12px',
            height: '12px'
          },
          // Proper centering for Google Maps
          position: 'absolute',
          left: '-5px',
          top: '-5px'
        }}
      />
    </Tooltip>
  );
};

export default Marker; 