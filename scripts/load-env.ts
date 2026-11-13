import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Next.js loads `.env.local` for the app automatically, but scripts run through
 * `tsx` do not. Import this module first in any script that touches the database
 * or provider keys, so `npm run seed` sees the same variables as `npm run dev`.
 */
const file = resolve(process.cwd(), '.env.local');
if (existsSync(file)) process.loadEnvFile(file);
