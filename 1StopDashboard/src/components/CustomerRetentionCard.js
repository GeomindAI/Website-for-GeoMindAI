import React from 'react';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';

const CustomerRetentionCard = ({ data }) => {
  const retentionRate = data?.retentionRate ? data.retentionRate : 0;
  const returningCustomers = data?.returningCustomers || 0;
  const totalCustomers = data?.totalCustomers || 0;

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Customer Retention
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 2 }}>
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
          <CircularProgress
            variant="determinate"
            value={retentionRate * 100}
            size={120}
            thickness={5}
            sx={{ color: '#3B82F6' }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h4" component="div" color="text.secondary">
              {(retentionRate * 100).toFixed(1)}%
            </Typography>
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary">
          {returningCustomers} returning out of {totalCustomers} customers
        </Typography>
      </Box>
    </Paper>
  );
};

export default CustomerRetentionCard; 