import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import { authenticate } from './lib/auth';

// Import all your routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import orderRoutes from './routes/orders';
import reportRoutes from './routes/reports';
import deviceRoutes from './routes/devices';
import notificationRoutes from './routes/notifications';

// Initialize notification queue and worker
import './queues/notificationQueue';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// --- Public Routes ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes are public (login/refresh)
app.use('/api/auth', authRoutes);

// --- Authenticated Routes ---
// All routes below this line require a valid token
app.use(authenticate);

app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  server.close(async () => {
    const { stopNotificationWorker } = await import('./queues/notificationQueue');
    
    await stopNotificationWorker();
    await prisma.$disconnect();
    
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  server.close(async () => {
    const { stopNotificationWorker } = await import('./queues/notificationQueue');
    
    await stopNotificationWorker();
    await prisma.$disconnect();
    
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;