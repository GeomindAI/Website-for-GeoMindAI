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
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';

const LaundromatPerformanceTable = ({ laundromatStats = [], laundromatFilter, setLaundromatFilter, laundromats = [] }) => {
  return (
    <Paper sx={{ p: 2, overflowX: 'auto' }}>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>Filter by Laundromat</InputLabel>
            <Select
              value={laundromatFilter}
              onChange={(e) => setLaundromatFilter(e.target.value)}
              label="Filter by Laundromat"
            >
              <MenuItem value="all">All Laundromats</MenuItem>
              {laundromats.map(laundromat => (
                <MenuItem key={laundromat.id} value={laundromat.id}>
                  {laundromat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Laundromat</TableCell>
              <TableCell>City</TableCell>
              <TableCell>Orders</TableCell>
              <TableCell>Revenue</TableCell>
              <TableCell>Avg. Order Value</TableCell>
              <TableCell>Customers</TableCell>
              <TableCell>Retention Rate</TableCell>
              <TableCell>Avg. Turnaround</TableCell>
              <TableCell>Avg. Weight</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {laundromatStats.length > 0 ? (
              laundromatStats.map((laundromat) => (
                <TableRow key={laundromat.id}>
                  <TableCell>
                    {laundromats.find(l => l.id === laundromat.id)?.name || laundromat.id.substring(0, 8)}
                  </TableCell>
                  <TableCell>{laundromat.city}</TableCell>
                  <TableCell>{laundromat.orders}</TableCell>
                  <TableCell>${laundromat.revenue.toFixed(2)}</TableCell>
                  <TableCell>
                    ${laundromat.orders > 0 ? (laundromat.revenue / laundromat.orders).toFixed(2) : '0.00'}
                  </TableCell>
                  <TableCell>{laundromat.customers}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          marginRight: '8px',
                          backgroundColor: laundromat.retentionRate >= 0.5 ? '#10B981' :
                                          laundromat.retentionRate >= 0.25 ? '#F59E0B' : '#EF4444'
                        }}
                      />
                      {(laundromat.retentionRate * 100).toFixed(1)}%
                    </Box>
                  </TableCell>
                  <TableCell>{laundromat.avgTurnaroundDays?.toFixed(1) || '0'} days</TableCell>
                  <TableCell>{laundromat.avgOrderWeight?.toFixed(2) || '0'} kg</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center">No laundromat data available</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default LaundromatPerformanceTable; 