# Child Development Platform

SENG 383 term project – Kardeşler Software.

A web-based decision support platform that brings parents, specialists and the child together around one shared schedule, task list and record of observations.

## Requirements

- Node.js 22 or later
- npm

## Project structure

```
client/   React (Vite) frontend – http://localhost:5173
server/   Express REST API + SQLite – http://localhost:3000
docs/     SRS, SDD and PMP
```

## Installation

```bash
# Backend
cd server
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npm run seed                # creates server/data/app.db with synthetic demo data

# Frontend
cd ../client
npm install
```

After pulling a change to `server/src/db/schema.sql`, run `npm run seed` again so your local database gets the new schema.

## Running

Open two terminals:

```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
cd client
npm run dev
```

Then open http://localhost:5173.

## Demo accounts

All accounts are synthetic and created by `npm run seed`. Password for all: `Password123`

| Email | Role |
|---|---|
| parent@example.com | Parent |
| teacher@example.com | Specialist (linked to Demo Child) |
| unlinked@example.com | Specialist (not linked) |
| child@example.com | Child |

Running `npm run seed` again resets the database to this demo data.

## Walking skeleton (v0.0)

http://localhost:5173/skeleton shows a sample task read from SQLite through the Express API.

## Tests

```bash
cd server
npm test        # Jest + Supertest, with coverage report

cd ../client
npm test        # Vitest
```

## Environment variables (`server/.env`)

| Variable | Description |
|---|---|
| `PORT` | Backend port (default `3000`) |
| `JWT_SECRET` | Secret used to sign login tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `1h` |
| `AI_PROVIDER` | AI summary provider: `mock` (fixed sample answer, used in tests and CI) or `gemini` |
| `AI_API_KEY` | Gemini API key, only needed when `AI_PROVIDER=gemini` |

`.env` is never committed; use `.env.example` as a template.
