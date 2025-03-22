const fs = require('fs');
const path = require('path');

// Paths
const sourceFile = path.join(__dirname, '..', 'appointments.json');
const destFile = path.join(__dirname, 'appointments.json');
const revenueFile = path.join(__dirname, 'revenue_data.json');

// Security wrapper template
const securityWrapperTemplate = `// Security guard for JSON data
// This file detects and blocks unauthorized access attempts

(function() {
  // Check if this file is being accessed directly
  if (document.referrer === '' || 
      !document.referrer.includes(window.location.hostname)) {
    
    // Direct access detected, redirect to the main page
    window.location.href = './index.html';
    
    // For extra security, clear the page content
    document.documentElement.innerHTML = 
      '<html><head><title>Access Denied</title></head>' +
      '<body style="font-family: sans-serif; text-align: center; padding-top: 50px;">' +
      '<h1>Access Denied</h1>' +
      '<p>Direct access to data files is not permitted.</p>' +
      '<p><a href="./index.html">Return to Dashboard</a></p>' +
      '</body></html>';
  }
})();`;

// Create security wrappers for JSON files
function createSecurityWrappers() {
  try {
    console.log('Creating security wrappers for JSON data files...');
    
    // Create wrapper for appointments.json
    if (fs.existsSync(destFile)) {
      fs.writeFileSync(`${destFile}.js`, securityWrapperTemplate);
      console.log('Created security wrapper for appointments.json');
    }
    
    // Create wrapper for revenue_data.json
    if (fs.existsSync(revenueFile)) {
      fs.writeFileSync(`${revenueFile}.js`, securityWrapperTemplate);
      console.log('Created security wrapper for revenue_data.json');
    }
  } catch (error) {
    console.error('Error creating security wrappers:', error);
  }
}

// Check if the destination file already exists
if (fs.existsSync(destFile)) {
  console.log('appointments.json already exists in public directory, skipping copy...');
  const stats = fs.statSync(destFile);
  console.log('File size:', stats.size, 'bytes');
  createSecurityWrappers();
  process.exit(0);
}

// Copy the file if source exists
try {
  console.log('Copying appointments.json to public directory...');
  console.log('Source file:', sourceFile);
  console.log('Destination file:', destFile);
  
  // Check if source file exists
  if (!fs.existsSync(sourceFile)) {
    console.log(`Source file not found: ${sourceFile}`);
    console.log('Skipping copy operation, will use existing file in build.');
    createSecurityWrappers();
    process.exit(0);
  }
  
  // Copy the file
  fs.copyFileSync(sourceFile, destFile);
  
  // Verify the copy
  if (!fs.existsSync(destFile)) {
    throw new Error('Destination file was not created');
  }
  
  const stats = fs.statSync(destFile);
  console.log('File copied successfully!');
  console.log('File size:', stats.size, 'bytes');
  
  // Create security wrappers
  createSecurityWrappers();
} catch (error) {
  console.error('Error copying file:', error);
  process.exit(1);
} 