const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db;

function getDb() {
  if (db) return db;

  const dbPath = process.env.DB_PATH || './data/instrument_tracker.db';
  const resolvedPath = path.resolve(dbPath);
  const dir = path.dirname(resolvedPath);

  fs.mkdirSync(dir, { recursive: true });

  db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'staff',
      is_blocked INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS instruments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department_id INTEGER,
      name TEXT NOT NULL,
      expected_quantity INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS count_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      shift TEXT NOT NULL,
      department_id INTEGER,
      submitted_by INTEGER,
      submitted_at TEXT,
      is_submitted INTEGER DEFAULT 0,
      FOREIGN KEY(department_id) REFERENCES departments(id),
      FOREIGN KEY(submitted_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS count_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      instrument_id INTEGER,
      actual_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'normal',
      remarks TEXT DEFAULT '',
      UNIQUE(session_id, instrument_id),
      FOREIGN KEY(session_id) REFERENCES count_sessions(id),
      FOREIGN KEY(instrument_id) REFERENCES instruments(id)
    );
  `);

  return db;
}

module.exports = { getDb };
