
import { Request, Response, NextFunction } from 'express';


export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`[${new Date().toISOString()}] ERROR: ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Prisma unique constraint violation
  if (err.message.includes('Unique constraint')) {
    res.status(409).json({ error: 'Resource already exists' });
    return;
  }

  // Prisma record not found
  if (err.message.includes('Record to update not found') ||
      err.message.includes('Record to delete not found')) {
    res.status(404).json({ error: 'Resource not found' });
    return;
  }

  // JSON parse error (malformed request body)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Malformed JSON in request body' });
    return;
  }

  // Default: internal server error
  res.status(500).json({
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
}
