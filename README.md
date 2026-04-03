# OT Instrument Tracker

A full-stack web application for tracking surgical instruments in an Operation Theatre.

## Features

- 🔐 JWT Authentication with role-based access (Admin/Staff)
- 📊 Real-time Dashboard with Nepal timezone support
- 🔢 Instrument count tracking with morning/evening shifts
- ⚠️ Mismatch detection (actual vs expected counts)
- 🔧 Status tracking: Normal, Damage, Malfunction, Send to Repair
- 📥 Excel export with ExcelJS
- 🖨️ Print view for monthly reports
- 👥 Staff management with block/unblock

## Tech Stack

**Backend:** Node.js + Express + SQLite (better-sqlite3) + JWT + bcryptjs + exceljs  
**Frontend:** React 18 + Vite + Tailwind CSS + React Router v6 + Axios

## Setup

### Prerequisites
- Node.js 18+

### Installation

```bash
# Install root dependencies
npm install

# Install backend + frontend dependencies
npm run install:all
```

### Running the Application

```bash
# Development mode (both backend + frontend)
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

## Default Admin Credentials

- **Username:** Admin  
- **Password:** Admin123

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/signup | Register |
| GET | /api/auth/me | Current user |
| GET | /api/departments | List departments |
| POST | /api/departments | Add department (admin) |
| GET | /api/instruments | List instruments |
| POST | /api/counts/session | Create/get count session |
| PUT | /api/counts/entry | Save count entry |
| POST | /api/counts/submit/:id | Submit session |
| GET | /api/counts/dashboard | Dashboard data |
| GET | /api/counts/history | Monthly history |
| GET | /api/export/excel | Download Excel |
| GET | /api/export/print | Print data |
| GET | /api/staff | List staff (admin) |
| PUT | /api/staff/:id/block | Block staff (admin) |
| PUT | /api/staff/:id/unblock | Unblock staff (admin) |