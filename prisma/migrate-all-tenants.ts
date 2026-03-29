/**
 * Runs `prisma migrate deploy` against all tenant schemas.
 *
 * Tenant list is loaded from prisma/tenants.json.
 * DB credentials come from .env (DB_USER, DB_PASSWORD, DB_HOST, DB_PORT).
 *
 * Usage:
 *   npx tsx prisma/migrate-all-tenants.ts
 *   npx tsx prisma/migrate-all-tenants.ts --dry-run   (preview only, no migrations)
 */
import 'dotenv/config';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

interface TenantsConfig {
  tenants: {
    name: string;
    schema: string;
  }[];
}

const { DB_USER, DB_PASSWORD, DB_HOST = 'localhost', DB_PORT = '3306' } = process.env;

if (!DB_USER || !DB_PASSWORD) {
  console.error('Missing DB_USER or DB_PASSWORD in .env');
  process.exit(1);
}

// Load tenant list
const tenantsPath = resolve(__dirname, 'tenants.json');
let config: TenantsConfig;

try {
  config = JSON.parse(readFileSync(tenantsPath, 'utf-8'));
} catch {
  console.error(`Could not read ${tenantsPath}`);
  console.error('Create prisma/tenants.json with your tenant list. See tenants.example.json.');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');
const results: { name: string; schema: string; status: 'success' | 'failed'; error?: string }[] =
  [];

console.log(`\nMigrating ${config.tenants.length} tenant(s)...\n`);

for (const tenant of config.tenants) {
  const url = `mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${tenant.schema}`;

  console.log(`--- ${tenant.name} (${tenant.schema}) ---`);

  if (dryRun) {
    console.log(
      `  [DRY RUN] Would run: DATABASE_URL=mysql://***@${DB_HOST}:${DB_PORT}/${tenant.schema} prisma migrate deploy\n`,
    );
    results.push({ name: tenant.name, schema: tenant.schema, status: 'success' });
    continue;
  }

  try {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: url },
      stdio: 'inherit',
    });
    results.push({ name: tenant.name, schema: tenant.schema, status: 'success' });
    console.log(`  ✓ Done\n`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({ name: tenant.name, schema: tenant.schema, status: 'failed', error: message });
    console.error(`  ✗ Failed: ${message}\n`);
  }
}

// Summary
console.log('\n========== SUMMARY ==========');
const succeeded = results.filter((r) => r.status === 'success');
const failed = results.filter((r) => r.status === 'failed');

console.log(`Total: ${results.length} | Success: ${succeeded.length} | Failed: ${failed.length}`);

if (failed.length > 0) {
  console.log('\nFailed tenants:');
  for (const f of failed) {
    console.log(`  - ${f.name} (${f.schema})`);
  }
  process.exit(1);
}
