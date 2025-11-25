import { join } from 'path';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { storage } from './storage.js';
import { db } from './db.js';
import { sql } from 'drizzle-orm';
import { users, employees, salaryRecords, complaints, gradeRates, careerHistory } from "../shared/schema.js";

// Créer le dossier data s'il n'existe pas
const dataDir = join(process.cwd(), 'data');

const dbPath = join(dataDir, 'kalid.db');
const dbSqlite = new Database(dbPath);

// Activer les foreign keys
dbSqlite.exec('PRAGMA foreign_keys = ON;');

// Créer les tables
dbSqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matricule TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matricule TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    grade_index INTEGER NOT NULL,
    service TEXT NOT NULL,
    department TEXT NOT NULL,
    entry_date INTEGER NOT NULL,
    email TEXT,
    phone TEXT,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    period TEXT NOT NULL,
    attachments TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    resolved_at INTEGER,
    resolved_by INTEGER REFERENCES users(id),
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS grade_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grade TEXT NOT NULL UNIQUE,
    cnss_rate REAL NOT NULL,
    ipts_rate REAL NOT NULL,
    updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration pour mettre à jour la table des réclamations
const migrationSQL = `
  -- Créer une table temporaire avec la nouvelle structure
  CREATE TABLE complaints_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    period_start INTEGER NOT NULL,
    period_end INTEGER NOT NULL,
    attachments TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    resolved_at INTEGER,
    resolved_by INTEGER REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- Copier les données existantes avec une conversion de la période
  INSERT INTO complaints_new (
    id, employee_id, type, description, period_start, period_end,
    attachments, status, resolved_at, resolved_by, created_at
  )
  SELECT 
    id, employee_id, type, description,
    strftime('%s', substr(period, 1, instr(period, ' - ') - 1)) as period_start,
    strftime('%s', substr(period, instr(period, ' - ') + 3)) as period_end,
    attachments, status, resolved_at, resolved_by, created_at
  FROM complaints;

  -- Supprimer l'ancienne table
  DROP TABLE complaints;

  -- Renommer la nouvelle table
  ALTER TABLE complaints_new RENAME TO complaints;
`;

// Fonction pour initialiser la base de données
export async function initDb() {
  console.log('Début de l\'initialisation de la base de données...');
  try {
    console.log('Exécution de la migration des réclamations...');
    // Exécuter la migration
    await dbSqlite.exec(migrationSQL);
    console.log('Migration de la table complaints effectuée avec succès');

    console.log('Création des utilisateurs par défaut...');
    // Hasher les mots de passe par défaut
    const adminPassword = await bcrypt.hash('admin123', 10);
    const comptaPassword = await bcrypt.hash('compta123', 10);
    const empPassword = await bcrypt.hash('emp123', 10);

    // Créer l'administrateur
    console.log('Création de l\'administrateur...');
    dbSqlite.prepare(`
      INSERT OR IGNORE INTO users (matricule, password, role, first_name, last_name, email)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('ADMIN001', adminPassword, 'admin', 'Admin', 'System', 'admin@kalid.com');

    // Créer le comptable
    console.log('Création du comptable...');
    dbSqlite.prepare(`
      INSERT OR IGNORE INTO users (matricule, password, role, first_name, last_name, email)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('COMPT001', comptaPassword, 'accountant', 'Jean', 'Dupont', 'comptable@kalid.com');

    // Créer l'employé test
    console.log('Création de l\'employé test...');
    dbSqlite.prepare(`
      INSERT OR IGNORE INTO users (matricule, password, role, first_name, last_name, email)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('EMP001', empPassword, 'employee', 'Marie', 'Kouadio', 'marie.kouadio@cotonou.gov.bj');

    console.log('Base de données initialisée avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    throw error; // Remonter l'erreur pour qu'elle soit visible
  } finally {
    dbSqlite.close();
    console.log('Connexion à la base de données fermée');
  }
}

// Exécuter la migration si ce fichier est exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Démarrage du script d\'initialisation...');
  initDb()
    .then(() => {
      console.log('Migration et initialisation terminées avec succès');
      process.exit(0);
    })
    .catch(error => {
      console.error('Erreur lors de l\'initialisation:', error);
      process.exit(1);
    });
} 