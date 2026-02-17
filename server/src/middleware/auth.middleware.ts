import type { Request, Response, NextFunction } from 'express';
import type { Session } from 'express-session';

declare module 'express-session' {
  interface SessionData {
    authenticated?: boolean;
  }
}

export const sessionConfig = {
  secret: process.env.SESSION_SECRET ?? 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const session = req.session as Session & { authenticated?: boolean };
  if (session?.authenticated) {
    next();
    return;
  }
  res.status(401).json({
    error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
  });
}
