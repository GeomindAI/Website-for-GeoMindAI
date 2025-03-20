import React, { useState, useEffect, useCallback } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Paper, Box, Typography, Collapse, IconButton } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const QuarterlyGrowthByCity = ({ selectedCity = 'all', cityMapping = {} }) => {
  const [chartData, setChartData] = useState([]);
  const [tableExpanded, setTableExpanded] = useState(false);
  const [currentQuarterIndex, setCurrentQuarterIndex] = useState(0);
  
  const getCityName = (cityId) => {
    if (cityId === 'all') return 'All Cities';
    return cityMapping[cityId] || cityId;
  };
  
  // Generate chart data using useCallback to memoize the function
  const generateData = useCallback(() => {
    // Base values for each city
    const cityBaseValues = {
      'all': 280,
      'LYGRRATQ7EGG2': 270, // London
      'L4NE8GPX89J3A': 185, // Ottawa
      'LDK6Z980JTKXY': 125, // Kitchener
      'LXMC6DWVJ5N7W':  95, // Hamilton
      'LG0VGFKQ25XED':  80  // Calgary
    };
    
    // Growth rates for each city
    const cityGrowthRates = {
      'all': 16,
      'LYGRRATQ7EGG2': 18, // London
      'L4NE8GPX89J3A': 14, // Ottawa
      'LDK6Z980JTKXY': 22, // Kitchener
      'LXMC6DWVJ5N7W': 12, // Hamilton
      'LG0VGFKQ25XED': 25  // Calgary
    };
    
    // Seasonal factors
    const seasonality = {
      1: 0.87,  // Q1
      2: 1.12,  // Q2
      3: 1.18,  // Q3
      4: 0.95   // Q4
    };
    
    // Get base value and growth rate for selected city
    const baseValue = cityBaseValues[selectedCity] || cityBaseValues['all'];
    const growthRate = cityGrowthRates[selectedCity] || cityGrowthRates['all'];
    
    // Generate quarters of data (historical + projections)
    const data = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3) + 1;
    
    let previousValue = null;
    let currentValue = baseValue;
    
    // Create the last 8 quarters of historical data and 4 quarters of projections
    const totalQuarters = 12; // 8 historical + 4 projections
    
    // Start 8 quarters ago from the current quarter
    for (let i = 0; i < totalQuarters; i++) {
      // Calculate quarter offset from current quarter
      const quarterOffset = i - 7;
      
      // Calculate year and quarter
      let targetYear = currentYear;
      let targetQuarter = currentQuarter + quarterOffset;
      
      // Adjust for previous years
      while (targetQuarter <= 0) {
        targetQuarter += 4;
        targetYear--;
      }
      
      // Adjust for next years
      while (targetQuarter > 4) {
        targetQuarter -= 4;
        targetYear++;
      }
      
      // Apply seasonal factors and growth
      const quarterlyGrowthFactor = Math.pow(1 + (growthRate / 100), 0.25);
      const seasonalFactor = seasonality[targetQuarter];
      const randomFactor = 0.95 + Math.random() * 0.1; // Random 0.95-1.05
      
      // For projections, increase the growth rate slightly to show optimistic trend
      const adjustedGrowthFactor = i >= 8 
        ? Math.pow(1 + (growthRate * 1.1 / 100), 0.25) 
        : quarterlyGrowthFactor;
      
      if (i === 0) {
        currentValue = Math.round(baseValue * seasonalFactor * randomFactor);
      } else {
        // Use regular growth for historical, adjusted growth for projections
        currentValue = Math.round(previousValue * adjustedGrowthFactor * seasonalFactor * randomFactor);
      }
      
      // Calculate growth percentage
      const growthPercentage = previousValue ? ((currentValue / previousValue - 1) * 100) : 0;
      
      // Add to data array
      data.push({
        name: `Q${targetQuarter} ${targetYear}`,
        orders: currentValue,
        growth: parseFloat(growthPercentage.toFixed(1)),
        quarter: targetQuarter,
        year: targetYear,
        isProjection: i >= 8 // Mark as projection if it's after current quarter
      });
      
      // Save current quarter index for the reference line
      if (quarterOffset === 0) {
        setCurrentQuarterIndex(i);
      }
      
      previousValue = currentValue;
    }
    
    setChartData(data);
  }, [selectedCity]); // Only regenerate the function when selectedCity changes
  
  // Generate data on component mount and when selectedCity changes
  useEffect(() => {
    generateData();
  }, [generateData]); // Now we can safely add generateData as a dependency
  
  // Custom tooltip to display both orders and growth
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isProjection = payload[0].payload.isProjection;
      
      return (
        <div style={{ 
          backgroundColor: '#fff',
          padding: '10px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderRadius: '4px'
        }}>
          <p style={{ margin: '0 0 5px', fontWeight: 'bold' }}>
            {label} {isProjection && <span style={{ color: '#666', fontStyle: 'italic' }}>(Projected)</span>}
          </p>
          <p style={{ margin: '0', color: '#3366cc' }}>
            Orders: {payload[0].value}
          </p>
          <p style={{ margin: '0', color: '#dc3912' }}>
            Growth: {payload[1].value}%
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Paper sx={{ p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)', borderRadius: '8px' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="medium">
          Quarterly Orders for {getCityName(selectedCity)}
        </Typography>
        <IconButton onClick={() => setTableExpanded(!tableExpanded)} size="small">
          {tableExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      </Box>
      
      <Box height={320}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              stroke="#3366cc"
              label={{ value: 'Orders', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#dc3912"
              domain={[-5, 40]}
              label={{ value: 'Growth %', angle: 90, position: 'insideRight' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              payload={[
                { value: 'Historical Orders', type: 'rect', color: '#3366cc' },
                { value: 'Projected Orders', type: 'rect', color: '#8bb4ff' },
                { value: 'Growth %', type: 'line', color: '#dc3912' }
              ]}
            />
            
            {/* Reference line for "Today" */}
            <ReferenceLine
              x={chartData[currentQuarterIndex]?.name}
              stroke="#666"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: 'Today', position: 'insideTopLeft', fill: '#666', fontSize: 12 }}
              yAxisId="left"
            />
            
            {/* Render the bars with conditional styling */}
            <Bar 
              yAxisId="left" 
              dataKey="orders"
              name="Orders" 
              fill="#3366cc"
              barSize={30}
              radius={[4, 4, 0, 0]}
              isAnimationActive={true}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isProjection ? '#8bb4ff' : '#3366cc'} 
                />
              ))}
            </Bar>
            
            <Line 
              yAxisId="right"
              type="monotone"
              dataKey="growth"
              name="Growth %"
              stroke="#dc3912"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
      
      {tableExpanded && (
        <Collapse in={tableExpanded} timeout="auto" unmountOnExit>
          <Box mt={3} maxHeight={200} overflow="auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Quarter</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>Orders</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>Growth %</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, index) => (
                  <tr key={index} style={{ backgroundColor: row.isProjection ? '#f5f9ff' : 'inherit' }}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{row.name}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{row.orders}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{row.growth}%</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'center', color: row.isProjection ? '#666' : 'inherit', fontStyle: row.isProjection ? 'italic' : 'normal' }}>
                      {row.isProjection ? 'Projected' : 'Historical'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Collapse>
      )}
    </Paper>
  );
};

export default QuarterlyGrowthByCity; 