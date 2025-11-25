import { defineStore } from 'pinia'
import { employeeService, type Employee, type EmployeeInfo, type EmployeeFilters, type Salary, type CareerEvent } from '@/services/employee.service'
import { accountantService } from '@/services/accountant.service'

interface EmployeeState {
  employees: Employee[]
  currentEmployee: EmployeeInfo | null
  salaries: Salary[]
  careerHistory: CareerEvent[]
  total: number
  loading: boolean
  error: string | null
  departments: string[]
}

export const useEmployeeStore = defineStore('employees', {
  state: (): EmployeeState => ({
    employees: [],
    currentEmployee: null,
    salaries: [],
    careerHistory: [],
    total: 0,
    loading: false,
    error: null,
    departments: []
  }),

  getters: {
    getFullName: (state) => (employee: Employee) => {
      return `${employee.lastName} ${employee.firstName}`
    }
  },

  actions: {
    async fetchEmployees(params: EmployeeFilters = {}) {
      console.log('Store: Starting fetchEmployees with params:', params)
      this.loading = true
      this.error = null
      try {
        console.log('Store: Calling employeeService.getAll')
        const data = await employeeService.getAll(params)
        console.log('Store: Raw data from service:', data)
        
        if (!data || !Array.isArray(data.items)) {
          throw new Error('Invalid response format')
        }
        
        this.employees = [...data.items]
        this.total = data.total
        
        console.log('Store: Updated state:', {
          employees: this.employees,
          total: this.total
        })
      } catch (error) {
        console.error('Store: Error in fetchEmployees:', error)
        this.error = error instanceof Error ? error.message : 'Échec du chargement des employés'
        this.employees = []
        this.total = 0
        throw error
      } finally {
        this.loading = false
        console.log('Store: Loading finished')
      }
    },

    async fetchDepartments() {
      console.log('Store: Starting fetchDepartments')
      try {
        const departments = await employeeService.getDepartments()
        
        if (!Array.isArray(departments)) {
          throw new Error('Invalid departments response format')
        }
        
        this.departments = departments
        console.log('Store: Departments loaded:', this.departments)
      } catch (error) {
        console.error('Store: Error in fetchDepartments:', error)
        this.error = error instanceof Error ? error.message : 'Échec du chargement des départements'
        this.departments = []
        throw error
      }
    },

    async createEmployee(employee: Omit<Employee, 'id'>) {
      this.loading = true
      this.error = null
      try {
        const newEmployee = await employeeService.create(employee)
        await this.fetchEmployees()
        return newEmployee
      } catch (error) {
        console.error('Store: Error in createEmployee:', error)
        this.error = error instanceof Error ? error.message : 'Échec de la création de l\'employé'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateEmployee(id: number, employee: Partial<Employee>) {
      console.log('Store: Starting updateEmployee', { id, employee })
      this.loading = true
      this.error = null
      try {
        const updatedEmployee = await employeeService.update(id, employee)
        console.log('Store: Employee updated successfully:', updatedEmployee)
        
        const index = this.employees.findIndex(e => e.id === id)
        if (index !== -1) {
          console.log('Store: Updating local employee at index:', index)
          this.employees = this.employees.map(emp => 
            emp.id === id ? { ...emp, ...updatedEmployee } : emp
          )
          console.log('Store: Local employees after update:', this.employees)
        }
        
        return updatedEmployee
      } catch (error) {
        console.error('Store: Error in updateEmployee:', error)
        this.error = error instanceof Error ? error.message : 'Échec de la mise à jour de l\'employé'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteEmployee(id: number) {
      this.loading = true
      this.error = null
      try {
        await employeeService.delete(id)
        await this.fetchEmployees()
      } catch (error) {
        console.error('Store: Error in deleteEmployee:', error)
        this.error = error instanceof Error ? error.message : 'Échec de la suppression de l\'employé'
        throw error
      } finally {
        this.loading = false
      }
    },

    async toggleEmployeeStatus(id: number) {
      this.loading = true
      this.error = null
      try {
        const updatedEmployee = await employeeService.toggleStatus(id)
        await this.fetchEmployees()
        return updatedEmployee
      } catch (error) {
        console.error('Store: Error in toggleEmployeeStatus:', error)
        this.error = error instanceof Error ? error.message : 'Échec du changement de statut de l\'employé'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchCurrentEmployee() {
      this.loading = true
      this.error = null
      try {
        const data = await employeeService.getCurrentEmployee()
        this.currentEmployee = data.employee
        this.careerHistory = data.careerHistory || []
        return data
      } catch (error) {
        console.error('Store: Error in fetchCurrentEmployee:', error)
        this.error = error instanceof Error ? error.message : 'Échec du chargement du profil'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchSalaries() {
      this.loading = true
      this.error = null
      try {
        const data = await employeeService.getSalaries()
        this.salaries = data
        return data
      } catch (error) {
        console.error('Store: Error in fetchSalaries:', error)
        this.error = error instanceof Error ? error.message : 'Échec du chargement des salaires'
        throw error
      } finally {
        this.loading = false
      }
    },

    async exportSalariesPDF(salaries: Salary[]) {
      try {
        return await employeeService.exportSalariesPDF(salaries)
      } catch (error) {
        console.error('Store: Error in exportSalariesPDF:', error)
        throw error
      }
    },

    async downloadSalarySlip(salaryId: number) {
      try {
        return await employeeService.downloadSalarySlip(salaryId)
      } catch (error) {
        console.error('Store: Error in downloadSalarySlip:', error)
        throw error
      }
    },

    async fetchEmployeeFiles(employeeId: number) {
      this.loading = true;
      this.error = null;
      try {
        const files = await accountantService.getEmployeeFiles(employeeId);
        return files;
      } catch (error) {
        console.error('Store: Error in fetchEmployeeFiles:', error);
        this.error = error instanceof Error ? error.message : 'Échec du chargement des dossiers';
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
}) 