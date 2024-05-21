const express = require('express');
const redis = require('redis');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = 3000;

// Configure Redis client
const redisClient = redis.createClient({
    host: 'db-redis-blr1-55103-do-user-13729304-0.c.db.ondigitalocean.com',
    port: 25061,
    password: 'AVNS_3Sj9qjkIRWdTG_4UIph'
});

redisClient.on('connect', () => {
    console.log('Connected to Redis...');
});

redisClient.on('error', (err) => {
    console.error(`Redis error: ${err}`);
});

// Middleware to check cache
function checkCache(req, res, next) {
    const { username } = req.params;

    redisClient.get(username, (err, data) => {
        if (err) throw err;

        if (data !== null) {
            res.send(JSON.parse(data));
        } else {
            next();
        }
    });
}

// Route to get GitHub user data
app.get('/github/:username', checkCache, async (req, res) => {
    try {
        const { username } = req.params;
        const response = await axios.get(`https://api.github.com/users/${username}`);
        const data = response.data;

        // Set data to Redis
        redisClient.setex(username, 3600, JSON.stringify(data));

        res.send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
