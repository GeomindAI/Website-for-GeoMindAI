/**
 * ProjectionImplementation.js
 * 
 * This file contains a complete working implementation that you can directly 
 * use in your dashboard to add realistic projections with minimal changes 
 * to your existing codebase.
 */

// Import formatDate utility if you don't already have it
import { format, addWeeks, parse, isValid } from 'date-fns';

// City mapping and constants
const CITY_MAPPING = {
  "LYGRRATQ7EGG2": "London",
  "L4NE8GPX89J3A": "Ottawa",
  "LDK6Z980JTKXY": "Kitchener-Waterloo",
  "LXMC6DWVJ5N7W": "Hamilton",
  "LG0VGFKQ25XED": "Calgary",
  "all": "All Cities"
};

// City population data and growth factors - all increased to ensure positive growth
const CITY_DATA = {
  "LYGRRATQ7EGG2": { // London
    name: "London",
    population: 400000,
    yearlyGrowthFactor: 1.35, // Increased to 35% yearly growth for strong upward trend
    operationalSince: new Date("2022-12-01"),
    marketMaturity: 0.15, // Reduced market maturity to allow stronger growth
    minWeeklyOrders: 80 // Minimum weekly orders for projections
  },
  "L4NE8GPX89J3A": { // Ottawa
    name: "Ottawa",
    population: 1050000,
    yearlyGrowthFactor: 1.28, // Increased to 28% yearly growth
    operationalSince: new Date("2023-03-15"),
    marketMaturity: 0.35,
    minWeeklyOrders: 35
  },
  "LDK6Z980JTKXY": { // Kitchener-Waterloo
    name: "Kitchener-Waterloo",
    population: 575000,
    yearlyGrowthFactor: 1.32, // Increased to 32% yearly growth
    operationalSince: new Date("2023-06-01"),
    marketMaturity: 0.30,
    minWeeklyOrders: 40
  }, 
  "LXMC6DWVJ5N7W": { // Hamilton
    name: "Hamilton",
    population: 570000,
    yearlyGrowthFactor: 1.25, // Increased to 25% yearly growth
    operationalSince: new Date("2023-09-10"),
    marketMaturity: 0.35,
    minWeeklyOrders: 30
  },
  "LG0VGFKQ25XED": { // Calgary
    name: "Calgary",
    population: 1300000,
    yearlyGrowthFactor: 1.40, // Increased to 40% yearly growth
    operationalSince: new Date("2023-11-20"),
    marketMaturity: 0.20,
    minWeeklyOrders: 25
  }
};

// Weekly seasonality factors - more granular for weekly projections
const WEEKLY_SEASONALITY = {
  0: 0.98,  // Week 1 of month
  1: 1.00,  // Week 2 of month
  2: 1.05,  // Week 3 of month
  3: 1.08,  // Week 4 of month
  4: 0.95,  // Week 5 of month (when applicable)
};

// Monthly seasonality factors 
const MONTHLY_SEASONALITY = {
  0: 0.95,  // January
  1: 0.98,  // February
  2: 1.02,  // March
  3: 1.05,  // April
  4: 1.08,  // May
  5: 1.12,  // June
  6: 1.10,  // July
  7: 1.05,  // August
  8: 1.10,  // September
  9: 1.05,  // October
  10: 1.00, // November
  11: 0.98  // December
};

/**
 * Generate weekly projections for a given set of monthly orders data
 * 
 * @param {Array} monthlyData - Array of monthly order data points in your existing format
 * @param {string} selectedCity - The currently selected city ID ('all' or a specific city ID)
 * @param {number} weeks - Number of weeks to project forward
 * @returns {Object} Combined historical and projected data with metrics
 */
