export interface Employee {
  id?: number;
  matricule: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  grade: string;
  gradeIndex: number;
  service: string;
  department: string;
  entryDate: string | number;
  isActive?: boolean;
  totalDue?: number;
  lastUpdate?: string | null;
}

export interface Salary {
  id: number;
  startDate: string | number;
  endDate: string | number;
  period?: string; // Format YYYY-MM
  duration: number;
  baseSalary: number;
  allowance: number;
  cnss: number;
  ipts: number;
  net: number;
  dueAmount: number;
}

export interface Complaint {
  id: number;
  employeeId: number;
  type: string;
  description: string;
  periodStart: string | number;
  periodEnd: string | number;
  attachments: string[] | null;
  status: 'pending' | 'in_progress' | 'resolved';
  resolvedAt: string | number | null;
  resolvedBy: number | null;
  createdAt: string | number;
  employee?: {
    matricule: string;
    firstName: string;
    lastName: string;
    department: string;
  };
} 