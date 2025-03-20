const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Read the appointments.json file
const appointmentsJson = require('./1StopDashboard/public/appointments.json');

async function uploadAppointments() {
  console.log(`Starting to upload ${appointmentsJson.length} appointments to Supabase...`);
  
  // Upload in batches to avoid timeouts and rate limits
  const batchSize = 100;
  const totalBatches = Math.ceil(appointmentsJson.length / batchSize);
  
  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, appointmentsJson.length);
    const batch = appointmentsJson.slice(start, end);
    
    console.log(`Uploading batch ${i+1}/${totalBatches} (records ${start+1}-${end})...`);
    
    const { data, error } = await supabase
      .from('appointments')
      .insert(batch);
    
    if (error) {
      console.error(`Error uploading batch ${i+1}:`, error);
    } else {
      console.log(`Successfully uploaded batch ${i+1}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('Upload completed!');
}

uploadAppointments().catch(console.error); 