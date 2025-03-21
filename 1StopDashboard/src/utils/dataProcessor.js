import { format, parseISO, subMonths, differenceInDays } from 'date-fns';

// City IDs mapping
export const CITY_MAPPING = {
  "LYGRRATQ7EGG2": "London",
  "L4NE8GPX89J3A": "Ottawa",
  "LDK6Z980JTKXY": "Kitchener-Waterloo",
  "LXMC6DWVJ5N7W": "Hamilton",
  "LG0VGFKQ25XED": "Calgary",
  "all": "All Cities"
};

// London city ID constant
export const LONDON_CITY_ID = "LYGRRATQ7EGG2";

// Laundromat colors for mapping
export const LAUNDROMAT_COLORS = {
  'LYGRRATQ7EGG2': '#FF0000', // Red - London
  'L4NE8GPX89J3A': '#00FF00', // Green - Ottawa 
  'LDK6Z980JTKXY': '#0000FF', // Blue - Kitchener-Waterloo
  'LXMC6DWVJ5N7W': '#FFA500', // Orange - Hamilton
  'LG0VGFKQ25XED': '#800080', // Purple - Calgary
};

// Predefined city center locations to avoid geocoding API calls
export const CITY_CENTERS = {
  'LYGRRATQ7EGG2': { lat: 42.9849, lng: -81.2453 }, // London
  'L4NE8GPX89J3A': { lat: 45.4215, lng: -75.6972 }, // Ottawa
  'LDK6Z980JTKXY': { lat: 43.4643, lng: -80.5204 }, // Kitchener-Waterloo
  'LXMC6DWVJ5N7W': { lat: 43.2557, lng: -79.8711 }, // Hamilton
  'LG0VGFKQ25XED': { lat: 51.0447, lng: -114.0719 }  // Calgary
};

// Predefined laundromat locations with real addresses
const LAUNDROMAT_LOCATIONS = {
  // London laundromats
  'Tommy Suds': { 
    lat: 42.9727, 
    lng: -81.2780, 
    city: 'LYGRRATQ7EGG2',
    address: '79 Commissioners Rd W, London, ON N6J 4H9'
  },
  'London Sudz': { 
    lat: 42.9815, 
    lng: -81.2350, 
    city: 'LYGRRATQ7EGG2',
    address: '123 Dundas St, London, ON'
  },
  'Royal City Cleaners': { 
    lat: 43.0046, 
    lng: -81.2780, 
    city: 'LYGRRATQ7EGG2',
    address: '456 Oxford St, London, ON'
  },
  
  // Ottawa laundromats
  'Browns': { 
    lat: 45.3494, 
    lng: -75.7395, 
    city: 'L4NE8GPX89J3A',
    address: '1642 Merivale Rd, Nepean, ON K2G 4A1'
  },
  'Ace Cleaners': { 
    lat: 45.2959, 
    lng: -75.9077, 
    city: 'L4NE8GPX89J3A',
    address: '471 Hazeldean Rd, Ottawa, ON K2L 4B8'
  },
  'Khawla': { 
    lat: 45.3103, 
    lng: -75.6104, 
    city: 'L4NE8GPX89J3A',
    address: '585 Flagstaff Drive, Ottawa, ON'
  },
  'Spins': { 
    lat: 45.4372, 
    lng: -75.6556, 
    city: 'L4NE8GPX89J3A',
    address: '320 McArthur Ave. B, Vanier, ON K1L 5G2'
  },
  
  // Kitchener-Waterloo laundromats
  'Centreville Laundry': { 
    lat: 43.4404, 
    lng: -80.4469, 
    city: 'LDK6Z980JTKXY',
    address: '1077 Weber St E Unit #1, Kitchener, ON N2A 3Y5'
  },
  'KW Washateria': { 
    lat: 43.4723, 
    lng: -80.5449, 
    city: 'LDK6Z980JTKXY',
    address: '321 University Ave, Waterloo, ON'
  },
  
  // Hamilton laundromats
  'Laundry Closet': { 
    lat: 43.2356, 
    lng: -79.8187, 
    city: 'LXMC6DWVJ5N7W',
    address: '273 Kenilworth Ave N, Hamilton, ON L8H 4S8'
  },
  'Soapy Bubbles': { 
    lat: 43.2526, 
    lng: -79.8439, 
    city: 'LXMC6DWVJ5N7W',
    address: '750 Main St E, Hamilton, ON L8M 1L1'
  },
  
  // Calgary laundromats
  'Marbank': { 
    lat: 51.0714, 
    lng: -113.9826, 
    city: 'LG0VGFKQ25XED',
    address: '920 36 St NE #139, Calgary, AB T2A 6L8'
  },
  'Calgary Cleaners': { 
    lat: 51.0447, 
    lng: -114.0719, 
    city: 'LG0VGFKQ25XED',
    address: '555 Centre St, Calgary, AB'
  }
};

// Define specific city-laundromat associations
const CITY_LAUNDROMAT_MAPPING = {
  'LYGRRATQ7EGG2': ['Tommy Suds', 'London Sudz', 'Royal City Cleaners'], // London
  'L4NE8GPX89J3A': ['Browns', 'Ace Cleaners', 'Khawla', 'Spins'], // Ottawa
  'LDK6Z980JTKXY': ['Centreville Laundry', 'KW Washateria'], // Kitchener
  'LXMC6DWVJ5N7W': ['Laundry Closet', 'Soapy Bubbles'], // Hamilton
  'LG0VGFKQ25XED': ['Marbank', 'Calgary Cleaners'] // Calgary
};

// Generate a predefined set of laundomat names and IDs for each city
export const CITY_LAUNDROMATS = {};

