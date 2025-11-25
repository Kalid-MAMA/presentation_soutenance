import api from './api'

export interface AccountantStats {
  totalEmployees: number
  pendingPayments: number
  totalPayroll: number
  pendingRecalls: number
  departmentDistribution: {
    name: string
    count: number
  }[]
  monthlyPayroll: {
    month: string
    amount: number
  }[]
  totalFiles: number
  totalPaid: number
  totalRecallsDue: number
  totalEmployeesProcessed: number
  recallsByMonth: {
    month: string
    amount: number
  }[]
}

export interface SalaryRate {
  id: number
  grade: string
  index: number
  baseAmount: number
  cnssRate: number
  iptsRate: number
  allowances: {
    name: string
    amount: number
    type: 'percentage' | 'fixed'
  }[]
  createdAt: string
  updatedAt: string
}

export interface ProcessedPayment {
  id: number
  employeeId: number
  matricule: string
  fullName: string
  month: string
  year: number
  baseAmount: number
  allowances: number
  deductions: number
  netAmount: number
  status: 'pending' | 'processed' | 'paid'
  processedAt: string
}

export interface PayrollReport {
  id: number
  month: string
  year: number
  totalEmployees: number
  totalBase: number
  totalAllowances: number
  totalDeductions: number
  totalNet: number
  generatedAt: string
  status: 'draft' | 'final'
}

export interface Employee {
  id: number
  matricule: string
  firstName: string
  lastName: string
  grade: string
  index: number
  department: string
  startDate: string
  currentSalary: number
  totalRecalls: number
  status: string
}

