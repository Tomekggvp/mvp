# Kanban MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a locally runnable React/TypeScript Kanban application with employee authentication, configurable managers and leads, transparent Expected GM optimization, manual drag-and-drop reassignment, and a Supabase-ready data layer.

**Architecture:** Use a monorepo with a Vite React frontend, an Express TypeScript API, and a separate Python analytics adapter. The backend exposes stable domain APIs and defaults to an in-memory/demo repository; a Supabase repository and SQL migrations can be enabled later without changing frontend contracts. The initial optimization algorithm is deterministic TypeScript code with a Python/OR-Tools-compatible contract so the app works without Python services.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, dnd-kit, Node.js, Express, Zod, Vitest, Python, pandas, OR-Tools-ready adapter, Supabase PostgreSQL/Auth-ready schema, Netlify, Render.

**Spec:** `docs/superpowers/specs/2026-09-21-kanban-mvp-design.md`

## Global Constraints

- The demo must run locally without Supabase credentials.
- The UI language is Russian and monetary values use BYN.
- The single MVP role is `employee` with access to the complete board.
- The demo seed contains 5 managers and about 70 leads, but production code must not hardcode those counts.
- Manager capacity and the global assignment limit are configurable; the default global limit is the sum of active manager capacities.
- Frontend communicates with the backend through REST only.
- Supabase secrets must be read from environment variables and never committed.
- The interface is compact and work-oriented, with no oversized marketing headings.
- Every behavior-changing task includes a focused automated test or a documented manual smoke check.

## Review Focus

- Zero managers: the board remains usable, optimization returns a clear “no active managers” error, and no lead is silently assigned.
- More leads than capacity: only the configured capacity is assigned; remaining leads stay unassigned and are counted.
- More managers than the demo seed: the UI creates a new column and the optimizer includes the manager without code changes.
- Sparse history: recommendations use smoothed fallback statistics rather than producing `NaN` or zero explanations.
- Manual move after optimization: the API preserves the original recommendation and returns the Expected GM delta.

### Task 1: Repository bootstrap and workspace scripts

**Files:**
- Create: `package.json`
- Create: `frontend/package.json`
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `backend/src/app.ts`
- Create: `backend/src/server.ts`
- Create: `backend/src/routes/health.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `README.md`
- Test: `backend/src/routes/health.test.ts`

**Interfaces:**
- Produces `GET /health` returning `{ status: "ok" }`.
- Produces root scripts `dev`, `build`, `test`, `dev:frontend`, and `dev:backend`.

- [ ] **Step 1: Write the failing health test**

```ts
it("returns an ok health response", async () => {
  const response = await request(app).get("/health");
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ status: "ok" });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- --run backend/src/routes/health.test.ts`
Expected: FAIL because the workspace has no backend application yet.

- [ ] **Step 3: Add workspace configuration and minimal Express app**

Configure npm workspaces, TypeScript, Vitest, Supertest, Express, CORS, and `tsx`. Keep frontend and backend dependency boundaries explicit. Add `.env.example` with `VITE_API_URL=http://localhost:3001`, `PORT=3001`, `DATA_SOURCE=demo`, and empty Supabase fields.

- [ ] **Step 4: Implement `/health` and the root scripts**

- [ ] **Step 5: Run the test and build**

Run: `npm test -- --run backend/src/routes/health.test.ts && npm run build`
Expected: PASS and both TypeScript projects compile.

- [ ] **Step 6: Commit**

```bash
git add package.json frontend backend .gitignore .env.example README.md
git commit -m "chore: bootstrap kanban monorepo"
```

### Task 2: Shared domain types and demo data

**Files:**
- Create: `backend/src/domain/types.ts`
- Create: `backend/src/domain/ids.ts`
- Create: `backend/src/data/demo-data.ts`
- Create: `backend/src/data/repository.ts`
- Create: `backend/src/data/demo-repository.ts`
- Test: `backend/src/data/demo-repository.test.ts`

