import React from 'react';
import { Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const MockMapView = ({ geoData, selectedCity }) => {
  return (
    <Paper sx={{ height: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Order Locations (Mock Map)</Typography>
        <FormControl variant="outlined" size="small" sx={{ width: 200 }}>
          <InputLabel>Visualization Mode</InputLabel>
          <Select
            value="count"
            label="Visualization Mode"
          >
            <MenuItem value="count">Order Count</MenuItem>
            <MenuItem value="revenue">Revenue</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Box 
        sx={{ 
          height: 'calc(100% - 50px)', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: '#f0f0f0',
          borderRadius: 1,
          p: 3
        }}
      >
        <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
          Map visualization is not available in this environment.
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Selected City: {selectedCity === 'all' ? 'All Cities' : selectedCity}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          Data points: {geoData?.length || 0}
        </Typography>
        
        {geoData && geoData.length > 0 && (
          <Box sx={{ mt: 3, width: '100%', maxWidth: 400 }}>
            <Typography variant="subtitle2" gutterBottom>Sample Data:</Typography>
            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, fontSize: 14 }}>
              <pre style={{ margin: 0, overflow: 'auto' }}>
                {JSON.stringify(geoData[0], null, 2)}
              </pre>
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default MockMapView;