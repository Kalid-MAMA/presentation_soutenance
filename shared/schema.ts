import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table for authentication
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  matricule: text('matricule').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull(), // 'admin', 'employee', 'accountant'
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  email: text('email'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Employees table for detailed employee information
export const employees = sqliteTable('employees', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  matricule: text('matricule').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  grade: text('grade').notNull(),
  gradeIndex: integer('grade_index').notNull(),
  service: text('service').notNull(),
  department: text('department').notNull(),
  entryDate: integer('entry_date', { mode: 'number' }).notNull(),
  phone: text('phone'),
  email: text('email'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Salary records table
export const salaryRecords = sqliteTable('salary_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  period: text('period').notNull(), // e.g., "Jan-Feb 2024"
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  durationDays: integer('duration_days').notNull(),
  baseSalary: real('base_salary').notNull(),
  allowance: real('allowance').notNull(),
  cnssAmount: real('cnss_amount').notNull(),
  iptsAmount: real('ipts_amount').notNull(),
  netSalary: real('net_salary').notNull(),
  recallAmount: real('recall_amount').notNull(),
  liquidatedAmount: real('liquidated_amount').notNull().default(0),
  paymentStatus: text('payment_status').notNull().default('unpaid'), // 'paid', 'partially_paid', 'unpaid'
  observations: text('observations'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: integer('created_by').references(() => users.id),
});

// Complaints table
export const complaints = sqliteTable('complaints', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  type: text('type').notNull(),
  description: text('description').notNull(),
  periodStart: integer('period_start', { mode: 'number' }).notNull(),
  periodEnd: integer('period_end', { mode: 'number' }).notNull(),
  attachments: text('attachments'), // Stocké comme JSON string
  status: text('status', { enum: ['pending', 'in_progress', 'resolved'] }).notNull().default('pending'),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  resolvedBy: integer('resolved_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Grade rates table for CNSS/IPTS calculations
export const gradeRates = sqliteTable('grade_rates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  grade: text('grade').notNull().unique(),
  cnssRate: real('cnss_rate').notNull(), // percentage
  iptsRate: real('ipts_rate').notNull(), // percentage
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Career history table
export const careerHistory = sqliteTable('career_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  grade: text('grade').notNull(),
  service: text('service').notNull(),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }),
  isCurrent: integer('is_current', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdSalaryRecords: many(salaryRecords),
  resolvedComplaints: many(complaints),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
  salaryRecords: many(salaryRecords),
  complaints: many(complaints),
  careerHistory: many(careerHistory),
}));

export const salaryRecordsRelations = relations(salaryRecords, ({ one }) => ({
  employee: one(employees, {
    fields: [salaryRecords.employeeId],
    references: [employees.id],
  }),
  createdBy: one(users, {
    fields: [salaryRecords.createdBy],
    references: [users.id],
  }),
}));

export const complaintsRelations = relations(complaints, ({ one }) => ({
  employee: one(employees, {
    fields: [complaints.employeeId],
    references: [employees.id],
  }),
  resolvedBy: one(users, {
    fields: [complaints.resolvedBy],
    references: [users.id],
  }),
}));

export const careerHistoryRelations = relations(careerHistory, ({ one }) => ({
  employee: one(employees, {
    fields: [careerHistory.employeeId],
    references: [employees.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users, {
  role: z.enum(['admin', 'employee', 'accountant']),
  password: z.string().min(8),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  createdAt: z.date().optional()
});
export const insertEmployeeSchema = createInsertSchema(employees, {
  entryDate: z.number(),
  createdAt: z.date().optional()
});
export const insertSalaryRecordSchema = createInsertSchema(salaryRecords);
export const insertComplaintSchema = z.object({
  employeeId: z.number(),
  type: z.string(),
  description: z.string(),
  periodStart: z.union([z.string(), z.number()]).transform(val => {
    if (typeof val === 'string') {
      if (/^\d+$/.test(val)) {
        return parseInt(val, 10);
      }
      const timestamp = new Date(val).getTime();
      if (isNaN(timestamp)) {
        throw new Error('Invalid date format');
      }
      return timestamp;
    }
    return val;
  }),
  periodEnd: z.union([z.string(), z.number()]).transform(val => {
    if (typeof val === 'string') {
      if (/^\d+$/.test(val)) {
        return parseInt(val, 10);
      }
      const timestamp = new Date(val).getTime();
      if (isNaN(timestamp)) {
        throw new Error('Invalid date format');
      }
      return timestamp;
    }
    return val;
  }),
  attachments: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'resolved']).default('pending'),
  resolvedAt: z.date().optional().nullable(),
  resolvedBy: z.number().optional().nullable(),
  createdAt: z.date().optional()
});
export const insertGradeRateSchema = createInsertSchema(gradeRates);
export const insertCareerHistorySchema = createInsertSchema(careerHistory);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type SalaryRecord = typeof salaryRecords.$inferSelect;
export type InsertSalaryRecord = z.infer<typeof insertSalaryRecordSchema>;

export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;

export type GradeRate = typeof gradeRates.$inferSelect;
export type InsertGradeRate = z.infer<typeof insertGradeRateSchema>;

export type CareerHistory = typeof careerHistory.$inferSelect;
export type InsertCareerHistory = z.infer<typeof insertCareerHistorySchema>;