export interface SalaryFile {
  id: number
  employeeId: number
  period: string
  baseSalary: number
  allowance: number
  liquidatedAmount: number
  cnss: number
  ipts: number
  netSalary: number
  recallAmount: number
  observations: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface RecentFile {
  id: number
  employeeId: number
  employeeName: string
  matricule: string
  period: string
  recallAmount: number
  status: string
  createdAt: string
}

// Données fictives pour le développement
const mockStats = {
  totalEmployees: 45,
  pendingPayments: 12,
  totalPayroll: 15000000,
  pendingRecalls: 8,
  totalFiles: 120,
  totalPaid: 12500000,
  totalRecallsDue: 2500000,
  totalEmployeesProcessed: 38,
  filesByMonth: [
    { month: 'Jan', count: 8 },
    { month: 'Fév', count: 12 },
    { month: 'Mar', count: 15 },
    { month: 'Avr', count: 10 },
    { month: 'Mai', count: 18 },
    { month: 'Juin', count: 20 }
  ],
  paymentsByMonth: [
    { month: 'Jan', amount: 1200000 },
    { month: 'Fév', amount: 1350000 },
    { month: 'Mar', amount: 1400000 },
    { month: 'Avr', amount: 1250000 },
    { month: 'Mai', amount: 1500000 },
    { month: 'Juin', amount: 1600000 }
  ],
  recallsByMonth: [
    { month: 'Jan', amount: 350000 },
    { month: 'Fév', amount: 420000 },
    { month: 'Mar', amount: 480000 },
    { month: 'Avr', amount: 380000 },
    { month: 'Mai', amount: 520000 },
    { month: 'Juin', amount: 550000 }
  ],
  icons: {
    employees: 'users',
    payments: 'credit-card',
    payroll: 'cash',
    recalls: 'bell',
    files: 'folder'
  }
}

const mockRecentFiles = [
  {
    id: 1,
    employeeName: 'Jean Dupont',
    matricule: 'EMP001',
    createdAt: '2025-06-20T10:30:00',
    status: 'En traitement',
    amount: 250000
  },
  {
    id: 2,
    employeeName: 'Marie Durand',
    matricule: 'EMP015',
    createdAt: '2025-06-19T14:45:00',
    status: 'Validé',
    amount: 180000
  },
  {
    id: 3,
    employeeName: 'Pierre Martin',
    matricule: 'EMP023',
    createdAt: '2025-06-18T09:15:00',
    status: 'En attente',
    amount: 320000
  },
  {
    id: 4,
    employeeName: 'Sophie Lefebvre',
    matricule: 'EMP042',
    createdAt: '2025-06-17T16:20:00',
    status: 'Validé',
    amount: 275000
  },
  {
    id: 5,
    employeeName: 'Thomas Bernard',
    matricule: 'EMP037',
    createdAt: '2025-06-16T11:05:00',
    status: 'Rejeté',
    amount: 195000
  }
]

const mockEmployees = [
  {
    id: 1,
    matricule: 'EMP001',
    firstName: 'Jean',
    lastName: 'Dupont',
    fullName: 'Jean Dupont',
    department: 'Informatique',
    position: 'Développeur Senior',
    grade: 'B',
    index: 550,
    currentSalary: 850000,
    totalRecalls: 120000,
    joinDate: '2022-03-15',
    status: 'Actif'
  },
  {
    id: 2,
    matricule: 'EMP015',
    firstName: 'Marie',
    lastName: 'Durand',
    fullName: 'Marie Durand',
    department: 'Marketing',
    position: 'Chef de Projet',
    grade: 'C',
    index: 450,
    currentSalary: 750000,
    totalRecalls: 85000,
    joinDate: '2023-01-10',
    status: 'Actif'
  },
  {
    id: 3,
    matricule: 'EMP023',
    firstName: 'Pierre',
    lastName: 'Martin',
    fullName: 'Pierre Martin',
    department: 'Finance',
    position: 'Comptable',
    grade: 'D',
    index: 380,
    currentSalary: 650000,
    totalRecalls: 75000,
    joinDate: '2021-11-05',
    status: 'Actif'
  },
  {
    id: 4,
    matricule: 'EMP042',
    firstName: 'Sophie',
    lastName: 'Lefebvre',
    fullName: 'Sophie Lefebvre',
    department: 'Ressources Humaines',
    position: 'Responsable RH',
    grade: 'B',
    index: 520,
    currentSalary: 900000,
    totalRecalls: 135000,
    joinDate: '2020-06-22',
    status: 'Actif'
  },
  {
    id: 5,
    matricule: 'EMP037',
    firstName: 'Thomas',
    lastName: 'Bernard',
    fullName: 'Thomas Bernard',
    department: 'Commercial',
    position: 'Représentant Commercial',
    grade: 'C',
    index: 420,
    currentSalary: 700000,
    totalRecalls: 95000,
    joinDate: '2022-09-18',
    status: 'Actif'
  },
  {
    id: 6,
    matricule: 'EMP053',
    firstName: 'Julie',
    lastName: 'Petit',
    fullName: 'Julie Petit',
    department: 'Informatique',
    position: 'Développeur Frontend',
    grade: 'C',
    index: 430,
    currentSalary: 720000,
    totalRecalls: 80000,
    joinDate: '2023-04-05',
    status: 'Actif'
  },
  {
    id: 7,
    matricule: 'EMP061',
    firstName: 'Nicolas',
    lastName: 'Moreau',
    fullName: 'Nicolas Moreau',
    department: 'Marketing',
    position: 'Analyste Marketing',
    grade: 'D',
    index: 370,
    currentSalary: 680000,
    totalRecalls: 60000,
    joinDate: '2022-07-12',
    status: 'Actif'
  }
]

const mockRates = {
  cnss: [
    { grade: 'A', rate: 3.5, description: 'Direction générale' },
    { grade: 'B', rate: 3.2, description: 'Cadres supérieurs' },
    { grade: 'C', rate: 2.8, description: 'Cadres moyens' },
    { grade: 'D', rate: 2.5, description: 'Agents de maîtrise' },
    { grade: 'E', rate: 2.2, description: 'Employés qualifiés' },
    { grade: 'F', rate: 2.0, description: 'Employés' }
  ],
  ipts: [
    { grade: 'A', rate: 15.0, description: 'Direction générale' },
    { grade: 'B', rate: 12.0, description: 'Cadres supérieurs' },
    { grade: 'C', rate: 10.0, description: 'Cadres moyens' },
    { grade: 'D', rate: 8.0, description: 'Agents de maîtrise' },
    { grade: 'E', rate: 5.0, description: 'Employés qualifiés' },
    { grade: 'F', rate: 3.0, description: 'Employés' }
  ]
}

const mockReportPreview = {
  totalEmployees: 45,
  totalAmount: 32500000,
  departments: [
    { name: 'Informatique', count: 12, amount: 10800000 },
    { name: 'Marketing', count: 8, amount: 6400000 },
    { name: 'Finance', count: 6, amount: 5100000 },
    { name: 'Ressources Humaines', count: 5, amount: 4500000 },
    { name: 'Commercial', count: 9, amount: 7200000 },
    { name: 'Direction', count: 3, amount: 3600000 },
    { name: 'Logistique', count: 2, amount: 1500000 }
  ],
  statusSummary: {
    validated: 38,
    pending: 5,
    rejected: 2
  }
}

const mockRecentReports = [
  {
    id: 1,
    title: 'Rapport de paie - Juin 2025',
    createdAt: '2025-06-15T14:30:00',
    createdBy: 'Admin Système',
    totalAmount: 32500000,
    employeeCount: 45,
    status: 'Finalisé'
  },
  {
    id: 2,
    title: 'Rapport de paie - Mai 2025',
    createdAt: '2025-05-15T10:15:00',
    createdBy: 'Admin Système',
    totalAmount: 31800000,
    employeeCount: 44,
    status: 'Finalisé'
  },
  {
    id: 3,
    title: 'Rapport de rappels - T2 2025',
    createdAt: '2025-06-10T09:45:00',
    createdBy: 'Comptable Principal',
    totalAmount: 2750000,
    employeeCount: 12,
    status: 'Finalisé'
  },
  {
    id: 4,
    title: 'Rapport de primes - Juin 2025',
    createdAt: '2025-06-05T16:20:00',
    createdBy: 'Directeur Financier',
    totalAmount: 4500000,
    employeeCount: 30,
    status: 'Finalisé'
  },
  {
    id: 5,
    title: 'Rapport de paie - Avril 2025',
    createdAt: '2025-04-15T11:30:00',
    createdBy: 'Admin Système',
    totalAmount: 31200000,
    employeeCount: 43,
    status: 'Finalisé'
  }
]

export const accountantService = {
  // Statistiques du tableau de bord
  async getStats() {
    try {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // En production, utiliser l'API réelle
      // const response = await api.get('/accountant/stats')
      // return response.data
      
      // Pour le développement, retourner des données fictives
      return mockStats
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      // Retourner des données fictives même en cas d'erreur
      return mockStats
    }
  },

  // Fichiers récents pour le tableau de bord
  async getRecentFiles(limit = 5) {
    try {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // En production, utiliser l'API réelle
      // const response = await api.get(`/accountant/files/recent?limit=${limit}`)
      // return response.data
      
      // Pour le développement, retourner des données fictives
      return mockRecentFiles.slice(0, limit)
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers récents:', error)
      // Retourner des données fictives même en cas d'erreur
      return mockRecentFiles.slice(0, limit)
    }
  },

  // Liste des employés
  async getEmployees(params = {}) {
    try {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 400))
      
      // En production, utiliser l'API réelle
      // const response = await api.get('/accountant/employees', { params })
      // return response.data
      
      // Pour le développement, retourner des données fictives
      return {
        data: mockEmployees,
        total: mockEmployees.length,
        page: 1,
        limit: 10
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des employés:', error)
      // Retourner des données fictives même en cas d'erreur
      return {
        data: mockEmployees,
        total: mockEmployees.length,
        page: 1,
        limit: 10
      }
    }
  },

