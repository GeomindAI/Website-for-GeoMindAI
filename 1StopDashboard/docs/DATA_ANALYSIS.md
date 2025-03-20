# Laundry Service Data Analysis Guide

This document explains the structure of the data and the analytical insights that can be extracted from the dashboard.

## Data Overview

The dataset contains records of laundry service appointments across multiple cities, including customer information, pickup and dropoff details, cleaning information, and invoice data.

### Key Data Elements

- **Customer Information**: Customer types (Residential, Commercial, Airbnb, Monthly), contact details, and unique identifiers
- **Geographic Information**: Cities, pickup/dropoff addresses
- **Service Details**: Pickup and dropoff dates, assigned drivers, distances traveled
- **Cleaning Details**: Laundry weight, assigned cleaners/laundromats, service rates
- **Financial Information**: Invoice totals, taxes, subtotals
- **Status Information**: Completion status of orders, pickups, and dropoffs

## Analytics Capabilities

### 1. City-Level Analysis

The dashboard enables city-by-city comparison to identify:

- **High-performing cities** with the most orders and revenue
- **Customer type distribution** by geography
- **Average order values** across different markets
- **Laundromat density** and market penetration

### 2. Customer Behavior Analysis

The customer metrics provide insights into:

- **Customer type segmentation** (Residential vs. Commercial vs. Airbnb)
- **Customer retention rates** overall and by laundromat
- **Customer lifetime value** through repeat order patterns
- **Average orders per customer** to identify loyalty

### 3. Laundromat Performance Analysis

The laundromat performance metrics help identify:

- **High-performing laundromats** by order volume and revenue
- **Customer retention leaders** that keep customers coming back
- **Service quality indicators** like turnaround time
- **Efficiency metrics** like average order weight processed

### 4. Operational Efficiency

The operational metrics track:

- **Driver performance** by completion rates and distances
- **Service timing patterns** for pickups and dropoffs
- **Turnaround time efficiency** from pickup to dropoff
- **Canceled order analysis** to identify problem areas

### 5. Temporal Analysis

Time-based analysis reveals:

- **Seasonal patterns** in order volume and revenue
- **Growth trends** over time by city and service type
- **Average order value trends** to track pricing effectiveness
- **Monthly performance comparisons** to identify trends

### 6. Geographic Distribution

The map visualization shows:

- **Order density by location** to identify high-demand areas
- **Distance optimization opportunities** for drivers
- **Market coverage assessment** to identify expansion opportunities
- **Customer clustering** for potential new laundromat locations

## Key Metrics and Formulas

### Customer Retention Rate
```
retention_rate = returning_customers / total_customers
```

### Average Order Value
```
avg_order_value = total_revenue / number_of_orders
```

### Average Turnaround Time
```
avg_turnaround_days = sum_of_turnaround_days / number_of_completed_orders
```

### Driver Efficiency
```
efficiency_rate = total_completed_services / total_services
avg_distance_per_service = total_distance / total_services
```

### Revenue Per Kilometer
```
revenue_per_km = total_revenue / total_distance_traveled
```

## Reading the Dashboard

### Summary Cards
These show top-level metrics at a glance, with percentage changes from previous periods.

### City Performance Charts
These compare cities across key metrics like order volume and revenue.

### Trend Charts
These show patterns over time, helping identify seasonal changes and growth trends.

### Laundromat Performance Table
This detailed table provides a comprehensive view of each laundromat's performance across multiple metrics.

### Customer Retention Section
This focuses on customer loyalty and repeat business patterns.

### Geographic Visualization
This maps order locations to identify patterns and potential new service areas.

## Making Business Decisions

The dashboard facilitates several key business decisions:

1. **Expansion Planning**: Identify high-performing cities for expansion
2. **Resource Allocation**: Direct resources to high-demand areas
3. **Laundromat Partnerships**: Evaluate laundromat performance for continued partnerships
4. **Customer Targeting**: Identify the most valuable customer segments
5. **Pricing Optimization**: Analyze average order values and seasonal trends
6. **Operational Improvements**: Identify inefficiencies in driver routes and turnaround times
7. **Marketing Strategy**: Focus on high-retention customer types and locations

## Custom Analysis

For specialized analysis beyond the dashboard capabilities:

1. Export raw data for detailed statistical analysis
2. Set up custom date ranges for period-to-period comparisons
3. Filter data by specific criteria (city, customer type, date ranges)
4. Track individual customer behavior over time

## Future Analytics Opportunities

The dashboard could be extended to include:

1. Predictive analytics for future order volumes
2. Customer churn prediction algorithms
3. Price elasticity analysis
4. Driver route optimization suggestions
5. Laundromat capacity planning tools 