**Interfaces:**
- `Manager { id, name, email, active, dailyCapacity, createdAt }`.
- `Lead { id, region, product, source, status, potentialAmount, createdAt }`.
- `NegotiationHistory { id, date, managerId, region, product, held, sold, saleAmount, grossMargin, discount }`.
- `Assignment { leadId, managerId, expectedProbability, expectedGm, recommendedManagerId, source, assignedAt }`.
- `Repository` methods: `listManagers`, `createManager`, `updateManager`, `listLeads`, `createLead`, `listHistory`, `getAssignments`, `saveAssignment`, `saveOptimizationRun`.

- [ ] **Step 1: Write tests for dynamic repository behavior**

Test that the demo repository loads 5 managers and 70 leads, accepts a sixth manager, accepts a new lead, and persists a manual assignment.

- [ ] **Step 2: Run repository tests and verify failure**

Run: `npm test -- --run backend/src/data/demo-repository.test.ts`
Expected: FAIL because the domain and repository are not implemented.

- [ ] **Step 3: Implement domain types and deterministic ID helpers**

Use string IDs, ISO timestamps, explicit enums for lead status, assignment source, regions, and products. Do not encode a maximum number of managers or leads.

- [ ] **Step 4: Implement seeded demo data**

Generate 70 leads and a sufficiently varied history deterministically from a fixed seed. Give managers different regional/product strengths and include recent records for form changes.

- [ ] **Step 5: Implement the in-memory repository**

Clone returned arrays to prevent route code from mutating repository state accidentally. Validate referenced manager and lead IDs before writes.

- [ ] **Step 6: Run tests and commit**

Run: `npm test -- --run backend/src/data/demo-repository.test.ts`
Expected: PASS.

```bash
git add backend/src/domain backend/src/data
git commit -m "feat: add configurable demo domain repository"
```

### Task 3: Expected GM calculation and assignment optimizer

**Files:**
- Create: `backend/src/analytics/statistics.ts`
- Create: `backend/src/analytics/expected-gm.ts`
- Create: `backend/src/analytics/optimizer.ts`
- Create: `backend/src/analytics/explanations.ts`
- Test: `backend/src/analytics/statistics.test.ts`
- Test: `backend/src/analytics/optimizer.test.ts`

**Interfaces:**
- `calculateManagerStats(history, managers, config): ManagerStat[]`.
- `scoreLeadForManager(lead, stat): Score`.
- `optimizeAssignments(leads, managers, scores, options): OptimizationResult`.
- `buildExplanation(score, stat): string`.

- [ ] **Step 1: Write failing tests for formula, smoothing, freshness, capacity, and zero-manager behavior**

Pin `expectedGm = probability * expectedGrossMarginOnSale`, 60/40 freshness weighting, fallback behavior with one observation, per-manager capacity, configurable global cap, and an explicit empty-manager result.

- [ ] **Step 2: Run analytics tests and verify failure**

Run: `npm test -- --run backend/src/analytics`
Expected: FAIL because the calculations do not exist.

- [ ] **Step 3: Implement aggregate statistics**

Compute manager/region/product, manager/product, region/product, product, and team aggregates. Blend narrow statistics with broader fallback levels based on observation count. Guard every division and return finite values.

- [ ] **Step 4: Implement scoring and explanations**

Return probability, expected sale amount, expected GM on sale, Expected GM, current load, and explanation text naming the strongest available signal and recent-form effect.

- [ ] **Step 5: Implement constrained greedy optimizer with deterministic tie-breaking**

Sort all lead-manager candidates by Expected GM, assign each lead once while respecting manager capacity and the global cap, then return assigned and unassigned lead IDs plus total Expected GM. Keep the function signature replaceable by a future OR-Tools adapter.

- [ ] **Step 6: Run tests and commit**

Run: `npm test -- --run backend/src/analytics`
Expected: PASS.

```bash
git add backend/src/analytics
git commit -m "feat: calculate expected GM and optimize assignments"
```

### Task 4: Authentication and backend services

**Files:**
- Create: `backend/src/auth/auth.types.ts`
- Create: `backend/src/auth/demo-auth.ts`
- Create: `backend/src/auth/auth.middleware.ts`
- Create: `backend/src/services/manager-service.ts`
- Create: `backend/src/services/lead-service.ts`
- Create: `backend/src/services/optimization-service.ts`
- Test: `backend/src/auth/auth.middleware.test.ts`
- Test: `backend/src/services/optimization-service.test.ts`

