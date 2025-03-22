const fs = require('fs');
const path = require('path');

// Input and output paths
const sourceFile = path.join(__dirname, '..', 'appointments.json');
const aggregatedDataFile = path.join(__dirname, 'public', 'aggregated_data.json');
const revenueDataFile = path.join(__dirname, 'public', 'revenue_data.json');

// City mapping for reference
const CITY_MAPPING = {
  "LYGRRATQ7EGG2": "London",
  "L4NE8GPX89J3A": "Ottawa",
  "LDK6Z980JTKXY": "Kitchener-Waterloo",
  "LXMC6DWVJ5N7W": "Hamilton",
  "LG0VGFKQ25XED": "Calgary",
  "all": "All Cities"
};

// Function to calculate appointment revenue
function getAppointmentRevenue(appointment) {
  // Try different revenue fields
  if (appointment.invoice && appointment.invoice.total) {
    return parseFloat(appointment.invoice.total) || 0;
  }
  if (appointment.invoiceTotal) {
    return parseFloat(appointment.invoiceTotal) || 0;
  }
  
  // Fallback to components
  let total = 0;
  
  // Add pickup fee if available
  if (appointment.pickup && appointment.pickup.rate) {
    total += parseFloat(appointment.pickup.rate) || 0;
  }
  
  // Add dropoff fee if available
  if (appointment.dropoff && appointment.dropoff.rate) {
    total += parseFloat(appointment.dropoff.rate) || 0;
  }
  
  // Add cleaning fee if available
  if (appointment.cleaning && appointment.cleaning.rate) {
    total += parseFloat(appointment.cleaning.rate) || 0;
  }
  
  return total;
}

// Processes appointments data and returns anonymized aggregated statistics
function processAppointmentsData(appointments) {
  console.log(`Processing ${appointments.length} appointments...`);
  
  // Calculate total revenue
  const total_revenue = appointments.reduce((sum, appointment) => {
    return sum + getAppointmentRevenue(appointment);
  }, 0);
  
  // Group by city
  const cityRevenue = {};
  appointments.forEach(appointment => {
    const cityId = appointment.cityId;
    if (!cityId) return;
    
    if (!cityRevenue[cityId]) {
      cityRevenue[cityId] = {
        name: CITY_MAPPING[cityId] || "Unknown",
        revenue: 0,
        orders: 0
      };
    }
    
    cityRevenue[cityId].revenue += getAppointmentRevenue(appointment);
    cityRevenue[cityId].orders += 1;
  });
  
  // Calculate percentages
  Object.keys(cityRevenue).forEach(cityId => {
    cityRevenue[cityId].percentage = (cityRevenue[cityId].revenue / total_revenue) * 100;
  });
  
  // Create customer type distribution
  const customerTypeDistribution = {};
  appointments.forEach(appointment => {
    const customerType = appointment.customerType || "Unknown";
    if (!customerTypeDistribution[customerType]) {
      customerTypeDistribution[customerType] = 0;
    }
    customerTypeDistribution[customerType] += 1;
  });
  
  // Calculate monthly trends
  const monthlyTrends = {};
  appointments.forEach(appointment => {
    let date = null;
    // Try to extract date
    if (appointment.pickup && appointment.pickup.serviceDate) {
      date = new Date(appointment.pickup.serviceDate);
    } else if (appointment.service_date) {
      date = new Date(appointment.service_date);
    } else if (appointment.createdAt) {
      date = new Date(appointment.createdAt);
    }
    
    if (date && !isNaN(date.getTime())) {
      const month = date.getMonth();
      const year = date.getFullYear();
      const key = `${year}-${month+1}`;
      
      if (!monthlyTrends[key]) {
        monthlyTrends[key] = {
          month: key,
          name: new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
          orders: 0,
          revenue: 0
        };
      }
      
      monthlyTrends[key].orders += 1;
      monthlyTrends[key].revenue += getAppointmentRevenue(appointment);
    }
  });
  
  // Convert to arrays for easier consumption
  const monthlyTrendsArray = Object.values(monthlyTrends).sort((a, b) => a.month.localeCompare(b.month));
  
  return {
    total_appointments: appointments.length,
    total_revenue: total_revenue,
    cities: cityRevenue,
    customer_types: customerTypeDistribution,
    monthly_trends: monthlyTrendsArray
  };
}

// Function to create the specific revenue data file format
function createRevenueDataFile(aggregatedData) {
  const revenueData = {
    total_revenue: aggregatedData.total_revenue,
    cities: {}
  };
  
  // Format city data
  Object.keys(aggregatedData.cities).forEach(cityId => {
    revenueData.cities[cityId] = {
      name: aggregatedData.cities[cityId].name,
      revenue: aggregatedData.cities[cityId].revenue,
      percentage: aggregatedData.cities[cityId].percentage
    };
  });
  
  return revenueData;
}

// Main process
try {
  console.log('Starting data preparation...');
  console.log(`Source file: ${sourceFile}`);
  
  // Check if source file exists
  if (!fs.existsSync(sourceFile)) {
    console.log(`Source file not found: ${sourceFile}`);
    process.exit(1);
  }
  
  // Load and parse the appointments data
  const appointmentsData = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
  console.log(`Loaded ${appointmentsData.length} appointments`);
  
  // Process the data
  const aggregatedData = processAppointmentsData(appointmentsData);
  console.log('Data processing complete');
  
  // Generate the revenue data file
  const revenueData = createRevenueDataFile(aggregatedData);
  
  // Write the aggregated data file
  fs.writeFileSync(aggregatedDataFile, JSON.stringify(aggregatedData, null, 2));
  console.log(`Aggregated data written to ${aggregatedDataFile}`);
  
  // Write the revenue data file
  fs.writeFileSync(revenueDataFile, JSON.stringify(revenueData, null, 2));
  console.log(`Revenue data written to ${revenueDataFile}`);
  
  console.log('Data preparation complete!');
} catch (error) {
  console.error('Error preparing data:', error);
  process.exit(1);
} 