  // Taux CNSS et IPTS
  async getRates() {
    try {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // En production, utiliser l'API réelle
      // const response = await api.get('/accountant/rates')
      // return response.data
      
      // Pour le développement, retourner des données fictives
      return mockRates
    } catch (error) {
      console.error('Erreur lors de la récupération des taux:', error)
      // Retourner des données fictives même en cas d'erreur
      return mockRates
    }
  },

  // Aperçu des rapports
  async getReportPreview(params = {}) {
    try {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // En production, utiliser l'API réelle
      // const response = await api.get('/accountant/reports/preview', { params })
      // return response.data
      
      // Pour le développement, retourner des données fictives
      return mockReportPreview
    } catch (error) {
      console.error('Erreur lors de la récupération des données d\'aperçu:', error)
      // Retourner des données fictives même en cas d'erreur
      return mockReportPreview
    }
  },

  // Rapports récents
  async getRecentReports() {
    try {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // En production, utiliser l'API réelle
      // const response = await api.get('/accountant/reports/recent')
      // return response.data
      
      // Pour le développement, retourner des données fictives
      return mockRecentReports
    } catch (error) {
      console.error('Erreur lors de la récupération des rapports récents:', error)
      // Retourner des données fictives même en cas d'erreur
      return mockRecentReports
    }
  },

