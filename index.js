const express = require('express');
const createRedisClient = require('./redisClient');
const { getDataById, addData } = require('./database');

const app = express();
app.use(express.json());

const redis = createRedisClient();

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
  let data;

  try {
    data = await redis.get(cacheKey);
  } catch (err) {
    console.error('Redis get error:', err);
  }

  if (!data) {
    console.log('Redis Cache miss - fetching from database');
    data = await getDataById(id);
    if (!data) {
      throw new Error('Data not found');
    }
    try {
      await redis.set(cacheKey, data, 'EX', 3600); // Cache for 1 hour
    } catch (err) {
      console.error('Redis set error:', err);
    }
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
