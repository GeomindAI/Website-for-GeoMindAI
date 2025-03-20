# 1Stop Dashboard Integration with GeoMindAI

This document provides instructions for integrating the 1Stop Dashboard with your GeoMindAI website, including the Supabase database setup and deployment steps.

## Overview

The 1Stop Dashboard provides analytics for your laundry service business. The integration with GeoMindAI:

1. Uses Supabase to store and retrieve appointment data
2. Keeps the dashboard hidden from normal site navigation (accessible only at /1stop)
3. Integrates the dashboard with your existing GeoMindAI website

## Setup Instructions

### 1. Supabase Database Setup

1. Go to [https://app.supabase.com/](https://app.supabase.com/) and sign in
2. Select your project
3. Go to "Table Editor" in the left sidebar
4. Create a new table named "appointments" with the following columns:
   - customerPhone (text)
   - customerType (text)
   - appointmentId (text, set as primary key)
   - customerId (text)
   - cityId (text)
   - customerName (text)
   - pickup (json)
   - drop (json) (if present in your data)
   - Add any other top-level fields from your appointments.json

### 2. Upload Data to Supabase

Run the data upload script:

```bash
node upload-to-supabase.js
```

This script will:
- Read the appointments.json file from 1StopDashboard/public/
- Upload the data to Supabase in batches
- Log progress and any errors

### 3. Deployment Steps

1. Make sure the 1StopDashboard is built:
   ```bash
   cd 1StopDashboard
   export NODE_OPTIONS=--openssl-legacy-provider
   npm run build
   ```

2. Ensure the `/1stop` directory exists with the gateway page

3. When deploying to GitHub Pages or your hosting service, include:
   - All website files
   - The `/1stop` directory
   - The `/1StopDashboard/build` directory

## Usage

After deployment:

1. The main GeoMindAI website functions normally
2. Users can access the 1Stop Dashboard only by navigating to: `https://geomindai.com/1stop`
3. The dashboard is not linked from any other part of the website

## Security Considerations

Consider implementing additional security:

1. Add authentication to the 1stop gateway page
2. Use environment variables instead of hardcoded Supabase credentials
3. Set up Row Level Security (RLS) in Supabase

## Troubleshooting

### Dashboard Not Loading Data

1. Check browser console for errors
2. Verify Supabase connection is working
3. Check that the appointments table is properly created
4. Verify that data was successfully uploaded

### Build Issues

If you encounter OpenSSL errors when building:

```bash
export NODE_OPTIONS=--openssl-legacy-provider
npm run build
```

## Future Improvements

1. Implement user authentication for the dashboard
2. Create an API for real-time data updates
3. Add data caching for better performance
4. Implement incremental data uploads 