/**
 * Data Insights Generator for Laundry Service Data
 * 
 * This script analyzes the raw appointments.json data and generates
 * basic insights that can be used as a starting point for the dashboard.
 */

const fs = require('fs');
const path = require('path');

// Mapping of city IDs to names
const CITY_MAPPING = {
  "LYGRRATQ7EGG2": "London",
  "L4NE8GPX89J3A": "Ottawa",
  "LDK6Z980JTKXY": "Kitchener-Waterloo",
  "LXMC6DWVJ5N7W": "Hamilton",
  "LG0VGFKQ25XED": "Calgary"
};

// Helper function to get revenue from an appointment - identical to the one in dataProcessor.js
const getAppointmentRevenue = (appointment) => {
  // Check if invoice.total exists (newer field)
  const invoiceTotal = appointment.invoice && appointment.invoice.total 
    ? parseFloat(appointment.invoice.total) 
    : 0;
  
  // Check if invoiceTotal exists (older field)
  const oldInvoiceTotal = appointment.invoiceTotal 
    ? parseFloat(appointment.invoiceTotal) 
    : 0;
  
  // Use the field that has a value, or combine if both have values
  // In case of split data, we'll use the sum
  const revenue = invoiceTotal + oldInvoiceTotal;
  
  return isNaN(revenue) ? 0 : revenue;
};

// Load the data
try {
  const dataPath = path.join(__dirname, 'appointments.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  console.log('Data Analysis Started...');
  console.log(`Total Records: ${data.length}`);
  
  // Analyze city distribution
  const cityStats = {};
  
  // Initialize cityStats with known cities
  Object.keys(CITY_MAPPING).forEach(cityId => {
    cityStats[cityId] = {
      id: cityId,
      name: CITY_MAPPING[cityId],
      orders: 0,
      revenue: 0,
      customers: new Set(),
      laundromats: new Set(),
      customerTypes: {}
    };
  });
  
  // Process data
  data.forEach(appointment => {
    if (!appointment || !appointment.cityId) return;
    
    const cityId = appointment.cityId;
    
    // Skip if city is not in our mapping
    if (!cityStats[cityId]) {
      console.log(`Unknown cityId found: ${cityId}`);
      return;
    }
    
    // Count order
    cityStats[cityId].orders += 1;
    
    // Add revenue
    const revenue = getAppointmentRevenue(appointment);
    cityStats[cityId].revenue += revenue;
    
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
  
  // Convert sets to counts and calculate derived metrics
  Object.keys(cityStats).forEach(cityId => {
    const stats = cityStats[cityId];
    stats.customers = stats.customers.size;
    stats.laundromats = stats.laundromats.size;
    stats.avgOrderValue = stats.orders > 0 ? (stats.revenue / stats.orders) : 0;
  });
  
  // Output results
  console.log('\n=== City Statistics ===');
  Object.values(cityStats).forEach(city => {
    console.log(`\n${city.name}:`);
    console.log(`  Orders: ${city.orders}`);
    console.log(`  Revenue: $${city.revenue.toFixed(2)}`);
    console.log(`  Avg Order Value: $${city.avgOrderValue.toFixed(2)}`);
    console.log(`  Unique Customers: ${city.customers}`);
    console.log(`  Laundromats: ${city.laundromats}`);
    console.log('  Customer Types:');
    Object.entries(city.customerTypes).forEach(([type, count]) => {
      console.log(`    ${type}: ${count}`);
    });
  });
  
  // Analyze customer types
  const customerTypes = {};
  data.forEach(appointment => {
    if (!appointment || !appointment.customerType) return;
    
    const type = appointment.customerType;
    customerTypes[type] = (customerTypes[type] || 0) + 1;
  });
  
  console.log('\n=== Customer Type Distribution ===');
  Object.entries(customerTypes).forEach(([type, count]) => {
    console.log(`${type}: ${count} orders (${((count / data.length) * 100).toFixed(1)}%)`);
  });
  
  // Analyze laundromats
  const laundromatStats = {};
  data.forEach(appointment => {
    if (!appointment || !appointment.cleaning || !appointment.cleaning.cleaner) return;
    
    const cleanerId = appointment.cleaning.cleaner;
    
    if (!laundromatStats[cleanerId]) {
      laundromatStats[cleanerId] = {
        id: cleanerId,
        orders: 0,
        revenue: 0,
        city: appointment.cityId ? CITY_MAPPING[appointment.cityId] || 'Unknown' : 'Unknown',
        customers: new Set()
      };
    }
    
    laundromatStats[cleanerId].orders += 1;
    
    const revenue = getAppointmentRevenue(appointment);
    laundromatStats[cleanerId].revenue += revenue;
    
    if (appointment.customerId) {
      laundromatStats[cleanerId].customers.add(appointment.customerId);
    }
  });
  
  // Convert sets to counts and calculate derived metrics
  Object.keys(laundromatStats).forEach(cleanerId => {
    const stats = laundromatStats[cleanerId];
    stats.customers = stats.customers.size;
    stats.avgOrderValue = stats.orders > 0 ? (stats.revenue / stats.orders) : 0;
  });
  
  console.log('\n=== Top Laundromats by Order Volume ===');
  Object.values(laundromatStats)
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5)
    .forEach(laundromat => {
      console.log(`${laundromat.id.substring(0, 8)}... (${laundromat.city}):`);
      console.log(`  Orders: ${laundromat.orders}`);
      console.log(`  Revenue: $${laundromat.revenue.toFixed(2)}`);
      console.log(`  Avg Order Value: $${laundromat.avgOrderValue.toFixed(2)}`);
      console.log(`  Unique Customers: ${laundromat.customers}`);
    });
  
  // Customer retention analysis
  const customerOrders = {};
  data.forEach(appointment => {
    if (!appointment || !appointment.customerId) return;
    
    const customerId = appointment.customerId;
    customerOrders[customerId] = (customerOrders[customerId] || 0) + 1;
  });
  
  const totalCustomers = Object.keys(customerOrders).length;
  const returningCustomers = Object.values(customerOrders).filter(count => count > 1).length;
  const retentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) : 0;
  
  console.log('\n=== Customer Retention ===');
  console.log(`Total Unique Customers: ${totalCustomers}`);
  console.log(`Returning Customers: ${returningCustomers}`);
  console.log(`Retention Rate: ${(retentionRate * 100).toFixed(1)}%`);
  
  console.log('\nData Analysis Complete!');
  
} catch (error) {
  console.error('Error analyzing data:', error);
} 