**Interfaces:**
- `POST /api/auth/login` accepts demo credentials and returns `{ token, user }`.
- `requireEmployee` attaches `req.user` or returns 401.
- Services depend on `Repository` and analytics functions, not Express request objects.

- [ ] **Step 1: Write failing tests for login, 401 protection, and optimization service**

Cover valid/invalid demo credentials, missing token, successful optimization using dynamic managers, and persistence of assignments and optimization run.

- [ ] **Step 2: Implement signed demo sessions**

Use a development-only secret from `DEMO_AUTH_SECRET`; document the demo email/password in README without treating them as production credentials. Keep the token format replaceable by Supabase JWT verification later.

- [ ] **Step 3: Implement services**

`ManagerService` adds and updates managers, `LeadService` adds static leads, and `OptimizationService` gathers repository data, scores candidates, runs optimization, persists assignments, and returns a complete board snapshot.

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- --run backend/src/auth backend/src/services`
Expected: PASS.

```bash
git add backend/src/auth backend/src/services
git commit -m "feat: add employee auth and domain services"
```

### Task 5: REST API and request validation

**Files:**
- Create: `backend/src/http/errors.ts`
- Create: `backend/src/http/validation.ts`
- Create: `backend/src/routes/auth.ts`
- Create: `backend/src/routes/managers.ts`
- Create: `backend/src/routes/leads.ts`
- Create: `backend/src/routes/optimization.ts`
- Create: `backend/src/routes/dashboard.ts`
- Modify: `backend/src/app.ts`
- Test: `backend/src/routes/api.integration.test.ts`

**Interfaces:**
- Implement the endpoints in the spec, including `POST/PATCH /api/managers`, `POST /api/leads`, `PATCH /api/leads/:id/assignment`, and dashboard summary.
- All mutations require `employee` auth.
- Errors use `{ error: { code, message, details? } }`.

- [ ] **Step 1: Write integration tests for the full API flow**

Login, fetch managers/leads, add a manager, add a lead, run optimization, fetch a lead detail with all manager scores, manually reassign it, and verify the Expected GM delta is returned.

- [ ] **Step 2: Run integration tests and verify failure**

Run: `npm test -- --run backend/src/routes/api.integration.test.ts`
Expected: FAIL because routes are not mounted.

- [ ] **Step 3: Add Zod schemas and centralized error handling**

Validate manager names/capacity, lead region/product/status, assignment manager IDs, and query filters. Return 400 for invalid input, 401 for missing auth, 404 for missing entities, and 409 for capacity violations on manual assignment when the policy disallows over-capacity moves.

- [ ] **Step 4: Mount routes and implement dashboard transformation**

Return a board snapshot shaped for the frontend: managers, columns, leads, assignments, KPI totals, and optimization metadata.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- --run backend/src/routes/api.integration.test.ts`
Expected: PASS.

```bash
git add backend/src/http backend/src/routes backend/src/app.ts
git commit -m "feat: expose authenticated kanban REST API"
```

