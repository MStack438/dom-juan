import type { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd ? 'Internal server error' : err.message;
  const status = (err as Error & { status?: number }).status ?? 500;
  res.status(status).json({
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  });
}