export function generateProjections(monthlyData, selectedCity, weeks = 52) {
  // Handle case where no data is available
  if (!monthlyData || monthlyData.length === 0) {
    return {
      combined: [],
      metrics: {
        totalAnnualOrders: 0,
        averageMonthlyOrders: 0,
        projectedGrowthPercent: 0
      }
    };
  }
  
  // Get historical data for the selected city - only use data until October
  const historicalData = preprocessHistoricalData(monthlyData, selectedCity);
  
  // Filter out data after October 2024 for projection calculations
  const cutoffDate = new Date(2024, 9, 31); // October 31, 2024
  
  const filteredHistoricalData = historicalData.filter(month => {
    // Try to parse the date from month name (e.g., "Oct 2024")
    let monthDate;
    try {
      const parts = month.name.split(' ');
      const monthName = parts[0];
      const year = parseInt(parts[1]);
      
      // Map month name to month number
      const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      if (monthMap[monthName] !== undefined && !isNaN(year)) {
        monthDate = new Date(year, monthMap[monthName], 1);
      }
    } catch (e) {
      console.error("Error parsing date from month name:", month.name, e);
    }
    
    // Include the month if we couldn't parse the date or if it's before the cutoff
    return !monthDate || monthDate <= cutoffDate;
  });
  
  // Get the last data point as baseline
  const lastHistoricalPoint = filteredHistoricalData.length > 0 
    ? filteredHistoricalData[filteredHistoricalData.length - 1] 
    : historicalData[historicalData.length - 1];
  
  // If no valid data point exists, return empty result
  if (!lastHistoricalPoint) {
    return {
      combined: [],
      metrics: {
        totalAnnualOrders: 0,
        averageMonthlyOrders: 0,
        projectedGrowthPercent: 0
      }
    };
  }
  
  // Set up city-specific parameters
  const cityParams = selectedCity !== 'all' ? CITY_DATA[selectedCity] : {
    name: "All Cities",
    yearlyGrowthFactor: 1.28, // Increased default growth factor
    marketMaturity: 0.25, // Reduced market maturity
    minWeeklyOrders: 85
  };
  
  // Extract base information from last historical point
  let baseMonthlyOrders = lastHistoricalPoint.orders;
  
  // Convert monthly orders to approximate weekly orders
  let baseWeeklyOrders = baseMonthlyOrders / 4.3;
  
  // Ensure base weekly orders meet the minimum for city
  baseWeeklyOrders = Math.max(baseWeeklyOrders, cityParams.minWeeklyOrders || 20);
  
  // Calculate a more appropriate baseline - use average of data until Oct
  let baselineForGrowth;
  if (filteredHistoricalData.length >= 3) {
    // Calculate average excluding any extreme outliers
    const values = filteredHistoricalData.map(m => m.orders);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // For weekly conversion
    baselineForGrowth = avg / 4.3;
    
    // Ensure it meets minimum
    baselineForGrowth = Math.max(baselineForGrowth, cityParams.minWeeklyOrders || 20);
  } else {
    baselineForGrowth = baseWeeklyOrders;
  }
  
  // Parse the month and year from the last data point
  const monthNameMap = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  
  // Parse month and year
  const [monthName, yearStr] = lastHistoricalPoint.name.split(' ');
  const startMonth = monthNameMap[monthName];
  const startYear = parseInt(yearStr);
  
  let startDate = new Date(startYear, startMonth, 15); // Middle of the month
  
  // Set current date as today unless using filtered data
  const currentDate = new Date();
  
  // Calculate weekly growth factor
  const yearlyGrowthFactor = cityParams.yearlyGrowthFactor || 1.28;
  const weeklyGrowthFactor = Math.pow(yearlyGrowthFactor, 1/52);
  
  // Adjust for market maturity - with reduced impact
  const maturityFactor = 1 - (cityParams.marketMaturity || 0.25) * 0.15; 
  const adjustedWeeklyGrowth = weeklyGrowthFactor * maturityFactor;
  
  // Generate projected data
  const projectedData = [];
  let currentOrders = baseWeeklyOrders;
  
  // For projections, start from today's date and project forward
  let projectionStartDate = new Date();
  
  for (let i = 0; i < weeks; i++) {
    // Calculate date for this week
    const weekDate = addWeeks(projectionStartDate, i);
    const weekOfMonth = Math.floor(weekDate.getDate() / 7);
    const month = weekDate.getMonth();
    
    // Apply growth factor (compounding weekly)
    currentOrders *= adjustedWeeklyGrowth;
    
    // Apply weekly and monthly seasonality
    const weeklyFactor = WEEKLY_SEASONALITY[weekOfMonth] || 1;
    const monthlyFactor = MONTHLY_SEASONALITY[month] || 1;
    currentOrders *= weeklyFactor * monthlyFactor;
    
    // Apply small random variation
    const variation = 1 + (Math.random() * 0.03 - 0.015); // Small random factor
    currentOrders *= variation;
    
    // Ensure orders never fall below minimum
    currentOrders = Math.max(currentOrders, cityParams.minWeeklyOrders || 20);
    
    // Format date and add to projections
    const formattedDate = format(weekDate, 'MMM d, yyyy');
    const shortDate = format(weekDate, 'MMM d');
    projectedData.push({
      name: shortDate,
      fullname: formattedDate,
      orders: Math.round(currentOrders),
      projected: true,
      month: format(weekDate, 'yyyy-MM'),
      week: format(weekDate, 'yyyy-MM-dd')
    });
  }
  
  // Generate weekly historical data points
  const weeklyHistoricalData = generateWeeklyHistoricalPoints(historicalData);
  
  // Calculate metrics
  const totalOrders = projectedData.reduce((sum, week) => sum + week.orders, 0);
  const totalOrdersMonthly = totalOrders / 4.3; // Convert weekly to monthly equivalent
  const avgWeeklyOrders = totalOrders / projectedData.length;
  
  // Calculate growth percentage using our adjusted baseline
  const growthPercent = ((avgWeeklyOrders / baselineForGrowth) - 1) * 100;
  
  // Combine historical and projected data
  const combined = [
    ...weeklyHistoricalData.map(week => ({
      ...week,
      projected: false
    })),
    ...projectedData
  ];
  
  return {
    combined,
    weeklyHistoricalData,
    projectedData,
    metrics: {
      totalAnnualOrders: Math.round(totalOrdersMonthly * 12),
      averageMonthlyOrders: Math.round(avgWeeklyOrders * 4.3),
      averageWeeklyOrders: Math.round(avgWeeklyOrders),
      projectedGrowthPercent: growthPercent,
      cityName: CITY_MAPPING[selectedCity] || 'Unknown'
    }
  };
}

