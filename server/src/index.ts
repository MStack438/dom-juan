import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Always load server/.env so the server uses the same env regardless of cwd (e.g. npm run from root vs server)
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import { sql } from 'drizzle-orm';
import { sessionConfig } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { db } from './db/index.js';
import authRoutes from './routes/auth.routes.js';
import trackingListRoutes from './routes/tracking-list.routes.js';
import listingRoutes from './routes/listing.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import regionRoutes from './routes/region.routes.js';
import scraperRoutes from './routes/scraper.routes.js';
import exportRoutes from './routes/export.routes.js';
import debugRoutes from './routes/debug.routes.js';
import { initializeScheduler } from './services/scraper/scheduler.service.js';

const app = express();
app.set('trust proxy', 1);
const PORT = parseInt(process.env.PORT || '5000', 10);

// Log every request and response status (so we can see if 403 is from our server or the proxy)
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`${req.method} ${req.url} → ${res.statusCode}`);
  });
  next();
});

// Helmet disabled in development to avoid 403 Forbidden on /api/* (strict cross-origin headers
// can block proxied requests from Vite). Use full Helmet in production.
if (process.env.NODE_ENV === 'production') {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
}
// In dev, allow the Vite dev server origin so direct API calls work; with proxy we're same-origin.
const corsOptions = {
  credentials: true,
  optionsSuccessStatus: 204,
  ...(process.env.NODE_ENV === 'development'
    ? { origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }
    : { origin: true }),
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(session(sessionConfig));

app.use('/api/auth', authRoutes);
app.use('/api/tracking-lists', trackingListRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/debug', debugRoutes);

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

initializeScheduler();

// Verify database connection on startup (log only; do not block)
db.execute(sql`SELECT 1`)
  .then(() => console.log('[DB] Connected'))
  .catch((err) => console.error('[DB] Connection failed:', err.message));

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
