CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'specialist', 'child')),
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS children (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  birth_date TEXT
);

CREATE TABLE IF NOT EXISTS specialist_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  specialist_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialist_type TEXT NOT NULL CHECK (specialist_type IN
    ('teacher', 'psychologist', 'doctor', 'special education teacher', 'coach')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (child_id, specialist_id)
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  created_by INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (end_at IS NULL OR end_at > start_at)
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  assigned_by INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  development_area TEXT NOT NULL CHECK (development_area IN
    ('Language', 'Motor', 'Social', 'Cognitive', 'Emotional')),
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
