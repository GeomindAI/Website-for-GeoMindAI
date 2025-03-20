# Laundry Service Analytics Dashboard

An interactive dashboard for analyzing and visualizing laundry service data, designed for a startup that offers a laundry pickup and delivery service.

## Features

- **Interactive filtering** by city, customer type, date range, and laundromat
- **Comprehensive analytics** for orders, revenue, customer retention, and driver performance
- **Geographic visualization** of order locations
- **Advanced metrics** like customer retention rate, average turnaround time, and seasonal trends
- **Mobile-responsive design** that works on all device sizes

## Key Insights Available

- City-by-city performance comparison
- Customer type distribution and behavior
- Laundromat performance evaluation including customer retention rates
- Driver efficiency and service completion rates
- Seasonal order trends and revenue patterns
- Order weight distribution analytics
- Customer lifetime value and order frequency

## Technical Implementation

- **Frontend**: React with Material UI components
- **State Management**: React hooks
- **Data Visualization**: Recharts for charts, React Leaflet for maps
- **Data Processing**: Custom utilities for analyzing JSON data
- **Responsive Design**: Full support for mobile, tablet, and desktop

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Place your `appointments.json` data file in the root directory
4. Start the development server:
   ```
   npm start
   ```
   This will automatically copy the data file to the public directory.

## Data Structure

The dashboard expects a JSON file with laundry service appointment data in the following structure:

```json
[
  {
    "customerPhone": string,
    "customerType": string,
    "appointmentId": string,
    "customerId": string,
    "cityId": string,
    "customerName": string,
    "pickup": {
      "serviceDate": string,
      "from": string,
      "type": "pickup",
      "driver": string,
      "distance": number,
      "basePay": number,
      "to": string,
      "status": string
    },
    "cleaning": {
      "orderDetails": {
        "washFoldWeight": number
      },
      "rate": number,
      "cleaner": string,
      "status": string
    },
    "invoice": {
      "total": number,
      "tax": number,
      "subTotal": number
    },
    "invoiceTotal": number,
    "status": string,
    "dropoff": {
      "serviceDate": string,
      "to": string,
      "type": "dropoff",
      "distance": number,
      "from": string,
      "driver": string,
      "status": string
    }
  }
]
```

## Extending the Dashboard

To add more analytics or visualizations:

1. Add additional data processing functions in `src/utils/dataProcessor.js`
2. Create new visualization components in `src/components/`
3. Integrate them into the main Dashboard component in `src/components/Dashboard.js`

## Building for Production

Run the build command to create a production-optimized build:

```
npm run build
```

This will create a `build` directory with all the necessary files for deployment.

## License

This project is proprietary and confidential.

## Contact

For support or inquiries, please contact the development team. 