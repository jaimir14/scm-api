# API Backend

Backend API service built with **Fastify**, **Prisma**, **MySQL**, and **TypeScript**.

## Architecture

This is a multi-tenant API where each client (clinic/doctor) gets their own MySQL schema. The schema name is configured via environment variables, allowing the same codebase to serve different clients by simply changing the `DB_NAME`.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Fastify
- **ORM:** Prisma
- **Database:** MySQL (schema-per-tenant)
- **Auth:** JWT (`@fastify/jwt`)
- **Validation:** Zod

## Project Structure

```
src/
├── config/          # Environment variables and app configuration
├── common/          # Shared utilities, errors, middleware, schemas
│   ├── errors/      # Custom error classes
│   ├── middleware/   # Global middleware (error handler)
│   └── schemas/     # Shared validation schemas (pagination, etc.)
├── database/        # Prisma client instance
├── modules/         # Feature modules (domain-driven)
│   ├── auth/        # JWT token generation and guards
│   └── patients/    # Patient CRUD (schema, service, routes)
├── plugins/         # Fastify plugins (JWT, etc.)
├── types/           # TypeScript type declarations
├── app.ts           # App builder (plugins, routes, error handling)
└── server.ts        # Entry point (starts the server)
```

## Getting Started

### Prerequisites

- Node.js >= 18
- MySQL 8.x
- npm or yarn

### Installation

```bash
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

### Database Setup

Create the MySQL schema for your client, then run migrations:

```bash
# Create the schema in MySQL
mysql -u root -p -e "CREATE DATABASE clinic_client_001;"

# Run Prisma migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate
```

### Running

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Health Check
- `GET /health` — No auth required

### Auth (development/testing)
- `POST /api/v1/auth/token` — Generate a JWT token

### Patients (requires JWT)
- `GET /api/v1/patients` — List patients (paginated)
- `GET /api/v1/patients/:id` — Get a patient
- `POST /api/v1/patients` — Create a patient
- `PUT /api/v1/patients/:id` — Update a patient
- `DELETE /api/v1/patients/:id` — Delete a patient

## Multi-Tenancy

Each client deployment uses a different `DB_NAME` in the `.env` file. This maps to a separate MySQL schema, keeping all data fully isolated between clients.

```
Client A → DB_NAME=clinic_alpha    → MySQL schema: clinic_alpha
Client B → DB_NAME=clinic_beta     → MySQL schema: clinic_beta
Client C → DB_NAME=dr_smith_office → MySQL schema: dr_smith_office
```
