const express = require('express');
const Redis = require('ioredis');
const { getDataById } = require('./database');

const app = express();
const redis = new Redis({
    host: 'db-redis-blr1-55103-do-user-13729304-0.c.db.ondigitalocean.com',
    port: 25061,
    password: 'AVNS_3Sj9qjkIRWdTG_4UIph'
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
    await redis.set(cacheKey, data, 'EX', 3600); // Cache for 1 hour
  } else {
    console.log('Redis Cache hit');
  }

  return data;
}

app.get('/data/no-cache/:id', async (req, res) => {
  try {
    const data = await getDataNoCache(req.params.id);
    res.json({ data });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

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
