# CLAUDE.md — Backend (api-backend)

## Response Rules

- Be concise: skip preambles, summaries, and restating what was asked.
- Lead with code or actions, not explanations.
- Do NOT add comments, docstrings, or type annotations to unchanged code.
- Do NOT add error handling for impossible scenarios.
- Do NOT create helpers/abstractions for one-off operations.
- Do NOT refactor or "improve" surrounding code unless asked.
- Spanish is used for domain field names (nombre, apellido1, clinicaId). Keep it consistent.
- All responses about this project should be in English unless told otherwise.

## Commands

```bash
# Dev
npm run dev                    # tsx watch src/server.ts
npm run build                  # tsc → dist/
npm run typecheck              # tsc --noEmit
npm run lint                   # eslint src/

# Test
npm test                       # vitest run (all)
npm run test:watch             # vitest watch
npm run test:coverage          # vitest + coverage (80% threshold)
npx vitest run src/modules/<name>/<name>.service.test.ts  # single file

# Prisma — ALWAYS prefix with DATABASE_URL=$(npx tsx prisma/load-env.ts)
npm run prisma:generate        # generate client
npm run prisma:migrate         # migrate single tenant (uses DB_NAME from .env)
npm run prisma:migrate:all     # migrate all tenants (prisma/tenants.json)
npm run prisma:migrate:all:dry # dry-run multi-tenant
npm run prisma:studio          # GUI
npm run prisma:seed            # tsx prisma/seed.ts
```

**CRITICAL:** Never run bare `npx prisma ...`. DATABASE_URL is assembled at runtime from DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME via `prisma/load-env.ts`. Bare commands fail with P1012.

## Architecture

Multi-tenant Fastify API — one MySQL schema per clinic. Tenancy = `DB_NAME` env var.

### Request Flow

`server.ts` → `buildApp()` (app.ts) → plugins (cors, helmet, JWT) → `/api/v1/*` routes

### Module Pattern (src/modules/<name>/)

Every feature follows this structure:

| File | Purpose |
|------|---------|
| `<name>.schema.ts` | Zod schemas + inferred TS types |
| `<name>.service.ts` | Business logic, uses Prisma client from `src/database/` |
| `<name>.routes.ts` | Fastify route definitions, calls service |
| `index.ts` | Re-exports |

Services are singletons: `export const fooService = new FooService()`.

**Existing modules:** appointments, appointment-types, audit-log, auth, clinics, config, consultation-images, consultations, dashboard, features, patient-files, patients, professionals, reports, roles, treatments, users

### Auth

JWT via `@fastify/jwt`. Guard: `src/modules/auth/auth.guard.ts` → `authenticate` hook attached per module. Token payload: `{ sub, role }`.

### Validation

Zod schemas validate request body/params/query (not Fastify built-in). `ZodError` caught in global error handler (app.ts) → structured 400.

### Errors

`src/common/errors/`: `AppError` → `NotFoundError`, `BadRequestError`, `UnauthorizedError`. Global handler in `app.ts` handles both `ZodError` and `AppError`.

### Shared Code (src/common/)

- `errors/` — error classes
- `helpers/clinic-scope.ts` — extract clinic scope from request
- `middleware/error-handler.ts` — global error handler
- `schemas/pagination.schema.ts` — reusable pagination schema + types

### Database

- Schema: `prisma/schema.prisma` (MySQL)
- Multi-tenant migrations: `prisma/migrate-all-tenants.ts` + `prisma/tenants.json`
- Client: `src/database/prisma.ts`

## Testing

- **Vitest** with setup in `tests/setup.ts` (sets env vars before app loads)
- Mock Prisma: `tests/helpers/mock-prisma.ts` via `vi.mock()`
- Integration: `tests/helpers/build-test-app.ts` → lightweight Fastify (no cors/helmet) + JWT + error handler
- Test files colocated: `src/modules/<name>/<name>.{service,routes,schema}.test.ts`

## Common Tasks

### Create a new module

1. Create `src/modules/<name>/` with schema, service, routes, index files
2. Follow the patients module as reference (`src/modules/patients/`)
3. Register routes in `src/app.ts`
4. Run typecheck: `npm run typecheck`

### Add a new Prisma model

1. Edit `prisma/schema.prisma`
2. Run `npm run prisma:migrate` (creates migration for single tenant)
3. Run `npm run prisma:generate` (regenerate client)
4. Run `npm run prisma:migrate:all` when ready to apply to all tenants

### Add a new endpoint to existing module

1. Add Zod schema in `<name>.schema.ts`
2. Add service method in `<name>.service.ts`
3. Add route in `<name>.routes.ts` — parse with Zod, call service, return `{ success: true, data }`
4. Standard response format: `reply.send({ success: true, data })` or `{ success: true, ...paginatedResult }`

### Write tests for a module

1. Service tests: mock Prisma, test business logic
2. Route tests: use `build-test-app.ts`, test HTTP status + response shape
3. Schema tests: test valid/invalid inputs with Zod `.safeParse()`
4. Run: `npx vitest run src/modules/<name>/`

### Debug a failing migration

1. Check `prisma/schema.prisma` syntax
2. Run `npm run prisma:migrate` — read the error
3. If P1012: you forgot the DATABASE_URL prefix (use npm scripts, not bare npx)
4. If schema drift: `DATABASE_URL=$(npx tsx prisma/load-env.ts) npx prisma migrate resolve`
