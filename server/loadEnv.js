/**
 * Loads ../.env before any other module is evaluated.
 *
 * ES `import` statements are hoisted, so calling dotenv.config() inside server.js would run
 * AFTER every service/db module had already read process.env at import time (DATABASE_URL,
 * FINNHUB_API_KEY, storage credentials…). Importing this file first guarantees the order.
 * Variables that are already set (Render/Railway/pm2/--env-file) are never overridden.
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });
