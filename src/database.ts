import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';

export const DEMO_USERNAME = 'demo';
export const DEMO_PASSWORD = 'demo123';

export const SEED_ACCOUNTS = [
  { username: DEMO_USERNAME, password: DEMO_PASSWORD, permissions: 'basic' as const },
  { username: 'Mod 1', password: 'ballonger', permissions: 'full' as const },
  { username: 'Mod 2', password: 'ballonger', permissions: 'full' as const },
];

export type UserPermissions = 'basic' | 'full';

const PASSWORD_SALT = 'login-app-v1';

export type SessionUser = {
  id: number;
  username: string;
  permissions: UserPermissions;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function hashPassword(password: string) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${PASSWORD_SALT}:${password}`
  );
}

async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  table: 'users' | 'session',
  column: string,
  definition: string
) {
  const columns = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table})`
  );
  if (!columns.some((entry) => entry.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function normalizePermissions(value: string | null | undefined): UserPermissions {
  return value === 'full' ? 'full' : 'basic';
}

async function upsertSeedUser(
  db: SQLite.SQLiteDatabase,
  username: string,
  password: string,
  permissions: UserPermissions
) {
  const passwordHash = await hashPassword(password);
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM users WHERE username = ?',
    username
  );

  if (existing) {
    await db.runAsync(
      'UPDATE users SET password_hash = ?, permissions = ? WHERE id = ?',
      passwordHash,
      permissions,
      existing.id
    );
    return;
  }

  await db.runAsync(
    'INSERT INTO users (username, password_hash, permissions) VALUES (?, ?, ?)',
    username,
    passwordHash,
    permissions
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
      password_hash TEXT NOT NULL,
      permissions TEXT NOT NULL DEFAULT 'basic'
    );
    CREATE TABLE IF NOT EXISTS session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      permissions TEXT NOT NULL DEFAULT 'basic',
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  await ensureColumn(db, 'users', 'permissions', "TEXT NOT NULL DEFAULT 'basic'");
  await ensureColumn(db, 'session', 'permissions', "TEXT NOT NULL DEFAULT 'basic'");

  for (const account of SEED_ACCOUNTS) {
    await upsertSeedUser(db, account.username, account.password, account.permissions);
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
  const session = await db.getFirstAsync<{
    id: number;
    username: string;
    permissions: string | null;
  }>('SELECT user_id AS id, username, permissions FROM session WHERE id = 1');

  if (!session) {
    return null;
  }

  return {
    id: session.id,
    username: session.username,
    permissions: normalizePermissions(session.permissions),
  } satisfies SessionUser;
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
    permissions: string | null;
  }>(
    'SELECT id, username, password_hash, permissions FROM users WHERE username = ? COLLATE NOCASE',
    trimmed
  );
  const passwordHash = await hashPassword(password);

  if (!user || user.password_hash !== passwordHash) {
    throw new Error('Wrong username or password.');
  }

  const permissions = normalizePermissions(user.permissions);

  await db.runAsync('DELETE FROM session');
  await db.runAsync(
    'INSERT INTO session (id, user_id, username, permissions) VALUES (1, ?, ?, ?)',
    user.id,
    user.username,
    permissions
  );

  return {
    id: user.id,
    username: user.username,
    permissions,
  } satisfies SessionUser;
}

export function hasFullPermissions(user: SessionUser) {
  return user.permissions === 'full';
}

export async function logout() {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM session');
}
