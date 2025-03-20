import React, { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Paper, Box, Typography, Collapse, IconButton, Grid } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const QuarterlyGrowthByCity = ({ selectedCity: propSelectedCity = 'all', cityMapping = {} }) => {
  const [loading, setLoading] = useState(true);
  const [quarterlyData, setQuarterlyData] = useState([]);
  const [tableExpanded, setTableExpanded] = useState(false);
  
  useEffect(() => {
    generateQuarterlyData();
  }, [propSelectedCity]);

  const getCityName = (cityId) => {
    if (cityId === 'all') return 'All Cities';
    return cityMapping[cityId] || cityId;
  };

  // Generate quarterly data
  const generateQuarterlyData = () => {
    // City configuration with proper growth factors
    const cityConfigs = {
      all: { 
        name: "All Cities", 
        growthFactor: 1.15, 
        baseValue: 300,
        color: '#2563EB'
      },
      LYGRRATQ7EGG2: { // London
        name: "London", 
        growthFactor: 1.18, 
        baseValue: 250,
        color: '#2563EB'
      },
      L4NE8GPX89J3A: { // Ottawa
        name: "Ottawa", 
        growthFactor: 1.12, 
        baseValue: 180,
        color: '#10B981'
      },
      LDK6Z980JTKXY: { // Kitchener-Waterloo
        name: "Kitchener-Waterloo", 
        growthFactor: 1.20, 
        baseValue: 120,
        color: '#F59E0B'
      },
      LXMC6DWVJ5N7W: { // Hamilton
        name: "Hamilton", 
        growthFactor: 1.08, 
        baseValue: 90,
        color: '#EF4444'
      },
      LG0VGFKQ25XED: { // Calgary
        name: "Calgary", 
        growthFactor: 1.25, 
        baseValue: 75,
        color: '#8B5CF6'
      }
    };
    
    // Quarterly seasonality factors
    const quarterlySeason = {
      "1": 0.9,  // Q1 (Jan-Mar)
      "2": 1.15, // Q2 (Apr-Jun)
      "3": 1.2,  // Q3 (Jul-Sep)
      "4": 1.0   // Q4 (Oct-Dec)
    };
    
    const config = cityConfigs[propSelectedCity] || cityConfigs.all;
    
    // Generate 8 quarters of data (2 years)
    const data = [];
    let previousValue = config.baseValue;
    
    // Start from 8 quarters ago (2 years of data)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
    
    for (let i = 0; i < 8; i++) {
      let quarterOffset = i - 7; // Start 7 quarters back
      let year = currentYear;
      let quarter = currentQuarter + quarterOffset;
      
      // Adjust year and quarter
      while (quarter <= 0) {
        quarter += 4;
        year -= 1;
      }
      while (quarter > 4) {
        quarter -= 4;
        year += 1;
      }
      
      // Apply quarterly growth with seasonality
      const quarterlyGrowthFactor = Math.pow(config.growthFactor, 1/4);
      const seasonalFactor = quarterlySeason[quarter];
      const randomFactor = 0.95 + (Math.random() * 0.1); // 0.95-1.05 random variation
      
      let currentValue;
      if (i === 0) {
        currentValue = Math.round(config.baseValue * seasonalFactor * randomFactor);
      } else {
        currentValue = Math.round(previousValue * quarterlyGrowthFactor * seasonalFactor * randomFactor);
      }
      
      // Calculate growth rate
      const growthRate = i === 0 ? 0 : ((currentValue / previousValue) - 1) * 100;
      
      data.push({
        name: `Q${quarter} ${year}`,
        value: currentValue,
        growthRate: parseFloat(growthRate.toFixed(1)),
        year: year,
        quarter: quarter
      });
      
      previousValue = currentValue;
    }
    
    setQuarterlyData(data);
    setLoading(false);
  };

  // Custom tooltip to show both orders and growth rate
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '10px', 
          border: '1px solid #ccc',
          borderRadius: '5px'
        }}>
          <p style={{ margin: '0 0 5px' }}><strong>{label}</strong></p>
          <p style={{ margin: '0', color: '#2563EB' }}>
            Orders: {payload[0].value}
          </p>
          {payload[1] && (
            <p style={{ margin: '0', color: '#DC2626' }}>
              Growth Rate: {payload[1].value}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  const cityName = getCityName(propSelectedCity);
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 3, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Quarterly Orders for {cityName}
        </Typography>
        <IconButton
          size="small"
          onClick={() => setTableExpanded(!tableExpanded)}
        >
          {tableExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      </Box>
      
      <Box sx={{ flex: 1, minHeight: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={quarterlyData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 70,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={70} 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              stroke="#2563EB"
              label={{ value: 'Orders', angle: -90, position: 'insideLeft' }} 
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#DC2626"
              label={{ value: 'Growth %', angle: 90, position: 'insideRight' }} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              yAxisId="left" 
              dataKey="value" 
              name="Orders" 
              fill="#2563EB" 
              radius={[4, 4, 0, 0]} 
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="growthRate" 
              name="Growth Rate" 
              stroke="#DC2626" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <ReferenceLine y={0} yAxisId="right" stroke="#666" />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
      
      {tableExpanded && (
        <Collapse in={tableExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Quarter</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>Orders</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>Growth %</th>
                </tr>
              </thead>
              <tbody>
                {quarterlyData.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{row.name}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{row.value}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                      {row.growthRate}%
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