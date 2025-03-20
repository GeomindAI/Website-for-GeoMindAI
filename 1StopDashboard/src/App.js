import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import Dashboard from './components/Dashboard';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://cnbpmepdmtpgrbllufcb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuYnBtZXBkbXRwZ3JibGx1ZmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5MjM4MjEsImV4cCI6MjA1MzQ5OTgyMX0.UqDleR4ucntrg9x6FNgJigKZjKiATFYiMiLiZZj3B2w';
const supabase = createClient(supabaseUrl, supabaseKey);

const App = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Fetching data from Supabase...');
        
        // First try Supabase
        const { data: supabaseData, error: supabaseError } = await supabase
          .from('appointments')
          .select('*');
        
        if (supabaseError) {
          console.error('Supabase error:', supabaseError);
          throw new Error(`Failed to load data from Supabase: ${supabaseError.message}`);
        }
        
        if (supabaseData && supabaseData.length > 0) {
          console.log(`Successfully loaded ${supabaseData.length} records from Supabase`);
          setData(supabaseData);
        } else {
          // Fallback to local JSON file
          console.log('No data found in Supabase, falling back to local JSON file');
          const response = await fetch('/appointments.json');
          if (!response.ok) {
            throw new Error(`Failed to load local data: ${response.status} ${response.statusText}`);
          }
          const jsonData = await response.json();
          setData(jsonData);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle retry when loading fails
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Re-trigger the effect
    const loadData = async () => {
      try {
        // First try Supabase
        const { data: supabaseData, error: supabaseError } = await supabase
          .from('appointments')
          .select('*');
        
        if (supabaseError) {
          console.error('Supabase error:', supabaseError);
          throw new Error(`Failed to load data from Supabase: ${supabaseError.message}`);
        }
        
        if (supabaseData && supabaseData.length > 0) {
          console.log(`Successfully loaded ${supabaseData.length} records from Supabase`);
          setData(supabaseData);
        } else {
          // Fallback to local JSON file
          console.log('No data found in Supabase, falling back to local JSON file');
          const response = await fetch('/appointments.json');
          if (!response.ok) {
            throw new Error(`Failed to load local data: ${response.status} ${response.statusText}`);
          }
          const jsonData = await response.json();
          setData(jsonData);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          backgroundColor: '#F3F4F6'
        }}
      >
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h6" color="text.secondary">
          Loading laundry service data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          backgroundColor: '#F3F4F6',
          p: 3
        }}
      >
        <Typography variant="h5" color="error" gutterBottom>
          Error Loading Data
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, textAlign: 'center' }}>
          {error}
        </Typography>
        <Button variant="contained" color="primary" onClick={handleRetry}>
          Retry
        </Button>
      </Box>
    );
  }

  return <Dashboard jsonData={data} />;
};

export default App; 