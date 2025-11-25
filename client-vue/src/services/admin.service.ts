import { api } from './api'

export interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  newEmployees: number
  totalComplaints: number
  resolvedComplaints: number
  departments: Array<{
    name: string
    count: number
  }>
}

export interface EmployeeGrowth {
  months: string[]
  counts: number[]
}

export const adminService = {
  async getDashboardStats(): Promise<DashboardStats> {
    console.log('Calling getDashboardStats API...')
    try {
      const response = await api.get('/api/dashboard/stats')
      console.log('API response:', response.data)
    return response.data
    } catch (error) {
      console.error('API error:', error)
      throw error
    }
  },

  async getEmployeeGrowth(year: number): Promise<EmployeeGrowth> {
    console.log('Calling getEmployeeGrowth API...')
    try {
      const response = await api.get(`/api/dashboard/employee-growth/${year}`)
      console.log('API response:', response.data)
    return response.data
    } catch (error) {
      console.error('API error:', error)
      throw error
    }
  },

  async searchEmployees(query: string) {
    const response = await api.get('/api/employees/search', {
      params: { q: query }
    })
    return response.data
  },

  async getEmployeesByDepartment(department: string) {
    const response = await api.get('/api/employees/by-department', {
      params: { department }
    })
    return response.data
  },

  async createEmployee(employeeData: any) {
    const response = await api.post('/api/employees', employeeData)
    return response.data
  },

  async updateEmployee(id: number, employeeData: any) {
    const response = await api.put(`/api/employees/${id}`, employeeData)
    return response.data
  },

  async deleteEmployee(id: number) {
    await api.delete(`/api/employees/${id}`)
  },

  async getComplaints() {
    const response = await api.get('/api/complaints')
    return response.data
  },

  async resolveComplaint(id: number) {
    const response = await api.put(`/api/complaints/${id}/resolve`)
    return response.data
  },

  async getUserAccounts() {
    const response = await api.get('/api/users')
    return response.data
  },

  async createUserAccount(userData: any) {
    const response = await api.post('/api/users', userData)
    return response.data
  },

  async updateUserAccount(id: number, userData: any) {
    const response = await api.put(`/api/users/${id}`, userData)
    return response.data
  },

  async deleteUserAccount(id: number) {
    await api.delete(`/api/users/${id}`)
  },

  async resetUserPassword(id: number) {
    console.log('Resetting password for user:', id)
    try {
      const response = await api.post(`/api/users/${id}/reset-password`)
      console.log('Password reset response:', response.data)
      return response.data
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  },

  async updateUserRole(id: number, role: string) {
    console.log('Updating role for user:', id, 'to:', role)
    try {
      const response = await api.put(`/api/users/${id}`, { role })
      console.log('Role update response:', response.data)
    return response.data
    } catch (error) {
      console.error('Role update error:', error)
      throw error
    }
  }
} 