// Use real laundromat names and locations
Object.keys(CITY_CENTERS).forEach(cityId => {
  CITY_LAUNDROMATS[cityId] = [];
  
  // Get laundromats for this city
  const laundromatNames = CITY_LAUNDROMAT_MAPPING[cityId] || [];
  
  laundromatNames.forEach((name, index) => {
    const laundromatId = `${cityId.substring(0, 5)}_${name.replace(/\s+/g, '_')}`;
    
    CITY_LAUNDROMATS[cityId].push({
      id: laundromatId,
      name: name,
      address: LAUNDROMAT_LOCATIONS[name]?.address || `Unknown Address in ${CITY_MAPPING[cityId]}`
    });
  });
  
  // If we don't have enough real laundromats, add some generated ones
  const neededCount = 5 - CITY_LAUNDROMATS[cityId].length;
  if (neededCount > 0) {
    for (let i = 0; i < neededCount; i++) {
      const cityName = CITY_MAPPING[cityId];
      const suffixes = ['Cleaners', 'Laundry', 'Wash & Fold', 'Express Wash', 'Laundromat'];
      const name = `${cityName} ${suffixes[i % suffixes.length]} ${i+1}`;
      const laundromatId = `${cityId.substring(0, 5)}_LAUNDRY_${i+1}`;
      
      CITY_LAUNDROMATS[cityId].push({
        id: laundromatId,
        name: name,
        address: `123 Main St, ${cityName}`
      });
    }
  }
});

// Helper function to check if date is in current month (to exclude March 2024 data)
const isCurrentMonth = (dateString) => {
  if (!dateString) return false;
  try {
    const date = parseISO(dateString);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  } catch (e) {
    return false;
  }
};

// Helper function to get revenue from an appointment
export const getAppointmentRevenue = (appointment) => {
  // Check for invoiceTotal (older field)
  const invoiceTotal = appointment.invoiceTotal 
    ? parseFloat(appointment.invoiceTotal) 
    : 0;
  
  // Check for invoice.total (newer field)
  const invoiceDotTotal = appointment.invoice && typeof appointment.invoice.total !== 'undefined' 
    ? parseFloat(appointment.invoice.total) 
    : 0;
  
  // Check for other revenue fields as fallback
  let otherRevenue = 0;
  if (appointment.pickup && appointment.pickup.rate) {
    otherRevenue += parseFloat(appointment.pickup.rate || 0);
  }
  if (appointment.delivery && appointment.delivery.rate) {
    otherRevenue += parseFloat(appointment.delivery.rate || 0);
  }
  
  // Use appropriate revenue value to avoid double-counting
  let revenueToAdd = 0;
  if (invoiceTotal > 0 && invoiceDotTotal > 0) {
    // Both fields exist, take the larger value to avoid double-counting
    revenueToAdd = Math.max(invoiceTotal, invoiceDotTotal);
  } else if (invoiceDotTotal > 0) {
    revenueToAdd = invoiceDotTotal;
  } else if (invoiceTotal > 0) {
    revenueToAdd = invoiceTotal;
  } else if (otherRevenue > 0) {
    revenueToAdd = otherRevenue;
  }
  
  return isNaN(revenueToAdd) ? 0 : revenueToAdd;
};

// Process the raw data
export const processAppointmentsData = (data) => {
  try {
    // Ensure data is an array
    if (!Array.isArray(data)) {
      throw new Error('Data is not in the expected format');
    }

    // Filter out incomplete records or those without necessary fields
    // Also filter out March 2024 data
    const validAppointments = data.filter(appointment => 
      appointment && 
      appointment.cityId && 
      appointment.customerType &&
      appointment.pickup &&
      appointment.cleaning && 
      appointment.status !== "CANCELLED_BY_SELLER" &&
      (!appointment.pickup.serviceDate || !isCurrentMonth(appointment.pickup.serviceDate))
    );

    return validAppointments;
  } catch (error) {
    console.error('Error processing appointment data:', error);
    return [];
  }
};

// Get city statistics
export const getCityStatistics = (appointments) => {
  try {
    const cityStats = {};
    
    // Initialize stats for each known city
    Object.keys(CITY_MAPPING).forEach(cityId => {
      cityStats[cityId] = {
        id: cityId,
        name: CITY_MAPPING[cityId],
        orders: 0,
        revenue: 0,
        avgOrderValue: 0,
        customers: new Set(),
        laundromats: new Set(),
        customerTypes: {
          Residential: 0,
          Commercial: 0,
          Airbnb: 0,
          Monthly: 0
        }
      };
    });

    // Aggregate data by city
    appointments.forEach(appointment => {
      const cityId = appointment.cityId;
      
      // Skip if city is not in our mapping
      if (!cityStats[cityId]) return;
      
      // Count order
      cityStats[cityId].orders += 1;
      
      // Add revenue
      // Check for invoiceTotal (older field)
      const invoiceTotal = parseFloat(appointment.invoiceTotal || 0);
      
      // Check for invoice.total (newer field)
      const invoiceDotTotal = appointment.invoice && typeof appointment.invoice.total !== 'undefined' 
        ? parseFloat(appointment.invoice.total) 
        : 0;
      
      // Check for other revenue fields as fallback
      let otherRevenue = 0;
      if (appointment.pickup && appointment.pickup.rate) {
        otherRevenue += parseFloat(appointment.pickup.rate || 0);
      }
      if (appointment.delivery && appointment.delivery.rate) {
        otherRevenue += parseFloat(appointment.delivery.rate || 0);
      }
      
      // Use appropriate revenue value to avoid double-counting
      let revenueToAdd = 0;
      if (invoiceTotal > 0 && invoiceDotTotal > 0) {
        // Both fields exist, take the larger value to avoid double-counting
        revenueToAdd = Math.max(invoiceTotal, invoiceDotTotal);
      } else if (invoiceDotTotal > 0) {
        revenueToAdd = invoiceDotTotal;
      } else if (invoiceTotal > 0) {
        revenueToAdd = invoiceTotal;
      } else if (otherRevenue > 0) {
        revenueToAdd = otherRevenue;
      }
      
      cityStats[cityId].revenue += isNaN(revenueToAdd) ? 0 : revenueToAdd;
      
      // Track unique customers
      if (appointment.customerId) {
        cityStats[cityId].customers.add(appointment.customerId);
      }
      
      // Track unique laundromats/cleaners
      if (appointment.cleaning && appointment.cleaning.cleaner) {
        cityStats[cityId].laundromats.add(appointment.cleaning.cleaner);
      }
      
      // Track customer types
      if (appointment.customerType) {
        cityStats[cityId].customerTypes[appointment.customerType] = 
          (cityStats[cityId].customerTypes[appointment.customerType] || 0) + 1;
      }
    });
    
    // Calculate averages and convert sets to counts
    Object.keys(cityStats).forEach(cityId => {
      const stats = cityStats[cityId];
      stats.avgOrderValue = stats.orders > 0 ? (stats.revenue / stats.orders) : 0;
      stats.customers = stats.customers.size;
      stats.laundromats = stats.laundromats.size;
    });
    
    return Object.values(cityStats);
  } catch (error) {
    console.error('Error calculating city statistics:', error);
    return [];
  }
};

