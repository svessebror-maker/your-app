import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';

export const DEMO_USERNAME = 'demo';
export const DEMO_PASSWORD = 'demo123';

const PASSWORD_SALT = 'login-app-v1';

export type SessionUser = {
  id: number;
  username: string;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function hashPassword(password: string) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${PASSWORD_SALT}:${password}`
  );
}

async function openDatabase() {
  const db = await SQLite.openDatabaseAsync('login.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM users'
  );
  if (!row || row.count === 0) {
    await db.runAsync(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      DEMO_USERNAME,
      await hashPassword(DEMO_PASSWORD)
    );
  }

  return db;
}

function getDatabase() {
  if (!dbPromise) {
    dbPromise = openDatabase();
  }
  return dbPromise;
}

export async function getSession() {
  const db = await getDatabase();
  return db.getFirstAsync<SessionUser>(
    'SELECT user_id AS id, username FROM session WHERE id = 1'
  );
}

export async function login(username: string, password: string) {
  const trimmed = username.trim();
  if (!trimmed || !password) {
    throw new Error('Enter a username and password.');
  }

  const db = await getDatabase();
  const user = await db.getFirstAsync<{
    id: number;
    username: string;
    password_hash: string;
  }>(
    'SELECT id, username, password_hash FROM users WHERE username = ? COLLATE NOCASE',
    trimmed
  );
  const passwordHash = await hashPassword(password);

  if (!user || user.password_hash !== passwordHash) {
    throw new Error('Wrong username or password.');
  }

  await db.runAsync('DELETE FROM session');
  await db.runAsync(
    'INSERT INTO session (id, user_id, username) VALUES (1, ?, ?)',
    user.id,
    user.username
  );

  return { id: user.id, username: user.username } satisfies SessionUser;
}

export async function logout() {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM session');
}
