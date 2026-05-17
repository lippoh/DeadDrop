import express, { Request, Response } from 'express';
import cors from 'cors';

export const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

export default app;