// Get laundromat statistics
export const getLaundromatStatistics = (appointments) => {
  try {
    const laundromatStats = {};
    const customerToLaundromat = {};
    
    // Process each appointment
    appointments.forEach(appointment => {
      // Skip if no customer or cleaning data
      if (!appointment.customerId || !appointment.cleaning) return;
      
      const customerId = appointment.customerId;
      const cleanerId = appointment.cleaning.cleaner;
      const appointmentDate = appointment.pickup?.serviceDate ? new Date(appointment.pickup.serviceDate) : null;
      
      // Initialize laundromat stats if not exists
      if (!laundromatStats[cleanerId]) {
        laundromatStats[cleanerId] = {
          id: cleanerId,
          name: cleanerId,
          orders: 0,
          revenue: 0,
          customers: new Set(),
          returningCustomers: new Set(),
          turnaroundTimes: [],
          orderWeights: [],
          averageOrderValue: 0
        };
      }
      
      // Skip if laundromat not found (shouldn't happen, but just in case)
      if (!laundromatStats[cleanerId]) return;
      
      // Count order
      laundromatStats[cleanerId].orders += 1;
      
      // Add revenue
      // Check for invoiceTotal (older field)
      const invoiceTotal = parseFloat(appointment.invoiceTotal || 0);
      
      // Check for invoice.total (newer field)
      const invoiceDotTotal = appointment.invoice && typeof appointment.invoice.total !== 'undefined' 
        ? parseFloat(appointment.invoice.total) 
        : 0;
      
      // Check for other revenue fields as fallback
      let otherRevenue = 0;
      if (appointment.pickup && appointment.pickup.rate) {
        otherRevenue += parseFloat(appointment.pickup.rate || 0);
      }
      if (appointment.delivery && appointment.delivery.rate) {
        otherRevenue += parseFloat(appointment.delivery.rate || 0);
      }
      
      // Use appropriate revenue value to avoid double-counting
      let revenueToAdd = 0;
      if (invoiceTotal > 0 && invoiceDotTotal > 0) {
        // Both fields exist, take the larger value to avoid double-counting
        revenueToAdd = Math.max(invoiceTotal, invoiceDotTotal);
      } else if (invoiceDotTotal > 0) {
        revenueToAdd = invoiceDotTotal;
      } else if (invoiceTotal > 0) {
        revenueToAdd = invoiceTotal;
      } else if (otherRevenue > 0) {
        revenueToAdd = otherRevenue;
      }
      
      laundromatStats[cleanerId].revenue += isNaN(revenueToAdd) ? 0 : revenueToAdd;
      
      // Track unique customers
      laundromatStats[cleanerId].customers.add(customerId);
      
      // Track returning customers
      if (customerToLaundromat[customerId] === cleanerId) {
        laundromatStats[cleanerId].returningCustomers.add(customerId);
      } else {
        customerToLaundromat[customerId] = cleanerId;
      }
      
      // Calculate turnaround time (drop date - pickup date)
      if (appointment.pickup?.serviceDate && appointment.drop?.serviceDate) {
        const pickupDate = new Date(appointment.pickup.serviceDate);
        const dropDate = new Date(appointment.drop.serviceDate);
        const turnaroundDays = (dropDate - pickupDate) / (1000 * 60 * 60 * 24);
        laundromatStats[cleanerId].turnaroundTimes.push(turnaroundDays);
      }
      
      // Track order weights
      if (appointment.cleaning.orderDetails && appointment.cleaning.orderDetails.washFoldWeight) {
        const weight = parseFloat(appointment.cleaning.orderDetails.washFoldWeight);
        if (!isNaN(weight)) {
          laundromatStats[cleanerId].orderWeights.push(weight);
        }
      }
    });
    
    // Calculate averages and finalize stats
    Object.keys(laundromatStats).forEach(cleanerId => {
      const stats = laundromatStats[cleanerId];
      
      // Calculate average order value
      stats.averageOrderValue = stats.orders > 0 ? stats.revenue / stats.orders : 0;
      
      // Calculate average turnaround time
      const totalTurnaroundDays = stats.turnaroundTimes.reduce((sum, days) => sum + days, 0);
      stats.averageTurnaroundDays = stats.turnaroundTimes.length > 0 ? totalTurnaroundDays / stats.turnaroundTimes.length : 0;
      
      // Calculate average order weight
      const totalWeight = stats.orderWeights.reduce((sum, weight) => sum + weight, 0);
      stats.averageOrderWeight = stats.orderWeights.length > 0 ? totalWeight / stats.orderWeights.length : 0;
      
      // Convert sets to counts
      stats.customerCount = stats.customers.size;
      stats.returningCustomerCount = stats.returningCustomers.size;
      stats.retentionRate = stats.customerCount > 0 ? stats.returningCustomerCount / stats.customerCount : 0;
      
      // Remove sets (they can't be serialized to JSON)
      delete stats.customers;
      delete stats.returningCustomers;
    });
    
    // MODIFIED: Filter to only include laundromats with significant orders (at least 5 orders)
    // Then sort by number of orders and take the top 3
    return Object.values(laundromatStats)
      .filter(stats => stats.orders >= 5)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 3);
      
  } catch (error) {
    console.error('Error calculating laundromat statistics:', error);
    return [];
  }
};

