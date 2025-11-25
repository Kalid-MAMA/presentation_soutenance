import { api } from './api'

// Pas besoin de conversion car SQLite renvoie déjà les timestamps en millisecondes
const convertDates = (employee: Employee): Employee => {
  console.log('Service - Conversion des dates pour:', employee)
  return {
    ...employee,
    entryDate: employee.entryDate ? Number(employee.entryDate) : null
  }
}

// Fonction utilitaire pour convertir les dates
const convertDateToTimestamp = (date: string | number | Date | null): number | null => {
  if (date === null || date === undefined) return null;
  if (typeof date === 'number') return date;
  try {
    const timestamp = new Date(date).getTime();
    return isNaN(timestamp) ? null : timestamp;
  } catch (e) {
    console.error('Erreur de conversion de date:', e);
    return null;
  }
}

export interface Employee {
  id?: number
  matricule: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  grade: string
  gradeIndex: number
  service: string
  department: string
  entryDate: number // Date au format timestamp SQLite
  isActive?: boolean
}

export interface EmployeeFilters {
  page?: number
  limit?: number
  sortBy?: string
  sortDesc?: boolean
  search?: string
  department?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface EmployeeInfo {
  id: number
  matricule: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  grade: string
  gradeIndex: number
  service: string
  department: string
  entryDate: number
  isActive: boolean
  totalDue?: number
  lastUpdate?: number
}

export interface SalaryHistory {
  id: number
  date: string
  base: number
  allowances: number
  deductions: number
  net: number
  status: 'pending' | 'processed' | 'paid'
}

export interface ComplaintCreate {
  type: string
  description: string
  periodStart: number
  periodEnd: number
  attachments?: File[]
}

export interface CareerEvent {
  id: number
  date: string
  type: 'promotion' | 'transfer' | 'grade'
  title: string
  description: string
}

export interface Salary {
  id: number
  startDate: string
  endDate: string
  duration: number
  baseSalary: number
  allowance: number
  cnss: number
  ipts: number
  net: number
  dueAmount: number
}

export interface Complaint {
  id: number
  employeeId: number
  type: string
  description: string
  periodStart: number
  periodEnd: number
  attachments: string[] | null
  status: 'pending' | 'in_progress' | 'resolved'
  resolvedAt: number | null
  resolvedBy: number | null
  createdAt: number
  employee?: {
    matricule: string
    firstName: string
    lastName: string
    department: string
  }
}

export class EmployeeService {
  private readonly baseUrl = '/api/employees'

  async getAll(filters: EmployeeFilters = {}) {
    console.log('Service: Starting getAll with filters:', filters)
    const params = new URLSearchParams()
    
    // Ajouter tous les paramètres de filtrage
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortDesc !== undefined) params.append('sortDesc', filters.sortDesc.toString())
    if (filters.search) params.append('search', filters.search)
    if (filters.department) params.append('department', filters.department)

    const queryString = params.toString()
    const url = `${this.baseUrl}${queryString ? `?${queryString}` : ''}`
    console.log('Service: Calling API with URL:', url)
    
    try {
      const response = await api.get<PaginatedResponse<Employee>>(url)
      console.log('Service: Raw API response:', response.data)
      
      // Convertir les dates pour chaque employé
      const processedItems = response.data.items.map(employee => ({
        ...employee,
        entryDate: convertDateToTimestamp(employee.entryDate)
      }))
      
      const processedResponse = {
        ...response.data,
        items: processedItems
      }
      
      console.log('Service: Processed response:', processedResponse)
      return processedResponse
    } catch (error) {
      console.error('Service: API error:', error)
      throw error
    }
  }

  async getById(id: number) {
    const response = await api.get<Employee>(`${this.baseUrl}/${id}`)
    return convertDates(response.data)
  }

  async getByMatricule(matricule: string) {
    const response = await api.get<Employee>(`${this.baseUrl}/${matricule}`)
    return convertDates(response.data)
  }

  async create(employee: Omit<Employee, 'id'>) {
    console.log('Service - Date reçue pour création:', employee.entryDate)
    const data = {
      ...employee,
      entryDate: convertDateToTimestamp(employee.entryDate)
    }
    console.log('Service - Date convertie pour l\'API:', data.entryDate)
    const response = await api.post<Employee>(this.baseUrl, data)
    return convertDates(response.data)
  }

  async update(id: number, employee: Partial<Employee>) {
    console.log('Service - Données reçues pour mise à jour:', employee);
    
    // S'assurer que toutes les données sont du bon type
    const data = {
      ...employee,
      entryDate: employee.entryDate !== undefined ? convertDateToTimestamp(employee.entryDate) : undefined,
      gradeIndex: employee.gradeIndex !== undefined ? Number(employee.gradeIndex) : undefined,
      isActive: employee.isActive !== undefined ? Boolean(employee.isActive) : undefined
    };
    
    console.log('Service - Données formatées pour l\'API:', data);
    const response = await api.put<Employee>(`${this.baseUrl}/${id}`, data);
    return convertDates(response.data);
  }

  async delete(id: number) {
    await api.delete(`${this.baseUrl}/${id}`)
  }

  async toggleStatus(id: number) {
    const response = await api.put<Employee>(`${this.baseUrl}/${id}/toggle-status`)
    return convertDates(response.data)
  }

  async getDepartments() {
    console.log('Service: Getting departments')
    try {
    const response = await api.get<string[]>(`${this.baseUrl}/departments`)
      console.log('Service: Departments response:', response.data)
    return response.data
    } catch (error) {
      console.error('Service: Error getting departments:', error)
      throw error
    }
  }

  async getEmployeeInfo(): Promise<EmployeeInfo> {
    const response = await api.get('/api/employee/info')
    return response.data
  }

  async getSalaryHistory(): Promise<SalaryHistory[]> {
    const response = await api.get('/api/employee/salaries')
    return response.data
  }

  async getCurrentEmployee() {
    try {
      const response = await api.get<{
        employee: EmployeeInfo;
        careerHistory: CareerEvent[];
      }>('/api/employees/me');
      return response.data;
    } catch (error) {
      console.error('Service: Error in getCurrentEmployee:', error);
      throw error;
    }
  }

  async getSalaries() {
    try {
      const response = await api.get<Salary[]>('/api/employees/salaries');
      return response.data;
    } catch (error) {
      console.error('Service: Error in getSalaries:', error);
      throw error;
    }
  }

  async exportSalariesPDF(salaries: Salary[]) {
    try {
      const response = await api.post('/api/employee/salaries/export', { salaries }, {
        responseType: 'blob'
      })
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'soldes.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Service: Error exporting salaries to PDF:', error)
      throw error
    }
  }

  async downloadSalarySlip(salaryId: number) {
    try {
      const response = await api.get(`/api/employees/salaries/${salaryId}/download`);
      return response.data;
    } catch (error) {
      console.error('Service: Error in downloadSalarySlip:', error);
      throw error;
    }
  }

  async getComplaints() {
    try {
      const response = await api.get<Complaint[]>('/api/complaints')
    return response.data
    } catch (error) {
      console.error('Service: Error getting complaints:', error)
      throw error
    }
  }

  async createComplaint(formData: FormData) {
    try {
      const response = await api.post('/api/complaints', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    return response.data
    } catch (error) {
      console.error('Service: Error creating complaint:', error)
      throw error
    }
  }

  async updateProfile(data: { email: string; phone: string }) {
    const response = await api.put('/employee/profile', data)
    return response.data
  }
}

export const employeeService = new EmployeeService() 