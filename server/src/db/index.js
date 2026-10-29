const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : process.env.DB_PATH || path.join(__dirname, '../../data/app.db');

if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

module.exports = db;    