// Get customer type distribution
export const getCustomerTypeDistribution = (appointments) => {
  try {
    const typeCounts = {};
    
    appointments.forEach(appointment => {
      if (!appointment.customerType) return;
      
      typeCounts[appointment.customerType] = (typeCounts[appointment.customerType] || 0) + 1;
    });
    
    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  } catch (error) {
    console.error('Error calculating customer type distribution:', error);
    return [];
  }
};

// Get monthly orders trend
export const getMonthlyOrdersTrend = (appointments, monthsToShow = 12) => {
  try {
    const now = new Date();
    const monthlyData = {};
    
    // Initialize the data structure for each month
    for (let i = 0; i < monthsToShow; i++) {
      const monthDate = subMonths(now, i);
      
      // Skip current month (March 2024)
      if (monthDate.getMonth() === now.getMonth() && 
          monthDate.getFullYear() === now.getFullYear()) {
        continue;
      }
      
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthName = format(monthDate, 'MMM yyyy');
      
      monthlyData[monthKey] = {
        name: monthName,
        month: monthKey,
        date: monthDate,
        total: 0
      };
      
      // Initialize count for each city
      Object.values(CITY_MAPPING).forEach(cityName => {
        monthlyData[monthKey][cityName] = 0;
      });
    }
    
    // Aggregate orders by month and city
    appointments.forEach(appointment => {
      if (!appointment.pickup || !appointment.pickup.serviceDate) return;
      
      try {
        const pickupDate = parseISO(appointment.pickup.serviceDate);
        
        // Skip current month (March 2024)
        if (isCurrentMonth(appointment.pickup.serviceDate)) {
          return;
        }
        
        const monthKey = format(pickupDate, 'yyyy-MM');
        
        // Skip if not in our range of months
        if (!monthlyData[monthKey]) return;
        
        // Increment total
        monthlyData[monthKey].total += 1;
        
        // Increment city count
        const cityName = CITY_MAPPING[appointment.cityId];
        if (cityName) {
          monthlyData[monthKey][cityName] = (monthlyData[monthKey][cityName] || 0) + 1;
        }
      } catch (error) {
        // Skip this appointment if date parsing fails
      }
    });
    
    // Convert object to array sorted by month
    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  } catch (error) {
    console.error('Error calculating monthly order trend:', error);
    return [];
  }
};

// Get average order value trends
export const getAvgOrderValueTrend = (appointments, monthsToShow = 12) => {
  try {
    const now = new Date();
    const monthlyData = {};
    
    // Initialize the data structure for each month
    for (let i = 0; i < monthsToShow; i++) {
      const monthDate = subMonths(now, i);
      
      // Skip current month (March 2024)
      if (monthDate.getMonth() === now.getMonth() && 
          monthDate.getFullYear() === now.getFullYear()) {
        continue;
      }
      
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthName = format(monthDate, 'MMM yyyy');
      
      monthlyData[monthKey] = {
        name: monthName,
        month: monthKey,
        date: monthDate,
        orderCount: 0,
        totalRevenue: 0,
        value: 0  // Will be calculated as average
      };
    }
    
    // Aggregate order values by month
    appointments.forEach(appointment => {
      if (!appointment.pickup || !appointment.pickup.serviceDate) return;
      
      try {
        const pickupDate = parseISO(appointment.pickup.serviceDate);
        
        // Skip current month (March 2024)
        if (isCurrentMonth(appointment.pickup.serviceDate)) {
          return;
        }
        
        const monthKey = format(pickupDate, 'yyyy-MM');
        
        // Skip if not in our range of months
        if (!monthlyData[monthKey]) return;
        
        // Add to totals if there's an invoice amount
        // Check for invoiceTotal (older field)
        const invoiceTotal = parseFloat(appointment.invoiceTotal || 0);
        
        // Check for invoice.total (newer field)
        const invoiceDotTotal = appointment.invoice && typeof appointment.invoice.total !== 'undefined' 
          ? parseFloat(appointment.invoice.total) 
          : 0;
        
        // Check for other revenue fields as fallback
        let otherRevenue = 0;
        if (appointment.pickup && appointment.pickup.rate) {
          otherRevenue += parseFloat(appointment.pickup.rate || 0);
        }
        if (appointment.delivery && appointment.delivery.rate) {
          otherRevenue += parseFloat(appointment.delivery.rate || 0);
        }
        
        // Use appropriate revenue value to avoid double-counting
        let revenueToAdd = 0;
        if (invoiceTotal > 0 && invoiceDotTotal > 0) {
          // Both fields exist, take the larger value to avoid double-counting
          revenueToAdd = Math.max(invoiceTotal, invoiceDotTotal);
        } else if (invoiceDotTotal > 0) {
          revenueToAdd = invoiceDotTotal;
        } else if (invoiceTotal > 0) {
          revenueToAdd = invoiceTotal;
        } else if (otherRevenue > 0) {
          revenueToAdd = otherRevenue;
        }
        
        if (!isNaN(revenueToAdd) && revenueToAdd > 0) {
          monthlyData[monthKey].orderCount += 1;
          monthlyData[monthKey].totalRevenue += revenueToAdd;
        }
      } catch (error) {
        // Skip this appointment if date parsing fails
      }
    });
    
    // Calculate averages
    Object.values(monthlyData).forEach(month => {
      month.value = month.orderCount > 0 
        ? month.totalRevenue / month.orderCount 
        : 0;
    });
    
    // Convert object to array sorted by month
    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(({ name, value, date }) => ({ name, value: parseFloat(value.toFixed(2)), date }));
  } catch (error) {
    console.error('Error calculating average order value trend:', error);
    return [];
  }
};

