# OT Instrument Tracker

A full-stack web application for tracking surgical instruments in an Operation Theatre. Built for hospital desktop use (local/on-prem), with mobile-friendly UI.

## Features

- 🔐 JWT Authentication with role-based access (Admin / Staff)
- 📊 Real-time Dashboard with Nepal timezone (Asia/Kathmandu) support
- 🔢 Instrument count tracking with Morning / Evening shifts
- ⏰ Shift time-window enforcement (Morning: 6 AM–12 PM | Evening: 12 PM–8 PM)
- ⚠️ Mismatch detection (actual vs expected counts)
- 🔧 Status tracking: Normal, Damage, Malfunction, Send to Repair
- 📥 Excel export per department + month (ExcelJS)
- 🖨️ Printable monthly report
- 👥 Staff management with block/unblock
- 🛡️ Rate limiting, bcrypt password hashing, server-side role checks

## Tech Stack

| Layer    | Technology                                          |
|----------|-----------------------------------------------------|
| Backend  | Node.js + Express + SQLite (better-sqlite3)         |
| Auth     | JWT + bcryptjs                                      |
| Export   | ExcelJS                                             |
| Frontend | React 18 + Vite + Tailwind CSS + React Router v6   |
| HTTP     | Axios                                               |

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
| GET    | /api/export/excel             | Download Excel (admin)           |
| GET    | /api/export/print             | Print report data (admin)        |

---

## Local Network Access (Hospital LAN)

To allow other devices on the same network to access the app:

1. Find your PC's local IP (e.g., `192.168.1.100`)
2. In `frontend/vite.config.js`, the `proxy` is set to `http://localhost:5000` — this is for development only
3. For production, configure your backend to listen on `0.0.0.0` (already done) and access from other devices at `http://192.168.1.100:5000`

---

## License

MIT
