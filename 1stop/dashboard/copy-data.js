const fs = require('fs');
const path = require('path');

// Paths
const sourceFile = path.join(__dirname, '..', 'appointments.json');
const destFile = path.join(__dirname, 'appointments.json');

// Check if the destination file already exists
if (fs.existsSync(destFile)) {
  console.log('appointments.json already exists in public directory, skipping copy...');
  const stats = fs.statSync(destFile);
  console.log('File size:', stats.size, 'bytes');
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
} catch (error) {
  console.error('Error copying file:', error);
  process.exit(1);
} 