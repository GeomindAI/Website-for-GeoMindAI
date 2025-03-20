import React from 'react';
import { Box, Typography } from '@mui/material';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const DateRangeSelector = ({ dateRange, setDateRange }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <DatePicker
        selected={dateRange.startDate}
        onChange={date => setDateRange({ ...dateRange, startDate: date })}
        selectsStart
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        customInput={<input style={{ padding: '8px', borderRadius: '4px', marginRight: '8px' }} />}
      />
      <Typography variant="body2" sx={{ mx: 1 }}>to</Typography>
      <DatePicker
        selected={dateRange.endDate}
        onChange={date => setDateRange({ ...dateRange, endDate: date })}
        selectsEnd
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        minDate={dateRange.startDate}
        customInput={<input style={{ padding: '8px', borderRadius: '4px' }} />}
      />
    </Box>
  );
};

export default DateRangeSelector; 