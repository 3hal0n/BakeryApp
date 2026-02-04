# Project Phases & Next Steps

This document breaks the remaining work into clear phases, describes tasks per phase, suggested owners, acceptance criteria, and checklists for sensitive operations (EAS dev builds, push notifications, deploy).

---

**Phase 0 — Stabilize local development (1-2 days)**

- Goal: Ensure developers can run backend and mobile locally and reproduce core flows.
- Tasks:
  - Verify `backend/` runs with `npm run dev` and Prisma migrations succeed.
  - Ensure `mobile/` starts with `npx expo start` and can connect to backend API on local network.
  - Add or document exact env var names and example `.env.example` files for backend and mobile.
- Owners: Backend dev (Prisma/env), Mobile dev (Expo config)
- Acceptance:
  - Fresh clone + `npm install` + env -> both backend and mobile start without errors.

**Phase 1 — Feature finish & bug fixes (2–5 days depending on scope)**

- Goal: Complete remaining UI/UX and backend features; squash runtime errors.
- Tasks:
  - Finalize admin user management UI and API CRUD flows; test RBAC thoroughly.
  - Address any remaining runtime exceptions and TypeScript issues flagged during dev.
  - Add unit tests for critical backend routes (auth, users, notifications).
- Owners: Full-stack dev(s)
- Acceptance:
  - Admin user CRUD flows pass manual E2E and unit tests; role restrictions enforce properly.

**Phase 2 — Notifications & EAS dev builds (2–4 days)**

- Goal: Verify push notifications end-to-end using EAS dev clients and production-like push credentials.
- Tasks:
  - Prepare EAS: ensure repo root is clean (git), login to EAS, and configure `eas.json`.
  - Create EAS dev builds (iOS/Android) and install on test devices.
  - Register push tokens from the dev clients; test backend `/api/notifications/test` to send pushes.
  - Verify notifications appear in system notification center and are handled by app worker.
  - Document push credential steps (APNs key/certificate, Firebase config) and storage of secrets.
- EAS checklist (brief):
  1. Ensure working git repo at repository root.
 2. Install EAS CLI: `npm install -g eas-cli` or use `npx eas`.
 3. `eas login` and `eas whoami` to verify account.
 4. From repo root: `cd mobile` then `eas build:configure` (if needed) and `eas build --profile development --platform android`.
 5. Install dev build on device and confirm push token registration.
- Owners: Mobile dev, Backend dev (worker/queue)
- Acceptance:
  - A push sent from backend is delivered to device notification center and can be opened to the app.

**Phase 3 — QA & End-to-End testing (2–4 days)**

- Goal: Exhaustive manual and automated QA across roles and flows.
- Tasks:
  - Write and run integration tests where possible (auth flows, notifications enqueueing).
  - Manual QA matrix: Admin flows, Manager flows, Cashier flows, order processing, notifications, offline behaviors.
  - Security checks: JWT expiry behavior, input validation, rate limits for endpoints.
- Owners: QA and devs
- Acceptance:
  - QA checklist items passed and critical bugs resolved.

**Phase 4 — Production readiness & infra (2–5 days)**

- Goal: Prepare infra for production deployment and finalize secrets/config.
- Tasks:
  - Provision Postgres (managed) and object storage if needed.
  - Configure secrets (CI/CD secret store, environment variables) and document them.
  - Set up backup procedures and DB migrations plan.
  - Add health-check endpoints and basic readiness probes.
- Owners: DevOps / Backend dev
- Acceptance:
  - Staging environment provisioned and app deployable via CI.

**Phase 5 — CI/CD, Monitoring, and Deploy (3–7 days)**

- Goal: Automate builds and deployments, add logging/monitoring.
- Tasks:
  - Create CI pipeline (GitHub Actions or other) to run tests and build backend artifacts.
  - Automate production EAS builds if distributing that way, or configure app store pipelines.
  - Add logging (Pino, structured logs) and shipping (Log aggregation) and basic alerting.
- Owners: DevOps, lead dev
- Acceptance:
  - CI runs on PRs, tests pass, and production deploys via pipeline.

**Phase 6 — Launch & post-deploy (ongoing)**

- Goal: Monitor production, fix post-launch issues, iterate on UX.
- Tasks:
  - Monitor logs, error rates, and queue backlogs.
  - Collect feedback, prioritize bug fixes and enhancements.

---

Additional notes & detailed checklists

- Env vars: create `backend/.env.example` and `mobile/.env.example`. At minimum document: `DATABASE_URL`, `JWT_SECRET`, `EXPO_PUBLIC_API_URL` (or similar mobile config), and `NODE_ENV`.
- Security: Store secrets in a dedicated secret manager (GitHub Actions secrets, Azure Key Vault, AWS Secrets Manager), never commit `.env`.

Owners suggestions

- Backend dev: migrations, API stability, queue worker.
- Mobile dev: Expo/EAS builds, push integration, client-side flows.
- DevOps: infra provisioning, CI/CD, monitoring.
- QA: manual test plans and regression verification.

Estimated timeline (small team, 2–3 engineers): 2–4 weeks from stable developer environment to production deployment, depending on review cycles and app store timings.

---

If you'd like, I can:

- Create `backend/.env.example` and `mobile/.env.example` templates.
- Start a CI GitHub Actions workflow stub to run tests.
- Walk you through EAS dev build steps interactively.
