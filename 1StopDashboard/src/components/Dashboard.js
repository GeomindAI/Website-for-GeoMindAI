import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Container, Grid, Paper, Typography, 
  AppBar, Toolbar, MenuItem,
  FormControl, InputLabel, Select,
  CircularProgress, TextField,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer
} from '@mui/material';
import {
  BarChart, LineChart, PieChart, ComposedChart,
  Bar, Line, Pie, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, Cell, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { subMonths, format, addMonths } from 'date-fns';
import GoogleMapReact from 'google-map-react';
// Import Lucide React icons for modern UI
import Icon from '@mui/material/Icon';
// Import animation components
import { Fade, Grow } from '@mui/material';
import { formatDistance, isWithinInterval, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import QuarterlyGrowthByCity from './QuarterlyGrowthByCity';

// Import data utilities
import {
  processAppointmentsData,
  getCityStatistics,
  getLaundromatStatistics,
  getCustomerTypeDistribution,
  getMonthlyOrdersTrend,
  getAvgOrderValueTrend,
  getCustomerRetentionMetrics,
  getDriverPerformanceMetrics,
  getSeasonalTrends,
  getWeightDistribution,
  LONDON_CITY_ID,
  getLaundromatLocations,
  getOrderLocations,
  CITY_MAPPING,
  CITY_CENTERS,
  CITY_LAUNDROMATS,
  normalizeCityId,
  LAUNDROMAT_COLORS
} from '../utils/dataProcessor';
import { addProjectionsToComponent } from '../utils/ProjectionImplementation';

// Import custom components
import MetricCard from './MetricCard';
import Marker from './Marker';

// Chart colors - updated with modern palette
const COLORS = ['#1E88E5', '#26A69A', '#FFA726', '#EF5350', '#AB47BC', '#66BB6A', '#EC407A'];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [selectedCity, setSelectedCity] = useState(LONDON_CITY_ID);
  const [startDate, setStartDate] = useState(subMonths(new Date(), 12));
  const [endDate, setEndDate] = useState(new Date());
  const [mapMarkers, setMapMarkers] = useState([]);
  const [laundromatLocations, setLaundromatLocations] = useState([]);

  // Filter options
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
  const [laundromatFilter, setLaundromatFilter] = useState('all');

  // Update the map center when city changes
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(11);
  const [mapInstance, setMapInstance] = useState(null);
  const [mapsApi, setMapsApi] = useState(null);

  // Map laundromat IDs to names based on address comparison
  const laundromatIdToNameMap = useMemo(() => {
    const idMap = {};
    
    // First create a mapping of locations from our predefined data
    const knownLocations = {};
    Object.keys(CITY_LAUNDROMATS).forEach(cityId => {
      CITY_LAUNDROMATS[cityId].forEach(laundromat => {
        knownLocations[laundromat.address] = laundromat.name;
      });
    });
    
    // Analyze appointment data to match cleaners to locations
    const laundromatAddresses = {};
    appointments.forEach(appointment => {
      if (appointment.cleaning && appointment.cleaning.cleaner && appointment.pickup && appointment.pickup.to) {
        const cleanerId = appointment.cleaning.cleaner;
        const address = appointment.pickup.to;
        
        if (!laundromatAddresses[cleanerId]) {
          laundromatAddresses[cleanerId] = {};
        }
        
        // Count frequency of addresses for this cleaner
        laundromatAddresses[cleanerId][address] = (laundromatAddresses[cleanerId][address] || 0) + 1;
      }
    });
    
    // For each laundromat ID, find most common address and match to our known locations
    Object.keys(laundromatAddresses).forEach(cleanerId => {
      const addresses = laundromatAddresses[cleanerId];
      let mostCommonAddress = null;
      let maxCount = 0;
      
      // Find most common address
      Object.keys(addresses).forEach(address => {
        if (addresses[address] > maxCount) {
          mostCommonAddress = address;
          maxCount = addresses[address];
        }
      });
      
      // Direct mapping if exact match
      if (mostCommonAddress && knownLocations[mostCommonAddress]) {
        idMap[cleanerId] = knownLocations[mostCommonAddress];
        return;
      }
      
      // Fuzzy matching for addresses
      let bestMatch = null;
      let bestScore = 0;
      
      // For each known location, calculate similarity with most common address
      Object.keys(knownLocations).forEach(knownAddress => {
        // Simple similarity score based on common words in address
        const knownWords = knownAddress.toLowerCase().split(/[,\s]+/);
        const actualWords = mostCommonAddress ? mostCommonAddress.toLowerCase().split(/[,\s]+/) : [];
        
        let matches = 0;
        actualWords.forEach(word => {
          if (word.length > 2 && knownWords.includes(word)) {
            matches++;
          }
        });
        
        const score = matches / Math.max(knownWords.length, actualWords.length);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = knownLocations[knownAddress];
        }
      });
      
      // If good match found, use it
      if (bestMatch && bestScore > 0.3) {
        idMap[cleanerId] = bestMatch;
      } else {
        // Fallback based on common frequencies between cities and cleaners
        const cityFrequency = {};
        appointments.forEach(appointment => {
          if (appointment.cleaning && appointment.cleaning.cleaner === cleanerId && appointment.cityId) {
            cityFrequency[appointment.cityId] = (cityFrequency[appointment.cityId] || 0) + 1;
          }
        });
        
        // Find most common city for this cleaner
        let mostCommonCity = null;
        let maxCityCount = 0;
        Object.keys(cityFrequency).forEach(cityId => {
          if (cityFrequency[cityId] > maxCityCount) {
            maxCityCount = cityFrequency[cityId];
            mostCommonCity = cityId;
          }
        });
        
        // Assign a name based on city and ID
        if (mostCommonCity && CITY_LAUNDROMATS[mostCommonCity] && CITY_LAUNDROMATS[mostCommonCity].length > 0) {
          const cityName = CITY_MAPPING[mostCommonCity];
          const cleanerIndex = Object.keys(laundromatAddresses).indexOf(cleanerId) % CITY_LAUNDROMATS[mostCommonCity].length;
          idMap[cleanerId] = CITY_LAUNDROMATS[mostCommonCity][cleanerIndex].name;
        } else {
          // Last resort - truncate ID for display
          idMap[cleanerId] = `Laundromat ${cleanerId.substring(0, 8)}`;
        }
      }
    });
    
    // Manual override for most common IDs based on the list shown
    idMap["q8dvkNhc9ZbCswGUbllUdoqOr6J3"] = "Tommy Suds";
    idMap["Z1qpZ7LByNWjT4QmjxZdCgEQogH3"] = "London Sudz";
    idMap["yXwnUIE3EPX1sSfpot3rw5MbbVs1"] = "Royal City Cleaners";
    idMap["hchYpbQECAQk2e2eyruUTxU8YP42"] = "Browns";
    
    return idMap;
  }, [appointments]);

  // Process JSON data
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Attempting to fetch data...');
        const response = await fetch('/appointments.json');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Data loaded successfully, total records:', data.length);
        
        // Log a sample record without trying to process dates yet
        if (data.length > 0) {
          const sample = data[0];
          console.log('Sample record:', sample);
          console.log('Date fields found:', {
            serviceDate: sample.pickup?.serviceDate,
            service_date: sample.service_date,
            createdAt: sample.createdAt,
            updatedAt: sample.updatedAt
          });
        }
        
        // Safely determine date range
        try {
          const validDates = data
            .map(d => {
              try {
                // Check all possible date fields
                const dateStr = 
                  d.pickup?.serviceDate || 
                  d.service_date ||
                  d.createdAt ||
                  d.updatedAt;
                
                if (!dateStr) return null;
                const date = new Date(dateStr);
                return isNaN(date.getTime()) ? null : date;
              } catch (e) {
                return null;
              }
            })
            .filter(date => date !== null);
          
          if (validDates.length > 0) {
            const earliest = new Date(Math.min(...validDates.map(d => d.getTime())));
            const latest = new Date(Math.max(...validDates.map(d => d.getTime())));
            console.log('Date range:', {
              earliest: earliest.toISOString(),
              latest: latest.toISOString()
            });
            
            // Set date range based on the actual data
            if (earliest < startDate) {
              setStartDate(earliest);
            }
            if (latest < endDate) {
              setEndDate(latest);
            }
          } else {
            console.log('No valid dates found in the data');
          }
        } catch (dateError) {
          console.error('Error calculating date range:', dateError);
        }
        
        setAppointments(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        console.log('Trying fallback data...');
        // Create some sample fallback data for testing
        const fallbackData = Array.from({length: 50}, (_, i) => ({
          id: `sample-${i}`,
          city_id: 'LYGRRATQ7EGG2',
          customer_type: i % 2 === 0 ? 'Residential' : 'Commercial',
          laundromat_id: 'LYGRRATQ7EGG' + Math.floor(i / 10),
          laundromat_name: `Laundromat ${Math.floor(i / 10)}`,
          revenue: 20 + Math.random() * 80,
          address: `${100 + i} Richmond St, London, Ontario`,
          pickup: {
            serviceDate: new Date(2023, 9, i % 30 + 1).toISOString()
          }
        }));
        console.log('Using fallback data:', fallbackData.length, 'records');
        setAppointments(fallbackData);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update map center when city changes
  useEffect(() => {
    console.log("City changed to:", selectedCity, "Setting map center:", CITY_CENTERS[selectedCity]);
    if (selectedCity === 'all') {
      // Default to London for 'all cities' view but at a lower zoom
      setMapCenter(CITY_CENTERS.LYGRRATQ7EGG2);
      setMapZoom(8);
    } else {
      setMapCenter(CITY_CENTERS[selectedCity]);
      setMapZoom(11);
    }
  }, [selectedCity]);

  // Reset the map center if user changes city
  useEffect(() => {
    if (mapInstance && mapCenter) {
      console.log("Panning map to:", mapCenter, "with zoom:", mapZoom);
      mapInstance.panTo(mapCenter);
      mapInstance.setZoom(mapZoom);
    }
  }, [mapCenter, mapZoom, mapInstance]);

  // Enhanced map data loading with better debugging
  useEffect(() => {
    const loadMapData = async () => {
      if (!appointments.length) return;

      // Enhanced debug logging for orders
      console.log('MAP DEBUG - Total orders:', appointments.length);
      const cityOrderCounts = appointments.reduce((acc, app) => {
        const cityId = normalizeCityId(app);
        acc[cityId] = (acc[cityId] || 0) + 1;
        return acc;
      }, {});
      console.log('MAP DEBUG - Orders by city:', cityOrderCounts);
      console.log('MAP DEBUG - Currently selected city:', selectedCity);
      
      // Debug: Check a sample appointment to verify cityId field
      if (appointments.length > 0) {
        const sample = appointments[0];
        console.log('MAP DEBUG - Sample appointment:', {
          id: sample.id || sample.appointmentId,
          cityId: sample.cityId,
          city_id: sample.city_id,
          city: sample.city,
          normalizedCityId: normalizeCityId(sample)
        });
      }

      // Filter by cityId with extra logging
      const filteredAppointments = selectedCity === 'all'
        ? appointments
        : appointments.filter(app => {
            const normalizedCityId = normalizeCityId(app);
            const matches = normalizedCityId === selectedCity;
            // Log a sample of matches/non-matches
            if (appointments.indexOf(app) < 5) {
              console.log(`MAP DEBUG - App ${app.id || app.appointmentId}: cityId=${app.cityId}, normalizedCityId=${normalizedCityId}, matches=${matches}`);
            }
            return matches;
          });
      
      console.log(`MAP DEBUG - After filtering, ${filteredAppointments.length} appointments match the selected city`);

      // Get laundromat locations - filter by city if not 'all'
      const laundromats = await getLaundromatLocations(filteredAppointments);
      console.log('MAP DEBUG - Laundromat locations:', laundromats);
      setLaundromatLocations(laundromats);

      // Get order locations with laundromat association - filter by city if not 'all'
      const orders = await getOrderLocations(filteredAppointments);
      console.log('MAP DEBUG - Order locations:', orders);
      setMapMarkers(orders);
    };

    loadMapData();
  }, [appointments, selectedCity]);

  // Generate a list of months for the selector
  const monthOptions = useMemo(() => {
    const options = [];
    const currentDate = new Date();
    // Exclude current month (March 2024 as per user request)
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    
    // Go back 24 months
    for (let i = 0; i < 24; i++) {
      const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
      options.push({
        value: { month: date.getMonth(), year: date.getFullYear() },
        label: date.toLocaleString('default', { month: 'long', year: 'numeric' })
      });
    }
    return options;
  }, []);

  // Filtered appointments based on selections
  const filteredAppointments = useMemo(() => {
    console.log("Filtering appointments with:", {
      totalAppointments: appointments.length,
      selectedCity,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      customerTypeFilter,
      sampleAppointment: appointments[0]
    });
    
    const filtered = appointments.filter(appointment => {
      // Debug a sample appointment to see its structure
      if (appointment.id === appointments[0]?.id) {
        console.log("Sample appointment structure:", appointment);
      }
      
      // Filter by city (using cityId instead of city_id)
      if (selectedCity !== 'all' && appointment.cityId !== selectedCity) {
        return false;
      }
      
      // Filter by customer type
      if (customerTypeFilter !== 'all' && appointment.customerType !== customerTypeFilter) {
        return false;
      }
      
      // Filter by laundromat
      if (laundromatFilter !== 'all' && 
          (!appointment.cleaning || appointment.cleaning.cleaner !== laundromatFilter)) {
        return false;
      }
      
      // Try all possible date fields
      let inDateRange = false;
      let dateChecked = false;

      // Check pickup.serviceDate
      if (appointment.pickup && appointment.pickup.serviceDate) {
        dateChecked = true;
        try {
          const pickupDate = new Date(appointment.pickup.serviceDate);
          
          // Log some sample dates to debug
          if (appointment.id === appointments[0]?.id || appointment.appointmentId === appointments[0]?.appointmentId) {
            console.log("Parsed pickup date:", pickupDate);
            console.log("Start date:", startDate);
            console.log("End date:", endDate);
            console.log("Is in range:", !(pickupDate < startDate || pickupDate > endDate));
          }
          
          if (!(pickupDate < startDate || pickupDate > endDate)) {
            inDateRange = true;
          }
        } catch (error) {
          console.error("Error parsing date:", appointment.pickup.serviceDate, error);
        }
      }
      
      // Check service_date if we haven't found a valid date yet
      if (!inDateRange && appointment.service_date) {
        dateChecked = true;
        try {
          const serviceDate = new Date(appointment.service_date);
          if (!(serviceDate < startDate || serviceDate > endDate)) {
            inDateRange = true;
          }
        } catch (error) {
          console.error("Error parsing service_date:", appointment.service_date, error);
        }
      }
      
      // Check createdAt as fallback
      if (!inDateRange && appointment.createdAt) {
        dateChecked = true;
        try {
          const createdDate = new Date(appointment.createdAt);
          if (!(createdDate < startDate || createdDate > endDate)) {
            inDateRange = true;
          }
        } catch (error) {
          console.error("Error parsing createdAt:", appointment.createdAt, error);
        }
      }
      
      // If we checked dates but none were in range, filter out this appointment
      if (dateChecked && !inDateRange) {
        return false;
      }
      
      return true;
    });
    
    console.log("Filtered appointments:", filtered.length);
    return filtered;
  }, [appointments, selectedCity, customerTypeFilter, laundromatFilter, startDate, endDate]);

  // Compute metrics based on filtered data
  const cityStats = useMemo(() => getCityStatistics(filteredAppointments), [filteredAppointments]);
  const laundromatStats = useMemo(() => {
    // Get basic laundromat statistics
    const stats = getLaundromatStatistics(filteredAppointments);
    
    // Calculate a simpler retention metric - returning customers as percentage of total customers
    return stats.map(laundromat => {
      // Simple retention rate - percentage of customers that return
      const simpleRetentionRate = laundromat.customers > 0 
        ? (laundromat.returningCustomers / laundromat.customers)
        : 0;
        
      return {
        ...laundromat,
        retentionRate: simpleRetentionRate
      };
    });
  }, [filteredAppointments]);
  
  const customerTypeDistribution = useMemo(() => getCustomerTypeDistribution(filteredAppointments), [filteredAppointments]);
  const monthlyOrdersTrend = useMemo(() => {
    // If 'all' is selected, show data for all cities, otherwise filter by selected city
    const filteredAppointments = selectedCity === 'all' 
      ? appointments 
      : appointments.filter(a => a.cityId === selectedCity);
      
    const trends = getMonthlyOrdersTrend(filteredAppointments, 12);
    
    // Filter out March data (or current month)
    const currentDate = new Date();
    return trends.filter(month => {
      const monthDate = new Date(month.date);
      return !(monthDate.getMonth() === currentDate.getMonth() && 
               monthDate.getFullYear() === currentDate.getFullYear());
    });
  }, [appointments, selectedCity]);
  
  const avgOrderValueTrend = useMemo(() => {
    // If 'all' is selected, show data for all cities, otherwise filter by selected city
    const filteredAppointments = selectedCity === 'all' 
      ? appointments 
      : appointments.filter(a => a.cityId === selectedCity);
      
    const trends = getAvgOrderValueTrend(filteredAppointments, 12);
    
    // Filter out March data (or current month)
    const currentDate = new Date();
    return trends.filter(month => {
      const monthDate = new Date(month.date);
      return !(monthDate.getMonth() === currentDate.getMonth() && 
               monthDate.getFullYear() === currentDate.getFullYear());
    });
  }, [appointments, selectedCity]);
  
  const customerRetention = useMemo(() => getCustomerRetentionMetrics(filteredAppointments), [filteredAppointments]);
  const driverPerformance = useMemo(() => getDriverPerformanceMetrics(filteredAppointments), [filteredAppointments]);
  const seasonalTrends = useMemo(() => getSeasonalTrends(filteredAppointments), [filteredAppointments]);
  const weightDistribution = useMemo(() => getWeightDistribution(filteredAppointments), [filteredAppointments]);

  // London-specific orders data for Google Maps
  const londonOrders = useMemo(() => {
    return appointments.filter(app => app.cityId === LONDON_CITY_ID).map(app => {
      // Extract address information for Google Maps
      let address = '';
      if (app.pickup && app.pickup.to) {
        address = app.pickup.to;
      }
      return {
        id: app.appointmentId,
        address,
        customerType: app.customerType || 'Unknown',
        revenue: parseFloat(app.invoiceTotal || 0)
      };
    });
  }, [appointments]);

  // Get aggregate metrics
  const aggregateMetrics = useMemo(() => {
    return {
      totalOrders: filteredAppointments.length,
      totalRevenue: filteredAppointments.reduce((sum, appointment) => {
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
        
        return sum + (isNaN(revenueToAdd) ? 0 : revenueToAdd);
      }, 0),
      totalCustomers: new Set(filteredAppointments.map(a => a.customerId).filter(Boolean)).size,
      totalLaundromats: new Set(filteredAppointments
        .filter(a => a.cleaning && a.cleaning.cleaner)
        .map(a => a.cleaning.cleaner)).size,
      avgOrderValue: filteredAppointments.length > 0 ? 
        (filteredAppointments.reduce((sum, appointment) => {
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
          
          return sum + (isNaN(revenueToAdd) ? 0 : revenueToAdd);
        }, 0) / filteredAppointments.length) : 0,
      avgWeight: filteredAppointments
        .filter(a => a.cleaning && a.cleaning.orderDetails && a.cleaning.orderDetails.washFoldWeight)
        .reduce((sum, a, idx, arr) => {
          const weight = parseFloat(a.cleaning.orderDetails.washFoldWeight);
          return idx === arr.length - 1 ? 
            (sum + weight) / arr.length : 
            sum + weight;
        }, 0)
    };
  }, [filteredAppointments]);

  // Calculate monthly retention rate trend
  const retentionRateTrend = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];
    
    // Group appointments by month
    const monthlyAppointments = {};
    appointments.forEach(appointment => {
      // Only process appointments from the selected city or all cities if 'all' is selected
      if (selectedCity !== 'all' && appointment.cityId !== selectedCity) return;
      
      let date = null;
      
      // Try to get date from various possible fields
      if (appointment.pickup && appointment.pickup.serviceDate) {
        date = new Date(appointment.pickup.serviceDate);
      } else if (appointment.service_date) {
        date = new Date(appointment.service_date);
      } else if (appointment.createdAt) {
        date = new Date(appointment.createdAt);
      }
      
      if (date && !isNaN(date.getTime())) {
        const monthKey = format(date, 'yyyy-MM');
        const monthName = format(date, 'MMM yyyy');
        
        if (!monthlyAppointments[monthKey]) {
          monthlyAppointments[monthKey] = {
            key: monthKey,
            name: monthName,
            date: date,
            appointments: [],
            customers: new Set(),
            returningCustomers: new Set()
          };
        }
        
        monthlyAppointments[monthKey].appointments.push(appointment);
        
        // Add customer to this month's unique customers
        if (appointment.customerId) {
          monthlyAppointments[monthKey].customers.add(appointment.customerId);
          
          // Check if this customer has appeared in previous months
          const isReturning = Object.keys(monthlyAppointments)
            .filter(m => m !== monthKey && new Date(monthlyAppointments[m].date) < date)
            .some(m => monthlyAppointments[m].customers.has(appointment.customerId));
          
          if (isReturning) {
            monthlyAppointments[monthKey].returningCustomers.add(appointment.customerId);
          }
        }
      }
    });
    
    // Calculate retention rate for each month
    return Object.values(monthlyAppointments)
      .map(month => ({
        name: month.name,
        date: month.date,
        month: month.key,
        customers: month.customers.size,
        returningCustomers: month.returningCustomers.size,
        retentionRate: month.customers.size > 0 ? 
          month.returningCustomers.size / month.customers.size : 0
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      // Filter out months with very few customers to avoid misleading rates
      .filter(month => month.customers >= 3);
  }, [appointments, selectedCity]);

  // Calculate weekly order frequency
  const orderFrequencyTrend = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];
    
    // Group appointments by week
    const weeklyAppointments = {};
    appointments.forEach(appointment => {
      // Only process appointments from the selected city or all cities if 'all' is selected
      if (selectedCity !== 'all' && appointment.cityId !== selectedCity) return;
      
      let date = null;
      
      // Try to get date from various possible fields
      if (appointment.pickup && appointment.pickup.serviceDate) {
        date = new Date(appointment.pickup.serviceDate);
      } else if (appointment.service_date) {
        date = new Date(appointment.service_date);
      } else if (appointment.createdAt) {
        date = new Date(appointment.createdAt);
      }
      
      if (date && !isNaN(date.getTime())) {
        // Get week number - FIX: Use 'yyyy-ww' instead of the problematic format
        const weekKey = format(date, 'yyyy-ww');
        const weekName = format(date, 'MMM d, yyyy');
        
        if (!weeklyAppointments[weekKey]) {
          weeklyAppointments[weekKey] = {
            key: weekKey,
            name: `Week of ${weekName}`,
            shortName: format(date, 'MMM d'),
            date: date,
            customerCount: new Set(),
            orderCount: 0
          };
        }
        
        weeklyAppointments[weekKey].orderCount++;
        
        // Count unique customers
        if (appointment.customerId) {
          weeklyAppointments[weekKey].customerCount.add(appointment.customerId);
        }
      }
    });
    
    // Calculate orders per customer for each week
    return Object.values(weeklyAppointments)
      .map(week => ({
        name: week.shortName,
        fullName: week.name,
        date: week.date,
        week: week.key,
        customers: week.customerCount.size,
        orders: week.orderCount,
        ordersPerCustomer: week.customerCount.size > 0 ? 
          week.orderCount / week.customerCount.size : 0
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      // Filter out weeks with very few customers to avoid misleading rates
      .filter(week => week.customers >= 2);
  }, [appointments, selectedCity]);

  // Calculate order processing time trend
  const processingTimeTrend = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];
    
    // Group appointments by month
    const monthlyProcessingTimes = {};
    appointments.forEach(appointment => {
      // Only process appointments from the selected city or all cities if 'all' is selected
      if (selectedCity !== 'all' && appointment.cityId !== selectedCity) return;
      
      // Calculate processing time if we have both pickup and delivery dates
      let pickupDate = null, deliveryDate = null;
      
      if (appointment.pickup && appointment.pickup.serviceDate) {
        pickupDate = new Date(appointment.pickup.serviceDate);
      }
      
      if (appointment.delivery && appointment.delivery.serviceDate) {
        deliveryDate = new Date(appointment.delivery.serviceDate);
      }
      
      // If we have valid dates and delivery is after pickup
      if (pickupDate && deliveryDate && 
          !isNaN(pickupDate.getTime()) && 
          !isNaN(deliveryDate.getTime()) && 
          deliveryDate > pickupDate) {
        
        const monthKey = format(pickupDate, 'yyyy-MM');
        const monthName = format(pickupDate, 'MMM yyyy');
        
        if (!monthlyProcessingTimes[monthKey]) {
          monthlyProcessingTimes[monthKey] = {
            key: monthKey,
            name: monthName,
            date: pickupDate,
            totalHours: 0,
            count: 0
          };
        }
        
        // Calculate hours between pickup and delivery
        const hours = (deliveryDate - pickupDate) / (1000 * 60 * 60);
        monthlyProcessingTimes[monthKey].totalHours += hours;
        monthlyProcessingTimes[monthKey].count++;
      }
    });
    
    // Calculate average processing time for each month
    return Object.values(monthlyProcessingTimes)
      .map(month => ({
        name: month.name,
        date: month.date,
        month: month.key,
        avgProcessingHours: month.count > 0 ? 
          month.totalHours / month.count : 0
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      // Filter out months with very few data points
      .filter(month => month.avgProcessingHours > 0);
  }, [appointments, selectedCity]);

  // Calculate commercial vs residential split trend
  const customerTypeTrend = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];
    
    // Group appointments by month
    const monthlyTypeSplit = {};
    appointments.forEach(appointment => {
      // Only process appointments from the selected city or all cities if 'all' is selected
      if (selectedCity !== 'all' && appointment.cityId !== selectedCity) return;
      
      let date = null;
      
      // Try to get date from various possible fields
      if (appointment.pickup && appointment.pickup.serviceDate) {
        date = new Date(appointment.pickup.serviceDate);
      } else if (appointment.service_date) {
        date = new Date(appointment.service_date);
      } else if (appointment.createdAt) {
        date = new Date(appointment.createdAt);
      }
      
      if (date && !isNaN(date.getTime())) {
        const monthKey = format(date, 'yyyy-MM');
        const monthName = format(date, 'MMM yyyy');
        
        if (!monthlyTypeSplit[monthKey]) {
          monthlyTypeSplit[monthKey] = {
            key: monthKey,
            name: monthName,
            date: date,
            residential: 0,
            commercial: 0,
            unknown: 0,
            total: 0
          };
        }
        
        monthlyTypeSplit[monthKey].total++;
        
        if (appointment.customerType === 'Residential') {
          monthlyTypeSplit[monthKey].residential++;
        } else if (appointment.customerType === 'Commercial') {
          monthlyTypeSplit[monthKey].commercial++;
        } else {
          monthlyTypeSplit[monthKey].unknown++;
        }
      }
    });
    
    // Calculate percentages
    return Object.values(monthlyTypeSplit)
      .map(month => ({
        name: month.name,
        date: month.date,
        month: month.key,
        residential: month.residential,
        residentialPercent: month.total > 0 ? (month.residential / month.total) * 100 : 0,
        commercial: month.commercial,
        commercialPercent: month.total > 0 ? (month.commercial / month.total) * 100 : 0,
        unknown: month.unknown,
        total: month.total
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      // Filter out months with very few orders
      .filter(month => month.total >= 5);
  }, [appointments, selectedCity]);

  // State to track which chart to display
  const [selectedChartType, setSelectedChartType] = useState('retention');

  // All unique customer types for filter
  const customerTypes = useMemo(() => {
    const types = new Set();
    appointments.forEach(appointment => {
      if (appointment.customerType) {
        types.add(appointment.customerType);
      }
    });
    return Array.from(types);
  }, [appointments]);

  // All unique laundromats for filter
  const laundromats = useMemo(() => {
    const cleaners = new Map();
    appointments.forEach(appointment => {
      if (appointment.cleaning && appointment.cleaning.cleaner) {
        const cleanerId = appointment.cleaning.cleaner;
        const name = laundromatIdToNameMap[cleanerId] || `Laundromat ${cleanerId.substring(0, 8)}`;
        cleaners.set(cleanerId, {
          id: cleanerId,
          name: name
        });
      }
    });
    return Array.from(cleaners.values());
  }, [appointments, laundromatIdToNameMap]);

  // For date range selection
  const handleStartDateChange = (event) => {
    const [year, month] = event.target.value.split('-');
    setStartDate(new Date(year, month - 1, 1));
  };

  const handleEndDateChange = (event) => {
    const [year, month] = event.target.value.split('-');
    // Last day of the month
    setEndDate(new Date(year, month, 0));
  };

  // Get map center coordinates based on selected city
  const getMapCenter = useMemo(() => {
    const centers = {
      'LYGRRATQ7EGG2': { lat: 42.9849, lng: -81.2453 }, // London
      'L4NE8GPX89J3A': { lat: 45.4215, lng: -75.6972 }, // Ottawa
      'LDK6Z980JTKXY': { lat: 43.4643, lng: -80.5204 }, // Kitchener-Waterloo
      'LXMC6DWVJ5N7W': { lat: 43.2557, lng: -79.8711 }, // Hamilton
      'LG0VGFKQ25XED': { lat: 51.0447, lng: -114.0719 }  // Calgary
    };
    
    // Return center for selected city or fallback to a default
    return selectedCity !== 'all' ? centers[selectedCity] : centers['LYGRRATQ7EGG2'];
  }, [selectedCity]);

  // Get total order count currently displayed on map
  const displayedMapOrdersCount = useMemo(() => {
    return mapMarkers.length;
  }, [mapMarkers]);

  // Get active laundromats count currently displayed on map
  const displayedLaundromatsCount = useMemo(() => {
    return laundromatLocations.length;
  }, [laundromatLocations]);

  const [sortColumn, setSortColumn] = useState('orders');
  const [sortDirection, setSortDirection] = useState('desc');

  // Handle sorting for laundromat table
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle sort direction if same column is clicked
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to descending
      setSortColumn(column);
      setSortDirection('desc');
    }
  };
  
  // Sort icon component
  const SortIcon = ({ column }) => {
    if (sortColumn !== column) return <span style={{ opacity: 0.3 }}>↕</span>;
    return <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  // Render laundromat table with sorting
  const renderLaundromatTable = () => {
    // Use all laundromats but highlight the ones from the selected city
    let allLaundromats = laundromatStats;
    
    // Filter out low-value entries (no revenue or very few orders)
    allLaundromats = allLaundromats.filter(l => 
      l.revenue > 0 || l.orders >= 1
    );
    
    // Sort the data
    const sortedLaundromats = [...allLaundromats].sort((a, b) => {
      let valueA, valueB;
      
      // Handle special sorting cases
      switch (sortColumn) {
        case 'name':
          valueA = laundromatIdToNameMap[a.id] || a.id;
          valueB = laundromatIdToNameMap[b.id] || b.id;
          break;
        case 'city':
          valueA = a.city || '';
          valueB = b.city || '';
          break;
        case 'avgOrderValue':
          valueA = a.orders > 0 ? a.revenue / a.orders : 0;
          valueB = b.orders > 0 ? b.revenue / b.orders : 0;
          break;
        case 'retentionScore':
          valueA = a.returningCustomers && a.customers ? a.returningCustomers / a.customers : 0;
          valueB = b.returningCustomers && b.customers ? b.returningCustomers / b.customers : 0;
          break;
        default:
          valueA = a[sortColumn];
          valueB = b[sortColumn];
      }
      
      // Compare values based on sort direction
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      } else {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
    });
    
    // Show top 15 laundromats by orders to keep the table manageable
    const topLaundromats = sortedLaundromats
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 15);
    
    return topLaundromats.map((laundromat) => {
      // Check if this laundromat belongs to the selected city
      const matchesSelectedCity = selectedCity !== 'all' && 
        (laundromat.city === CITY_MAPPING[selectedCity] || laundromat.cityId === selectedCity);
      
      // Calculate retention rate properly
      const customers = laundromat.customers || laundromat.customerCount || 0;
      const returningCustomers = laundromat.returningCustomers || laundromat.returningCustomerCount || 0;
      const retentionRate = customers > 0 ? returningCustomers / customers : 0;
      
      return (
        <tr 
          key={laundromat.id} 
          style={{ 
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <td style={{ padding: '12px 16px' }}>
            {matchesSelectedCity && (
              <Icon sx={{ 
                color: '#EAB308', 
                verticalAlign: 'middle',
                marginRight: '6px',
                fontSize: '1.2rem'
              }}>
                star
              </Icon>
            )}
            {laundromatIdToNameMap[laundromat.id] || laundromat.id}
          </td>
          <td style={{ padding: '12px 16px' }}>
            {laundromat.city || CITY_MAPPING[laundromat.cityId] || 'Unknown'}
          </td>
          <td style={{ padding: '12px 16px' }}>{laundromat.orders.toLocaleString()}</td>
          <td style={{ padding: '12px 16px' }}>${laundromat.revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          <td style={{ padding: '12px 16px' }}>
            ${laundromat.orders > 0 ? 
              (laundromat.revenue / laundromat.orders).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : 
              '0.00'}
          </td>
          <td style={{ padding: '12px 16px' }}>{customers.toLocaleString()}</td>
          <td style={{ padding: '12px 16px' }}>{returningCustomers.toLocaleString()}</td>
          <td style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                marginRight: '8px',
                backgroundColor: retentionRate >= 0.6 ? '#10B981' :
                              retentionRate >= 0.45 ? '#059669' :
                              retentionRate >= 0.35 ? '#F59E0B' :
                              retentionRate >= 0.25 ? '#D97706' :
                              retentionRate >= 0.15 ? '#DC2626' : '#B91C1C'
              }}></span>
              {(retentionRate * 100).toFixed(1)}%
            </div>
          </td>
          <td style={{ padding: '12px 16px' }}>
            {laundromat.avgTurnaroundDays ? laundromat.avgTurnaroundDays.toFixed(1) : '—'} days
          </td>
        </tr>
      );
    });
  };

  // City information data
  const cityInfo = useMemo(() => {
    const info = {
      'LYGRRATQ7EGG2': {
        name: 'London',
        population: 400000,
        laundromatCount: 3,
        operationalSince: '2023-01-01',
        marketShare: (aggregateMetrics.totalOrders / 400000) * 100,
        avgOrderFrequency: aggregateMetrics.totalOrders / aggregateMetrics.totalCustomers
      },
      'L4NE8GPX89J3A': {
        name: 'Ottawa',
        population: 1017449,
        laundromatCount: 5,
        operationalSince: '2023-03-15',
        marketShare: (aggregateMetrics.totalOrders / 1017449) * 100,
        avgOrderFrequency: aggregateMetrics.totalOrders / aggregateMetrics.totalCustomers
      },
      'LDK6Z980JTKXY': {
        name: 'Kitchener-Waterloo',
        population: 575847,
        laundromatCount: 4,
        operationalSince: '2023-06-01',
        marketShare: (aggregateMetrics.totalOrders / 575847) * 100,
        avgOrderFrequency: aggregateMetrics.totalOrders / aggregateMetrics.totalCustomers
      },
      'LXMC6DWVJ5N7W': {
        name: 'Hamilton',
        population: 569353,
        laundromatCount: 3,
        operationalSince: '2023-09-10',
        marketShare: (aggregateMetrics.totalOrders / 569353) * 100,
        avgOrderFrequency: aggregateMetrics.totalOrders / aggregateMetrics.totalCustomers
      },
      'LG0VGFKQ25XED': {
        name: 'Calgary',
        population: 1306784,
        laundromatCount: 4,
        operationalSince: '2023-11-20',
        marketShare: (aggregateMetrics.totalOrders / 1306784) * 100,
        avgOrderFrequency: aggregateMetrics.totalOrders / aggregateMetrics.totalCustomers
      }
    };
    return selectedCity === 'all' ? null : info[selectedCity];
  }, [selectedCity, aggregateMetrics]);

  // City projection constants - extracted from CityProjectionCalculator
  const PROJECTION_RATE = 5.57; // Standard rate excluding London
  const MONTHLY_DISTRIBUTION = {
    1: 0.0604, 2: 0.1546, 3: 0.1570, 4: 0.1691, 5: 0.2126, 6: 0.2464
  };

  // Calculate projections for the selected city with error handling
  const projectionData = useMemo(() => {
    try {
      if (!monthlyOrdersTrend || monthlyOrdersTrend.length === 0) {
        return {
          combinedOrderTrend: [],
          metrics: {
            totalAnnualOrders: 0,
            averageMonthlyOrders: 0,
            projectedGrowthPercent: 0
          }
        };
      }
      
      // Generate projections using the advanced system
      return addProjectionsToComponent(monthlyOrdersTrend, selectedCity);
    } catch (error) {
      console.error("Error generating projections:", error);
      // Return a safe default in case of errors
      return {
        combinedOrderTrend: monthlyOrdersTrend,
        metrics: {
          totalAnnualOrders: 0,
          averageMonthlyOrders: 0,
          projectedGrowthPercent: 0
        },
        error: true
      };
    }
  }, [monthlyOrdersTrend, selectedCity]);

  // Combine actual data with projections for the chart
  const combinedOrderTrend = useMemo(() => {
    if (!monthlyOrdersTrend || !projectionData || selectedCity === 'all') {
      return monthlyOrdersTrend;
    }

    // Create a map of existing data points by month
    const existingDataMap = {};
    monthlyOrdersTrend.forEach(dataPoint => {
      existingDataMap[dataPoint.month] = dataPoint;
    });

    // Merge actual data with projections - make sure we access the array correctly
    return [
      ...monthlyOrdersTrend,
      ...(projectionData.projectedData || []).filter(projection => !existingDataMap[projection.month])
    ].sort((a, b) => {
      // Sort by date
      if (a.month && b.month) {
        return a.month.localeCompare(b.month);
      }
      return 0;
    });
  }, [monthlyOrdersTrend, projectionData, selectedCity]);

  // Add a state for total orders across all cities
  const [totalOrdersAllCities, setTotalOrdersAllCities] = useState(0);
  
  // When appointments are loaded, calculate total orders across all cities
  useEffect(() => {
    if (appointments && appointments.length > 0) {
      setTotalOrdersAllCities(appointments.length);
    }
  }, [appointments]);

  // Add state for total revenue across all cities
  const [totalRevenueAllCities, setTotalRevenueAllCities] = useState(0);

  // Update the useEffect that calculates totalOrdersAllCities to also calculate total revenue
  useEffect(() => {
    if (appointments && appointments.length > 0) {
      setTotalOrdersAllCities(appointments.length);
      
      // Calculate total revenue across all cities
      const totalRevenue = appointments.reduce((sum, appointment) => {
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
        
        return sum + (isNaN(revenueToAdd) ? 0 : revenueToAdd);
      }, 0);
      
      setTotalRevenueAllCities(totalRevenue);
    }
  }, [appointments]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Add a section for displaying order projections with error handling
  const renderProjectionSection = () => {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: '#111827' }}>
          Quarterly Growth for {selectedCity === 'all' ? 'All Cities' : CITY_MAPPING[selectedCity]}
        </Typography>
        <QuarterlyGrowthByCity selectedCity={selectedCity} cityMapping={CITY_MAPPING} />
      </Box>
    );
  };

  // Render map section with Coming Soon message
  const renderMapSection = () => {
    return (
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#111827' }}>
            Order Locations - {CITY_MAPPING[selectedCity] || 'All Cities'}
          </Typography>
        </Box>
        <Paper sx={{ 
          borderRadius: 2, 
          overflow: 'hidden', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          height: '450px',
          position: 'relative'
        }}>
          <GoogleMapReact
            bootstrapURLKeys={{ 
              key: 'AIzaSyAtGuXvA4E3HW0xM2yzRU7tphMTtxqKQD4',
              libraries: ['places']
            }}
            center={mapCenter || getMapCenter}
            zoom={mapZoom}
            onChange={({ center, zoom, bounds }) => {
              // Update map state when user interacts with the map
              setMapCenter(center);
              setMapZoom(zoom);
            }}
            options={{
              fullscreenControl: true,
              zoomControl: true,
              mapTypeControl: true,
              streetViewControl: false,
              gestureHandling: 'greedy',
              minZoom: 5,
              maxZoom: 18,
              styles: [
                {
                  featureType: 'all',
                  elementType: 'geometry',
                  stylers: [{ lightness: 20 }]
                },
                {
                  featureType: 'water',
                  elementType: 'geometry',
                  stylers: [{ color: '#e0f2fe' }]
                },
                {
                  featureType: 'road',
                  elementType: 'geometry',
                  stylers: [{ color: '#f1f5f9' }]
                }
              ]
            }}
          />
          
          {/* Coming Soon overlay */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10
          }}>
            <Box sx={{
              backgroundColor: '#3B82F6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              marginBottom: '16px'
            }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Coming Soon!
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ maxWidth: '450px', textAlign: 'center', color: '#1F2937' }}>
              Our team is working on integrating detailed map data for all service areas.
              Check back soon for a visual representation of our order locations.
            </Typography>
          </Box>
        </Paper>
      </Box>
    );
  };

  // Modify the statistics card section to show percentages
  const renderStatisticsCard = (title, value, secondaryValue = null, icon = null) => {
    // Calculate percentage of total if this is the total orders card
    const showPercentage = title === 'Total Orders' && totalOrdersAllCities > 0 && selectedCity !== 'all';
    const percentage = showPercentage ? (value / totalOrdersAllCities * 100).toFixed(1) : null;

    const showRevenuePercentage = title === 'Total Revenue' && totalRevenueAllCities > 0 && selectedCity !== 'all';
    const revenuePercentage = showRevenuePercentage ? (value / totalRevenueAllCities * 100).toFixed(1) : null;

    return (
      <Paper 
        elevation={1}
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          borderRadius: 2,
          backgroundColor: '#FFFFFF',
          transition: 'transform 0.3s, box-shadow 0.3s',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography
            variant="subtitle1"
            component="div"
            sx={{ 
              color: '#6B7280',
              fontWeight: 500,
              fontSize: '0.875rem'
            }}
          >
            {title}
          </Typography>
          {icon && (
            <Box
              sx={{
                bgcolor: '#F3F4F6',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3B82F6'
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
        
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'baseline' }}>
          <Typography
            variant="h4"
            component="div"
            sx={{
              fontWeight: 'bold',
              color: '#111827',
              lineHeight: 1.2
            }}
          >
            {typeof value === 'number' && title === 'Total Revenue'
              ? `$${value.toLocaleString(undefined, {
                  minimumFractionDigits: value % 1 === 0 ? 0 : 2,
                  maximumFractionDigits: 2
                })}`
              : (typeof value === 'number' ? value.toLocaleString() : value)
            }
          </Typography>
          
          {showPercentage && (
            <Typography
              variant="body2"
              component="div"
              sx={{
                ml: 1,
                color: '#10B981',
                fontWeight: 'medium',
                fontSize: '0.875rem',
                bgcolor: '#ECFDF5',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                whiteSpace: 'nowrap'
              }}
            >
              {percentage}% of total
            </Typography>
          )}
          
          {showRevenuePercentage && (
            <Typography
              variant="body2"
              component="div"
              sx={{
                ml: 1,
                color: '#10B981',
                fontWeight: 'medium',
                fontSize: '0.875rem',
                bgcolor: '#ECFDF5',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                whiteSpace: 'nowrap'
              }}
            >
              {revenuePercentage}% of total
            </Typography>
          )}
        </Box>
        
        {secondaryValue && (
          <Typography
            variant="body2"
            sx={{
              color: '#6B7280',
              mt: 1
            }}
          >
            {secondaryValue}
          </Typography>
        )}
      </Paper>
    );
  };

  return (
    <Box sx={{ 
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#F3F4F6', 
      minHeight: '100vh'
    }}>
      <Box component="main" sx={{ flexGrow: 1, px: 3, py: 4 }}>
        <Container maxWidth="xl">
          {/* Header */}
          <AppBar 
            position="sticky" 
            sx={{ 
              backgroundColor: '#1E40AF', 
              top: 0, 
              zIndex: 1100,
              transition: 'transform 0.3s ease',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          >
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                Laundry Service Analytics Dashboard
              </Typography>
              
              {/* Filter Controls with clear labels */}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* City Selector with Label */}
                <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 130 }}>
                  <Typography variant="caption" sx={{ color: 'white', fontWeight: 'medium', mb: 0.3 }}>
                    City
                  </Typography>
                  <FormControl variant="filled" size="small" sx={{ backgroundColor: 'white', borderRadius: '4px' }}>
                    <Select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      displayEmpty
                      sx={{ 
                        color: '#1E3A8A',
                        '.MuiSelect-select': { py: 1, pr: 6 },
                        '&:focus': { backgroundColor: 'white' },
                        fontSize: '0.85rem'
                      }}
                      IconComponent={() => (
                        <Icon sx={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#1E3A8A', fontSize: '1.25rem' }}>
                          expand_more
                        </Icon>
                      )}
                    >
                      <MenuItem value="all">All Cities</MenuItem>
                      <MenuItem value="LYGRRATQ7EGG2">London</MenuItem>
                      <MenuItem value="L4NE8GPX89J3A">Ottawa</MenuItem>
                      <MenuItem value="LDK6Z980JTKXY">Kitchener-Waterloo</MenuItem>
                      <MenuItem value="LXMC6DWVJ5N7W">Hamilton</MenuItem>
                      <MenuItem value="LG0VGFKQ25XED">Calgary</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                {/* Date Range Selector - From With Label */}
                <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 100 }}>
                  <Typography variant="caption" sx={{ color: 'white', fontWeight: 'medium', mb: 0.3 }}>
                    From
                  </Typography>
                  <FormControl variant="filled" size="small" sx={{ backgroundColor: 'white', borderRadius: '4px' }}>
                    <Select
                      value={`${startDate.getFullYear()}-${startDate.getMonth()+1}`}
                      onChange={handleStartDateChange}
                      displayEmpty
                      sx={{ 
                        color: '#1E3A8A',
                        '.MuiSelect-select': { py: 1, pr: 6 },
                        '&:focus': { backgroundColor: 'white' },
                        fontSize: '0.85rem'
                      }}
                      IconComponent={() => (
                        <Icon sx={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#1E3A8A', fontSize: '1.25rem' }}>
                          expand_more
                        </Icon>
                      )}
                    >
                      {[...Array(24)].map((_, i) => {
                        const date = subMonths(new Date(), i);
                        const value = `${date.getFullYear()}-${date.getMonth()+1}`;
                        const label = format(date, 'MMM yyyy');
                        return (
                          <MenuItem key={`from-${value}`} value={value}>{label}</MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Box>
                
                {/* Date Range Selector - To With Label */}
                <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 100 }}>
                  <Typography variant="caption" sx={{ color: 'white', fontWeight: 'medium', mb: 0.3 }}>
                    To
                  </Typography>
                  <FormControl variant="filled" size="small" sx={{ backgroundColor: 'white', borderRadius: '4px' }}>
                    <Select
                      value={`${endDate.getFullYear()}-${endDate.getMonth()+1}`}
                      onChange={handleEndDateChange}
                      displayEmpty
                      sx={{ 
                        color: '#1E3A8A',
                        '.MuiSelect-select': { py: 1, pr: 6 },
                        '&:focus': { backgroundColor: 'white' },
                        fontSize: '0.85rem'
                      }}
                      IconComponent={() => (
                        <Icon sx={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#1E3A8A', fontSize: '1.25rem' }}>
                          expand_more
                        </Icon>
                      )}
                    >
                      {[...Array(24)].map((_, i) => {
                        const date = subMonths(new Date(), i);
                        const value = `${date.getFullYear()}-${date.getMonth()+1}`;
                        const label = format(date, 'MMM yyyy');
                        return (
                          <MenuItem key={`to-${value}`} value={value}>{label}</MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Box>
                
                {/* Customer Type Filter With Label */}
                <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 130 }}>
                  <Typography variant="caption" sx={{ color: 'white', fontWeight: 'medium', mb: 0.3 }}>
                    Customer Type
                  </Typography>
                  <FormControl variant="filled" size="small" sx={{ backgroundColor: 'white', borderRadius: '4px' }}>
                    <Select
                      value={customerTypeFilter}
                      onChange={(e) => setCustomerTypeFilter(e.target.value)}
                      displayEmpty
                      sx={{ 
                        color: '#1E3A8A',
                        '.MuiSelect-select': { py: 1, pr: 6 },
                        '&:focus': { backgroundColor: 'white' },
                        fontSize: '0.85rem'
                      }}
                      IconComponent={() => (
                        <Icon sx={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#1E3A8A', fontSize: '1.25rem' }}>
                          expand_more
                        </Icon>
                      )}
                    >
                      <MenuItem value="all">All Customer Types</MenuItem>
                      {customerTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Toolbar>
          </AppBar>

          {/* City Overview Section (Independent of date range) */}
          {cityInfo && (
            <Box sx={{ mb: 6 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'start', md: 'center' }, mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#111827', mb: { xs: 2, md: 0 } }}>
                  {cityInfo.name} Overview
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Icon sx={{ color: '#6B7280', mr: 1 }}>calendar_today</Icon>
                  <Typography variant="body2" color="text.secondary">
                    <span style={{ fontWeight: 500 }}>Operational Since:</span> {new Date(cityInfo.operationalSince).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </Typography>
                </Box>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box sx={{ backgroundColor: '#EBF5FF', borderRadius: '50%', p: 1.5, mr: 2 }}>
                        <Icon sx={{ color: '#1E88E5' }}>groups</Icon>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Population</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5 }}>{cityInfo.population.toLocaleString()}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box sx={{ backgroundColor: '#E6FFFA', borderRadius: '50%', p: 1.5, mr: 2 }}>
                        <Icon sx={{ color: '#26A69A' }}>location_on</Icon>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Active Laundromats</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5 }}>{cityInfo.laundromatCount}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                          {laundromats
                            .filter(l => {
                              // Filter by city based on most common city for this cleaner
                              const cityFrequency = {};
                              appointments.forEach(appointment => {
                                if (appointment.cleaning && appointment.cleaning.cleaner === l.id && appointment.cityId) {
                                  cityFrequency[appointment.cityId] = (cityFrequency[appointment.cityId] || 0) + 1;
                                }
                              });
                              
                              let mostCommonCity = null;
                              let maxCityCount = 0;
                              Object.keys(cityFrequency).forEach(cityId => {
                                if (cityFrequency[cityId] > maxCityCount) {
                                  maxCityCount = cityFrequency[cityId];
                                  mostCommonCity = cityId;
                                }
                              });
                              
                              return mostCommonCity === selectedCity;
                            })
                            .map(l => l.name)
                            .join(', ')}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box sx={{ backgroundColor: '#F3E8FF', borderRadius: '50%', p: 1.5, mr: 2 }}>
                        <Icon sx={{ color: '#AB47BC' }}>trending_up</Icon>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Market Penetration</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5 }}>{cityInfo.marketShare.toFixed(2)}%</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                          Based on total population
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box sx={{ backgroundColor: '#FFF7ED', borderRadius: '50%', p: 1.5, mr: 2 }}>
                        <Icon sx={{ color: '#F59E0B' }}>shopping_bag</Icon>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Average Orders Per Customer</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5 }}>{cityInfo.avgOrderFrequency.toFixed(1)}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Order Projections Section - Only show for specific cities */}
          {selectedCity !== 'all' && renderProjectionSection()}

          {/* Date Range Information Banner - Made more prominent */}
          <Paper sx={{ 
            p: 3, 
            mb: 4, 
            backgroundColor: '#EFF6FF', 
            borderRadius: 2, 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            alignItems: { xs: 'start', md: 'center' }, 
            justifyContent: 'space-between',
            borderLeft: '5px solid #3B82F6' // Added accent border
          }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1E40AF', mb: { xs: 2, md: 0 } }}>
              Showing Statistics for: {selectedCity === 'all' ? 'All Cities' : CITY_MAPPING[selectedCity]}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', px: 2, py: 1, borderRadius: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              <Icon sx={{ color: '#3B82F6', mr: 1 }}>date_range</Icon>
              <Typography variant="body1" sx={{ mr: 1, color: '#1E40AF', fontWeight: 'medium' }}>
                From: {format(startDate, 'MMM yyyy')}
              </Typography>
              <Typography variant="body1" sx={{ color: '#1E40AF', fontWeight: 'medium' }}>
                To: {format(endDate, 'MMM yyyy')}
              </Typography>
            </Box>
          </Paper>

          {/* Summary Cards - Now clearly marked as being for the selected date range */}
          <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: '#111827' }}>
            Performance Metrics
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Box sx={{ backgroundColor: '#EBF5FF', borderRadius: '50%', p: 1.5, mr: 2 }}>
                    <Icon sx={{ color: '#2563EB' }}>shopping_bag</Icon>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Orders</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5 }}>{aggregateMetrics.totalOrders.toLocaleString()}</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Box sx={{ backgroundColor: '#ECFDF5', borderRadius: '50%', p: 1.5, mr: 2 }}>
                    <Icon sx={{ color: '#10B981' }}>attach_money</Icon>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5 }}>${aggregateMetrics.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Box sx={{ backgroundColor: '#FEF3C7', borderRadius: '50%', p: 1.5, mr: 2 }}>
                    <Icon sx={{ color: '#F59E0B' }}>trending_up</Icon>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Avg. Order Value</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5 }}>${aggregateMetrics.avgOrderValue.toFixed(2)}</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Box sx={{ backgroundColor: '#F3E8FF', borderRadius: '50%', p: 1.5, mr: 2 }}>
                    <Icon sx={{ color: '#8B5CF6' }}>inventory_2</Icon>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Avg. Order Weight</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5 }}>{aggregateMetrics.avgWeight.toFixed(2)} kg</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Chart Section - Within the Date Range */}
          <Typography variant="h5" gutterBottom sx={{ mt: 6, mb: 3, fontWeight: 'bold', color: '#111827' }}>
            {selectedCity === 'all' ? 'All Cities' : CITY_MAPPING[selectedCity]} Order Trends
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', color: '#4B5563' }}>
                  Weekly Orders - {selectedCity === 'all' ? 'All Cities' : CITY_MAPPING[selectedCity]}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart 
                    data={
                      selectedCity === 'all' 
                        ? monthlyOrdersTrend 
                        : (projectionData?.weeklyHistoricalData || monthlyOrdersTrend)
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#6B7280' }}
                      interval="preserveStartEnd"
                      minTickGap={15}
                      tickMargin={8}
                    />
                    <YAxis tick={{ fill: '#6B7280' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        borderRadius: '0.375rem', 
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', 
                        border: 'none' 
                      }}
                      formatter={(value, name, props) => {
                        return [`${value} orders`, name];
                      }}
                      labelFormatter={(label, items) => {
                        const dataPoint = items?.[0]?.payload;
                        return dataPoint?.fullname || label;
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    
                    {selectedCity === 'all' 
                      ? Object.values(CITY_MAPPING)
                        .filter(city => city !== 'All Cities')
                        .map((city, index) => (
                          <Line 
                            key={city}
                            type="monotone" 
                            dataKey={city} 
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 3, strokeWidth: 1, fill: COLORS[index % COLORS.length] }}
                            activeDot={{ r: 6 }}
                            isAnimationActive={true}
                            animationDuration={1000}
                            connectNulls={true}
                          />
                        ))
                      : (
                        <Line 
                          type="monotone" 
                          dataKey="orders" 
                          name={CITY_MAPPING[selectedCity]}
                          stroke="#2563EB"
                          strokeWidth={2}
                          dot={{ r: 3, strokeWidth: 1, fill: '#2563EB' }}
                          activeDot={{ r: 6 }}
                          isAnimationActive={true}
                          animationDuration={1000}
                          connectNulls={true}
                        />
                      )
                    }
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', color: '#4B5563' }}>Customer Types</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={customerTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {customerTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '0.375rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', border: 'none' }}
                      formatter={(value) => [`${value} orders`, 'Count']} 
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>

          {/* Additional Metric Charts - with improved styling */}
          <Grid container spacing={3} sx={{ mb: 5 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Customer Retention Over Time</Typography>
                </Box>
                
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={retentionRateTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fill: '#6B7280' }} />
                    <YAxis 
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                      domain={[0, dataMax => Math.min(1, dataMax * 1.1)]}
                      tick={{ fill: '#6B7280' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '0.375rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', border: 'none' }}
                      formatter={(value) => [`${(value * 100).toFixed(1)}%`, 'Retention Rate']} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="retentionRate" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 1, fill: "#3B82F6" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', color: '#4B5563' }}>
                  Order Weight Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weightDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="range" tick={{ fill: '#6B7280' }} />
                    <YAxis tick={{ fill: '#6B7280' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '0.375rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', border: 'none' }}
                      formatter={(value) => [`${value} orders`, 'Count']} 
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="count" fill="#26A69A" name="Number of Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>

          {/* Laundromat Performance Table - With Improved Styling */}
          <Typography variant="h5" gutterBottom sx={{ mt: 6, mb: 3, fontWeight: 'bold', color: '#111827' }}>
            Laundromat Performance
          </Typography>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {selectedCity !== 'all' 
                ? `Showing all laundromats with ${CITY_MAPPING[selectedCity]} laundromats highlighted`
                : `Showing all laundromats across cities`}
            </Typography>
            {selectedCity !== 'all' && (
              <Box 
                sx={{ 
                  display: 'inline-block', 
                  marginLeft: '10px', 
                  padding: '2px 8px',
                  backgroundColor: '#FEF08A',
                  color: '#854D0E',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: 'medium'
                }}
              >
                {CITY_MAPPING[selectedCity]} Highlighted
              </Box>
            )}
          </Box>
          <Paper sx={{ p: 0, mb: 4, overflowX: 'auto', borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #E5E7EB' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>Filter by Laundromat</InputLabel>
                    <Select
                      value={laundromatFilter}
                      onChange={(e) => setLaundromatFilter(e.target.value)}
                      label="Filter by Laundromat"
                    >
                      <MenuItem value="all">All Laundromats</MenuItem>
                      {laundromats.map(laundromat => (
                        <MenuItem key={laundromat.id} value={laundromat.id}>{laundromat.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
            <Box>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    <th 
                      style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', cursor: 'pointer' }}
                      onClick={() => handleSort('name')}
                    >
                      Laundromat Name <SortIcon column="name" />
                    </th>
                    <th 
                      style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', cursor: 'pointer' }}
                      onClick={() => handleSort('city')}
                    >
                      City <SortIcon column="city" />
                    </th>
                    <th 
                      style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', cursor: 'pointer' }}
                      onClick={() => handleSort('orders')}
                    >
                      Total Orders <SortIcon column="orders" />
                    </th>
                    <th 
                      style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', cursor: 'pointer' }}
                      onClick={() => handleSort('revenue')}
                    >
                      Revenue <SortIcon column="revenue" />
                    </th>
                    <th 
                      style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', cursor: 'pointer' }}
                      onClick={() => handleSort('avgOrderValue')}
                    >
                      Avg. Order Value <SortIcon column="avgOrderValue" />
                    </th>
                    <th 
                      style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', cursor: 'pointer' }}
                      onClick={() => handleSort('customers')}
                    >
                      Customers <SortIcon column="customers" />
                    </th>
                    <th 
                      style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', cursor: 'pointer' }}
                      onClick={() => handleSort('returningCustomers')}
                    >
                      Returning <SortIcon column="returningCustomers" />
                    </th>
                    <th 
                      style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', cursor: 'pointer' }}
                      onClick={() => handleSort('retentionScore')}
                    >
                      Retention <SortIcon column="retentionScore" />
                    </th>
                    <th 
                      style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', cursor: 'pointer' }}
                      onClick={() => handleSort('avgTurnaroundDays')}
                    >
                      Turnaround <SortIcon column="avgTurnaroundDays" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {renderLaundromatTable()}
                </tbody>
              </table>
            </Box>
          </Paper>

          {/* City Performance Table - showing metrics across all cities */}
          <Typography variant="h5" gutterBottom sx={{ mt: 6, mb: 3, fontWeight: 'bold', color: '#111827' }}>
            City Performance
          </Typography>
          <Paper sx={{ p: 0, mb: 4, overflowX: 'auto', borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
            <Box>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>
                      City
                    </th>
                    <th style={{ padding: '16px', textAlign: 'right', borderBottom: '1px solid #E5E7EB', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>
                      In Operation
                    </th>
                    <th style={{ padding: '16px', textAlign: 'right', borderBottom: '1px solid #E5E7EB', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>
                      Total Orders
                    </th>
                    <th style={{ padding: '16px', textAlign: 'right', borderBottom: '1px solid #E5E7EB', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>
                      Revenue
                    </th>
                    <th style={{ padding: '16px', textAlign: 'right', borderBottom: '1px solid #E5E7EB', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>
                      Avg. Order Value
                    </th>
                    <th style={{ padding: '16px', textAlign: 'right', borderBottom: '1px solid #E5E7EB', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>
                      Customers
                    </th>
                    <th style={{ padding: '16px', textAlign: 'right', borderBottom: '1px solid #E5E7EB', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>
                      Returning
                    </th>
                    <th style={{ padding: '16px', textAlign: 'right', borderBottom: '1px solid #E5E7EB', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>
                      Retention
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(CITY_MAPPING)
                    .filter(cityId => cityId !== 'all')
                    .map(cityId => {
                      // Get city data from filtered appointments
                      const cityData = appointments
                        .filter(a => a.cityId === cityId || normalizeCityId(a) === cityId);
                      
                      const totalOrders = cityData.length;
                      const totalRevenue = cityData.reduce((sum, a) => {
                        // Check for invoiceTotal (older field)
                        const invoiceTotal = parseFloat(a.invoiceTotal || 0);
                        
                        // Check for invoice.total (newer field)
                        const invoiceDotTotal = a.invoice && typeof a.invoice.total !== 'undefined' 
                          ? parseFloat(a.invoice.total) 
                          : 0;
                        
                        // Check for other revenue fields as fallback
                        let otherRevenue = 0;
                        if (a.pickup && a.pickup.rate) {
                          otherRevenue += parseFloat(a.pickup.rate || 0);
                        }
                        if (a.delivery && a.delivery.rate) {
                          otherRevenue += parseFloat(a.delivery.rate || 0);
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
                        
                        return sum + (isNaN(revenueToAdd) ? 0 : revenueToAdd);
                      }, 0);
                      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
                      
                      // Calculate unique customers
                      const uniqueCustomers = new Set();
                      const customerAppointments = {};
                      
                      cityData.forEach(a => {
                        if (a.customerId) {
                          uniqueCustomers.add(a.customerId);
                          
                          if (!customerAppointments[a.customerId]) {
                            customerAppointments[a.customerId] = 0;
                          }
                          customerAppointments[a.customerId]++;
                        }
                      });
                      
                      // Calculate returning customers
                      const totalCustomers = uniqueCustomers.size;
                      const returningCustomers = Object.values(customerAppointments)
                        .filter(count => count > 1).length;
                      
                      // Calculate retention rate
                      const retentionRate = totalCustomers > 0 ? 
                        returningCustomers / totalCustomers : 0;
                      
                      // Is this the currently selected city?
                      const isSelected = cityId === selectedCity;

                      // Calculate years in operation
                      let operationSince;
                      let yearsInOperation;
                      const currentDate = new Date();
                      
                      switch(cityId) {
                        case 'LYGRRATQ7EGG2': // London
                          operationSince = new Date('2022-01-01');
                          break;
                        case 'L4NE8GPX89J3A': // Ottawa
                          operationSince = new Date('2023-03-15');
                          break;
                        case 'LDK6Z980JTKXY': // Kitchener-Waterloo
                          operationSince = new Date('2023-06-01');
                          break;
                        case 'LXMC6DWVJ5N7W': // Hamilton
                          operationSince = new Date('2023-09-10');
                          break;
                        case 'LG0VGFKQ25XED': // Calgary
                          operationSince = new Date('2023-11-20');
                          break;
                        default:
                          operationSince = new Date('2022-01-01');
                      }
                      
                      const diffTime = Math.abs(currentDate - operationSince);
                      const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
                      yearsInOperation = diffYears.toFixed(1);
                      
                      return (
                        <tr key={cityId} style={{ borderBottom: '1px solid #E5E7EB' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                            {isSelected && (
                              <Icon sx={{ 
                                color: '#EAB308', 
                                verticalAlign: 'middle',
                                marginRight: '6px',
                                fontSize: '1.2rem'
                              }}>
                                star
                              </Icon>
                            )}
                            {CITY_MAPPING[cityId]}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            {yearsInOperation} years
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            {totalOrders.toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            ${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            ${avgOrderValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            {totalCustomers.toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            {returningCustomers.toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                              <span style={{ 
                                width: '12px', 
                                height: '12px', 
                                borderRadius: '50%', 
                                marginRight: '8px',
                                backgroundColor: retentionRate >= 0.6 ? '#10B981' :
                                             retentionRate >= 0.45 ? '#059669' :
                                             retentionRate >= 0.35 ? '#F59E0B' :
                                             retentionRate >= 0.25 ? '#D97706' :
                                             retentionRate >= 0.15 ? '#DC2626' : '#B91C1C'
                              }}></span>
                              {(retentionRate * 100).toFixed(1)}%
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </Box>
          </Paper>
          
          {/* Map Section - replaced with Coming Soon version */}
          {renderMapSection()}
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ p: 3, backgroundColor: '#F1F5F9', borderTop: '1px solid #E2E8F0' }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Laundry Service Analytics Dashboard &bull; Last updated: {new Date().toLocaleDateString()} 
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard; 