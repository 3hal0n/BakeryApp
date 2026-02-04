// Redis configuration - DEPRECATED
// This file is kept for reference but Redis is no longer used for notifications.
// The notification system now uses Prisma/Postgres directly for better reliability
// and to avoid external dependencies.
//
// If you need Redis for other purposes (caching, sessions, etc.), uncomment below:

/*
import { Redis } from 'ioredis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  throw new Error('Missing Upstash Redis credentials in .env file');
}

// Extract host and port from Upstash REST URL
const urlMatch = redisUrl.match(/https?:\/\/([^:]+)/);
const host = urlMatch ? urlMatch[1] : '';

export const redisConnection = new Redis({
  host,
  port: 6379,
  password: redisToken,
  tls: {
    rejectUnauthorized: false,
  },
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisConnection.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisConnection.on('connect', () => {
  console.log('✅ Connected to Upstash Redis');
});
*/

export {}; // Make this a module
