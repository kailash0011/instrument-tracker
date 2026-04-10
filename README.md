# OT Instrument Tracker

A full-stack web application for tracking surgical instruments in an Operation Theatre. Built for hospital desktop use (local/on-prem), with mobile-friendly UI.

![CI](https://github.com/kailash0011/instrument-tracker/actions/workflows/ci.yml/badge.svg)

## Features

- 🔐 JWT Authentication with role-based access (Admin / Staff)
- 📊 Real-time Dashboard with Nepal timezone (Asia/Kathmandu) support
- 📈 Chart-based visualisations: daily summary bar chart & session-completion donut chart
- 🌙 Dark mode toggle with `localStorage` persistence and system-preference fallback
- 💾 UI state persistence via `localStorage` (last-used department, in-progress count entries)
- 🔢 Instrument count tracking with Morning / Evening shifts
- ⏰ Shift time-window enforcement (Morning: 6 AM–12 PM | Evening: 12 PM–8 PM)
- ⚠️ Mismatch detection (actual vs expected counts)
- 🔧 Status tracking: Normal, Damage, Malfunction, Send to Repair
- 📥 Excel export per department + month (ExcelJS)
- 🖨️ Printable monthly report
- 👥 Staff management with block/unblock
- 🛡️ Rate limiting, bcrypt password hashing, server-side role checks

## Tech Stack

| Layer    | Technology                                                    |
|----------|---------------------------------------------------------------|
| Backend  | Node.js + Express + SQLite (better-sqlite3)                   |
| Auth     | JWT + bcryptjs                                                |
| Export   | ExcelJS                                                       |
| Frontend | React 18 + Vite + Tailwind CSS (dark mode) + React Router v6 |
| Charts   | Recharts                                                      |
| HTTP     | Axios + service-layer cache                                   |
| CI/CD    | GitHub Actions                                                |

---

## Prerequisites

- **Node.js 18+** (download from https://nodejs.org)
- No database setup required — SQLite file is created automatically on first run.

---

## Installation & Running

### 1. Install dependencies

```bash
# From the repository root
npm install
npm run install:all
```

### 2. Start in development mode

```bash
npm run dev
```

This starts both:
- **Backend API** at http://localhost:5000
- **Frontend app** at http://localhost:3000 (open this in a browser)

### 3. Production mode

```bash
# Build frontend
cd frontend && npm run build && cd ..

# Start both servers
npm start
```

---

## Default Admin Credentials

| Field    | Value    |
|----------|----------|
| Username | `Admin`  |
| Password | `Admin123` |

> Staff accounts are created via the Sign Up page.

---

## Data Storage

All data is stored in a **local SQLite database file**:

```
backend/data/instrument_tracker.db
```

This file is created automatically on first startup. It can be backed up by simply copying this file.

**To reset all data:** delete `backend/data/instrument_tracker.db` and restart the server. Default seed data (departments, instruments, admin account) will be recreated.

---

## Browser localStorage Persistence

In addition to the SQLite database, the frontend stores lightweight UI state in the browser's `localStorage` so that user preferences and in-progress work survive a page refresh without requiring data to be re-entered.

### What is stored

All keys are namespaced with the prefix `instrument-tracker:` to avoid collisions.

| localStorage key | Content | When written | When cleared |
|---|---|---|---|
| `instrument-tracker:count:selectedDept` | Last selected department ID on the Count page | On every department selection change | Never (updates on re-selection) |
| `instrument-tracker:count:entries:<sessionId>` | In-progress count entries for the active session (actual counts, statuses, remarks) | On every entry edit while a session is open | When the session is submitted |
| `instrument-tracker:manage:selectedDept` | Last selected department ID on the Manage Instruments page | On every department selection change | When no department is selected |
| `theme` | UI colour theme (`"light"` or `"dark"`) | On every theme toggle | Never |
| `token` | JWT auth token | On login / signup | On logout |
| `user` | Logged-in user info (JSON) | On login / signup | On logout |

> **Note:** Instrument counts, session history, and all business data are stored exclusively in the SQLite database on the server and are not duplicated in localStorage.

### Behaviour on page refresh

- The last-used **department** is automatically re-selected on the Count page and the Manage Instruments page.
- Any **in-progress count entries** edited but not yet debounce-saved to the server are restored when you re-open the same session (click *Start Count* again for the same shift/department/date).
- After a session is **submitted**, its localStorage entries are cleared.

### Data scope and privacy

localStorage is **browser-local** — the data is stored only on the device and browser used to access the app. It is not synced across devices or users.

### How to reset / clear localStorage data

Open your browser's developer tools, go to **Application → Local Storage**, select the app origin, and delete the relevant keys (all prefixed `instrument-tracker:`), or run the following in the browser console:

```js
Object.keys(localStorage)
  .filter(k => k.startsWith('instrument-tracker:'))
  .forEach(k => localStorage.removeItem(k))
```

Clearing localStorage only resets UI preferences. All submitted count data remains intact in the SQLite database.

### Corrupted entries

The storage utility wraps every read with a `try/catch` around `JSON.parse`. If a stored value is malformed, the fallback value is used silently and the app continues to function normally.

---

## Default Departments & Instruments (Seed Data)

| Department        | Instruments (examples)                                  |
|-------------------|---------------------------------------------------------|
| Surgery           | Scalpel Handle, Tissue Forceps, Artery Forceps (×10), Needle Holder, Scissors, Retractors, Suction Tip, Towel Clips |
| Gyane             | Sims Speculum, Uterine Dilators, Vulsellum Forceps, Uterine Sound, Curette, Ovum Forceps, Volsellum, Flushing Curette |
| Ortho             | Bone Mallet, Bone Chisel, Periosteal Elevator, Bone Holding Forceps, Retractors, Drill, Gigli Saw, Bone File |
| Extra Instruments | Instrument Trolley, Mayo Stand, Basin Set, Drape Clamps, Sponge Holding Forceps, Bowl Set |
| Sutures           | Vicryl 0, Vicryl 1, Chromic 0, Silk 0, Prolene 0, Nylon, PDS, Mersilene |

---

## Shift Time Windows (Nepal Time, UTC+5:45)

| Shift   | Allowed Hours        |
|---------|----------------------|
| Morning | 06:00 AM – 12:00 PM  |
| Evening | 12:00 PM – 08:00 PM  |

Accessing a shift outside its time window is denied for that day.  
One submission per day + shift + department is allowed.

---

## Admin: Reset Staff Password

If a staff member forgets their password, the admin can reset it from the **Manage Staff** page:

1. Log in as Admin.
2. Go to **Manage Staff** in the navbar.
3. Click **Reset Password** next to the staff member's row.
4. Confirm the prompt — a random 8-character temporary password is generated.
5. The temporary password is shown **once** on screen. Share it with the staff member verbally or on paper.
6. The staff member can log in immediately with the temporary password.

> **Security note:** Passwords are never stored in plaintext — only a bcrypt hash is saved. The temporary password is shown once to the admin immediately after reset and is not stored anywhere. Once you dismiss the banner, the password cannot be retrieved again.

---

## Export Usage (Admin only)

1. Log in as Admin
2. Go to **Export** in the navbar
3. Select a **Department** from the dropdown
4. Select **Year-Month** (e.g., 2026-04)
5. Click **Download Excel** — an `.xlsx` file is downloaded containing all sessions and count entries for that month

---

## Print View Usage (Admin only)

1. Go to **Print** in the navbar
2. Select **Department** and **Year-Month**
3. Click **Load Report**
4. Review the report showing daily counts, who counted, mismatch summary
5. Click **Print** to send to printer

---

## API Endpoints

| Method | Route                         | Description                      |
|--------|-------------------------------|----------------------------------|
| POST   | /api/auth/signup              | Register new staff               |
| POST   | /api/auth/login               | Login                            |
| GET    | /api/auth/me                  | Current user info                |
| GET    | /api/departments              | List departments                 |
| POST   | /api/departments              | Add department (admin)           |
| PUT    | /api/departments/:id          | Update department (admin)        |
| DELETE | /api/departments/:id          | Delete department (admin)        |
| GET    | /api/instruments              | List instruments by dept         |
| POST   | /api/instruments              | Add instrument (admin)           |
| PUT    | /api/instruments/:id          | Update instrument (admin)        |
| DELETE | /api/instruments/:id          | Delete instrument (admin)        |
| POST   | /api/counts/check             | Check if session exists          |
| POST   | /api/counts/session           | Create/get count session         |
| GET    | /api/counts/session/:id       | Get session details              |
| PUT    | /api/counts/entry             | Save/update a count entry        |
| POST   | /api/counts/submit/:id        | Submit and lock session          |
| GET    | /api/counts/dashboard         | Dashboard summary (today)        |
| GET    | /api/counts/history           | Monthly history for export       |
| GET    | /api/staff                    | List staff (admin)               |
| PUT    | /api/staff/:id/block          | Block staff login (admin)        |
| PUT    | /api/staff/:id/unblock        | Unblock staff login (admin)      |
| PUT    | /api/staff/:id/reset-password | Reset staff password (admin)     |
| GET    | /api/export/excel             | Download Excel (admin)           |
| GET    | /api/export/print             | Print report data (admin)        |

---

## Local Network Access (Hospital LAN)

To allow other devices on the same network to access the app:

1. Find your PC's local IP (e.g., `192.168.1.100`)
2. In `frontend/vite.config.js`, the `proxy` is set to `http://localhost:5000` — this is for development only
3. For production, configure your backend to listen on `0.0.0.0` (already done) and access from other devices at `http://192.168.1.100:5000`

---

## CI / CD

### GitHub Actions workflows

| Workflow | File | Triggers |
|----------|------|----------|
| **CI** | `.github/workflows/ci.yml` | Every push & pull-request to `main` |
| **Deploy** | `.github/workflows/deploy.yml` | Manual (`workflow_dispatch`) or un-comment auto-trigger |

#### CI workflow (`ci.yml`)

Runs on every push/PR to `main`:

1. **Frontend** — `npm ci` → `npm run lint` → `npm run build`
2. **Backend** — `npm ci` → validates `package.json` + entry point

Both jobs use `actions/setup-node@v4` with npm caching keyed to each `package-lock.json` for fast, deterministic runs.

#### Running checks locally

```bash
# Frontend
cd frontend
npm ci
npm run lint     # ESLint (fails on >5 warnings)
npm run build    # Vite production build

# Backend
cd backend
npm ci
node -e "require('./package.json')"   # validates JSON
```

#### Deploy workflow (`deploy.yml`)

A scaffold you customise for your hosting target. Trigger it manually from the GitHub Actions UI.

**Built-in options (uncomment the relevant block in the file):**

| Target | Description |
|--------|-------------|
| SSH / rsync | Deploy to a VPS or on-prem server with `appleboy/ssh-action` |
| Render.com | Trigger a deploy hook URL |
| GitHub Pages | Publish `frontend/dist/` via `peaceiris/actions-gh-pages` |
| Cloud (AWS/GCP/Azure) | Add provider-specific steps and secrets |

**Required secrets** (add in _Settings → Secrets and variables → Actions_):

| Secret | Used by | Description |
|--------|---------|-------------|
| `VITE_API_BASE_URL` | Deploy | Override API base URL for production builds |
| `DEPLOY_HOST` | SSH option | Target server hostname/IP |
| `DEPLOY_USER` | SSH option | SSH username |
| `DEPLOY_SSH_KEY` | SSH option | Private SSH key |
| `RENDER_DEPLOY_HOOK_URL` | Render option | Render deploy hook URL |

---

## License

MIT
