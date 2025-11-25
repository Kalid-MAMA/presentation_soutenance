import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Employee } from '@/services/employee.service'

interface Column {
  header: string
  dataKey: string
  width?: number
  format?: (value: any) => string | number
}

interface ExportOptions {
  filename?: string
  sheetName?: string
}

export const exportToExcel = (
  columns: Column[],
  data: any[],
  options: ExportOptions = {}
) => {
  const {
    filename = 'export.xlsx',
    sheetName = 'Sheet1'
  } = options

  // Prepare headers
  const headers = columns.map(col => col.header)

  // Prepare data with proper formatting
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.dataKey]
      return col.format ? col.format(value) : value
    })
  })

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

  // Set column widths
  const colWidths = columns.map(col => ({ wch: col.width || 15 }))
  ws['!cols'] = colWidths

  // Create workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Save file
  XLSX.writeFile(wb, filename)
}

export const exportEmployeeListExcel = (employees: Employee[]) => {
  const columns: Column[] = [
    { header: 'Matricule', dataKey: 'matricule', width: 12 },
    { 
      header: 'Nom', 
      dataKey: 'lastName',
      width: 20
    },
    {
      header: 'Prénom',
      dataKey: 'firstName',
      width: 20
    },
    { 
      header: 'Email', 
      dataKey: 'email', 
      width: 30 
    },
    { 
      header: 'Département', 
      dataKey: 'department', 
      width: 20 
    },
    { 
      header: 'Service', 
      dataKey: 'service', 
      width: 20 
    },
    { 
      header: 'Grade', 
      dataKey: 'grade', 
      width: 10 
    },
    { 
      header: 'Indice', 
      dataKey: 'gradeIndex', 
      width: 10,
      format: (value: number) => Number(value) // Assure que c'est un nombre
    },
    { 
      header: 'Date d\'entrée', 
      dataKey: 'entryDate', 
      width: 15,
      format: (value: number) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: fr }) : '-'
    },
    {
      header: 'Statut',
      dataKey: 'isActive',
      width: 10,
      format: (value: boolean) => value ? 'Actif' : 'Inactif'
    }
  ]

  exportToExcel(columns, employees, {
    filename: 'liste-employes.xlsx',
    sheetName: 'Employés'
  })
}

export const exportSalaryReportExcel = (salaries: any[]) => {
  const columns: Column[] = [
    { 
      header: 'Employé', 
      dataKey: 'employeeName', 
      width: 30 
    },
    { 
      header: 'Mois', 
      dataKey: 'month', 
      width: 15,
      format: (value: string) => format(new Date(value), 'MMMM yyyy', { locale: fr })
    },
    { 
      header: 'Salaire de base', 
      dataKey: 'baseSalary', 
      width: 15,
      format: (value: number) => Number(value.toFixed(2))
    },
    { 
      header: 'Primes', 
      dataKey: 'bonus', 
      width: 15,
      format: (value: number) => Number(value.toFixed(2))
    },
    { 
      header: 'Retenues', 
      dataKey: 'deductions', 
      width: 15,
      format: (value: number) => Number(value.toFixed(2))
    },
    { 
      header: 'Net à payer', 
      dataKey: 'netSalary', 
      width: 15,
      format: (value: number) => Number(value.toFixed(2))
    }
  ]

  exportToExcel(columns, salaries, {
    filename: 'rapport-salaires.xlsx',
    sheetName: 'Salaires'
  })
} 