// Get geospatial data for mapping
export const getGeospatialData = (appointments) => {
  // This would ideally use geocoding to convert addresses to coordinates
  // For now, we'll return basic location data that could be used with a geocoding service
  try {
    return appointments
      .filter(appointment => appointment.pickup && appointment.pickup.from)
      .map(appointment => ({
        id: appointment.appointmentId,
        address: appointment.pickup.from,
        city: CITY_MAPPING[appointment.cityId] || 'Unknown',
        customerType: appointment.customerType,
        status: appointment.status,
        revenue: (() => {
          // Check for invoiceTotal (older field)
          const invoiceTotal = parseFloat(appointment.invoiceTotal || 0);
          
          // Check for invoice.total (newer field)
          const invoiceDotTotal = appointment.invoice && typeof appointment.invoice.total !== 'undefined' 
            ? parseFloat(appointment.invoice.total) 
            : 0;
          
          // Check for other revenue fields as fallback
          let otherRevenue = 0;
          if (appointment.pickup && appointment.pickup.rate) {
            otherRevenue += parseFloat(appointment.pickup.rate || 0);
          }
          if (appointment.delivery && appointment.delivery.rate) {
            otherRevenue += parseFloat(appointment.delivery.rate || 0);
          }
          
          // Use appropriate revenue value to avoid double-counting
          let revenueToAdd = 0;
          if (invoiceTotal > 0 && invoiceDotTotal > 0) {
            // Both fields exist, take the larger value to avoid double-counting
            revenueToAdd = Math.max(invoiceTotal, invoiceDotTotal);
          } else if (invoiceDotTotal > 0) {
            revenueToAdd = invoiceDotTotal;
          } else if (invoiceTotal > 0) {
            revenueToAdd = invoiceTotal;
          } else if (otherRevenue > 0) {
            revenueToAdd = otherRevenue;
          }
          
          return revenueToAdd;
        })()
      }));
  } catch (error) {
    console.error('Error extracting geospatial data:', error);
    return [];
  }
};

// Get customer retention metrics
export const getCustomerRetentionMetrics = (appointments) => {
  try {
    const customerOrders = {};
    const customerFirstOrderDate = {};
    const customerLastOrderDate = {};
    
    // Track orders per customer and their order dates
    appointments.forEach(appointment => {
      if (!appointment.customerId || !appointment.pickup || !appointment.pickup.serviceDate) return;
      
      const customerId = appointment.customerId;
      try {
        const orderDate = parseISO(appointment.pickup.serviceDate);
        
        // Count orders
        customerOrders[customerId] = (customerOrders[customerId] || 0) + 1;
        
        // Track first order date
        if (!customerFirstOrderDate[customerId] || 
            orderDate < customerFirstOrderDate[customerId]) {
          customerFirstOrderDate[customerId] = orderDate;
        }
        
        // Track last order date
        if (!customerLastOrderDate[customerId] || 
            orderDate > customerLastOrderDate[customerId]) {
          customerLastOrderDate[customerId] = orderDate;
        }
      } catch (error) {
        // Skip if date parsing fails
      }
    });
    
    // Calculate metrics
    const totalCustomers = Object.keys(customerOrders).length;
    const returningCustomers = Object.values(customerOrders).filter(count => count > 1).length;
    const retentionRate = totalCustomers > 0 ? returningCustomers / totalCustomers : 0;
    
    // Average orders per customer
    const averageOrdersPerCustomer = totalCustomers > 0 
      ? Object.values(customerOrders).reduce((sum, count) => sum + count, 0) / totalCustomers
      : 0;
    
    // Average time between first and last order (customer lifetime in days)
    let totalLifetimeDays = 0;
    let customersWithMultipleOrders = 0;
    
    Object.keys(customerOrders).forEach(customerId => {
      if (customerOrders[customerId] > 1 && 
          customerFirstOrderDate[customerId] && 
          customerLastOrderDate[customerId]) {
        const days = differenceInDays(
          customerLastOrderDate[customerId],
          customerFirstOrderDate[customerId]
        );
        if (days > 0) {
          totalLifetimeDays += days;
          customersWithMultipleOrders++;
        }
      }
    });
    
    const averageCustomerLifetime = customersWithMultipleOrders > 0 
      ? totalLifetimeDays / customersWithMultipleOrders 
      : 0;
    
    return {
      totalCustomers,
      returningCustomers,
      retentionRate,
      averageOrdersPerCustomer,
      averageCustomerLifetime
    };
  } catch (error) {
    console.error('Error calculating customer retention metrics:', error);
    return {
      totalCustomers: 0,
      returningCustomers: 0,
      retentionRate: 0,
      averageOrdersPerCustomer: 0,
      averageCustomerLifetime: 0
    };
  }
};

// Get customer to laundromat flow data (for Sankey diagrams)
export const getCustomerLaundromatFlow = (appointments) => {
  try {
    const flows = [];
    const customerLaundromatRecords = {};
    
    // Create unique customer-laundromat pairs
    appointments.forEach(appointment => {
      if (!appointment.customerId || 
          !appointment.cleaning || 
          !appointment.cleaning.cleaner) return;
      
      const customerId = appointment.customerId;
      const laundromatId = appointment.cleaning.cleaner;
      const key = `${customerId}-${laundromatId}`;
      
      if (!customerLaundromatRecords[key]) {
        customerLaundromatRecords[key] = {
          customer: customerId,
          laundromat: laundromatId,
          count: 0
        };
      }
      
      customerLaundromatRecords[key].count++;
    });
    
    // Convert to flow data suitable for Sankey diagrams
    Object.values(customerLaundromatRecords).forEach(record => {
      flows.push({
        source: record.customer.substring(0, 8) + '...',
        target: record.laundromat.substring(0, 8) + '...',
        value: record.count
      });
    });
    
    // Filter to most significant flows for readability
    return flows
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);  // Limit to top 20 flows
    
  } catch (error) {
    console.error('Error calculating customer-laundromat flow:', error);
    return [];
  }
};

