const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const app = express();
const port = 3000;

let weatherData = {
  "Varkala Beach Weather Station": [],
  "Goa Beach Weather Station": []
};

// Function to parse the date string
function parseDate(dateString) {
  const [date, time, period] = dateString.split(' ');
  return new Date(`${date} ${time} ${period}`);
}

// Load data from CSV file
fs.createReadStream('new_csv.csv')
  .pipe(csv())
  .on('data', (row) => {
    const data = {
      stationName: row['Station Name'],
      timestamp: parseDate(row['Measurement Timestamp']),
      airTemperature: parseFloat(row['Air Temperature']),
      humidity: parseInt(row['Humidity']),
      rainIntensity: parseFloat(row['Rain Intensity']),
      windDirection: parseInt(row['Wind Direction']),
      windSpeed: parseFloat(row['Wind Speed']),
      maxWindSpeed: parseFloat(row['Maximum Wind Speed']),
      barometricPressure: parseFloat(row['Barometric Pressure']),
      solarRadiation: parseInt(row['Solar Radiation']),
      label: row['Label'],
      activitySuitability: row['Activity Suitability']
    };
    
    if (weatherData[row['Station Name']]) {
      weatherData[row['Station Name']].push(data);
    } else {
      console.warn(`Unknown station: ${row['Station Name']}`);
    }
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  });

// Middleware to parse JSON body
app.use(express.json());

// Helper function to filter data by date
function filterByDate(data, dateStr) {
  return data.filter(entry => 
    entry.timestamp.toISOString().split('T')[0] === dateStr
  );
}

// Endpoint to get weather data for a specific beach and date
app.get('/weather/:beach', (req, res) => {
  const beach = req.params.beach;
  const dateStr = req.query.date; // Expected format: YYYY-MM-DD

  if (!weatherData[beach]) {
    return res.status(404).json({ error: 'Beach not found' });
  }

  if (!dateStr) {
    return res.status(400).json({ error: 'Date parameter is required' });
  }

  const requestedDate = new Date(dateStr);
  if (isNaN(requestedDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  const filteredData = filterByDate(weatherData[beach], dateStr);

  if (filteredData.length === 0) {
    return res.status(404).json({ error: 'No data found for the specified date' });
  }

  res.json(filteredData);
});

// Endpoint to get weather data for a specific activity suitability and date
app.get('/weather/suitability/:activity', (req, res) => {
  const activity = req.params.activity;
  const dateStr = req.query.date; // Expected format: YYYY-MM-DD

  if (!dateStr) {
    return res.status(400).json({ error: 'Date parameter is required' });
  }

  const requestedDate = new Date(dateStr);
  if (isNaN(requestedDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  let suitableData = [];

  for (let beach in weatherData) {
    const filteredData = filterByDate(weatherData[beach], dateStr);
    const suitableBeachData = filteredData.filter(entry => 
      entry.activitySuitability.toLowerCase() === activity.toLowerCase()
    );
    suitableData = suitableData.concat(suitableBeachData);
  }

  if (suitableData.length === 0) {
    return res.status(404).json({ error: 'No data found for the specified activity and date' });
  }

  res.json(suitableData);
});

// Endpoint to get a list of available beaches
app.get('/beaches', (req, res) => {
  res.json(Object.keys(weatherData));
});

// Start the server
app.listen(port, () => {
  console.log(`Multi-Beach Weather Data server running at http://localhost:${port}`);
});

// const express = require('express');
// const fs = require('fs');
// const csv = require('csv-parser');
// const app = express();
// const port = 3000;

// let weatherData = [];

// // Function to parse the date string
// function parseDate(dateString) {
//   const [date, time, period] = dateString.split(' ');
//   return new Date(`${date} ${time} ${period}`);
// }

// // Load data from CSV file
// fs.createReadStream('new_csv.csv')
//   .pipe(csv())
//   .on('data', (row) => {
//     weatherData.push({
//       stationName: row['Station Name'],
//       timestamp: parseDate(row['Measurement Timestamp']),
//       airTemperature: parseFloat(row['Air Temperature']),
//       humidity: parseInt(row['Humidity']),
//       rainIntensity: parseFloat(row['Rain Intensity']),
//       windDirection: parseInt(row['Wind Direction']),
//       windSpeed: parseFloat(row['Wind Speed']),
//       maxWindSpeed: parseFloat(row['Maximum Wind Speed']),
//       barometricPressure: parseFloat(row['Barometric Pressure']),
//       solarRadiation: parseInt(row['Solar Radiation']),
//       label: row['Label'],
//       activitySuitability: row['Activity Suitability']
//     });
//   })
//   .on('end', () => {
//     console.log('CSV file successfully processed');
//   });

// // Endpoint to get all weather data
// app.get('/weather', (req, res) => {
//   res.json(weatherData);
// });

// // Endpoint to get weather data for a specific timestamp
// app.get('/weather/:timestamp', (req, res) => {
//   const requestedTimestamp = new Date(req.params.timestamp);
//   const data = weatherData.find(entry => entry.timestamp.getTime() === requestedTimestamp.getTime());
//   if (data) {
//     res.json(data);
//   } else {
//     res.status(404).send('Weather data not found for the specified timestamp');
//   }
// });

// // Endpoint to get weather data for a specific activity suitability
// app.get('/weather/suitability/:activity', (req, res) => {
//   const activity = req.params.activity;
//   const data = weatherData.filter(entry => entry.activitySuitability.toLowerCase() === activity.toLowerCase());
//   if (data.length > 0) {
//     res.json(data);
//   } else {
//     res.status(404).send('No weather data found for the specified activity suitability');
//   }
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Goa Beach Weather Data server running at http://localhost:${port}`);
// });