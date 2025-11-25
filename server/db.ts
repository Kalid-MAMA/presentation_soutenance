import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { join } from 'path';
import * as schema from "@shared/schema";

// Créer le dossier data s'il n'existe pas
import { mkdirSync } from 'fs';

const dataDir = join(process.cwd(), 'data');
try {
  mkdirSync(dataDir, { recursive: true });
} catch (error) {
  // Le dossier existe déjà
}

const sqlite = new Database(join(dataDir, 'kalid.db'));
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });