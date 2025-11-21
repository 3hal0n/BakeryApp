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
