const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAppointmentsTable() {
  // Note: We can't directly create tables using the JavaScript client
  // You'll need to go to the Supabase dashboard to create the table
  
  console.log(`
  ==========================================================
  IMPORTANT: You need to create the 'appointments' table in Supabase manually.
  
  1. Go to https://app.supabase.com/ and sign in
  2. Select your project
  3. Go to "Table Editor" in the left sidebar
  4. Click "New Table"
  5. Enter table name: "appointments"
  6. Add columns:
     - customerPhone (text)
     - customerType (text)
     - appointmentId (text, set as primary key)
     - customerId (text)
     - cityId (text)
     - customerName (text)
     - pickup (json)
     - drop (json) (if present in your data)
     - any other top-level fields from your appointments.json
  
  After creating the table, run the upload-to-supabase.js script.
  ==========================================================
  `);
}

createAppointmentsTable(); 