/**
 * Generate weekly data points from monthly data
 */
function generateWeeklyHistoricalPoints(monthlyData) {
  if (!monthlyData || monthlyData.length < 2) return monthlyData;
  
  const weeklyData = [];
  
  // For each month, generate 4-5 weekly points
  for (let i = 0; i < monthlyData.length; i++) {
    const month = monthlyData[i];
    
    // Parse month and year
    const parts = month.name.split(' ');
    const monthName = parts[0];
    const year = parseInt(parts[1]);
    
    // Map month name to month number
    const monthMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    if (monthMap[monthName] === undefined || isNaN(year)) {
      // If we can't parse the date, just add the month as is
      weeklyData.push(month);
      continue;
    }
    
    const monthNumber = monthMap[monthName];
    const baseDate = new Date(year, monthNumber, 1);
    
    // Number of weeks in this month (usually 4, sometimes 5)
    const daysInMonth = new Date(year, monthNumber + 1, 0).getDate();
    const weeksInMonth = Math.ceil(daysInMonth / 7);
    
    // Get next month's data for interpolation if available
    const nextMonth = monthlyData[i + 1];
    let nextMonthOrders = month.orders;
    if (nextMonth) {
      nextMonthOrders = nextMonth.orders;
    }
    
    // Calculate weekly distribution based on general patterns
    // This creates a natural-looking curve between months
    for (let week = 0; week < weeksInMonth; week++) {
      // Calculate week's date
      const weekDay = Math.min(week * 7 + 1, daysInMonth);
      const weekDate = new Date(year, monthNumber, weekDay);
      
      // Calculate position within month (0-1)
      const position = week / weeksInMonth;
      
      // Interpolate between current and next month
      let weekOrders;
      if (i < monthlyData.length - 1) {
        // Linear interpolation between months
        weekOrders = month.orders * (1 - position) + nextMonthOrders * position;
      } else {
        // For the last month, create a gentle trend
        const factor = 1 + (position - 0.5) * 0.1; // -5% to +5% variation
        weekOrders = month.orders * factor;
      }
      
      // Apply weekly pattern
      const weekFactor = WEEKLY_SEASONALITY[week] || 1;
      weekOrders *= weekFactor;
      
      // Add small random variation
      const randomFactor = 1 + (Math.random() * 0.04 - 0.02); // ±2% random variation
      weekOrders *= randomFactor;
      
      // Format date
      const shortDate = format(weekDate, 'MMM d');
      const formattedDate = format(weekDate, 'MMM d, yyyy');
      
      weeklyData.push({
        name: shortDate,
        fullname: formattedDate,
        orders: Math.round(weekOrders / weeksInMonth),  // Distribute monthly orders
        month: format(weekDate, 'yyyy-MM'),
        week: format(weekDate, 'yyyy-MM-dd'),
        projected: false
      });
    }
  }
  
  return weeklyData;
}

