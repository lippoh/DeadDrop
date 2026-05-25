import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { deadDropRoutes } from './modules/deaddrops/deaddrops.routes';
import { errorHandler } from './middleware/error.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { roomRoutes } from './modules/rooms/room.routes';
import { authMiddleware } from './middleware/auth.middleware';


export const app = express();

 
// ─── Middleware ───

// CORS: allow requests from the frontend
app.use(cors({
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

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
app.use('/api/auth', authRoutes);

// Room routes (protected)
app.use('/api/rooms', authMiddleware, roomRoutes);


// ─── Error Handler (MUST be last) ───

app.use(errorHandler);

export default app;