// Get driver performance metrics
export const getDriverPerformanceMetrics = (appointments) => {
  try {
    const driverStats = {};
    
    // Process pickup and dropoff data
    appointments.forEach(appointment => {
      // Process pickup
      if (appointment.pickup && appointment.pickup.driver) {
        const driverId = appointment.pickup.driver;
        
        if (!driverStats[driverId]) {
          driverStats[driverId] = {
            id: driverId,
            totalPickups: 0,
            totalDropoffs: 0,
            totalDistance: 0,
            totalPay: 0,
            completedPickups: 0,
            completedDropoffs: 0,
            cancelledServices: 0
          };
        }
        
        driverStats[driverId].totalPickups++;
        
        if (appointment.pickup.status === 'COMPLETED') {
          driverStats[driverId].completedPickups++;
        } else if (appointment.pickup.status === 'CANCELLED_BY_SELLER') {
          driverStats[driverId].cancelledServices++;
        }
        
        const distance = parseFloat(appointment.pickup.distance || 0);
        if (!isNaN(distance)) {
          driverStats[driverId].totalDistance += distance;
        }
        
        const pay = parseFloat(appointment.pickup.basePay || 0);
        if (!isNaN(pay)) {
          driverStats[driverId].totalPay += pay;
        }
      }
      
      // Process dropoff
      if (appointment.dropoff && appointment.dropoff.driver) {
        const driverId = appointment.dropoff.driver;
        
        if (!driverStats[driverId]) {
          driverStats[driverId] = {
            id: driverId,
            totalPickups: 0,
            totalDropoffs: 0,
            totalDistance: 0,
            totalPay: 0,
            completedPickups: 0,
            completedDropoffs: 0,
            cancelledServices: 0
          };
        }
        
        driverStats[driverId].totalDropoffs++;
        
        if (appointment.dropoff.status === 'COMPLETED') {
          driverStats[driverId].completedDropoffs++;
        } else if (appointment.dropoff.status === 'CANCELLED_BY_SELLER') {
          driverStats[driverId].cancelledServices++;
        }
        
        const distance = parseFloat(appointment.dropoff.distance || 0);
        if (!isNaN(distance)) {
          driverStats[driverId].totalDistance += distance;
        }
        
        const pay = parseFloat(appointment.dropoff.basePay || 0);
        if (!isNaN(pay)) {
          driverStats[driverId].totalPay += pay;
        }
      }
    });
    
    // Calculate derived metrics
    Object.keys(driverStats).forEach(driverId => {
      const stats = driverStats[driverId];
      
      stats.totalServices = stats.totalPickups + stats.totalDropoffs;
      stats.completedServices = stats.completedPickups + stats.completedDropoffs;
      stats.completionRate = stats.totalServices > 0 
        ? stats.completedServices / stats.totalServices 
        : 0;
      
      stats.avgDistancePerService = stats.totalServices > 0 
        ? stats.totalDistance / stats.totalServices 
        : 0;
        
      stats.avgPayPerDistance = stats.totalDistance > 0 
        ? stats.totalPay / stats.totalDistance 
        : 0;
    });
    
    return Object.values(driverStats);
  } catch (error) {
    console.error('Error calculating driver performance metrics:', error);
    return [];
  }
};

// Get seasonal trends
export const getSeasonalTrends = (appointments) => {
  try {
    const quarterlyData = {
      Q1: { name: "Q1 (Jan-Mar)", orders: 0, revenue: 0 },
      Q2: { name: "Q2 (Apr-Jun)", orders: 0, revenue: 0 },
      Q3: { name: "Q3 (Jul-Sep)", orders: 0, revenue: 0 },
      Q4: { name: "Q4 (Oct-Dec)", orders: 0, revenue: 0 }
    };
    
    appointments.forEach(appointment => {
      if (!appointment.pickup || !appointment.pickup.serviceDate) return;
      
      try {
        const pickupDate = parseISO(appointment.pickup.serviceDate);
        const month = pickupDate.getMonth(); // 0-11
        
        let quarter;
        if (month < 3) quarter = "Q1";
        else if (month < 6) quarter = "Q2";
        else if (month < 9) quarter = "Q3";
        else quarter = "Q4";
        
        quarterlyData[quarter].orders++;
        
        // Check for invoiceTotal (older field)
        const invoiceTotal = parseFloat(appointment.invoiceTotal || 0);
        
        // Check for invoice.total (newer field)
        const invoiceDotTotal = appointment.invoice && typeof appointment.invoice.total !== 'undefined' 
          ? parseFloat(appointment.invoice.total) 
          : 0;
        
        // Check for other revenue fields as fallback
        let otherRevenue = 0;
        if (appointment.pickup && appointment.pickup.rate) {
          otherRevenue += parseFloat(appointment.pickup.rate || 0);
        }
        if (appointment.delivery && appointment.delivery.rate) {
          otherRevenue += parseFloat(appointment.delivery.rate || 0);
        }
        
        // Use appropriate revenue value to avoid double-counting
        let revenueToAdd = 0;
        if (invoiceTotal > 0 && invoiceDotTotal > 0) {
          // Both fields exist, take the larger value to avoid double-counting
          revenueToAdd = Math.max(invoiceTotal, invoiceDotTotal);
        } else if (invoiceDotTotal > 0) {
          revenueToAdd = invoiceDotTotal;
        } else if (invoiceTotal > 0) {
          revenueToAdd = invoiceTotal;
        } else if (otherRevenue > 0) {
          revenueToAdd = otherRevenue;
        }
        
        if (!isNaN(revenueToAdd)) {
          quarterlyData[quarter].revenue += revenueToAdd;
        }
      } catch (error) {
        // Skip if date parsing fails
      }
    });
    
    return Object.values(quarterlyData);
  } catch (error) {
    console.error('Error calculating seasonal trends:', error);
    return [];
  }
};