/**
 * Preprocess historical data to extract the relevant city data
 * 
 * @param {Array} monthlyData - Raw monthly data in your existing format
 * @param {string} selectedCity - Selected city ID
 * @returns {Array} Processed historical data for the selected city
 */
function preprocessHistoricalData(monthlyData, selectedCity) {
  if (!monthlyData || monthlyData.length === 0) return [];
  
  // Get city name from mapping
  const cityName = CITY_MAPPING[selectedCity] || selectedCity;
  
  // Extract data for this city
  return monthlyData
    .filter(month => {
      // For 'all' city, use total; otherwise use city-specific data
      if (selectedCity === 'all') {
        return month.total !== undefined || 
               Object.values(CITY_MAPPING)
                 .filter(name => name !== 'All Cities')
                 .some(name => month[name] !== undefined);
      } else {
        return month[cityName] !== undefined;
      }
    })
    .map(month => {
      // For 'all' city, use total or calculate it
      let orders;
      if (selectedCity === 'all') {
        if (month.total !== undefined) {
          orders = month.total;
        } else {
          // Calculate total from all cities
          orders = Object.values(CITY_MAPPING)
            .filter(name => name !== 'All Cities')
            .reduce((sum, name) => sum + (month[name] || 0), 0);
        }
      } else {
        orders = month[cityName] || 0;
      }
      
      return {
        name: month.name,
        orders: orders,
        month: month.month || null,
        // Preserve any other properties you need
        date: month.date || null
      };
    })
    .filter(month => month.orders > 0); // Filter out months with no orders
}

/**
 * Function to add projections to your existing Dashboard component
 * 
 * @param {Array} monthlyOrdersTrend - Your monthly order data
 * @param {string} selectedCity - Currently selected city
 * @returns {Object} Projection data that can be used in your UI
 */
export function addProjectionsToComponent(monthlyOrdersTrend, selectedCity) {
  try {
    // Generate projections - these will now be weekly
    const projectionData = generateProjections(monthlyOrdersTrend, selectedCity);
    
    return {
      // Combined historical + projected data for charts
      combinedOrderTrend: projectionData.combined,
      
      // Historical weekly data
      weeklyHistoricalData: projectionData.weeklyHistoricalData,
      
      // Just the projected portion
      projectedData: projectionData.projectedData,
      
      // Metrics for display in cards
      metrics: projectionData.metrics,
      
      // Reference line position (typically today's date)
      referenceDate: format(new Date(), 'MMM d')
    };
  } catch (error) {
    console.error("Error generating projections:", error);
    return {
      combinedOrderTrend: [],
      weeklyHistoricalData: [],
      projectedData: [],
      metrics: {
        totalAnnualOrders: 0,
        averageMonthlyOrders: 0,
        projectedGrowthPercent: 0
      },
      referenceDate: format(new Date(), 'MMM d')
    };
  }
} 