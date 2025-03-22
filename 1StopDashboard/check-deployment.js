/**
 * Dashboard Deployment Check Script
 * 
 * This script attempts to fetch the revenue_data.json file from the live site
 * to verify that the correct revenue figures are being served.
 */

const https = require('https');

// URL of the live revenue data file
const LIVE_URL = 'https://geomindai.com/1stop/dashboard/revenue_data.json';
// The expected total revenue amount
const EXPECTED_REVENUE = 310395.84;

console.log(`Checking deployment at ${LIVE_URL}...`);
console.log('Expected total revenue:', EXPECTED_REVENUE);

// Add timestamp to prevent caching
const url = `${LIVE_URL}?t=${Date.now()}`;

https.get(url, (res) => {
  console.log('Status code:', res.statusCode);
  console.log('Response headers:', res.headers);
  
  // Check if response is being redirected
  if (res.statusCode >= 300 && res.statusCode < 400) {
    console.log(`Redirected to: ${res.headers.location}`);
  }
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const revenueData = JSON.parse(data);
      console.log('Revenue data fetched successfully:');
      console.log('Total revenue:', revenueData.total_revenue);
      
      if (revenueData.total_revenue === EXPECTED_REVENUE) {
        console.log('✅ SUCCESS: Revenue amount is correct!');
      } else {
        console.log(`❌ ERROR: Revenue amount is wrong! Expected ${EXPECTED_REVENUE}, got ${revenueData.total_revenue}`);
      }
      
      // Print city breakdown
      console.log('\nCity breakdown:');
      Object.keys(revenueData.cities).forEach(cityId => {
        const city = revenueData.cities[cityId];
        console.log(`- ${city.name}: $${city.revenue.toFixed(2)} (${city.percentage.toFixed(1)}%)`);
      });
      
    } catch (error) {
      console.error('Failed to parse response:', error);
      console.log('Raw response:', data);
    }
  });
  
}).on('error', (error) => {
  console.error('Error fetching revenue data:', error);
}); 