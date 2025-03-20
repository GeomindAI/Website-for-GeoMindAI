import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Paper, Box, Typography, Collapse, IconButton, Grid } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const QuarterlyGrowthByCity = ({ selectedCity: propSelectedCity = 'all', cityMapping = {} }) => {
  const [loading, setLoading] = useState(true);
  const [quarterlyData, setQuarterlyData] = useState({});
  const [tableExpanded, setTableExpanded] = useState(false);
  
  useEffect(() => {
    generateQuarterlyData();
  }, []);

  const generateQuarterlyData = () => {
    // City configuration with proper growth factors and start dates
    const cityConfigs = {
      all: { 
        name: "All Cities", 
        startDate: "2022-04-01", // Average start date
        growthFactor: 1.15, 
        baseValue: 300,
        color: '#2563EB'
      },
      LYGRRATQ7EGG2: { // London
        name: "London", 
        startDate: "2022-12-01",  // Started in 2022
        growthFactor: 1.18, 
        baseValue: 65,
        color: '#2563EB'
      },
      L4NE8GPX89J3A: { // Ottawa
        name: "Ottawa", 
        startDate: "2023-03-15",  // Started in 2023
        growthFactor: 1.12, 
        baseValue: 40,
        color: '#10B981'
      },
      LDK6Z980JTKXY: { // Kitchener-Waterloo
        name: "Kitchener-Waterloo", 
        startDate: "2023-06-01",  // Mid 2023
        growthFactor: 1.20, 
        baseValue: 25,
        color: '#F59E0B'
      },
      LXMC6DWVJ5N7W: { // Hamilton
        name: "Hamilton", 
        startDate: "2023-09-10",  // Late 2023
        growthFactor: 1.08, 
        baseValue: 20,
        color: '#EF4444'
      },
      LG0VGFKQ25XED: { // Calgary
        name: "Calgary", 
        startDate: "2023-11-20",  // Most recent
        growthFactor: 1.25, 
        baseValue: 10,
        color: '#8B5CF6'
      }
    };
    
    // Quarterly seasonality factors
    const quarterlySeason = {
      "Q1": 0.9,  // Jan-Mar
      "Q2": 1.15, // Apr-Jun
      "Q3": 1.2,  // Jul-Sep
      "Q4": 1.0   // Oct-Dec
    };
    
    // Generate quarterly data for all cities
    const allCityQuarterly = {};
    const combinedQuarterly = {};
    
    Object.keys(cityConfigs).forEach(cityId => {
      if (cityId === 'all') return; // Skip 'all' for now, we'll calculate it from the combined data
      
      const config = cityConfigs[cityId];
      const quarterlyGrowth = [];
      
      // Parse start date
      const startDate = new Date(config.startDate);
      const startYear = startDate.getFullYear();
      const startQuarter = Math.floor(startDate.getMonth() / 3) + 1;
      
      // Current date for projection boundary
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
      
      // Calculate how many quarters to generate
      const totalQuarters = (currentYear - startYear) * 4 + (currentQuarter - startQuarter) + 9; // +9 for future projections
      
      let previousValue = null;
      let currentValue = config.baseValue;
      
      // Generate data for each quarter
      for (let i = 0; i < totalQuarters; i++) {
        const quarterYear = startYear + Math.floor((startQuarter + i - 1) / 4);
        const quarter = ((startQuarter + i - 1) % 4) + 1;
        const quarterKey = `Q${quarter} ${quarterYear}`;
        const isProjected = quarterYear > currentYear || (quarterYear === currentYear && quarter > currentQuarter);
        
        // Apply quarterly growth with seasonality
        const quarterlyGrowthFactor = Math.pow(config.growthFactor, 1/4);
        const seasonalFactor = quarterlySeason[`Q${quarter}`];
        const randomFactor = 0.95 + (Math.random() * 0.1); // 0.95-1.05 random variation
        
        // First quarter uses the base value
        if (i === 0) {
          currentValue = Math.round(config.baseValue * seasonalFactor * randomFactor);
        } else {
          // Apply growth to previous quarter's value
          currentValue = Math.round(previousValue * quarterlyGrowthFactor * seasonalFactor * randomFactor);
        }
        
        // Calculate growth rate if we have a previous value
        let growthRate = null;
        if (previousValue !== null) {
          growthRate = ((currentValue / previousValue) - 1) * 100;
        }
        
        const quarterData = {
          name: quarterKey,
          year: quarterYear,
          quarter: quarter,
          value: currentValue,
          growthRate: growthRate !== null ? parseFloat(growthRate.toFixed(1)) : null,
          projected: isProjected
        };
        
        quarterlyGrowth.push(quarterData);
        
        // Track combined data for all cities
        if (!combinedQuarterly[quarterKey]) {
          combinedQuarterly[quarterKey] = {
            name: quarterKey,
            year: quarterYear,
            quarter: quarter,
            total: 0,
            projected: isProjected,
            cities: {}
          };
        }
        
        combinedQuarterly[quarterKey].total += currentValue;
        combinedQuarterly[quarterKey].cities[config.name] = currentValue;
        
        previousValue = currentValue;
      }
      
      allCityQuarterly[cityId] = {
        data: quarterlyGrowth,
        color: config.color,
        annualGrowthTarget: (config.growthFactor - 1) * 100,
        startDate: config.startDate
      };
    });
    
    // Process combined data for 'all' cities
    const combinedQuarterlyArray = Object.values(combinedQuarterly)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.quarter - b.quarter;
      });
    
    // Calculate growth rates for combined data
    const allCitiesGrowth = [];
    let previousTotal = null;
    
    combinedQuarterlyArray.forEach(quarter => {
      let growthRate = null;
      if (previousTotal !== null) {
        growthRate = ((quarter.total / previousTotal) - 1) * 100;
      }
      
      allCitiesGrowth.push({
        name: quarter.name,
        year: quarter.year,
        quarter: quarter.quarter,
        value: quarter.total,
        growthRate: growthRate !== null ? parseFloat(growthRate.toFixed(1)) : null,
        projected: quarter.projected
      });
      
      previousTotal = quarter.total;
    });
    
    allCityQuarterly['all'] = {
      data: allCitiesGrowth,
      color: cityConfigs['all'].color,
      annualGrowthTarget: (cityConfigs['all'].growthFactor - 1) * 100,
      startDate: cityConfigs['all'].startDate
    };
    
    setQuarterlyData(allCityQuarterly);
    setLoading(false);
  };
  
  // Get current city data based on the prop
  const currentCityData = quarterlyData[propSelectedCity] || quarterlyData.all;
  
  // Calculate weekly average from the current quarter
  const getWeeklyAverage = () => {
    if (!currentCityData || !currentCityData.data) return 0;
    const currentQuarterIndex = currentCityData.data.findIndex(q => q.projected) - 1;
    if (currentQuarterIndex < 0) return 0;
    
    const currentQuarterValue = currentCityData.data[currentQuarterIndex].value;
    // Assuming 13 weeks per quarter on average
    return Math.round(currentQuarterValue / 13);
  };
  
  // Calculate projected annual orders
  const getProjectedAnnualOrders = () => {
    if (!currentCityData || !currentCityData.data) return 0;
    
    // Find where the projected data starts
    const currentQuarterIndex = currentCityData.data.findIndex(q => q.projected) - 1;
    if (currentQuarterIndex < 0) return 0;
    
    // Get the current quarter's orders
    const currentQuarter = currentCityData.data[currentQuarterIndex];
    
    // Get the projected quarters for the next year (4 quarters)
    const projectedQuarters = currentCityData.data.slice(currentQuarterIndex + 1, currentQuarterIndex + 5);
    
    // Sum up the projected orders for the next 4 quarters
    return projectedQuarters.reduce((sum, quarter) => sum + quarter.value, 0);
  };
  
  // Calculate annual growth rate
  const getAnnualGrowthRate = () => {
    if (!currentCityData || !currentCityData.data) return 0;
    
    const projectedQuarterIndex = currentCityData.data.findIndex(q => q.projected);
    if (projectedQuarterIndex <= 0 || projectedQuarterIndex >= currentCityData.data.length - 4) return 0;
    
    // Get current quarter and the same quarter next year
    const currentQuarter = currentCityData.data[projectedQuarterIndex - 1];
    const nextYearSameQuarter = currentCityData.data.find(
      q => q.quarter === currentQuarter.quarter && q.year === currentQuarter.year + 1
    );
    
    if (!nextYearSameQuarter) return 0;
    
    // Calculate year over year growth rate
    return ((nextYearSameQuarter.value / currentQuarter.value) - 1) * 100;
  };
  
  // Function to get color based on growth rate
  const getGrowthColor = (growthRate) => {
    if (growthRate === null) return '#cccccc';
    if (growthRate >= 15) return '#10B981'; // High growth - green
    if (growthRate >= 5) return '#60A5FA';  // Moderate growth - blue
    if (growthRate >= 0) return '#FBBF24';  // Low growth - yellow
    return '#EF4444';                       // Negative growth - red
  };
  
  // Get city name based on ID
  const getCityName = (cityId) => {
    if (cityMapping[cityId]) return cityMapping[cityId];
    
    switch(cityId) {
      case 'all': return 'All Cities';
      case 'LYGRRATQ7EGG2': return 'London';
      case 'L4NE8GPX89J3A': return 'Ottawa';
      case 'LDK6Z980JTKXY': return 'Kitchener-Waterloo';
      case 'LXMC6DWVJ5N7W': return 'Hamilton';
      case 'LG0VGFKQ25XED': return 'Calgary';
      default: return cityId;
    }
  };
  
  // Get formatted start date
  const getStartDate = (cityId) => {
    switch(cityId) {
      case 'all': return 'Various dates';
      case 'LYGRRATQ7EGG2': return 'December 2022';
      case 'L4NE8GPX89J3A': return 'March 2023';
      case 'LDK6Z980JTKXY': return 'June 2023';
      case 'LXMC6DWVJ5N7W': return 'September 2023';
      case 'LG0VGFKQ25XED': return 'November 2023';
      default: return 'Unknown';
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ width: '100%', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6">Loading city growth data...</Typography>
      </Box>
    );
  }
  
  // Find the transition point between historical and projected data
  const projectionStartIndex = currentCityData?.data?.findIndex(q => q.projected);
  const historicalData = currentCityData?.data?.slice(0, projectionStartIndex);
  const projectedData = currentCityData?.data?.slice(projectionStartIndex);
  
  return (
    <Box sx={{ mb: 5 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'medium', color: '#1F2937' }}>
        Quarterly Growth of {getCityName(propSelectedCity)}
      </Typography>
      
      {/* Metrics cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              background: 'linear-gradient(135deg, #3B82F6, #2563EB)'
            }}
          >
            <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 1 }}>
              Annual Growth Rate
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
              {getAnnualGrowthRate().toFixed(1)}%
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Target: {currentCityData?.annualGrowthTarget?.toFixed(0)}%
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              background: 'linear-gradient(135deg, #10B981, #059669)'
            }}
          >
            <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 1 }}>
              Weekly Average Orders
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
              {getWeeklyAverage().toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Based on current quarter
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
            }}
          >
            <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 1 }}>
              Projected Annual Orders
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
              {getProjectedAnnualOrders().toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Next 4 quarters
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* City info box */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', bgcolor: '#F9FAFB' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
          {getCityName(propSelectedCity)}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Started operations:</strong> {getStartDate(propSelectedCity)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Annual growth target:</strong> {currentCityData?.annualGrowthTarget?.toFixed(0)}%
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Latest quarterly orders:</strong> {
                currentCityData?.data[projectionStartIndex - 1]?.value.toLocaleString() || 'N/A'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Orders next quarter:</strong> {
                currentCityData?.data[projectionStartIndex]?.value.toLocaleString() || 'N/A'
              }
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Latest growth rate:</strong> {
                (() => {
                  const growth = projectionStartIndex > 0 ? currentCityData?.data[projectionStartIndex - 1]?.growthRate : null;
                  return growth !== null ? `${growth >= 0 ? '+' : ''}${growth}%` : 'N/A';
                })()
              }
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Status:</strong> {
                (() => {
                  const growth = getAnnualGrowthRate();
                  const target = currentCityData?.annualGrowthTarget || 0;
                  if (growth >= target * 1.1) return 'Exceeding Target';
                  if (growth >= target * 0.9) return 'On Target';
                  if (growth >= target * 0.7) return 'Below Target';
                  return 'Needs Attention';
                })()
              }
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Quarterly orders chart */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'medium' }}>
          Quarterly Orders
        </Typography>
        
        <Box sx={{ height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={currentCityData?.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280' }} />
              <YAxis tick={{ fill: '#6B7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  borderRadius: '0.375rem', 
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', 
                  border: 'none' 
                }}
                formatter={(value, name) => [
                  value.toLocaleString(),
                  name === 'value' ? 'Orders' : name
                ]}
                labelFormatter={(label, items) => {
                  const dataPoint = items?.[0]?.payload;
                  return `${label}${dataPoint?.projected ? ' (Projected)' : ' (Historical)'}`;
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              
              <ReferenceLine 
                x={currentCityData?.data?.[projectionStartIndex]?.name} 
                stroke="#6B7280" 
                strokeDasharray="3 3" 
                label={{ value: "Today", position: "insideTopLeft", fill: '#6B7280' }} 
              />
              
              <Bar 
                dataKey="value" 
                name="Orders" 
                fill={(entry) => entry?.projected ? '#64748B' : currentCityData?.color || '#2563EB'}
                opacity={(entry) => entry?.projected ? 0.6 : 1}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
        
        {/* Projection indicator */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 2,
          pt: 2,
          borderTop: '1px dashed #CBD5E1',
          color: '#64748B',
          fontSize: '0.875rem'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ 
              width: 12, 
              height: 12, 
              backgroundColor: currentCityData?.color || '#2563EB', 
              borderRadius: 1,
              mr: 1 
            }}></Box>
            <Typography variant="body2">Historical Data</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ 
              width: 12, 
              height: 12, 
              backgroundColor: '#64748B', 
              borderRadius: 1,
              opacity: 0.6,
              mr: 1 
            }}></Box>
            <Typography variant="body2">Projected Data</Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* Quarterly growth rates chart */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'medium' }}>
          Quarter-over-Quarter Growth Rate (%)
        </Typography>
        
        <Box sx={{ height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={currentCityData?.data?.filter(q => q.growthRate !== null) || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280' }} />
              <YAxis domain={[-5, 30]} tick={{ fill: '#6B7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  borderRadius: '0.375rem', 
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', 
                  border: 'none' 
                }}
                formatter={(value, name) => [
                  name === 'growthRate' ? `${value}%` : value,
                  name === 'growthRate' ? 'Growth Rate' : name
                ]}
                labelFormatter={(label, items) => {
                  const dataPoint = items?.[0]?.payload;
                  return `${label}${dataPoint?.projected ? ' (Projected)' : ' (Historical)'}`;
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              
              <ReferenceLine 
                y={0} 
                stroke="#94A3B8" 
                strokeWidth={1}
              />
              
              <ReferenceLine 
                x={currentCityData?.data?.[projectionStartIndex]?.name} 
                stroke="#6B7280" 
                strokeDasharray="3 3" 
                label={{ value: "Today", position: "insideTopLeft", fill: '#6B7280' }} 
              />
              
              <Bar 
                dataKey="growthRate" 
                name="Growth Rate (%)" 
                fill={(entry) => {
                  // Use different opacity for projections
                  const color = getGrowthColor(entry.growthRate);
                  return entry.projected ? color : color;
                }}
                opacity={(entry) => entry.projected ? 0.6 : 1}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
        
        {/* Projection indicator */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 2,
          pt: 2,
          borderTop: '1px dashed #CBD5E1',
          color: '#64748B',
          fontSize: '0.875rem'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ 
              width: 12, 
              height: 12, 
              backgroundColor: '#10B981', 
              borderRadius: 1,
              mr: 1 
            }}></Box>
            <Typography variant="body2">Historical Growth Rate</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ 
              width: 12, 
              height: 12, 
              backgroundColor: '#10B981', 
              borderRadius: 1,
              opacity: 0.6,
              mr: 1 
            }}></Box>
            <Typography variant="body2">Projected Growth Rate</Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* Quarterly data table - Collapsible */}
      <Paper sx={{ borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer',
          borderBottom: tableExpanded ? '1px solid #E5E7EB' : 'none',
          '&:hover': { backgroundColor: '#F9FAFB' }
        }} onClick={() => setTableExpanded(!tableExpanded)}>
          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
            Quarterly Data Table
          </Typography>
          <IconButton size="small">
            {tableExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </Box>
        
        <Collapse in={tableExpanded}>
          <Box sx={{ p: 3, overflowX: 'auto' }}>
            <table style={{ 
              minWidth: '100%', 
              borderCollapse: 'separate', 
              borderSpacing: 0,
              fontSize: '0.875rem'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'medium', color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>Quarter</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'medium', color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>Orders</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'medium', color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>Growth Rate</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'medium', color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentCityData?.data?.map((quarter, idx) => (
                  <tr key={idx} style={{ backgroundColor: quarter.projected ? '#F9FAFB' : 'white' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 'medium', color: '#111827', borderBottom: '1px solid #E5E7EB' }}>
                      {quarter.name}
                      {quarter.projected && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#64748B' }}>(Projected)</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>{quarter.value.toLocaleString()}</td>
                    <td style={{ 
                      padding: '12px 16px', 
                      fontWeight: 'medium', 
                      color: quarter.growthRate === null ? '#9CA3AF' :
                            quarter.growthRate >= 15 ? '#059669' :
                            quarter.growthRate >= 5 ? '#2563EB' :
                            quarter.growthRate >= 0 ? '#D97706' :
                            '#DC2626',
                      borderBottom: '1px solid #E5E7EB',
                      opacity: quarter.projected ? 0.8 : 1
                    }}>
                      {quarter.growthRate === null ? 'N/A' : `${quarter.growthRate >= 0 ? '+' : ''}${quarter.growthRate}%`}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>
                      {quarter.projected ? 'Projected' : 'Historical'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default QuarterlyGrowthByCity; 