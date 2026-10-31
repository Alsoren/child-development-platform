require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./index');

const DEMO_PASSWORD = 'Password123';

// Dates relative to today so the weekly view always has data
const day = (offset, time = '10:00') => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.toISOString().slice(0, 10)} ${time}`;
};

const seed = db.transaction(() => {
  // Reset (child tables first)
  ['tasks', 'events', 'specialist_links', 'children', 'users'].forEach((t) =>
    db.prepare(`DELETE FROM ${t}`).run()
  );
  db.prepare('DELETE FROM sqlite_sequence').run();

  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  const insertUser = db.prepare(
    'INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)'
  );
  const addUser = (email, role, name) => insertUser.run(email, hash, role, name).lastInsertRowid;

  const parentId = addUser('parent@example.com', 'parent', 'Demo Parent');
  const teacherId = addUser('teacher@example.com', 'specialist', 'Demo Teacher');
  const unlinkedId = addUser('unlinked@example.com', 'specialist', 'Unlinked Specialist');
  const childUserId = addUser('child@example.com', 'child', 'Demo Child');

  const childId = db
    .prepare('INSERT INTO children (parent_id, user_id, name, birth_date) VALUES (?, ?, ?, ?)')
    .run(parentId, childUserId, 'Demo Child', '2018-05-14').lastInsertRowid;

  db.prepare('INSERT INTO specialist_links (child_id, specialist_id, specialist_type) VALUES (?, ?, ?)')
    .run(childId, teacherId, 'teacher');

  const insertEvent = db.prepare(
    'INSERT INTO events (child_id, created_by, title, start_at, end_at) VALUES (?, ?, ?, ?, ?)'
  );
  insertEvent.run(childId, parentId, 'Swimming class', day(1, '16:00'), day(1, '17:00'));
  insertEvent.run(childId, teacherId, 'Reading session', day(3, '10:00'), day(3, '10:45'));

  const insertTask = db.prepare(
    `INSERT INTO tasks (child_id, assigned_by, title, description, development_area, due_date, status, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insertTask.run(childId, teacherId, 'Read for 20 minutes', 'Read one chapter of a book.', 'Language', day(2, '18:00'), 'pending', null);
  insertTask.run(childId, teacherId, 'Practice counting to 50', null, 'Cognitive', day(0, '18:00'), 'done', day(0, '17:30'));
  insertTask.run(childId, parentId, 'Tidy up your room', null, 'Self-care', day(1, '19:00'), 'pending', null);
});

seed();
console.log(`Database seeded. All demo accounts use password: ${DEMO_PASSWORD}`);