### Task 6: Supabase schema and repository adapter

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/seed.sql`
- Create: `backend/src/data/supabase-repository.ts`
- Create: `backend/src/data/repository-factory.ts`
- Test: `backend/src/data/repository-contract.test.ts`

**Interfaces:**
- `createRepository(config): Repository` returns demo or Supabase implementation.
- Both repositories satisfy the same contract tests.

- [ ] **Step 1: Write repository contract tests**

Run the same create/list/update/assignment operations against the demo repository. Keep the Supabase adapter behind an environment-gated test so local tests do not require credentials.

- [ ] **Step 2: Create SQL schema**

Add tables for managers, leads, negotiation history, assignments, manager statistics, optimization runs, and auth metadata. Use generated UUIDs, timestamps, foreign keys, indexes on lead status and manager/region/product, and nullable assignment fields for unassigned leads.

- [ ] **Step 3: Add seed SQL**

Insert representative managers, leads, and history without assuming fixed production counts. The demo seed remains useful for Supabase previews.

- [ ] **Step 4: Implement the Supabase repository and factory**

Use `DATA_SOURCE=demo|supabase`. Keep service-role keys backend-only. Map database rows into the domain types and preserve the same validation behavior.

- [ ] **Step 5: Run local contract tests and commit**

Run: `npm test -- --run backend/src/data/repository-contract.test.ts`
Expected: PASS for demo mode; Supabase integration is skipped unless explicitly configured.

```bash
git add supabase backend/src/data/repository-factory.ts backend/src/data/supabase-repository.ts
git commit -m "feat: add Supabase-ready persistence"
```

### Task 7: Frontend shell, auth flow, and API client

**Files:**
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/session.ts`
- Create: `frontend/src/types.ts`
- Create: `frontend/src/pages/LoginPage.tsx`
- Create: `frontend/src/pages/BoardPage.tsx`
- Create: `frontend/src/components/AppShell.tsx`
- Create: `frontend/src/components/LoadingState.tsx`
- Create: `frontend/src/components/ErrorState.tsx`
- Create: `frontend/src/styles.css`
- Test: `frontend/src/lib/api.test.ts`

**Interfaces:**
- `api.login`, `api.getBoard`, `api.addManager`, `api.addLead`, `api.runOptimization`, `api.assignLead`, `api.getLeadDetail`.
- `BoardSnapshot` matches the backend dashboard response.

- [ ] **Step 1: Write failing API client tests**

Test token injection, JSON parsing, API error normalization, and redirect to login on 401.

- [ ] **Step 2: Configure Vite, Tailwind, and frontend test environment**

Use CSS variables for colors, spacing, borders, and typography. Add a non-system display accent only where useful, while keeping body text compact and readable.

- [ ] **Step 3: Implement API client and session state**

Persist the demo token in session storage, expose `login/logout/currentUser`, and keep server response types explicit.

- [ ] **Step 4: Implement login page and app shell**

Provide Russian labels, demo credentials helper text, accessible form errors, compact navigation, and logout.

- [ ] **Step 5: Run tests and build**

Run: `npm test -- --run frontend/src/lib/api.test.ts && npm run build --workspace frontend`
Expected: PASS and production build succeeds.

- [ ] **Step 6: Commit**

```bash
git add frontend
git commit -m "feat: add authenticated frontend shell"
```

### Task 8: Kanban board, manager management, and drag-and-drop

**Files:**
- Create: `frontend/src/components/KpiStrip.tsx`
- Create: `frontend/src/components/BoardToolbar.tsx`
- Create: `frontend/src/components/KanbanBoard.tsx`
- Create: `frontend/src/components/ManagerColumn.tsx`
- Create: `frontend/src/components/LeadCard.tsx`
- Create: `frontend/src/components/LeadDetailsDrawer.tsx`
- Create: `frontend/src/components/ManagerDialog.tsx`
- Create: `frontend/src/hooks/useBoard.ts`
- Create: `frontend/src/hooks/useDragAssignment.ts`
- Create: `frontend/src/utils/formatters.ts`
- Test: `frontend/src/components/LeadCard.test.tsx`

**Interfaces:**
- `KanbanBoard` renders a dynamic manager list plus `Не назначено`.
- `useBoard` owns fetch, filters, optimization, and optimistic/revalidated updates.
- `useDragAssignment` accepts `leadId` and destination manager ID and calls `api.assignLead`.

- [ ] **Step 1: Write component tests**

Test that a lead card displays region/product/Expected GM, an arbitrary added manager creates a column, unassigned leads render, and a manual assignment displays the returned delta.

- [ ] **Step 2: Implement the board data hook**

Load dashboard snapshot after login, keep filters client-side, expose loading/error states, and refresh after mutations.

- [ ] **Step 3: Implement compact visual system**

Use semantic HTML, CSS variables, restrained shadows, visible focus rings, responsive horizontal board scrolling, and no oversized headings. Use color only to distinguish Expected GM bands, statuses, and capacity warnings.

- [ ] **Step 4: Implement dynamic columns and cards**

Render all active managers returned by the API. Include per-column capacity and load. Keep lead cards compact but show the fields required by the spec.

