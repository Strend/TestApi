import Database from 'better-sqlite3';

const db = new Database('movenear.db');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,
  full_name TEXT NOT NULL,
  document_id TEXT,
  rating REAL DEFAULT 5.0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rider_name TEXT NOT NULL,
  driver_name TEXT,
  mode TEXT NOT NULL,
  from_label TEXT NOT NULL,
  to_label TEXT NOT NULL,
  distance_km REAL NOT NULL,
  radius_meters INTEGER NOT NULL,
  zone TEXT NOT NULL,
  vehicle_class TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ride_id INTEGER NOT NULL,
  from_user TEXT NOT NULL,
  to_user TEXT NOT NULL,
  score INTEGER NOT NULL,
  comment TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ride_id) REFERENCES rides(id)
);
`);

export default db;
