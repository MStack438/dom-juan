import { Router, type Request, type Response } from 'express';
import session from 'express-session';
import { verifyPassword } from '../services/auth/auth.service.js';

const router = Router();

declare module 'express-session' {
  interface SessionData {
    authenticated?: boolean;
  }
}

router.post('/login', (req: Request, res: Response) => {
  const { password } = req.body as { password?: string };
  if (!password || typeof password !== 'string') {
    res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'Password is required' },
    });
    return;
  }
  if (!verifyPassword(password)) {
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid password' },
    });
    return;
  }
  (req.session as session.Session & { authenticated?: boolean }).authenticated =
    true;
  res.json({ success: true });
});

router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to logout' },
      });
      return;
    }
    res.json({ success: true });
  });
});

router.get('/status', (_req: Request, res: Response) => {
  const session = _req.session as session.Session & { authenticated?: boolean };
  res.json({ authenticated: Boolean(session?.authenticated) });
});

export default router;
