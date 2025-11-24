import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { initSocket } from './config/socket.js';
import { startTimeoutCheckJob } from './utils/cronJobs.js';
import studentRoutes from './routes/studentRoutes.js';
import interventionRoutes from './routes/interventionRoutes.js';
import logger from './utils/logger.js';
import { errorHandler } from './utils/errorHandler.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
}));
app.use(express.json());

// Initialize WebSocket
initSocket(server);

// Routes
app.use('/api', studentRoutes);
app.use('/api', interventionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

// Start cron jobs
startTimeoutCheckJob();

export default app;
