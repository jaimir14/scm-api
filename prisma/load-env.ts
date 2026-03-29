/**
 * Loads individual DB_* env vars and assembles DATABASE_URL for Prisma CLI.
 * Prisma requires a connection URL — this script builds it from your .env
 * so you never have to write or maintain DATABASE_URL manually.
 *
 * Used via: tsx prisma/load-env.ts && prisma migrate dev
 */
import 'dotenv/config';

const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;

if (!DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.error('Missing required DB_USER, DB_PASSWORD, or DB_NAME in .env');
  process.exit(1);
}

const host = DB_HOST || 'localhost';
const port = DB_PORT || '3306';
const url = `mysql://${DB_USER}:${DB_PASSWORD}@${host}:${port}/${DB_NAME}`;

console.log(url);