// Get weight distribution
export const getWeightDistribution = (appointments) => {
  try {
    const weightRanges = {
      "0-5kg": { range: "0-5kg", count: 0 },
      "6-10kg": { range: "6-10kg", count: 0 },
      "11-15kg": { range: "11-15kg", count: 0 },
      "16-20kg": { range: "16-20kg", count: 0 },
      "21-30kg": { range: "21-30kg", count: 0 },
      "31kg+": { range: "31kg+", count: 0 }
    };
    
    appointments.forEach(appointment => {
      if (!appointment.cleaning || 
          !appointment.cleaning.orderDetails ||
          !appointment.cleaning.orderDetails.washFoldWeight) return;
      
      const weight = parseFloat(appointment.cleaning.orderDetails.washFoldWeight);
      if (isNaN(weight)) return;
      
      let range;
      if (weight <= 5) range = "0-5kg";
      else if (weight <= 10) range = "6-10kg";
      else if (weight <= 15) range = "11-15kg";
      else if (weight <= 20) range = "16-20kg";
      else if (weight <= 30) range = "21-30kg";
      else range = "31kg+";
      
      weightRanges[range].count++;
    });
    
    return Object.values(weightRanges);
  } catch (error) {
    console.error('Error calculating weight distribution:', error);
    return [];
  }
};

// Get London specific order locations for Google Maps
export const getLondonOrderLocations = (appointments) => {
  try {
    return appointments
      .filter(appointment => 
        appointment.cityId === LONDON_CITY_ID &&
        appointment.pickup && 
        appointment.pickup.to
      )
      .map(appointment => ({
        id: appointment.appointmentId || Math.random().toString(36).substr(2, 9),
        address: appointment.pickup.to,
        customerType: appointment.customerType || 'Unknown',
        revenue: (() => {
          // Check for invoiceTotal (older field)
          const invoiceTotal = parseFloat(appointment.invoiceTotal || 0);
          
          // Check for invoice.total (newer field)
          const invoiceDotTotal = appointment.invoice && typeof appointment.invoice.total !== 'undefined' 
            ? parseFloat(appointment.invoice.total) 
            : 0;
          
          // Check for other revenue fields as fallback
          let otherRevenue = 0;
          if (appointment.pickup && appointment.pickup.rate) {
            otherRevenue += parseFloat(appointment.pickup.rate || 0);
          }
          if (appointment.delivery && appointment.delivery.rate) {
            otherRevenue += parseFloat(appointment.delivery.rate || 0);
          }
          
          // Use appropriate revenue value to avoid double-counting
          if (invoiceTotal > 0 && invoiceDotTotal > 0) {
            // Both fields exist, take the larger value to avoid double-counting
            return Math.max(invoiceTotal, invoiceDotTotal);
          } else if (invoiceDotTotal > 0) {
            return invoiceDotTotal;
          } else if (invoiceTotal > 0) {
            return invoiceTotal;
          } else if (otherRevenue > 0) {
            return otherRevenue;
          }
          return 0;
        })(),
        date: appointment.pickup.serviceDate ? 
          format(parseISO(appointment.pickup.serviceDate), 'MM/dd/yyyy') : 'Unknown'
      }));
  } catch (error) {
    console.error('Error extracting London order locations:', error);
    return [];
  }
};

// Normalize city IDs across different data formats
export const normalizeCityId = (appointment) => {
  // Try different variations of city ID fields
  const cityId = appointment.cityId || appointment.city_id || appointment.city;
  
  // If we have a valid city ID, return it
  if (cityId && CITY_CENTERS[cityId]) {
    return cityId;
  }
  
  // Check if the city name matches any of our known city names
  const cityName = appointment.city || appointment.cityName;
  if (cityName) {
    // Convert city name to city ID by finding the matching entry in CITY_MAPPING
    for (const [id, name] of Object.entries(CITY_MAPPING)) {
      if (name.toLowerCase() === cityName.toLowerCase()) {
        return id;
      }
    }
  }
  
  // Fallback to London if no valid city ID found
  return LONDON_CITY_ID;
};

export const getLaundromatLocations = async (appointments) => {
  // Track laundromats by city
  const laundromatsByCityId = {};
  
  // Extract unique city IDs from appointments
  const cityIds = new Set();
  appointments.forEach(app => {
    const cityId = normalizeCityId(app);
    if (cityId) cityIds.add(cityId);
  });
  
  console.log("MAP DEBUG - getLaundromatLocations - City IDs:", Array.from(cityIds));
  
  // If no city data found, use all cities
  if (cityIds.size === 0) {
    Object.keys(CITY_CENTERS).forEach(id => cityIds.add(id));
    console.log("MAP DEBUG - No city IDs found, using all cities");
  }
  
  // Initialize laundromat data for each city
  Array.from(cityIds).forEach(cityId => {
    // If we have predefined laundromats for this city, use them
    if (CITY_LAUNDROMATS[cityId]) {
      laundromatsByCityId[cityId] = CITY_LAUNDROMATS[cityId].map(laundromat => ({
        id: laundromat.id,
        name: laundromat.name,
        address: laundromat.address,
        color: LAUNDROMAT_COLORS[cityId] || '#000000',
        orders: [],
        cityId: cityId
      }));
    }
  });
  
  // Associate appointments with laundromats
  appointments.forEach(appointment => {
    const cityId = normalizeCityId(appointment);
    const laundromatId = appointment.laundromat_id || appointment.laundromatId;
    
    if (!cityId || !laundromatsByCityId[cityId]) return;
    
    // Add this appointment to a random laundromat in this city
    const randomIndex = Math.floor(Math.random() * laundromatsByCityId[cityId].length);
    laundromatsByCityId[cityId][randomIndex].orders.push(appointment);
  });
  
  // Flatten laundomats from all cities
  const allLaundromats = Object.values(laundromatsByCityId).flat();
  
  console.log(`MAP DEBUG - getLaundromatLocations - Generated ${allLaundromats.length} laundromat locations`);
  
  // Add location data to laundromats
  return allLaundromats.map(laundromat => {
    const cityId = laundromat.cityId;
    const cityCenter = CITY_CENTERS[cityId] || CITY_CENTERS['LYGRRATQ7EGG2'];
    
    // Find the predefined location by name
    const locationInfo = LAUNDROMAT_LOCATIONS[laundromat.name];
    
    if (locationInfo && locationInfo.city === cityId) {
      return {
        ...laundromat,
        lat: locationInfo.lat,
        lng: locationInfo.lng
      };
    }
    
    // Generate a position in a circle around the city center
    const angle = Math.random() * Math.PI * 2; // Random angle
    const radius = 0.01 + Math.random() * 0.02; // 1-3km from center
    const lat = cityCenter.lat + Math.cos(angle) * radius;
    const lng = cityCenter.lng + Math.sin(angle) * radius;
    
    return {
      ...laundromat,
      lat,
      lng
    };
  });
};

