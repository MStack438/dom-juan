import type { Request, Response, NextFunction } from 'express';
import type { Session, SessionOptions } from 'express-session';
import session from 'express-session';
import { createRequire } from 'module';

declare module 'express-session' {
  interface SessionData {
    authenticated?: boolean;
  }
}

function buildSessionConfig(): SessionOptions {
  const baseConfig: SessionOptions = {
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

  // Use PostgreSQL session store in production (survives container restarts)
  if (process.env.DATABASE_URL) {
    try {
      // connect-pg-simple is CJS — use createRequire for ESM compatibility
      const require = createRequire(import.meta.url);
      const connectPgSimple = require('connect-pg-simple');
      const PgStore = connectPgSimple(session);
      baseConfig.store = new PgStore({
        conString: process.env.DATABASE_URL,
        tableName: 'user_sessions',
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 15, // Clean expired sessions every 15 min
      });
      console.log('[Session] Using PostgreSQL session store');
    } catch (err) {
      console.warn('[Session] Failed to load connect-pg-simple, falling back to memory store:', err);
    }
  } else {
    console.log('[Session] Using in-memory session store (no DATABASE_URL)');
  }

  return baseConfig;
}

export const sessionConfig = buildSessionConfig();

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