  // Récupérer les dossiers d'un employé
  async getEmployeeFiles(employeeId) {
    try {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // En production, utiliser l'API réelle
      // const response = await api.get(`/accountant/employees/${employeeId}/files`)
      // return response.data
      
      // Pour le développement, retourner des données fictives
      return [
        {
          id: 1,
          employeeId: employeeId,
          period: '2025-05',
          baseSalary: 850000,
          allowance: 50000,
          liquidatedAmount: 800000,
          cnss: 27200,
          ipts: 102000,
          netSalary: 770800,
          recallAmount: -29200,
          observations: 'Régularisation suite à promotion',
          status: 'paid',
          createdAt: '2025-05-15T10:30:00'
        },
        {
          id: 2,
          employeeId: employeeId,
          period: '2025-04',
          baseSalary: 800000,
          allowance: 50000,
          liquidatedAmount: 750000,
          cnss: 25600,
          ipts: 96000,
          netSalary: 728400,
          recallAmount: -21600,
          observations: 'Paiement normal',
          status: 'paid',
          createdAt: '2025-04-15T11:20:00'
        },
        {
          id: 3,
          employeeId: employeeId,
          period: '2025-03',
          baseSalary: 800000,
          allowance: 50000,
          liquidatedAmount: 700000,
          cnss: 25600,
          ipts: 96000,
          netSalary: 728400,
          recallAmount: 28400,
          observations: 'Rappel dû pour indemnité non versée',
          status: 'partially_paid',
          createdAt: '2025-03-15T09:45:00'
        }
      ]
    } catch (error) {
      console.error('Erreur lors de la récupération des dossiers de l\'employé:', error)
      return []
    }
  },

  // Créer un dossier de solde
  async createSalaryFile(data) {
    try {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // En production, utiliser l'API réelle
      // const response = await api.post('/accountant/files', data)
      // return response.data
      
      // Pour le développement, simuler une création réussie
      return {
        id: Math.floor(Math.random() * 1000) + 10,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error)
      throw new Error('Impossible de créer le dossier')
    }
  },

  // Mettre à jour un dossier de solde
  async updateSalaryFile(fileId, data) {
    try {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // En production, utiliser l'API réelle
      // const response = await api.put(`/accountant/files/${fileId}`, data)
      // return response.data
      
      // Pour le développement, simuler une mise à jour réussie
      return {
        id: fileId,
        ...data,
        updatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du dossier:', error)
      throw new Error('Impossible de mettre à jour le dossier')
    }
  },

  // Supprimer un dossier de solde
  async deleteSalaryFile(fileId) {
    try {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // En production, utiliser l'API réelle
      // return await api.delete(`/accountant/files/${fileId}`)
      
      // Pour le développement, simuler une suppression réussie
      return { success: true }
    } catch (error) {
      console.error('Erreur lors de la suppression du dossier:', error)
      throw new Error('Impossible de supprimer le dossier')
    }
  }
} 