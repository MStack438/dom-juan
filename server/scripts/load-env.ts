/**
 * Load server/.env before any other server code that needs DATABASE_URL.
 * Import this first in scripts that run from repo root (e.g. npm run db:seed).
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
