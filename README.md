# BakeryApp

Short description: BakeryApp is a full-stack bakery point-of-sale and management application with a TypeScript/Node backend (Express + Prisma) and an Expo React Native mobile client.

## Repository layout

- `backend/` — Node + TypeScript backend (Express, Prisma). Listens on port `5000` in local dev.
- `mobile/` — Expo React Native mobile app (Expo Router, React Query, MMKV fallback to AsyncStorage).
- `docs/` — project documentation.

---

## Prerequisites

- Node.js (LTS, e.g., 18+)
- npm or pnpm
- Expo CLI / EAS CLI (for builds) — installed globally or via `npx`
- PostgreSQL (local or remote) for Prisma `DATABASE_URL`

Windows PowerShell examples are shown below.

## Backend: quick start (local dev)

1. Install dependencies

```powershell
cd backend
npm install
```

2. Configure environment variables (create a `.env` file in `backend/` with at least):

- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` — secret for signing tokens
- `PORT` — optional (default 5000)

3. Run Prisma migrations (creates/updates local DB schema) and optional seed

```powershell
npm run prisma:migrate
npm run seed   # if you want sample data
```

4. Start the backend server (in dev)

```powershell
npm run dev
```

Notes:
- Backend scripts available in `backend/package.json`: `dev`, `test`, `seed`, `prisma:migrate`, `prisma:studio`.

## Mobile (Expo): quick start (local dev)

1. Install dependencies

```powershell
cd mobile
npm install
```

2. Configure runtime API URL

- The mobile app expects the backend API URL to be reachable from the device. Edit the appropriate config or env file in `mobile/` to point to your machine (e.g., `http://192.168.1.8:5000/api`). Use your PC's LAN IP for physical devices.

	- File to update: if your project uses a hard-coded API constant, it is commonly located at `mobile/services/api.ts` (or similar). Update the `API_URL` (or equivalent) string to use your machine's LAN IP so a phone on the same Wi‑Fi can reach the backend.

	- How to find your Windows LAN IP (PowerShell):

```powershell
ipconfig | Select-String "IPv4" -Context 0,0
```

	- Example change in `mobile/services/api.ts`:

```ts
// before
export const API_URL = "http://localhost:5000/api";

// after (replace 192.168.1.8 with your PC's IPv4 address)
export const API_URL = "http://192.168.1.8:5000/api";
```

	- Alternatively, store the URL in an env file or Expo config (recommended). For example, in an env file or `app.config.js` set `EXPO_PUBLIC_API_URL` and use it in code so you don't commit local IPs.

	- Troubleshooting: ensure your firewall allows incoming connections on the backend port (e.g., 5000) and both devices are on the same network.

3. Start Expo (development)

```powershell
npx expo start
```

Notes on push notifications:
- Expo Go cannot show native system push notifications for production push flows. To test system notifications (notification center), build an EAS development client (see `docs/ProjectPhases.md` for an EAS checklist). Local in-app notifications and scheduling are available in Expo Go and in-app UI.

## Testing

- Backend tests: from `backend/` run `npm test` (Jest).
- Manual E2E: log in as an admin, create users, send/test notifications using the mobile test UI or backend `/api/notifications/test` endpoint.

## Useful commands

Backend (from repo root):

```powershell
cd backend; npm install; npm run dev
```

Mobile (from repo root):

```powershell
cd mobile; npm install; npx expo start
```

## Deployment notes

- Push-notifications require a proper build (EAS) and push credentials (Apple/Google). See `docs/ProjectPhases.md` Phase: EAS + Push.
- Configure production database and secrets before deploying.
- Notifications now use Prisma/Postgres directly (no Redis/external queue service required).

## Contributing

- Follow the `docs/ProjectPhases.md` checklists when working on features and releases.

---

If you want, I can now create the `docs/ProjectPhases.md` file that lists phases, detailed tasks, checklists, owners, and acceptance criteria.
