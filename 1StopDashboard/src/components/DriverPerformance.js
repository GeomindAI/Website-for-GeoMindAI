import React from 'react';
import { 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Box
} from '@mui/material';

const DriverPerformance = ({ driverData = [] }) => {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>Driver Performance</Typography>
      
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Driver ID</TableCell>
              <TableCell>Total Services</TableCell>
              <TableCell>Pickups</TableCell>
              <TableCell>Dropoffs</TableCell>
              <TableCell>Total Distance (km)</TableCell>
              <TableCell>Completion Rate</TableCell>
              <TableCell>Avg. Distance/Service</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {driverData.length > 0 ? (
              driverData.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>{driver.id.substring(0, 8)}...</TableCell>
                  <TableCell>{driver.totalServices}</TableCell>
                  <TableCell>{driver.totalPickups}</TableCell>
                  <TableCell>{driver.totalDropoffs}</TableCell>
                  <TableCell>{driver.totalDistance.toFixed(2)} km</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          backgroundColor: driver.completionRate >= 0.9 ? '#10B981' : 
                                          driver.completionRate >= 0.75 ? '#F59E0B' : '#EF4444',
                          mr: 1
                        }} 
                      />
                      {(driver.completionRate * 100).toFixed(1)}%
                    </Box>
                  </TableCell>
                  <TableCell>{driver.avgDistancePerService.toFixed(2)} km</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">No driver data available</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default DriverPerformance; 