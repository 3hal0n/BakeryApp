# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
 
---

## Local development — run locally

Follow these steps to run the backend and the mobile app on your machine or device.

### Prerequisites

- **Node.js** (v16+ recommended)
- **npm** (or yarn/pnpm)
- **Expo CLI** (optional: `npm install -g expo-cli`)
- Android Studio (for Android emulator) or a physical device with Expo Go
- If you plan to run the backend locally: Postgres (or the DB configured in `backend/.env`) and `npx prisma` available

### Backend — start locally

1. Open a terminal and start the backend dev server (PowerShell example):

```powershell
cd ..\backend
npm install
# create a .env with your database and secret settings, or copy from .env.example
# Example minimal env (do NOT commit secrets):
# PORT=5000
# DATABASE_URL=postgresql://user:pass@localhost:5432/bakery
# JWT_SECRET=your_jwt_secret

npm run dev
```

The backend dev script runs `ts-node src/server.ts` (server defaults to port `5000`).

If you use Prisma migrations:

```powershell
npx prisma generate
npx prisma migrate dev
npm run seed   # if your project includes a seed script
```

### Mobile — configure API URL

The mobile app talks to the backend via a base URL in `mobile/services/api.ts` (or an environment constant). Set the correct address depending on where you run the app:

- Running on Android emulator (Android Studio): use `http://10.0.2.2:5000`
- Running on iOS simulator (macOS): use `http://localhost:5000`
- Running on a physical device over local Wi-Fi: use your machine's LAN IP such as `http://192.168.1.42:5000`

Update the base URL in `mobile/services/api.ts` or create a simple `.env` loader for your environment. Ensure the backend is reachable from the device/emulator.

### Install mobile deps and start Expo

Open a second terminal for the mobile app (PowerShell example):

```powershell
cd mobile
npm install
npx expo start
```

Then use the Expo dev tools to open on an emulator or a real device (scan the QR code with Expo Go).

### Run on Android emulator (example)

1. Start an Android emulator (Android Studio > AVD Manager) or connect a device via USB with USB debugging enabled.
2. In the Expo dev tools, choose `Run on Android device/emulator` or run:

```powershell
npx expo run:android
```

### Troubleshooting

#### Network request failed / Cannot connect to backend

This is the most common issue. The mobile app cannot reach your backend server.

**Step 1: Verify your machine's IP address**

Run this command in PowerShell to find your current IP:

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike '*Loopback*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object IPAddress, InterfaceAlias
```

Look for your Wi-Fi adapter's IP (e.g., `192.168.1.9`).

**Step 2: Update the API URL in your mobile app**

Edit `mobile/services/api.ts` and change the `API_URL` constant:

```typescript
// For physical device on the same Wi-Fi:
const API_URL = 'http://192.168.1.9:5000/api'; // Use YOUR machine's IP

// For Android emulator:
const API_URL = 'http://10.0.2.2:5000/api';

// For iOS simulator:
const API_URL = 'http://localhost:5000/api';
```

**Step 3: Verify the backend is running**

Check that the backend dev server is running on port 5000:

```powershell
cd backend
npm run dev
```

You should see: `Server running on port 5000`

**Step 4: Test the backend directly**

From PowerShell, test if the backend is responding:

```powershell
curl http://localhost:5000/health
```

Should return: `{"status":"ok","timestamp":"..."}`

**Step 5: Check firewall settings**

If using a physical device, Windows Firewall may block incoming connections. Allow Node.js through the firewall:

1. Search "Windows Defender Firewall" → "Allow an app through firewall"
2. Find "Node.js" and check both Private and Public networks
3. Or temporarily disable firewall to test

**Step 6: Restart Metro bundler**

After changing the API URL, reload the app:
- Shake the device or press `Ctrl+M` (Android) / `Cmd+D` (iOS)
- Select "Reload"

Or restart Expo:

```powershell
npx expo start -c
```

#### Prisma EPERM errors

The `EPERM: operation not permitted, rename` error occurs when:
- A process (VS Code, terminal, dev server) has the Prisma client file locked
- You're trying to regenerate while the dev server is running

**Solution:**
1. Stop the backend dev server (`Ctrl+C`)
2. Close any terminals or VS Code instances that might be locking the file
3. Run `npx prisma generate` again
4. Restart the dev server

**You only need to run Prisma commands when:**
- ✅ You change `schema.prisma` → run `npx prisma migrate dev`
- ✅ After pulling new migrations → run `npx prisma migrate dev`
- ❌ You do NOT need to run Prisma commands every time you start the app

#### Other common issues

- **Metro bundler stalls:** Clear cache with `npx expo start -c`
- **Device not detected:** Use `adb devices` to confirm Android device/emulator is visible
- **Build errors after npm install:** Try deleting `node_modules` and reinstalling:
  ```powershell
  Remove-Item -Recurse -Force node_modules
  npm install
  ```

### Quick checklist

- Backend running: `npm run dev` (port 5000)
- Mobile dependencies installed: `npm install` in `mobile`
- API base URL set correctly for your device
- Start Expo: `npx expo start`

---

If you'd like, I can also add a small `mobile/.env.example` and a short script to toggle API URLs for emulator vs device.
