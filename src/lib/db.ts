import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
};

export type ConversationRow = {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: number;
  conversation_id: number;
  role: 'user' | 'model';
  content: string;
  created_at: string;
};

const DEFAULT_DB_PATH = './data/chat.db';

let dbInstance: Database.Database | null = null;

function resolveDbPath(): string {
  const raw = process.env.DATABASE_PATH || DEFAULT_DB_PATH;
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function initializeDB(db: Database.Database): void {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      created_at    DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title      TEXT    NOT NULL DEFAULT '새 대화',
      created_at DATETIME DEFAULT (datetime('now')),
      updated_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role            TEXT    NOT NULL CHECK(role IN ('user', 'model')),
      content         TEXT    NOT NULL,
      created_at      DATETIME DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
  `);
}

export function getDB(): Database.Database {
  if (dbInstance) return dbInstance;
  const dbPath = resolveDbPath();
  ensureDir(dbPath);
  const db = new Database(dbPath);
  initializeDB(db);
  dbInstance = db;
  return db;
}

// User helpers
export function createUser(email: string, passwordHash: string): UserRow {
  const stmt = getDB().prepare(
    'INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING *'
  );
  return stmt.get(email, passwordHash) as UserRow;
}

export function findUserByEmail(email: string): UserRow | undefined {
  const stmt = getDB().prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email) as UserRow | undefined;
}

export function findUserById(id: number): UserRow | undefined {
  const stmt = getDB().prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as UserRow | undefined;
}

// Conversation helpers
export function createConversation(userId: number, title = '새 대화'): ConversationRow {
  const stmt = getDB().prepare(
    'INSERT INTO conversations (user_id, title) VALUES (?, ?) RETURNING *'
  );
  return stmt.get(userId, title) as ConversationRow;
}

export function listConversations(userId: number): ConversationRow[] {
  const stmt = getDB().prepare(
    'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC, id DESC'
  );
  return stmt.all(userId) as ConversationRow[];
}

export function findConversation(id: number, userId: number): ConversationRow | undefined {
  const stmt = getDB().prepare(
    'SELECT * FROM conversations WHERE id = ? AND user_id = ?'
  );
  return stmt.get(id, userId) as ConversationRow | undefined;
}

export function deleteConversation(id: number, userId: number): boolean {
  const stmt = getDB().prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?');
  const info = stmt.run(id, userId);
  return info.changes > 0;
}

export function updateConversationTitle(id: number, title: string): void {
  const stmt = getDB().prepare('UPDATE conversations SET title = ? WHERE id = ?');
  stmt.run(title, id);
}

export function touchConversation(id: number): void {
  const stmt = getDB().prepare(
    "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?"
  );
  stmt.run(id);
}

// Message helpers
export function listMessages(conversationId: number): MessageRow[] {
  const stmt = getDB().prepare(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC'
  );
  return stmt.all(conversationId) as MessageRow[];
}

export function countMessages(conversationId: number): number {
  const stmt = getDB().prepare(
    'SELECT COUNT(*) AS n FROM messages WHERE conversation_id = ?'
  );
  const row = stmt.get(conversationId) as { n: number };
  return row.n;
}

export function saveMessage(
  conversationId: number,
  role: 'user' | 'model',
  content: string
): MessageRow {
  const stmt = getDB().prepare(
    'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?) RETURNING *'
  );
  return stmt.get(conversationId, role, content) as MessageRow;
}
