import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { sessionConfig } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import trackingListRoutes from './routes/tracking-list.routes.js';
import listingRoutes from './routes/listing.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import regionRoutes from './routes/region.routes.js';
import scraperRoutes from './routes/scraper.routes.js';
import exportRoutes from './routes/export.routes.js';
import { initializeScheduler } from './services/scraper/scheduler.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set('trust proxy', 1);
const PORT = parseInt(process.env.PORT || '5000', 10);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(session(sessionConfig));

app.use('/api/auth', authRoutes);
app.use('/api/tracking-lists', trackingListRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/export', exportRoutes);

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

initializeScheduler();

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
