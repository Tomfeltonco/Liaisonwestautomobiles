# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- DB schema: `lib/db/src/schema.ts`
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- Generated hooks: `lib/api-client-react/src/generated/`
- Frontend pages: `artifacts/liaison-west/src/pages/`
- API routes: `artifacts/api-server/src/routes/`

## Architecture decisions

- Interest rate stored as percentage directly (6.9 = 6.9% APR) — display as `loan.interestRate.toFixed(1)%`
- Inspection auto-created when order is placed; inspector rotates via `orderId % 3`
- Chat polling: 3s `refetchInterval` via React Query; `useGetChatMessages` hook with `enabled: !!roomId`
- Auth: HMAC token in localStorage as `lw_token`; `setAuthTokenGetter` called at App startup
- Site settings stored in `site_settings` table (single row, id=1); seeded on first request

## Product

- **Public inventory browser** — filter/search luxury vehicles with AI match
- **Customer accounts** — location detection, verification status, order/loan history, inspection reports
- **Financing** — apply for loans with ID/SSN/credit verification; admin approve/decline with notes
- **Cart + checkout** — multi-payment-method checkout
- **Floating chat support** — customers chat with agents/admin; agents see a support queue; admin monitors all rooms
- **Admin panel** — inventory, users, agents, orders, loans (approve/decline), chat monitor, contact settings, payment settings

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
