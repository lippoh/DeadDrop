import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { deadDropRoutes } from './modules/deaddrops/deaddrops.routes';
import { errorHandler } from './middleware/error.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { roomRoutes } from './modules/rooms/room.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { authLoginLimiter, authRegisterLimiter } from './middleware/rateLimiter';


export const app = express();


// ─── CORS ───

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowedPatterns = [
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /^https:\/\/.*\.vercel\.app$/,
    ];

    const isAllowed = allowedPatterns.some((pattern) => pattern.test(origin));

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};



 
// ─── Middleware ───

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Request logging (development only)
if (env.NODE_ENV === 'development') {
  app.use((req: Request, _res: Response, next) => {
    console.log(`[${req.method}] ${req.path}`);
    next();
  });
}


// ─── API Routes ───

// Health check endpoint (keep this!)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});
 
// Dead Drop API routes
app.use('/api/drops', deadDropRoutes);

// Rate limiting on auth endpoints
app.use('/api/auth/login', authLoginLimiter);
app.use('/api/auth/register', authRegisterLimiter);

// Auth routes (after rate limiters)
app.use('/api/auth', authRoutes);

// Room routes (protected)
app.use('/api/rooms', authMiddleware, roomRoutes);


// ─── Error Handler (MUST be last) ───

app.use(errorHandler);

export default app;