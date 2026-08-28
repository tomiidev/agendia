import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import errorHandler from './middleware/error';
import { connectDB } from './config/db';

// Import routes
import authRoutes from './modules/auth/routes';
import businessRoutes from './modules/businesses/routes';
import professionalRoutes from './modules/professionals/routes';
import serviceRoutes from './modules/services/routes';
import clientRoutes from './modules/clients/routes';
import appointmentRoutes from './modules/appointments/routes';
import availabilityRoutes from './modules/availability/routes';
import couponRoutes from './modules/coupons/routes';
import promotionRoutes from './modules/promotions/routes';
import reportRoutes from './modules/reports/routes';
import waitlistRoutes from './modules/waitlist/routes';
import quoteRequestRoutes from './modules/quote-requests/routes';
import publicRoutes from './modules/public/routes';
import slugRoutes from './modules/public/slug-routes';

const app = express();

// Database Connection Middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('[ERROR] Middleware DB connection failed:', error);
    res.status(500).json({ success: false, message: 'Error de conexión a la base de datos.' });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Demasiados intentos, intenta de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false, // Fix for Vercel proxy environment
});

// Enable CORS
app.use(
  cors({
    origin: true, // Allow all origins for development (Vercel serverless requires dynamic origin or cors)
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom lightweight cookie parser middleware to extract JWT from httpOnly cookies
app.use((req: any, res, next) => {
  const cookieHeader = req.headers.cookie || '';
  req.cookies = cookieHeader.split(';').reduce((acc: any, cookieStr: string) => {
    const parts = cookieStr.trim().split('=');
    const key = parts[0];
    const value = parts.slice(1).join('=');
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {});
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Versioned API Routes mount points
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/businesses', businessRoutes);
app.use('/api/v1/professionals', professionalRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/availability', availabilityRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/promotions', promotionRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/waitlist', waitlistRoutes);
app.use('/api/v1/quote-requests', quoteRequestRoutes);
app.use('/api/v1/public/by-slug', slugRoutes);
app.use('/api/v1/public/:businessId', publicRoutes);
// Mount new standalone routes
app.use('/api/v1/public', require('./modules/public/standalone-routes').default);

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
