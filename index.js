// app.js
const express = require('express');
const app = express();
const getRedisClient = require('./redisClient');
const client = getRedisClient();

// Endpoint without caching
app.get('/data', (req, res) => {
  const data = fetchDataFromDB();
  res.json(data);
});

// Endpoint with Redis caching
app.get('/cached-data', (req, res) => {
  const key = req.originalUrl;
  client.get(key, (err, data) => {
    if (err) throw err;
    if (data !== null) {
      res.send(JSON.parse(data));
    } else {
      const data = fetchCachedDataFromDB();
      client.set(key, JSON.stringify(data), 'EX', 3600);
      res.json(data);
    }
  });
});

// Simulate database calls
const fetchDataFromDB = () => {
  return { data: 'This is data from the DB' };
};

const fetchCachedDataFromDB = () => {
  return { data: 'This is Cached data from the DB' };
};

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
