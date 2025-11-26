import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import * as schema from '../shared/schema.js';

// MODIFIÉ POUR RENDER: Utiliser le volume persistant
const dataDir = process.env.RENDER_DISK_PATH || join(process.cwd(), 'data');

console.log(`[DB] 🗂️  Data directory: ${dataDir}`);
console.log(`[DB] 🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

// Créer le dossier s'il n'existe pas
if (!existsSync(dataDir)) {
  try {
    mkdirSync(dataDir, { recursive: true });
    console.log(`[DB] ✅ Created data directory`);
  } catch (error) {
    console.error('[DB] ❌ Error creating data directory:', error);
    throw error;
  }
} else {
  console.log(`[DB] ✅ Data directory exists`);
}

const dbPath = join(dataDir, 'kalid.db');
console.log(`[DB] 💾 Database path: ${dbPath}`);

const sqlite = new Database(dbPath);
sqlite.pragma('foreign_keys = ON');

// Meilleure performance en production avec WAL mode
if (process.env.NODE_ENV === 'production') {
  sqlite.pragma('journal_mode = WAL');
  console.log(`[DB] ⚡ WAL mode enabled for better performance`);
}

console.log(`[DB] ✅ Database connection established`);

export const db = drizzle(sqlite, { schema });