import Database from 'better-sqlite3';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(dirname(__dirname), 'data', 'kalid.db');
const db = new Database(dbPath);

// Activer les foreign keys
db.exec('PRAGMA foreign_keys = OFF;');

try {
  console.log('Début de la migration...');

  // Recréer la table users
  console.log('Recréation de la table users...');
  db.exec(`
    DROP TABLE IF EXISTS users;
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matricule TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT CURRENT_TIMESTAMP
    );

    DROP TABLE IF EXISTS employees;
    CREATE TABLE employees (
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

    DROP TABLE IF EXISTS career_history;
    CREATE TABLE career_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      grade TEXT NOT NULL,
      grade_index INTEGER NOT NULL,
      service TEXT NOT NULL,
      department TEXT NOT NULL,
      start_date INTEGER NOT NULL,
      end_date INTEGER,
      is_current INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    DROP TABLE IF EXISTS salary_records;
    CREATE TABLE salary_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      period TEXT NOT NULL,
      start_date INTEGER NOT NULL,
      end_date INTEGER NOT NULL,
      duration_days INTEGER NOT NULL,
      base_salary REAL NOT NULL,
      allowance REAL NOT NULL,
      cnss_amount REAL NOT NULL,
      ipts_amount REAL NOT NULL,
      net_salary REAL NOT NULL,
      recall_amount REAL NOT NULL,
      liquidated_amount REAL NOT NULL DEFAULT 0,
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      observations TEXT,
      created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    DROP TABLE IF EXISTS complaints;
    CREATE TABLE complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      period_start INTEGER NOT NULL,
      period_end INTEGER NOT NULL,
      attachments TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      resolved_at INTEGER,
      resolved_by INTEGER,
      created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (resolved_by) REFERENCES users(id)
    );
  `);

  // Créer les utilisateurs par défaut
  console.log('Création des utilisateurs par défaut...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const comptaPassword = await bcrypt.hash('compta123', 10);
  const empPassword = await bcrypt.hash('emp123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (matricule, password, role, first_name, last_name, email, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertEmployee = db.prepare(`
    INSERT INTO employees (matricule, first_name, last_name, grade, grade_index, service, department, entry_date, email, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCareerHistory = db.prepare(`
    INSERT INTO career_history (employee_id, grade, grade_index, service, department, start_date, is_current)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSalaryRecord = db.prepare(`
    INSERT INTO salary_records (
      employee_id, period, start_date, end_date, duration_days,
      base_salary, allowance, cnss_amount, ipts_amount, net_salary,
      recall_amount, liquidated_amount, payment_status, observations, created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertComplaint = db.prepare(`
    INSERT INTO complaints (employee_id, type, description, period_start, period_end, status, resolved_at, resolved_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Créer l'administrateur
  const adminResult = insertUser.run('ADMIN001', adminPassword, 'admin', 'Admin', 'System', 'admin@kalid.com', 1);
  console.log('Admin créé:', { matricule: 'ADMIN001', role: 'admin', is_active: 1 });

  // Créer le comptable
  const comptableUserResult = insertUser.run('COMPT001', comptaPassword, 'accountant', 'Jean', 'Dupont', 'comptable@kalid.com', 1);
  console.log('Comptable (user) créé:', { matricule: 'COMPT001', role: 'accountant', is_active: 1 });

  const comptableEmployeeResult = insertEmployee.run(
    'COMPT001',
    'Jean',
    'Dupont',
    'A1',
    1,
    'Comptabilité',
    'Finance',
    Date.now(),
    'comptable@kalid.com',
    1
  );
  console.log('Comptable (employee) créé:', { matricule: 'COMPT001', grade: 'A1', service: 'Comptabilité', is_active: 1 });

  insertCareerHistory.run(
    comptableEmployeeResult.lastInsertRowid,
    'A1',
    1,
    'Comptabilité',
    'Finance',
    Date.now(),
    1
  );

  // Créer plusieurs employés
  const employees = [
    {
      matricule: 'EMP001',
      password: empPassword,
      firstName: 'Marie',
      lastName: 'Kouadio',
      grade: 'B2',
      gradeIndex: 2,
      service: 'Administration',
      department: 'RH',
      email: 'marie.kouadio@cotonou.gov.bj',
      isActive: 1
    },
    {
      matricule: 'EMP002',
      password: empPassword,
      firstName: 'Paul',
      lastName: 'Mensah',
      grade: 'A2',
      gradeIndex: 2,
      service: 'Informatique',
      department: 'DSI',
      email: 'paul.mensah@cotonou.gov.bj',
      isActive: 1
    },
    {
      matricule: 'EMP003',
      password: empPassword,
      firstName: 'Sophie',
      lastName: 'Kone',
      grade: 'B1',
      gradeIndex: 1,
      service: 'Logistique',
      department: 'Operations',
      email: 'sophie.kone@cotonou.gov.bj',
      isActive: 0
    }
  ];

  // Insérer les employés
  for (const emp of employees) {
    const userResult = insertUser.run(
      emp.matricule,
      emp.password,
      'employee',
      emp.firstName,
      emp.lastName,
      emp.email,
      emp.isActive
    );
    console.log('Utilisateur créé:', { matricule: emp.matricule, role: 'employee', is_active: emp.isActive });

    const employeeResult = insertEmployee.run(
      emp.matricule,
      emp.firstName,
      emp.lastName,
      emp.grade,
      emp.gradeIndex,
      emp.service,
      emp.department,
      Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 jours avant
      emp.email,
      emp.isActive
    );
    console.log('Employé créé:', { matricule: emp.matricule, grade: emp.grade, service: emp.service, is_active: emp.isActive });

    insertCareerHistory.run(
      employeeResult.lastInsertRowid,
      emp.grade,
      emp.gradeIndex,
      emp.service,
      emp.department,
      Date.now() - 90 * 24 * 60 * 60 * 1000,
      1
    );
    console.log('Historique de carrière créé:', { employee_id: employeeResult.lastInsertRowid, grade: emp.grade, service: emp.service });

    // Ajouter des salaires pour les 3 derniers mois
    for (let i = 0; i < 3; i++) {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - (i + 1), 1).getTime();
      const endDate = new Date(now.getFullYear(), now.getMonth() - i, 0).getTime();
      const period = `${new Date(startDate).toLocaleString('fr-FR', { month: 'short', year: 'numeric' })}`;
      const baseSalary = 250000 + Math.floor(Math.random() * 50000);
      const allowance = Math.floor(baseSalary * 0.1);
      const cnssAmount = Math.floor(baseSalary * 0.035);
      const iptsAmount = Math.floor(baseSalary * 0.12);
      const netSalary = baseSalary + allowance - cnssAmount - iptsAmount;
      const recallAmount = 0;
      const liquidatedAmount = 0;
      const paymentStatus = 'unpaid';
      const observations = null;

      console.log('Création salaire avec dates:', {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString()
      });

      insertSalaryRecord.run(
        employeeResult.lastInsertRowid,
        period,
        startDate,
        endDate,
        30,
        baseSalary,
        allowance,
        cnssAmount,
        iptsAmount,
        netSalary,
        recallAmount,
        liquidatedAmount,
        paymentStatus,
        observations,
        adminResult.lastInsertRowid
      );
      console.log('Salaire créé:', { employee_id: employeeResult.lastInsertRowid, period, net_salary: netSalary });
    }

    // Créer quelques réclamations de test
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    // Pour l'employé EMP001
    insertComplaint.run(
      2, // ID de l'employé EMP001
      'congé',
      'Demande de congé annuel',
      now - oneMonth, // Il y a un mois
      now - oneMonth + 2 * oneWeek, // Deux semaines de congé
      'pending',
      null,
      null,
      now - oneMonth
    );

    insertComplaint.run(
      2, // ID de l'employé EMP001
      'maladie',
      'Arrêt maladie pour grippe',
      now - 2 * oneWeek, // Il y a deux semaines
      now - oneWeek, // Une semaine d'arrêt
      'resolved',
      now - oneWeek,
      1, // Résolu par l'admin
      now - 2 * oneWeek
    );

    // Pour l'employé EMP002
    insertComplaint.run(
      3, // ID de l'employé EMP002
      'formation',
      'Demande de formation en développement web',
      now + oneWeek, // La semaine prochaine
      now + 2 * oneWeek, // Une semaine de formation
      'pending',
      null,
      null,
      now - oneDay
    );
  }

  console.log('Migration effectuée avec succès');
} catch (error) {
  console.error('Erreur lors de la migration:', error);
  throw error;
} finally {
  db.close();
  console.log('Connexion à la base de données fermée');
}

// Migration pour mettre à jour les colonnes periodStart et periodEnd
export const migration = async (db) => {
  // Créer une table temporaire avec la nouvelle structure
  await db.run(`
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
  `);

  // Copier les données existantes
  await db.run(`
    INSERT INTO complaints_new (
      id, employee_id, type, description, period_start, period_end,
      attachments, status, resolved_at, resolved_by, created_at
    )
    SELECT 
      id, employee_id, type, description, period_start, period_end,
      attachments, status, resolved_at, resolved_by, created_at
    FROM complaints;
  `);

  // Supprimer l'ancienne table
  await db.run('DROP TABLE complaints;');

  // Renommer la nouvelle table
  await db.run('ALTER TABLE complaints_new RENAME TO complaints;');
};

export default migration; 