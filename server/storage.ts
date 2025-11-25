import { 
  users, employees, salaryRecords, complaints, gradeRates, careerHistory,
  type User, type InsertUser, type Employee, type InsertEmployee,
  type SalaryRecord, type InsertSalaryRecord, type Complaint, type InsertComplaint,
  type GradeRate, type InsertGradeRate, type CareerHistory, type InsertCareerHistory
} from "../shared/schema";
import { db } from "./db.js";
import { eq, desc, and, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByMatricule(matricule: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  resetUserPassword(id: number, password: string): Promise<void>;

  // Employee methods
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByMatricule(matricule: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;
  getAllEmployees(filters: EmployeeFilters): Promise<{ items: Employee[]; total: number }>;
  getEmployeeDepartments(): Promise<string[]>;

  // Salary record methods
  getSalaryRecord(id: number): Promise<SalaryRecord | undefined>;
  getSalaryRecordsByEmployee(employeeId: number): Promise<SalaryRecord[]>;
  createSalaryRecord(record: InsertSalaryRecord): Promise<SalaryRecord>;
  updateSalaryRecord(id: number, record: Partial<InsertSalaryRecord>): Promise<SalaryRecord>;
  getAllSalaryRecords(): Promise<SalaryRecord[]>;

  // Complaint methods
  getComplaint(id: number): Promise<Complaint | undefined>;
  getComplaintsByEmployee(employeeId: number): Promise<Complaint[]>;
  createComplaint(complaint: InsertComplaint): Promise<Complaint>;
  updateComplaint(id: number, complaint: Partial<InsertComplaint>): Promise<Complaint>;
  getAllComplaints(filters?: ComplaintFilters): Promise<{ items: Complaint[]; total: number }>;
  resolveComplaint(id: number, resolvedBy: number): Promise<Complaint>;
  deleteComplaint(id: number): Promise<void>;

  // Grade rate methods
  getGradeRate(grade: string): Promise<GradeRate | undefined>;
  getAllGradeRates(): Promise<GradeRate[]>;
  createGradeRate(rate: InsertGradeRate): Promise<GradeRate>;
  updateGradeRate(id: number, rate: Partial<InsertGradeRate>): Promise<GradeRate>;
  deleteGradeRate(id: number): Promise<void>;

  // Career history methods
  getCareerHistoryByEmployee(employeeId: number): Promise<CareerHistory[]>;
  createCareerHistory(history: InsertCareerHistory): Promise<CareerHistory>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    totalComplaints: number;
    resolvedComplaints: number;
    newEmployees: number;
    departments: Array<{ name: string; count: number }>;
  }>;

  getAccountantStats(): Promise<{
    createdFiles: number;
    totalLiquidated: string;
    totalRecalls: string;
    treatedEmployees: number;
  }>;

  getEmployeeGrowth(year: number): Promise<{
    months: string[];
    counts: number[];
  }>;

  searchEmployees(query: string): Promise<Employee[]>;

  getPaginatedUsers(filters: UserFilters): Promise<{ items: User[]; total: number }>;

  getAdminUsers(): Promise<User[]>;
}

export interface EmployeeFilters {
  page: number;
  limit: number;
  sortBy: string;
  sortDesc: boolean;
  search: string;
  department: string;
}

export interface UserFilters {
  page: number;
  limit: number;
  sortBy: string;
  sortDesc: boolean;
  search: string;
}

export interface ComplaintFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortDesc?: boolean;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByMatricule(matricule: string): Promise<User | undefined> {
    console.log('[Storage] Getting user by matricule:', matricule);
    try {
      const result = await db.select().from(users).where(eq(users.matricule, matricule));
      console.log('[Storage] User lookup result:', result.length ? { ...result[0], password: '[HIDDEN]' } : null);
      return result[0];
    } catch (error) {
      console.error('[Storage] Error getting user by matricule:', error);
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async resetUserPassword(id: number, password: string): Promise<void> {
    await db.update(users).set({ password }).where(eq(users.id, id));
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeeByMatricule(matricule: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.matricule, matricule));
    return employee || undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee> {
    const [updatedEmployee] = await db
      .update(employees)
      .set(employee)
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  async getAllEmployees(filters: EmployeeFilters): Promise<{ items: Employee[]; total: number }> {
    const offset = (filters.page - 1) * filters.limit;
    
    let query = db.select().from(employees);
    
    // Apply search filter
    if (filters.search) {
      query = query.where(
        sql`${employees.firstName} ILIKE ${`%${filters.search}%`} OR 
            ${employees.lastName} ILIKE ${`%${filters.search}%`} OR 
            ${employees.matricule} ILIKE ${`%${filters.search}%`}`
    );
  }

    // Apply department filter
    if (filters.department) {
      query = query.where(eq(employees.department, filters.department));
    }
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(query.as('filtered_employees'));
    
    // Apply sorting
    const sortColumn = employees[filters.sortBy as keyof typeof employees] || employees.lastName;
    query = filters.sortDesc 
      ? query.orderBy(desc(sortColumn))
      : query.orderBy(sortColumn);
    
    // Apply pagination
    query = query.limit(filters.limit).offset(offset);
    
    const items = await query;
    
    return {
      items,
      total: Number(count)
    };
  }

  async getEmployeeDepartments(): Promise<string[]> {
    const result = await db
      .select({ department: employees.department })
      .from(employees)
      .groupBy(employees.department)
      .orderBy(employees.department);
    
    return result.map((r: { department: string }) => r.department);
  }

  async getSalaryRecordsByEmployee(employeeId: number): Promise<SalaryRecord[]> {
    return await db.select().from(salaryRecords)
      .where(eq(salaryRecords.employeeId, employeeId))
      .orderBy(desc(salaryRecords.startDate));
  }

  async getSalaryRecord(id: number): Promise<SalaryRecord | undefined> {
    const [record] = await db.select().from(salaryRecords).where(eq(salaryRecords.id, id));
    return record || undefined;
  }

  async createSalaryRecord(record: InsertSalaryRecord): Promise<SalaryRecord> {
    const [newRecord] = await db.insert(salaryRecords).values(record).returning();
    return newRecord;
  }

  async updateSalaryRecord(id: number, record: Partial<InsertSalaryRecord>): Promise<SalaryRecord> {
    const [updatedRecord] = await db
      .update(salaryRecords)
      .set(record)
      .where(eq(salaryRecords.id, id))
      .returning();
    return updatedRecord;
  }

  async getAllSalaryRecords(): Promise<SalaryRecord[]> {
    return await db.select().from(salaryRecords).orderBy(desc(salaryRecords.createdAt));
  }

  async getComplaint(id: number): Promise<Complaint | undefined> {
    const [complaint] = await db.select().from(complaints).where(eq(complaints.id, id));
    return complaint || undefined;
  }

  async getComplaintsByEmployee(employeeId: number): Promise<Complaint[]> {
    console.log('[Storage] Getting complaints for employee:', employeeId);
    try {
      const result = await db.select().from(complaints)
      .where(eq(complaints.employeeId, employeeId))
      .orderBy(desc(complaints.createdAt));
      console.log('[Storage] Found complaints:', result.length);
      console.log('[Storage] Complaints:', result);
      return result;
    } catch (error) {
      console.error('[Storage] Error getting complaints:', error);
      throw error;
    }
  }

  async createComplaint(complaint: InsertComplaint): Promise<Complaint> {
    const [newComplaint] = await db.insert(complaints).values(complaint).returning();
    return newComplaint;
  }

  async updateComplaint(id: number, complaint: Partial<InsertComplaint>): Promise<Complaint> {
    const [updatedComplaint] = await db
      .update(complaints)
      .set(complaint)
      .where(eq(complaints.id, id))
      .returning();
    return updatedComplaint;
  }

  async getAllComplaints(filters: ComplaintFilters = {}): Promise<{ items: Complaint[]; total: number }> {
    console.log('[Storage] Getting all complaints with filters:', filters);
    
    const { page = 1, limit = 10, search, status, sortBy = 'createdAt', sortDesc = true } = filters;
    const offset = (page - 1) * limit;
    
    let query = db
      .select({
        complaint: complaints,
        employee: {
          matricule: employees.matricule,
          firstName: employees.firstName,
          lastName: employees.lastName,
          department: employees.department,
          service: employees.service
        }
      })
      .from(complaints)
      .leftJoin(employees, eq(complaints.employeeId, employees.id));
    
    // Apply search filter
    if (search) {
      query = query.where(
        sql`${complaints.type} ILIKE ${`%${search}%`} OR 
            ${complaints.description} ILIKE ${`%${search}%`} OR
            ${employees.matricule} ILIKE ${`%${search}%`} OR
            ${employees.firstName} ILIKE ${`%${search}%`} OR
            ${employees.lastName} ILIKE ${`%${search}%`}`
      );
    }
    
    // Apply status filter
    if (status) {
      query = query.where(eq(complaints.status, status));
    }
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(query.as('filtered_complaints'));
    
    // Apply sorting
    const sortColumn = complaints[sortBy as keyof typeof complaints] || complaints.createdAt;
    query = sortDesc 
      ? query.orderBy(desc(sortColumn))
      : query.orderBy(sortColumn);
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    console.log('[Storage] Executing complaints query');
    const results = await query;
    console.log('[Storage] Found complaints:', results.length);
    
    const items = results.map((result: { complaint: Complaint; employee: { matricule: string; firstName: string; lastName: string; department: string; service: string; } }) => ({
      ...result.complaint,
      employee: result.employee
    }));
    
    return {
      items,
      total: Number(count)
    };
  }

  async resolveComplaint(id: number, resolvedBy: number): Promise<Complaint> {
    const [resolvedComplaint] = await db
      .update(complaints)
      .set({ 
        status: 'resolved', 
        resolvedAt: new Date(), 
        resolvedBy 
      })
      .where(eq(complaints.id, id))
      .returning();
    return resolvedComplaint;
  }

  async deleteComplaint(id: number): Promise<void> {
    await db.delete(complaints).where(eq(complaints.id, id));
  }

  async getGradeRate(grade: string): Promise<GradeRate | undefined> {
    const [rate] = await db.select().from(gradeRates).where(eq(gradeRates.grade, grade));
    return rate || undefined;
  }

  async getAllGradeRates(): Promise<GradeRate[]> {
    return await db.select().from(gradeRates).orderBy(gradeRates.grade);
  }

  async createGradeRate(rate: InsertGradeRate): Promise<GradeRate> {
    const [newRate] = await db.insert(gradeRates).values(rate).returning();
    return newRate;
  }

  async updateGradeRate(id: number, rate: Partial<InsertGradeRate>): Promise<GradeRate> {
    const [updatedRate] = await db
      .update(gradeRates)
      .set({ ...rate, updatedAt: new Date() })
      .where(eq(gradeRates.id, id))
      .returning();
    return updatedRate;
  }

  async deleteGradeRate(id: number): Promise<void> {
    await db.delete(gradeRates).where(eq(gradeRates.id, id));
  }

  async getCareerHistoryByEmployee(employeeId: number): Promise<CareerHistory[]> {
    return await db.select().from(careerHistory)
      .where(eq(careerHistory.employeeId, employeeId))
      .orderBy(desc(careerHistory.startDate));
  }

  async createCareerHistory(history: InsertCareerHistory): Promise<CareerHistory> {
    const [newHistory] = await db.insert(careerHistory).values(history).returning();
    return newHistory;
  }

  async getDashboardStats(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    totalComplaints: number;
    resolvedComplaints: number;
    newEmployees: number;
    departments: Array<{ name: string; count: number }>;
  }> {
    // Get total employees (users with role 'employee')
    const [{ totalEmployees }] = await db
      .select({ totalEmployees: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'employee'));

    // Get active employees
    const [{ activeEmployees }] = await db
      .select({ activeEmployees: sql<number>`count(*)` })
      .from(users)
      .where(and(
        eq(users.role, 'employee'),
        eq(users.isActive, true)
      ));

    // Get new employees (this month)
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const [{ newEmployees }] = await db
      .select({ newEmployees: sql<number>`count(*)` })
      .from(users)
      .where(and(
        eq(users.role, 'employee'),
        sql`${users.createdAt} >= ${firstDayOfMonth.getTime()}`
      ));

    // Get total complaints
    const [{ totalComplaints }] = await db
      .select({ totalComplaints: sql<number>`count(*)` })
      .from(complaints);

    // Get resolved complaints
    const [{ resolvedComplaints }] = await db
      .select({ resolvedComplaints: sql<number>`count(*)` })
      .from(complaints)
      .where(sql`${complaints.resolvedAt} IS NOT NULL`);

    // Get departments with employee counts
    const departments = await db
      .select({
        name: employees.department,
        count: sql<number>`count(*)`
      })
      .from(employees)
      .where(
        sql`${employees.matricule} IN (
          SELECT matricule FROM users WHERE role = 'employee'
        )`
      )
      .groupBy(employees.department)
      .orderBy(employees.department);

    return {
      totalEmployees: Number(totalEmployees),
      activeEmployees: Number(activeEmployees),
      totalComplaints: Number(totalComplaints),
      resolvedComplaints: Number(resolvedComplaints),
      newEmployees: Number(newEmployees),
      departments: departments.map((d: { name: string; count: number }) => ({ 
        name: d.name, 
        count: Number(d.count) 
      }))
    };
  }

  async getAccountantStats(): Promise<{
    createdFiles: number;
    totalLiquidated: string;
    totalRecalls: string;
    treatedEmployees: number;
  }> {
    const [createdFiles] = await db.select({ count: sql<number>`count(*)` }).from(salaryRecords);
    const [totalLiquidated] = await db.select({ sum: sql<string>`COALESCE(SUM(liquidated_amount), 0)` }).from(salaryRecords);
    const [totalRecalls] = await db.select({ sum: sql<string>`COALESCE(SUM(recall_amount), 0)` }).from(salaryRecords);
    const [treatedEmployees] = await db.select({ count: sql<number>`count(DISTINCT employee_id)` }).from(salaryRecords);

    return {
      createdFiles: createdFiles.count,
      totalLiquidated: totalLiquidated.sum,
      totalRecalls: totalRecalls.sum,
      treatedEmployees: treatedEmployees.count,
    };
  }

  async getEmployeeGrowth(year: number): Promise<{
    months: string[];
    counts: number[];
  }> {
    const months = [];
    const counts = [];
    
    for (let month = 0; month < 12; month++) {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      const [result] = await db.select({
        count: sql<number>`count(*)`
      })
      .from(employees)
      .where(sql`${employees.createdAt} >= datetime(${startDate.toISOString()}) AND ${employees.createdAt} <= datetime(${endDate.toISOString()})`);
      
      months.push(startDate.toISOString());
      counts.push(result.count);
    }
    
    return { months, counts };
  }

  async searchEmployees(query: string): Promise<Employee[]> {
    return await db.select().from(employees).where(
      sql`${employees.firstName} ILIKE ${`%${query}%`} OR ${employees.lastName} ILIKE ${`%${query}%`} OR ${employees.matricule} ILIKE ${`%${query}%`}`
    );
  }

  async getPaginatedUsers(filters: UserFilters): Promise<{ items: User[]; total: number }> {
    const offset = (filters.page - 1) * filters.limit;
    
    let query = db.select().from(users);
    
    // Apply search filter
    if (filters.search) {
      query = query.where(
        sql`${users.firstName} ILIKE ${`%${filters.search}%`} OR 
            ${users.lastName} ILIKE ${`%${filters.search}%`} OR 
            ${users.matricule} ILIKE ${`%${filters.search}%`}`
      );
    }
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(query.as('filtered_users'));
    
    // Apply sorting
    if (filters.sortBy) {
      const sortColumn = users[filters.sortBy as keyof typeof users];
      if (sortColumn) {
        query = filters.sortDesc 
          ? query.orderBy(desc(sortColumn))
          : query.orderBy(sortColumn);
      }
    } else {
      query = query.orderBy(desc(users.createdAt));
    }
    
    // Apply pagination
    query = query.limit(filters.limit).offset(offset);
    
    const items = await query;

    // Get all employees and create user accounts for them if they don't exist
    const allEmployees = await db.select().from(employees);
    const newUsers: InsertUser[] = [];

    for (const employee of allEmployees) {
      const existingUser = items.find(u => u.matricule === employee.matricule);
      if (!existingUser) {
        // Create a new user account for this employee
        const newUser: InsertUser = {
          matricule: employee.matricule,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email || undefined,
          phone: employee.phone || undefined,
          role: 'employee',
          password: await bcrypt.hash('password123', 10), // Temporary password
          isActive: employee.isActive
        };
        newUsers.push(newUser);
      }
    }

    // Insert new users if any
    if (newUsers.length > 0) {
      await db.insert(users).values(newUsers);
      // Refresh the query to include new users
      const updatedItems = await query;
      return {
        items: updatedItems.map(user => ({ ...user, password: undefined })),
        total: Number(count) + newUsers.length
      };
    }
    
    return {
      items: items.map((u: User) => ({
        ...u,
        password: undefined
      })),
      total: Number(count)
    };
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  private async createUserWithPassword(user: InsertUser): Promise<User> {
    const hashedPassword = await this.hashPassword(user.password);
    return this.createUser({ ...user, password: hashedPassword });
  }

  async getAdminUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .orderBy(users.createdAt);
  }
}

export const storage = new DatabaseStorage();


