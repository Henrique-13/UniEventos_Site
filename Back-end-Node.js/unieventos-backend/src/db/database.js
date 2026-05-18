/* ════════════════════════════════════════
   db/database.js
   Banco SQLite com a biblioteca sqlite3
   (compatível com Windows sem compilação)
════════════════════════════════════════ */
const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const fs      = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const DB_PATH = path.join(dataDir, 'unieventos.db');
const db      = new sqlite3.Database(DB_PATH);

/* ─── Ativa foreign keys e cria tabelas ─── */
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA journal_mode = WAL');

  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      email      TEXT    NOT NULL UNIQUE,
      phone      TEXT,
      password   TEXT    NOT NULL,
      created_at TEXT    DEFAULT (datetime('now','localtime')),
      last_login TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id       TEXT    NOT NULL UNIQUE,
      client_id      INTEGER REFERENCES clients(id),
      client_name    TEXT    NOT NULL,
      client_email   TEXT    NOT NULL,
      package_key    TEXT    NOT NULL,
      package_name   TEXT    NOT NULL,
      stadium        TEXT    NOT NULL,
      sector         TEXT    NOT NULL,
      gate           TEXT    NOT NULL,
      event_date     TEXT    NOT NULL,
      quantity       INTEGER NOT NULL,
      unit_price     REAL    NOT NULL,
      total_price    REAL    NOT NULL,
      payment_method TEXT    NOT NULL,
      status         TEXT    DEFAULT 'confirmed',
      created_at     TEXT    DEFAULT (datetime('now','localtime'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS admin_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      action     TEXT NOT NULL,
      details    TEXT,
      ip         TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);
});

/* ════════════════════════════════════════
   Helpers que imitam a API síncrona do
   better-sqlite3, mas usando callbacks
   internamente — o restante do código
   não precisa mudar.
════════════════════════════════════════ */

function prepare(sql) {
  return {
    /* Leitura — retorna uma linha */
    get(...params) {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
        });
      });
    },
    /* Leitura — retorna todas as linhas */
    all(...params) {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
    },
    /* Escrita — retorna { lastInsertRowid, changes } */
    run(...params) {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
        });
      });
    },
  };
}

module.exports = { prepare };
