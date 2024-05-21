const express = require('express');
const Redis = require('ioredis');
const { getDataById, addData } = require('./database');

const app = express();
const redis = new Redis({
  host: 'db-redis-blr1-55103-do-user-13729304-0.c.db.ondigitalocean.com',
  port: 25061,
  password: 'AVNS_3Sj9qjkIRWdTG_4UIph',
  maxRetriesPerRequest: 5, // Adjust this as needed
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Event listeners for Redis
redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

// Function to get data without caching
async function getDataNoCache(id) {
  const data = await getDataById(id);
  if (!data) {
    throw new Error('Data not found');
  }
  return data;
}

// Function to get data with Redis caching
async function getDataRedis(id) {
  const cacheKey = `data:${id}`;
  let data = await redis.get(cacheKey);

  if (!data) {
    console.log('Redis Cache miss - fetching from database');
    data = await getDataById(id);
    if (!data) {
      throw new Error('Data not found');
    }
    // Store data in Redis with an expiration time of 1 hour (3600 seconds)
    await redis.set(cacheKey, data, 'EX', 3600);
  } else {
    console.log('Redis Cache hit');
  }

  return data;
}

// Endpoint to add data to the mock database and Redis cache
app.post('/data/:id', async (req, res) => {
  const { id } = req.params;
  const { value } = req.body;

  try {
    await addData(id, value);
    await redis.set(`data:${id}`, value, 'EX', 3600); // Cache for 1 hour
    res.status(201).json({ message: 'Data added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get data without caching
app.get('/data/no-cache/:id', async (req, res) => {
  try {
    const data = await getDataNoCache(req.params.id);
    res.json({ data });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Endpoint to get data with Redis caching
app.get('/data/redis/:id', async (req, res) => {
  try {
    const data = await getDataRedis(req.params.id);
    res.json({ data });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
