import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertEmployeeSchema, insertSalaryRecordSchema, insertComplaintSchema, insertGradeRateSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Router } from 'express'
import { db } from './db'
import { users } from '../shared/schema'
import { eq } from 'drizzle-orm'
import { generatePassword } from './utils'
import { isAdmin } from './middleware'
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sql } from 'drizzle-orm';

// Extend the Request interface to include session
declare module 'express-serve-static-core' {
  interface Request {
    session: {
      userId?: number;
      userRole?: string;
      destroy: (callback: (err?: Error) => void) => void;
    };
  }
}

const loginSchema = z.object({
  matricule: z.string().min(1),
  password: z.string().min(1),
});

// Middleware to check authentication
const requireAuth = (req: any, res: any, next: any) => {
  console.log('Auth check - Session:', req.session);
  if (!req.session.userId) {
    console.log('Auth check failed - No userId in session');
    return res.status(401).json({ message: "Authentication required" });
  }
  console.log('Auth check passed');
  next();
};

// Middleware to check role
const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    console.log('Role check - Required roles:', roles, 'User role:', req.session.userRole);
    if (!roles.includes(req.session.userRole)) {
      console.log('Role check failed');
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    console.log('Role check passed');
    next();
  };
};

// Configuration de multer pour l'upload de fichiers
const uploadDir = path.join(process.cwd(), 'uploads', 'pieces_justificatives');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    // Créer un sous-dossier par année/mois
    const now = new Date();
    const yearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const targetDir = path.join(uploadDir, yearMonth);
    
    // Créer le sous-dossier s'il n'existe pas
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    cb(null, targetDir);
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier plus descriptif
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E6).toString().padStart(6, '0');
    const extension = path.extname(file.originalname);
    const originalNameWithoutExt = path.basename(file.originalname, extension);
    
    // Format: timestamp-random-originalname.ext
    const filename = `${timestamp}-${randomSuffix}-${originalNameWithoutExt}${extension}`;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté. Seuls les PDF et images sont acceptés.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log('[Auth Route] Login attempt - Request body:', req.body);
      
      // Validate request body
      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.log('[Auth Route] Validation failed:', validationResult.error);
        return res.status(400).json({ message: "Invalid request format" });
      }
      
      const { matricule, password } = validationResult.data;
      console.log('[Auth Route] Looking up user with matricule:', matricule);
      
      const user = await storage.getUserByMatricule(matricule);
      console.log('[Auth Route] User lookup result:', user ? { ...user, password: '[HIDDEN]' } : null);
      
      if (!user) {
        console.log('[Auth Route] Login failed - User not found:', matricule);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log('[Auth Route] Comparing passwords for user:', matricule);
      // Utiliser bcrypt pour comparer les mots de passe
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('[Auth Route] Password comparison result:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('[Auth Route] Login failed - Invalid password for user:', matricule);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Store user in session
      req.session.userId = user.id;
      req.session.userRole = user.role;
      
      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error('[Auth Route] Session save error:', err);
          return res.status(500).json({ message: "Session error" });
        }
        
        console.log('[Auth Route] Login successful - Session:', {
          id: req.session.id,
          userId: req.session.userId,
          userRole: req.session.userRole
        });
        
        const responseData = { 
          user: { 
            id: user.id, 
            matricule: user.matricule, 
            role: user.role, 
            firstName: user.firstName,
            lastName: user.lastName 
          }
        };
        console.log('[Auth Route] Sending response:', responseData);
        res.json(responseData);
      });
    } catch (error) {
      console.error('[Auth Route] Unexpected error during login:', error);
      res.status(500).json({ message: "Server error during login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({ 
      user: { 
        id: user.id, 
        matricule: user.matricule, 
        role: user.role, 
        firstName: user.firstName,
        lastName: user.lastName 
      } 
    });
  });

  // Endpoint pour récupérer les informations de l'employé connecté
  app.get("/api/employees/me", requireAuth, requireRole(["employee"]), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const employee = await storage.getEmployeeByMatricule(user.matricule);
      if (!employee) {
        return res.status(404).json({ message: "Employé non trouvé" });
      }

      const careerHistory = await storage.getCareerHistoryByEmployee(employee.id);
      const salaries = await storage.getSalaryRecordsByEmployee(employee.id);
      const totalDue = salaries.reduce((sum, salary) => sum + (salary.recallAmount || 0), 0);
      const lastSalary = salaries[0];

      res.json({
        employee: {
          id: employee.id,
          matricule: employee.matricule,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          department: employee.department,
          service: employee.service,
          grade: employee.grade,
          gradeIndex: employee.gradeIndex,
          entryDate: employee.entryDate,
          isActive: employee.isActive,
          totalDue: totalDue,
          lastUpdate: lastSalary ? lastSalary.createdAt : null
        },
        careerHistory: careerHistory.map(event => ({
          id: event.id,
          date: event.startDate,
          type: 'grade',
          title: `Passage au grade ${event.grade}`,
          description: `Affectation au service ${event.service} du département ${event.department}`
        }))
      });
    } catch (error) {
      console.error('Error fetching employee profile:', error);
      res.status(500).json({ message: "Erreur lors de la récupération du profil" });
    }
  });

  // Endpoint pour récupérer les salaires de l'employé connecté
  app.get("/api/employees/salaries", requireAuth, requireRole(["employee"]), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const employee = await storage.getEmployeeByMatricule(user.matricule);
      if (!employee) {
        return res.status(404).json({ message: "Employé non trouvé" });
      }

      const salaries = await storage.getSalaryRecordsByEmployee(employee.id);
      
      // Transformer les données pour correspondre au format attendu par le frontend
      const transformedSalaries = salaries.map(salary => {
        // S'assurer que les dates sont des nombres
        const startDate = typeof salary.startDate === 'number' ? salary.startDate : Number(salary.startDate);
        const endDate = typeof salary.endDate === 'number' ? salary.endDate : Number(salary.endDate);

        // Log pour debug
        console.log('Dates transformées:', {
          original: { startDate: salary.startDate, endDate: salary.endDate },
          transformed: { startDate, endDate },
          asDate: {
            start: new Date(startDate).toISOString(),
            end: new Date(endDate).toISOString()
          }
        });

        return {
          id: salary.id,
          startDate,
          endDate,
          duration: salary.durationDays,
          baseSalary: salary.baseSalary,
          allowance: salary.allowance,
          cnss: salary.cnssAmount,
          ipts: salary.iptsAmount,
          net: salary.netSalary,
          dueAmount: salary.recallAmount,
          period: salary.period,
          paymentStatus: salary.paymentStatus,
          observations: salary.observations
        };
      });

      res.json(transformedSalaries);
    } catch (error) {
      console.error('Error fetching employee salaries:', error);
      res.status(500).json({ message: "Erreur lors de la récupération des salaires" });
    }
  });

  // Endpoint pour télécharger un bulletin de salaire
  app.get("/api/employees/salaries/:id/download", requireAuth, requireRole(["employee"]), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const employee = await storage.getEmployeeByMatricule(user.matricule);
      if (!employee) {
        return res.status(404).json({ message: "Employé non trouvé" });
      }

      const salaryId = parseInt(req.params.id);
      const salary = await storage.getSalary(salaryId);

      if (!salary || salary.employeeId !== employee.id) {
        return res.status(404).json({ message: "Bulletin de salaire non trouvé" });
      }

      // Ici, vous pouvez générer le PDF du bulletin de salaire
      // Pour l'instant, nous renvoyons juste les données
      res.json(salary);
    } catch (error) {
      console.error('Error downloading salary slip:', error);
      res.status(500).json({ message: "Erreur lors du téléchargement du bulletin" });
    }
  });

  // Endpoint pour exporter les salaires en PDF
  app.post("/api/employee/salaries/export", requireAuth, requireRole(["employee"]), async (req, res) => {
    try {
      console.log('Starting PDF generation...');
      
      const PDFDocument = await import('pdfkit');
      console.log('PDFKit imported successfully');
      
      const doc = new PDFDocument.default({
        size: 'A4',
        layout: 'landscape',
        margin: 50,
        info: {
          Title: 'Historique des Soldes d\'Avancement',
          Author: 'KALID System'
        }
      });

      // Configuration de l'en-tête de la réponse
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=soldes-avancement.pdf');
      console.log('Headers set');

      // Pipe le PDF vers la réponse
      doc.pipe(res);
      console.log('PDF piped to response');

      // Récupération des données de l'employé
      console.log('Fetching employee data...');
      const user = await storage.getUser(req.session.userId!);
      console.log('User fetched:', user ? 'found' : 'not found');
      
      const employee = await storage.getEmployeeByMatricule(user!.matricule);
      console.log('Employee fetched:', employee ? 'found' : 'not found');
      
      const salaryRecords = await storage.getSalaryRecordsByEmployee(employee!.id);
      console.log('Salary records fetched:', salaryRecords.length, 'records found');
      console.log('First salary record:', JSON.stringify(salaryRecords[0], null, 2));

      // Si aucun enregistrement trouvé, créer des données de test
      if (salaryRecords.length === 0) {
        console.log('No salary records found, creating test data...');
        const now = new Date();
        const mockSalaries = [];
        
        for (let i = 0; i < 12; i++) {
          const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          const baseSalary = 250000 + Math.random() * 50000;
          const allowance = baseSalary * 0.1;
          const cnssAmount = baseSalary * 0.035;
          const iptsAmount = baseSalary * 0.12;
          const netSalary = baseSalary + allowance - cnssAmount - iptsAmount;
          const recallAmount = Math.round(Math.random() * 25000);
          
          const record = {
            employeeId: employee.id,
            period: `${startDate.toLocaleDateString('fr-FR', { month: 'short' })}-${endDate.toLocaleDateString('fr-FR', { month: 'short' })} ${startDate.getFullYear()}`,
            startDate: startDate,
            endDate: endDate,
            durationDays: 30,
            baseSalary: Math.round(baseSalary),
            allowance: Math.round(allowance),
            cnssAmount: Math.round(cnssAmount),
            iptsAmount: Math.round(iptsAmount),
            netSalary: Math.round(netSalary),
            recallAmount: recallAmount,
            liquidatedAmount: 0,
            paymentStatus: 'unpaid',
            createdBy: req.session.userId
          };
          
          try {
            const savedRecord = await storage.createSalaryRecord(record);
            mockSalaries.push(savedRecord);
            console.log('Created salary record:', savedRecord.id);
          } catch (error) {
            console.error('Error creating salary record:', error);
            throw error;
          }
        }
        
        console.log('Test data created:', mockSalaries.length, 'records');
        return res.json({ message: "Données de test créées. Veuillez réessayer l'export." });
      }

      if (!user || !employee || !salaryRecords) {
        throw new Error('Required data not found');
      }

      // En-tête du document
      console.log('Writing document header...');
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('Historique des Soldes d\'Avancement', { align: 'center' });

      doc.moveDown();

      // Informations de l'employé
      console.log('Writing employee information...');
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Informations de l\'employé', { underline: true });

      doc.fontSize(10)
         .font('Helvetica')
         .text(`Matricule: ${employee.matricule}`)
         .text(`Nom complet: ${employee.lastName} ${employee.firstName}`)
         .text(`Grade: ${employee.grade}`)
         .text(`Service: ${employee.service}`);

      doc.moveDown();

      // En-tête du tableau
      console.log('Creating table header...');
      const startX = 50;
      let currentY = doc.y + 20;
      const rowHeight = 20;
      const colWidths = {
        period: 120,
        duration: 60,
        base: 80,
        allowance: 80,
        cnss: 70,
        ipts: 70,
        net: 80,
        due: 80
      };

      // Style de l'en-tête
      doc.font('Helvetica-Bold')
         .fontSize(10);

      // Dessiner l'en-tête du tableau
      doc.rect(startX, currentY, doc.page.width - 100, rowHeight)
         .fillAndStroke('#2980b9', '#2980b9');

      let xPos = startX + 5;
      doc.fill('#FFFFFF');

      // En-têtes des colonnes
      doc.text('Période', xPos, currentY + 5);
      xPos += colWidths.period;
      doc.text('Durée', xPos, currentY + 5);
      xPos += colWidths.duration;
      doc.text('Salaire de base', xPos, currentY + 5);
      xPos += colWidths.base;
      doc.text('Indemnité', xPos, currentY + 5);
      xPos += colWidths.allowance;
      doc.text('CNSS', xPos, currentY + 5);
      xPos += colWidths.cnss;
      doc.text('IPTS', xPos, currentY + 5);
      xPos += colWidths.ipts;
      doc.text('Net', xPos, currentY + 5);
      xPos += colWidths.net;
      doc.text('Rappels dus', xPos, currentY + 5);

      currentY += rowHeight;

      // Contenu du tableau
      console.log('Writing table content...');
      doc.font('Helvetica')
         .fontSize(9)
         .fill('#000000');

      let totalDue = 0;
      let alternate = false;

      for (const record of salaryRecords) {
        // Fond alterné
        if (alternate) {
          doc.rect(startX, currentY, doc.page.width - 100, rowHeight)
             .fill('#f5f5f5');
        }

        const formatDate = (timestamp: number) => {
          return new Date(timestamp).toLocaleDateString('fr-FR');
        };
        const formatAmount = (amount: number) => {
          // Formater avec des espaces comme séparateurs de milliers
          return amount.toLocaleString('fr-FR', { 
            style: 'currency', 
            currency: 'XOF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            useGrouping: true
          }).replace(/\s/g, ' '); // Assurer que les espaces sont des espaces normaux
        };

        xPos = startX + 5;
        doc.fill(alternate ? '#666666' : '#000000');

        // Période
        doc.text(`${formatDate(record.startDate)} - ${formatDate(record.endDate)}`, xPos, currentY + 5);
        xPos += colWidths.period;

        // Durée
        doc.text(record.durationDays.toString(), xPos, currentY + 5);
        xPos += colWidths.duration;

        // Montants alignés à droite
        const rightAlign = { width: 70, align: 'right' };
        
        // Montants
        doc.text(formatAmount(record.baseSalary), xPos, currentY + 5, rightAlign);
        xPos += colWidths.base;
        doc.text(formatAmount(record.allowance), xPos, currentY + 5, rightAlign);
        xPos += colWidths.allowance;
        doc.text(formatAmount(record.cnssAmount), xPos, currentY + 5, rightAlign);
        xPos += colWidths.cnss;
        doc.text(formatAmount(record.iptsAmount), xPos, currentY + 5, rightAlign);
        xPos += colWidths.ipts;
        doc.text(formatAmount(record.netSalary), xPos, currentY + 5, rightAlign);
        xPos += colWidths.net;
        doc.text(formatAmount(record.recallAmount), xPos, currentY + 5, rightAlign);

        totalDue += record.recallAmount;
        currentY += rowHeight;
        alternate = !alternate;

        // Nouvelle page si nécessaire
        if (currentY > doc.page.height - 100) {
          doc.addPage();
          currentY = 50;
        }
      }

      // Total des rappels
      doc.moveDown();
      doc.font('Helvetica-Bold')
         .fontSize(10);

      const totalWidth = 150;
      xPos = doc.page.width - 150;
      currentY += 10;

      doc.rect(xPos - 5, currentY, totalWidth, rowHeight)
         .fillAndStroke('#f5f5f5', '#cccccc');

      doc.fill('#000000')
         .text('Total Rappel:', xPos, currentY + 5)
         .text(totalDue.toLocaleString('fr-FR', { 
           style: 'currency', 
           currency: 'XOF',
           minimumFractionDigits: 0,
           maximumFractionDigits: 0,
           useGrouping: true 
         }).replace(/\s/g, ' '), 
         xPos + 80, currentY + 5, { width: 65, align: 'right' });

      // Pied de page
      console.log('Writing footer...');
      doc.fontSize(8)
         .text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, 50, doc.page.height - 50, {
           align: 'center',
           width: doc.page.width - 100
         });

      // Finaliser le document
      console.log('Finalizing document...');
      doc.end();
      console.log('PDF generation completed successfully');

    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ message: "Erreur lors de la génération du PDF" });
    }
  });

  // User management routes (Admin only)
  app.get("/api/users", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const filters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: (req.query.search as string) || '',
        sortBy: (req.query.sortBy as string) || '',
        sortDesc: req.query.sortDesc === 'true'
      };
      
      console.log('Fetching users with filters:', filters);
      const result = await storage.getPaginatedUsers(filters);
      console.log('Users fetched:', result);
      res.json(result);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      console.log('Creating user with data:', req.body);
      
      // Extraire les données pour l'utilisateur et l'employé
      const { grade, function: employeeFunction, service, ...userData } = req.body;
      
      // Valider les données de l'utilisateur
      const validatedUserData = insertUserSchema.parse(userData);
      console.log('Validated user data:', validatedUserData);
      
      // Vérifier si le matricule existe déjà
      const existingUser = await storage.getUserByMatricule(validatedUserData.matricule);
      if (existingUser) {
        console.log('User creation failed: Matricule already exists');
        return res.status(400).json({ 
          message: "Un utilisateur avec ce matricule existe déjà",
          field: "matricule"
        });
      }

      // Sauvegarder le mot de passe en clair pour l'afficher plus tard
      const clearPassword = validatedUserData.password;
      console.log('Clear password saved:', clearPassword);
      
      // Créer l'utilisateur
      const hashedPassword = await bcrypt.hash(validatedUserData.password, 10);
      const user = await storage.createUser({ ...validatedUserData, password: hashedPassword });
      
      // Si c'est un employé, créer aussi l'entrée dans la table employees
      if (validatedUserData.role === 'employee') {
        try {
          const employeeData = {
            matricule: validatedUserData.matricule,
            firstName: validatedUserData.firstName,
            lastName: validatedUserData.lastName,
            grade,
            gradeIndex: 1, // Valeur par défaut, à ajuster selon vos besoins
            service,
            department: service, // Pour le moment, on utilise le même que service
            entryDate: Date.now(),
            phone: validatedUserData.phone,
            email: validatedUserData.email
          };
          
          const validatedEmployeeData = insertEmployeeSchema.parse(employeeData);
          await storage.createEmployee(validatedEmployeeData);
        } catch (error) {
          // Si la création de l'employé échoue, supprimer l'utilisateur créé
          await storage.deleteUser(user.id);
          throw error;
        }
      }
      
      console.log('User created successfully:', { ...user, password: undefined });
      
      // Préparer la réponse avec le mot de passe en clair
      const responseData = { ...user, password: clearPassword };
      console.log('Response data being sent:', responseData);
      
      // S'assurer que le mot de passe en clair est retourné pour l'affichage
      res.json(responseData);
    } catch (error) {
      console.error('User creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Données invalides", 
          errors: error.errors 
        });
      }
      res.status(400).json({ message: "Impossible de créer l'utilisateur" });
    }
  });

  app.put("/api/users/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      
      const user = await storage.updateUser(id, userData);
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete user" });
    }
  });

  app.post("/api/users/:id/reset-password", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const newPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.resetUserPassword(id, hashedPassword);
      res.json({ newPassword });
    } catch (error) {
      res.status(400).json({ message: "Failed to reset password" });
    }
  });

  // Employee management routes
  app.get("/api/employees/departments", requireAuth, async (req, res) => {
    try {
      const departments = await storage.getEmployeeDepartments();
      res.json(departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.get("/api/employees/search", requireAuth, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json([]);
      }
      const employees = await storage.searchEmployees(query);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to search employees" });
    }
  });

  app.get("/api/employees/:matricule", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByMatricule(req.params.matricule);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.get("/api/employees", requireAuth, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = (req.query.sortBy as string) || 'lastName';
      const sortDesc = req.query.sortDesc === 'true';
      const search = (req.query.search as string) || '';
      const department = (req.query.department as string) || '';

      const { items, total } = await storage.getAllEmployees({
        page,
        limit,
        sortBy,
        sortDesc,
        search,
        department
      });

      res.json({ items, total, page, limit });
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employeeData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, employeeData);
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEmployee(id);
      res.json({ message: "Employee deleted successfully" });
    } catch (error) {
      console.error('Error deleting employee:', error);
      res.status(400).json({ message: "Failed to delete employee" });
    }
  });

  // Salary records routes
  app.get("/api/salary-records", requireAuth, requireRole(["accountant", "admin"]), async (req, res) => {
    try {
      const records = await storage.getAllSalaryRecords();
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch salary records" });
    }
  });

  app.get("/api/salary-records/employee/:matricule", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByMatricule(req.params.matricule);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Check if user can access this employee's records
      if (req.session.userRole === "employee") {
        const user = await storage.getUserByMatricule(req.params.matricule);
        if (!user || user.id !== req.session.userId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      const records = await storage.getSalaryRecordsByEmployee(employee.id);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch salary records" });
    }
  });

  app.post("/api/salary-records", requireAuth, requireRole(["accountant"]), async (req, res) => {
    try {
      const recordData = insertSalaryRecordSchema.parse(req.body);
      recordData.createdBy = req.session.userId;
      const record = await storage.createSalaryRecord(recordData);
      res.json(record);
    } catch (error) {
      res.status(400).json({ message: "Failed to create salary record" });
    }
  });

  app.put("/api/salary-records/:id", requireAuth, requireRole(["accountant"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recordData = insertSalaryRecordSchema.partial().parse(req.body);
      const record = await storage.updateSalaryRecord(id, recordData);
      res.json(record);
    } catch (error) {
      res.status(400).json({ message: "Failed to update salary record" });
    }
  });

  // Complaints routes
  app.get("/api/complaints", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      console.log('[Complaints Route] Session:', {
        userId: req.session.userId,
        userRole: req.session.userRole
      });
      
      const { page, limit, search, status, sortBy, sortDesc } = req.query;
      console.log('[Complaints Route] Query params:', { page, limit, search, status, sortBy, sortDesc });

      console.log('[Complaints Route] Processing admin request');
      const result = await storage.getAllComplaints({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search?.toString(),
        status: status?.toString(),
        sortBy: sortBy?.toString(),
        sortDesc: sortDesc === 'true'
      });
      console.log('[Complaints Route] Found complaints for admin:', result.items.length);
      res.json(result);
    } catch (error) {
      console.error('[Complaints Route] Error:', error);
      res.status(500).json({ message: "Failed to fetch complaints" });
    }
  });

  app.post("/api/complaints", requireAuth, requireRole(["employee"]), upload.array('attachments'), async (req, res) => {
    try {
      console.log('[Complaints Route] Creating complaint - Request body:', req.body);
      console.log('[Complaints Route] Files:', req.files);

      const files = req.files as Express.Multer.File[];
      const attachments = files?.map(file => file.path.replace(/\\/g, '/')) || [];

      // Récupérer les pièces jointes existantes du body si présentes
      let existingAttachments: string[] = [];
      try {
        if (req.body.attachments) {
          existingAttachments = JSON.parse(req.body.attachments);
        }
      } catch (e) {
        console.warn('[Complaints Route] Failed to parse existing attachments:', e);
      }

      // Combiner les pièces jointes existantes avec les nouvelles
      const allAttachments = [...existingAttachments, ...attachments];

      const complaintData = {
        ...req.body,
        employeeId: req.session.userId,
        attachments: JSON.stringify(allAttachments)
      };

      console.log('[Complaints Route] Complaint data:', complaintData);

      const validationResult = insertComplaintSchema.safeParse(complaintData);
      if (!validationResult.success) {
        console.log('[Complaints Route] Validation failed:', validationResult.error);
        return res.status(400).json({ 
          message: "Données de réclamation invalides", 
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const complaint = await storage.createComplaint(validationResult.data);
      console.log('[Complaints Route] Complaint created:', complaint);

      // Récupérer les informations de l'employé
      const employee = await storage.getEmployee(complaint.employeeId);
      const complaintWithEmployee = {
        ...complaint,
        employee: employee ? {
          matricule: employee.matricule,
          firstName: employee.firstName,
          lastName: employee.lastName,
          department: employee.department,
          service: employee.service
        } : undefined
      };

      res.status(201).json(complaintWithEmployee);
    } catch (error) {
      console.error('[Complaints Route] Error creating complaint:', error);
      res.status(500).json({ 
        message: "Erreur lors de la création de la réclamation",
        error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
      });
    }
  });

  app.put("/api/complaints/:id/resolve", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const complaintId = parseInt(req.params.id);
      if (isNaN(complaintId)) {
        return res.status(400).json({ message: "ID de réclamation invalide" });
      }

      const complaint = await storage.getComplaint(complaintId);
      if (!complaint) {
        return res.status(404).json({ message: "Réclamation non trouvée" });
      }

      const resolvedComplaint = await storage.updateComplaint(complaintId, {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: req.session.userId
      });

      res.json(resolvedComplaint);
    } catch (error) {
      console.error('Error resolving complaint:', error);
      res.status(500).json({ message: "Erreur lors de la résolution de la réclamation" });
    }
  });

  // Grade rates routes
  app.get("/api/grade-rates", requireAuth, requireRole(["accountant", "admin"]), async (req, res) => {
    try {
      const rates = await storage.getAllGradeRates();
      res.json(rates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch grade rates" });
    }
  });

  app.post("/api/grade-rates", requireAuth, requireRole(["accountant"]), async (req, res) => {
    try {
      const rateData = insertGradeRateSchema.parse(req.body);
      const rate = await storage.createGradeRate(rateData);
      res.json(rate);
    } catch (error) {
      res.status(400).json({ message: "Failed to create grade rate" });
    }
  });

  app.put("/api/grade-rates/:id", requireAuth, requireRole(["accountant"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rateData = insertGradeRateSchema.partial().parse(req.body);
      const rate = await storage.updateGradeRate(id, rateData);
      res.json(rate);
    } catch (error) {
      res.status(400).json({ message: "Failed to update grade rate" });
    }
  });

  app.delete("/api/grade-rates/:id", requireAuth, requireRole(["accountant"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGradeRate(id);
      res.json({ message: "Grade rate deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete grade rate" });
    }
  });

  // Career history routes
  app.get("/api/career-history/:matricule", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByMatricule(req.params.matricule);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Check if user can access this employee's career history
      if (req.session.userRole === "employee") {
        const user = await storage.getUserByMatricule(req.params.matricule);
        if (!user || user.id !== req.session.userId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      const history = await storage.getCareerHistoryByEmployee(employee.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch career history" });
    }
  });

  // Dashboard stats routes
  app.get("/api/dashboard/stats", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/employee-growth/:year", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const growth = await storage.getEmployeeGrowth(year);
      res.json(growth);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee growth" });
    }
  });

  app.get("/api/dashboard/accountant-stats", requireAuth, requireRole(["accountant"]), async (req, res) => {
    try {
      const stats = await storage.getAccountantStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accountant stats" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', sortBy = 'lastName', sortDesc = false } = req.query

      // Construction de la requête
      let query = db.select().from(users)

      // Recherche
      if (search) {
        query = query.where(
          sql`LOWER(matricule) LIKE ${`%${search.toLowerCase()}%`} OR 
              LOWER(firstName) LIKE ${`%${search.toLowerCase()}%`} OR 
              LOWER(lastName) LIKE ${`%${search.toLowerCase()}%`}`
        )
      }

      // Comptage total
      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(query.as('filtered_users'))

      // Tri et pagination
      const offset = (Number(page) - 1) * Number(limit)
      query = query
        .orderBy(sql`${sortBy} ${sortDesc ? 'DESC' : 'ASC'}`)
        .limit(Number(limit))
        .offset(offset)

      const items = await query

      res.json({
        items,
        total: Number(count),
        page: Number(page),
        limit: Number(limit)
      })
    } catch (error) {
      console.error('Error fetching users:', error)
      res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' })
    }
  });

  app.post("/api/admin/users", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const {
        matricule,
        firstName,
        lastName,
        email,
        phone,
        role,
        grade,
        function: userFunction,
        service
      } = req.body

      // Vérification si le matricule ou l'email existe déjà
      const existing = await db
        .select()
        .from(users)
        .where(sql`matricule = ${matricule} OR email = ${email}`)
        .limit(1)

      if (existing.length > 0) {
        return res.status(400).json({
          message: 'Un utilisateur avec ce matricule ou cet email existe déjà'
        })
      }

      // Génération du mot de passe initial
      const password = generatePassword()
      const hashedPassword = await bcrypt.hash(password, 10)

      // Création de l'utilisateur
      const [user] = await db
        .insert(users)
        .values({
          matricule,
          firstName,
          lastName,
          email,
          phone,
          role,
          grade,
          function: userFunction,
          service,
          password: hashedPassword
        })
        .returning()

      res.status(201).json({
        user,
        password // Retourner le mot de passe en clair pour l'afficher à l'admin
      })
    } catch (error) {
      console.error('Error creating user:', error)
      res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' })
    }
  });

  app.put("/api/admin/users/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const { id } = req.params
      const { role } = req.body

      // Mise à jour du rôle uniquement
      const [user] = await db
        .update(users)
        .set({ role })
        .where(eq(users.id, Number(id)))
        .returning()

      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' })
      }

      res.json(user)
    } catch (error) {
      console.error('Error updating user:', error)
      res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' })
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const { id } = req.params

      const [user] = await db
        .delete(users)
        .where(eq(users.id, Number(id)))
        .returning()

      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' })
      }

      res.status(204).send()
    } catch (error) {
      console.error('Error deleting user:', error)
      res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' })
    }
  });

  app.post("/api/admin/users/:id/reset-password", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const { id } = req.params

      // Génération du nouveau mot de passe
      const password = generatePassword()
      const hashedPassword = await bcrypt.hash(password, 10)

      // Mise à jour du mot de passe
      const [user] = await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, Number(id)))
        .returning()

      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' })
      }

      res.json({
        user,
        password // Retourner le mot de passe en clair pour l'afficher à l'admin
      })
    } catch (error) {
      console.error('Error resetting password:', error)
      res.status(500).json({ message: 'Erreur lors de la réinitialisation du mot de passe' })
    }
  });

  // Initialize default data if needed
  app.post("/api/init", async (req, res) => {
    try {
      // Create default users if they don't exist
      const defaultUsers = [
        {
          matricule: "ADMIN001",
          password: "admin123",
          role: "admin",
          firstName: "Admin",
          lastName: "System",
          email: "admin@kalid.com",
        },
        {
          matricule: "EMP001",
          password: "emp123",
          role: "employee",
          firstName: "Marie",
          lastName: "Kouadio",
          email: "marie.kouadio@cotonou.gov.bj",
        },
        {
          matricule: "COMPT001",
          password: "compta123",
          role: "accountant",
          firstName: "Jean",
          lastName: "Dupont",
          email: "comptable@kalid.com",
        },
      ];

      for (const userData of defaultUsers) {
        const existingUser = await storage.getUserByMatricule(userData.matricule);
        if (!existingUser) {
          // Stocker le mot de passe en clair
          await storage.createUser(userData);
        }
      }

      // Create default employee records
      const defaultEmployees = [
        {
          matricule: "EMP001",
          firstName: "Marie",
          lastName: "Kouadio",
          grade: "Agent Principal",
          gradeIndex: 450,
          service: "Direction Financière",
          department: "Finance",
          entryDate: new Date("2020-03-15"),
          email: "marie.kouadio@cotonou.gov.bj",
        },
      ];

      for (const employeeData of defaultEmployees) {
        const existingEmployee = await storage.getEmployeeByMatricule(employeeData.matricule);
        if (!existingEmployee) {
          await storage.createEmployee(employeeData);
        }
      }

      // Create default grade rates
      const defaultGradeRates = [
        { grade: "Agent Principal", cnssRate: "10.00", iptsRate: "8.00" },
        { grade: "Secrétaire", cnssRate: "9.00", iptsRate: "7.00" },
        { grade: "Chef de Service", cnssRate: "12.00", iptsRate: "10.00" },
      ];

      for (const rateData of defaultGradeRates) {
        const existingRate = await storage.getGradeRate(rateData.grade);
        if (!existingRate) {
          await storage.createGradeRate(rateData);
        }
      }

      res.json({ message: "Default data initialized successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to initialize default data" });
    }
  });

  // Routes pour les réclamations
  app.get("/api/complaints/me", requireAuth, requireRole(["employee"]), async (req, res) => {
    try {
      console.log('[Complaints/Me Route] Session:', {
        userId: req.session.userId,
        userRole: req.session.userRole
      });

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        console.log('[Complaints/Me Route] User not found');
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      console.log('[Complaints/Me Route] User found:', {
        id: user.id,
        matricule: user.matricule,
        role: user.role
      });

      const employee = await storage.getEmployeeByMatricule(user.matricule);
      if (!employee) {
        console.log('[Complaints/Me Route] Employee not found for matricule:', user.matricule);
        return res.status(404).json({ message: "Employé non trouvé" });
      }
      console.log('[Complaints/Me Route] Employee found:', {
        id: employee.id,
        matricule: employee.matricule,
        name: `${employee.firstName} ${employee.lastName}`
      });

      const complaints = await storage.getComplaintsByEmployee(employee.id);
      console.log('[Complaints/Me Route] Complaints found:', complaints.length);
      res.json(complaints);
    } catch (error) {
      console.error('[Complaints/Me Route] Error:', error);
      res.status(500).json({ message: "Erreur lors de la récupération des réclamations" });
    }
  });

  app.post("/api/complaints", requireAuth, requireRole(["employee"]), upload.array('attachments'), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const employee = await storage.getEmployeeByMatricule(user.matricule);
      if (!employee) {
        return res.status(404).json({ message: "Employé non trouvé" });
      }

      const files = req.files as Express.Multer.File[];
      const attachments = files ? files.map(file => file.path.replace(/\\/g, '/')) : [];

      const complaint = await storage.createComplaint({
        employeeId: employee.id,
        type: req.body.type,
        description: req.body.description,
        periodStart: Number(req.body.periodStart),
        periodEnd: Number(req.body.periodEnd),
        attachments: attachments.length > 0 ? attachments : undefined,
        status: 'pending'
      });

      res.json(complaint);
    } catch (error) {
      console.error('Error creating complaint:', error);
      res.status(500).json({ message: "Erreur lors de la création de la réclamation" });
    }
  });

  app.patch("/api/complaints/:id", requireAuth, requireRole(["employee"]), async (req, res) => {
    try {
      const complaintId = parseInt(req.params.id);
      const complaint = await storage.getComplaint(complaintId);

      if (!complaint) {
        return res.status(404).json({ message: "Réclamation non trouvée" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const employee = await storage.getEmployeeByMatricule(user.matricule);
      if (!employee || complaint.employeeId !== employee.id) {
        return res.status(403).json({ message: "Accès non autorisé" });
      }

      const updatedComplaint = await storage.updateComplaint(complaintId, {
        type: req.body.type,
        description: req.body.description,
        periodStart: req.body.periodStart ? Number(req.body.periodStart) : undefined,
        periodEnd: req.body.periodEnd ? Number(req.body.periodEnd) : undefined
      });

      res.json(updatedComplaint);
    } catch (error) {
      console.error('Error updating complaint:', error);
      res.status(500).json({ message: "Erreur lors de la mise à jour de la réclamation" });
    }
  });

  app.delete("/api/complaints/:id", requireAuth, requireRole(["employee"]), async (req, res) => {
    try {
      const complaintId = parseInt(req.params.id);
      const complaint = await storage.getComplaint(complaintId);

      if (!complaint) {
        return res.status(404).json({ message: "Réclamation non trouvée" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const employee = await storage.getEmployeeByMatricule(user.matricule);
      if (!employee || complaint.employeeId !== employee.id) {
        return res.status(403).json({ message: "Accès non autorisé" });
      }

      await storage.deleteComplaint(complaintId);
      res.json({ message: "Réclamation supprimée avec succès" });
    } catch (error) {
      console.error('Error deleting complaint:', error);
      res.status(500).json({ message: "Erreur lors de la suppression de la réclamation" });
    }
  });

  // Route de diagnostic
  app.get("/api/diagnostic", requireAuth, async (req, res) => {
    try {
      console.log('[Diagnostic] Starting database check...');
      
      // Vérifier les utilisateurs
      const users = await db.select().from(users);
      console.log('[Diagnostic] Users count:', users.length);
      
      // Vérifier les employés
      const employees = await db.select().from(employees);
      console.log('[Diagnostic] Employees count:', employees.length);
      
      // Vérifier les réclamations
      const allComplaints = await db.select().from(complaints);
      console.log('[Diagnostic] All complaints:', allComplaints);
      
      // Vérifier les réclamations de EMP001
      const emp001 = employees.find(e => e.matricule === 'EMP001');
      if (emp001) {
        const emp001Complaints = allComplaints.filter(c => c.employeeId === emp001.id);
        console.log('[Diagnostic] EMP001 complaints:', emp001Complaints);
      }
      
      res.json({
        users: users.length,
        employees: employees.length,
        complaints: allComplaints.length,
        emp001Complaints: emp001 ? allComplaints.filter(c => c.employeeId === emp001.id).length : 0
      });
    } catch (error) {
      console.error('[Diagnostic] Error:', error);
      res.status(500).json({ message: "Failed to run diagnostic" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
