# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server with hot reload (tsx watch)
npm run build            # TypeScript compile to dist/
npm start                # Run compiled build (dist/server.js)
npm test                 # Run all tests (vitest run)
npm run test:watch       # Run tests in watch mode
npx vitest run src/modules/patients/patient.service.test.ts  # Run a single test file
npm run test:coverage    # Run tests with coverage (80% threshold on lines/functions/branches/statements)
npm run typecheck        # Type-check without emitting (tsc --noEmit)
npm run lint             # ESLint on src/

# Prisma (DATABASE_URL is assembled from DB_* env vars via prisma/load-env.ts)
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations on single tenant (uses DB_NAME from .env)
npm run prisma:migrate:all       # Migrate all tenants (reads prisma/tenants.json)
npm run prisma:migrate:all:dry   # Preview multi-tenant migration
```

## Architecture

**Multi-tenant Fastify API** — each clinic/client gets an isolated MySQL schema. Tenancy is controlled by the `DB_NAME` env var; the same codebase serves all clients.

### Request flow

`server.ts` → `buildApp()` in `app.ts` → Fastify plugins (cors, helmet, JWT) → route modules under `/api/v1/*`

All routes under a module share a common prefix and auth hook. Request bodies/params/query are validated with **Zod schemas** (not Fastify's built-in validation). Zod errors are caught in the global error handler in `app.ts` and returned as structured 400 responses.

### Module pattern

Each feature lives in `src/modules/<name>/` with:

- `<name>.schema.ts` — Zod schemas and inferred TypeScript types
- `<name>.service.ts` — Business logic, imports Prisma client from `src/database/`
- `<name>.routes.ts` — Fastify route definitions, calls service methods
- `index.ts` — Re-exports

Services are instantiated as singletons (`export const patientService = new PatientService()`).

### Auth

JWT via `@fastify/jwt`. The `authenticate` guard (`src/modules/auth/auth.guard.ts`) is attached as an `onRequest` hook at the module level. Token payload has `sub` and `role` fields.

### Error handling

Custom error hierarchy in `src/common/errors/`: `AppError` (base) → `NotFoundError`, `BadRequestError`, `UnauthorizedError`. The global error handler in `app.ts` handles both `ZodError` and `AppError` instances.

### Database / Prisma

- Prisma schema in `prisma/schema.prisma`, MySQL datasource
- `DATABASE_URL` is not stored directly — it's assembled at runtime from individual `DB_*` env vars in `src/config/env.ts` and `prisma/load-env.ts`
- Multi-tenant migrations use `prisma/migrate-all-tenants.ts` with a tenant list in `prisma/tenants.json`

## Testing

Tests use **Vitest** with a setup file (`tests/setup.ts`) that sets env vars before any app code loads. Tests mock Prisma via `tests/helpers/mock-prisma.ts` using `vi.mock()`. Integration tests use `tests/helpers/build-test-app.ts` which builds a lightweight Fastify instance (no cors/helmet) with JWT and the same error handler.

Test files are colocated with source: `src/**/*.test.ts` (also `tests/` for helpers/setup).