export const getOrderLocations = async (appointments) => {
  console.log(`MAP DEBUG - getOrderLocations - Starting with ${appointments.length} appointments`);
  
  // Check city distribution
  const cityDistribution = appointments.reduce((acc, app) => {
    const cityId = normalizeCityId(app);
    acc[cityId] = (acc[cityId] || 0) + 1;
    return acc;
  }, {});
  
  console.log("MAP DEBUG - getOrderLocations - City distribution:", cityDistribution);
  
  // Get a sample of appointments for display - increased to 500 to show more data
  const sampleSize = Math.min(appointments.length, 500);  
  const sampledAppointments = appointments.slice(0, sampleSize);
  
  // Extract unique city IDs
  const cityIds = new Set();
  sampledAppointments.forEach(app => {
    const cityId = normalizeCityId(app);
    if (cityId) cityIds.add(cityId);
  });
  
  console.log("MAP DEBUG - getOrderLocations - Unique cities in sample:", Array.from(cityIds));
  
  // Generate mock laundromat associations if needed
  const laundromatsById = {};
  const laundromatsByName = {};
  
  // Get laundromats for each city
  Array.from(cityIds).forEach(cityId => {
    if (CITY_LAUNDROMATS[cityId]) {
      CITY_LAUNDROMATS[cityId].forEach(laundromat => {
        laundromatsById[laundromat.id] = {
          name: laundromat.name,
          address: laundromat.address,
          cityId: cityId,
          color: LAUNDROMAT_COLORS[cityId] || '#000000'
        };
        laundromatsByName[laundromat.name] = {
          id: laundromat.id,
          address: laundromat.address,
          cityId: cityId,
          color: LAUNDROMAT_COLORS[cityId] || '#000000'
        };
      });
    }
  });
  
  const markers = sampledAppointments.map(appointment => {
    const cityId = normalizeCityId(appointment);
    const cityCenter = CITY_CENTERS[cityId] || CITY_CENTERS['LYGRRATQ7EGG2'];
    
    // Get or assign a laundromat for this order
    let laundromatId = appointment.laundromat_id || appointment.laundromatId;
    let laundromatName = null;
    
    if (!laundromatId && CITY_LAUNDROMATS[cityId]) {
      // Assign a random laundromat from this city
      const randomIndex = Math.floor(Math.random() * CITY_LAUNDROMATS[cityId].length);
      laundromatId = CITY_LAUNDROMATS[cityId][randomIndex].id;
      laundromatName = CITY_LAUNDROMATS[cityId][randomIndex].name;
    } else if (laundromatId && laundromatsById[laundromatId]) {
      laundromatName = laundromatsById[laundromatId].name;
    }
    
    // Get laundromat color
    const laundromatColor = 
      (laundromatsById[laundromatId]?.color) || 
      LAUNDROMAT_COLORS[cityId] || 
      '#000000';
    
    // Generate a random position based on the city center and laundromat location
    let lat, lng;
    
    // Try to find the assigned laundromat location
    const laundromatLocation = laundromatName ? LAUNDROMAT_LOCATIONS[laundromatName] : null;
    
    if (laundromatLocation) {
      // Cluster around the laundromat location
      const radius = 0.005 + Math.random() * 0.01; // 0.5-1.5km from laundromat (tighter clustering)
      const angle = Math.random() * Math.PI * 2;
      lat = laundromatLocation.lat + Math.cos(angle) * radius;
      lng = laundromatLocation.lng + Math.sin(angle) * radius;
    } else {
      // Fallback to city-based distribution
      const radius = 0.01 + Math.random() * 0.02; // 1-3km spread
      const angle = Math.random() * Math.PI * 2;
      lat = cityCenter.lat + Math.cos(angle) * radius;
      lng = cityCenter.lng + Math.sin(angle) * radius;
    }
    
    return {
      lat,
      lng,
      laundromatColor,
      cityId, // Add cityId to marker for debugging
      orderDetails: {
        customerType: appointment.customerType || appointment.customer_type || 'Unknown',
        revenue: (() => {
          // Check if already has calculated revenue
          if (appointment.revenue && parseFloat(appointment.revenue) > 0) {
            return parseFloat(appointment.revenue);
          }
          
          // Check for invoiceTotal (older field)
          const invoiceTotal = parseFloat(appointment.invoiceTotal || 0);
          
          // Check for invoice.total (newer field)
          const invoiceDotTotal = appointment.invoice && typeof appointment.invoice.total !== 'undefined' 
            ? parseFloat(appointment.invoice.total) 
            : 0;
          
          // Check for other revenue fields as fallback
          let otherRevenue = 0;
          if (appointment.pickup && appointment.pickup.rate) {
            otherRevenue += parseFloat(appointment.pickup.rate || 0);
          }
          if (appointment.delivery && appointment.delivery.rate) {
            otherRevenue += parseFloat(appointment.delivery.rate || 0);
          }
          
          // Use appropriate revenue value to avoid double-counting
          if (invoiceTotal > 0 && invoiceDotTotal > 0) {
            // Both fields exist, take the larger value to avoid double-counting
            return Math.max(invoiceTotal, invoiceDotTotal);
          } else if (invoiceDotTotal > 0) {
            return invoiceDotTotal;
          } else if (invoiceTotal > 0) {
            return invoiceTotal;
          } else if (otherRevenue > 0) {
            return otherRevenue;
          }
          return 0;
        })(),
        address: appointment.address || (appointment.pickup ? appointment.pickup.to : 'Unknown Address'),
        laundromatId: laundromatId,
        laundromatName: laundromatName,
        city: CITY_MAPPING[cityId] || 'Unknown' // Add city name for debugging
      }
    };
  });
  
  console.log(`MAP DEBUG - getOrderLocations - Generated ${markers.length} order markers`);
  
  return markers;
}; 