- [ ] **Step 5: Add dnd-kit drag-and-drop**

Dragging a card to a manager calls manual assignment. Dragging to `Не назначено` clears the manager while preserving the recommendation. On success, show a small inline delta and refresh board totals.

- [ ] **Step 6: Add manager dialog and static lead form**

Allow adding/editing manager name, email, active state, and daily capacity. Allow adding a lead manually; leave the future service/import boundary in the API.

- [ ] **Step 7: Run tests and commit**

Run: `npm test -- --run frontend/src/components && npm run build --workspace frontend`
Expected: PASS and build succeeds.

```bash
git add frontend/src
git commit -m "feat: build dynamic kanban workspace"
```

### Task 9: Python analytics adapter and deployment configuration

**Files:**
- Create: `analytics/requirements.txt`
- Create: `analytics/README.md`
- Create: `analytics/src/prepare_features.py`
- Create: `analytics/src/optimize_assignments.py`
- Create: `analytics/tests/test_features.py`
- Create: `backend/src/analytics/python-adapter.ts`
- Create: `backend/Dockerfile`
- Create: `frontend/netlify.toml`
- Create: `render.yaml`
- Modify: `README.md`

**Interfaces:**
- Python CLI accepts JSON from stdin and returns JSON to stdout with the same score/assignment shape as the TypeScript optimizer.
- Node adapter is disabled by default and enabled only with `ANALYTICS_ENGINE=python`.

- [ ] **Step 1: Write Python feature tests**

Test grouped manager/region/product aggregates, finite fallback values, and JSON output shape.

- [ ] **Step 2: Implement the Python adapter contract**

Use pandas for feature preparation and keep OR-Tools integration behind a small function with the same capacity/global-limit arguments. The local Node optimizer remains the default so the app does not require Python to start.

- [ ] **Step 3: Add deployment configuration**

Configure frontend build/output and SPA redirects for Netlify, backend build/start/health settings for Render, and documented environment variables.

- [ ] **Step 4: Run Python tests and deployment builds**

Run: `python3 -m pytest analytics/tests -q && npm run build`
Expected: PASS and both frontend/backend builds succeed.

- [ ] **Step 5: Commit**

```bash
git add analytics backend/src/analytics/python-adapter.ts backend/Dockerfile frontend/netlify.toml render.yaml README.md
git commit -m "chore: add analytics adapter and deployment config"
```

### Task 10: End-to-end verification and delivery documentation

**Files:**
- Create: `docs/LOCAL_DEVELOPMENT.md`
- Create: `docs/API.md`
- Modify: `README.md`
- Test: `scripts/smoke-test.sh`

- [ ] **Step 1: Add local development documentation**

Document Node version, install, environment setup, demo credentials, concurrent frontend/backend startup, test commands, and optional Supabase configuration.

- [ ] **Step 2: Add API documentation**

Document auth, manager creation, lead creation, optimization, board snapshot, and manual assignment response including Expected GM delta.

- [ ] **Step 3: Add executable smoke test**

Start the backend in demo mode, login, fetch the board, add a manager, run optimization, assign a lead, and assert that all responses are successful and the assignment count never exceeds the computed capacity.

- [ ] **Step 4: Run the complete verification suite**

Run:

```bash
npm test
python3 -m pytest analytics/tests -q
npm run build
bash scripts/smoke-test.sh
git diff --check
```

Expected: all tests pass, both builds succeed, the smoke test completes, and `git diff --check` is clean.

- [ ] **Step 5: Commit**

```bash
git add docs README.md scripts
git commit -m "docs: document local kanban MVP and verification"
```

## Final Review Checklist

- [ ] No code path assumes exactly 5 managers or exactly 70 leads.
- [ ] Demo seed still provides 5 managers and about 70 leads for a meaningful first screen.
- [ ] Manager creation changes the number of Kanban columns without a frontend code change.
- [ ] Static lead creation works and leaves an explicit boundary for future service ingestion.
- [ ] Zero-manager, sparse-history, over-capacity, and manual-reassignment behaviors are tested.
- [ ] No Supabase secret appears in tracked files.
- [ ] The UI remains dense, legible, keyboard-accessible, and free of oversized headings.
