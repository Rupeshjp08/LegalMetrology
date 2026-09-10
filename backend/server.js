import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import notificationRoutes from './routes/notificationRoutes.js';
import responseRoutes from './routes/responseRoutes.js';
import reinspectionRoutes from './routes/reinspectionRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/member4/notifications', notificationRoutes);
app.use('/api/member4/responses', responseRoutes);
app.use('/api/member4/reinspections', reinspectionRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', module: 'member4' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
