import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Employee } from '@/services/employee.service'

interface Column {
  header: string
  dataKey: string
  format?: (value: any) => string
}

interface ExportOptions {
  filename?: string
  title?: string
  subtitle?: string
  orientation?: 'portrait' | 'landscape'
}

interface EmployeeInfo {
  fullName: string;
  matricule: string;
  grade: string;
  service: string;
  department: string;
}

interface SalaryData {
  period: string;
  duration: number;
  baseSalary: number;
  allowance: number;
  cnss: number;
  ipts: number;
  net: number;
  dueAmount: number;
}

interface ExportData {
  employee: EmployeeInfo;
  salaries: SalaryData[];
  totalDue: number;
}

export const exportToPDF = (
  columns: Column[],
  data: any[],
  options: ExportOptions = {}
) => {
  const {
    filename = 'export.pdf',
    title = 'Report',
    subtitle = '',
    orientation = 'portrait'
  } = options

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  })

  // Add title
  doc.setFontSize(20)
  doc.text(title, 14, 20)

  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(12)
    doc.text(subtitle, 14, 30)
  }

  // Add date
  doc.setFontSize(10)
  doc.text(`Généré le : ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, 14, subtitle ? 35 : 25)

  // Prepare table data
  const headers = columns.map(col => col.header)
  const rows = data.map(item =>
    columns.map(col => {
      const value = item[col.dataKey]
      return col.format ? col.format(value) : value?.toString() || ''
    })
  )

  // Add table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: subtitle ? 40 : 30,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  })

  // Save the PDF
  doc.save(filename)
}

export const exportEmployeeList = (employees: Employee[]) => {
  const columns: Column[] = [
    { header: 'Matricule', dataKey: 'matricule' },
    { 
      header: 'Nom complet', 
      dataKey: 'lastName',
      format: (value: string) => `${value || ''} ${employees.find(e => e.lastName === value)?.firstName || ''}`
    },
    { header: 'Email', dataKey: 'email' },
    { header: 'Département', dataKey: 'department' },
    { header: 'Service', dataKey: 'service' },
    { header: 'Grade', dataKey: 'grade' },
    { header: 'Indice', dataKey: 'gradeIndex' },
    { 
      header: 'Date d\'entrée', 
      dataKey: 'entryDate',
      format: (value: number) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: fr }) : '-'
    },
    {
      header: 'Statut',
      dataKey: 'isActive',
      format: (value: boolean) => value ? 'Actif' : 'Inactif'
    }
  ]

  exportToPDF(columns, employees, {
    filename: 'liste-employes.pdf',
    title: 'Liste des Employés',
    subtitle: 'Liste complète des employés',
    orientation: 'landscape'
  })
}

const formatCurrency = (amount: number) => {
  // Formater le nombre avec des espaces comme séparateurs de milliers
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

export const exportSalaryReport = async (data: ExportData) => {
  // Créer un nouveau document PDF en mode paysage
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let currentY = margin;

  // En-tête avec les informations de l'employé
  doc.setFontSize(16);
  doc.text('État des Salaires', pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  doc.setFontSize(12);
  doc.text(`Nom complet: ${data.employee.fullName}`, margin, currentY);
  currentY += 8;
  doc.text(`Matricule: ${data.employee.matricule}`, margin, currentY);
  currentY += 8;
  doc.text(`Grade: ${data.employee.grade}`, margin, currentY);
  currentY += 8;
  doc.text(`Service: ${data.employee.service}`, margin, currentY);
  currentY += 8;
  doc.text(`Département: ${data.employee.department}`, margin, currentY);
  currentY += 15;

  // En-têtes du tableau
  const headers = ['Période', 'Durée', 'Salaire de base', 'Indemnité', 'CNSS', 'IPTS', 'Net', 'Rappels dus'];
  const colWidths = [50, 20, 35, 35, 25, 25, 35, 35];
  let x = margin;

  // Dessiner l'en-tête du tableau
  doc.setFillColor(41, 128, 185);
  doc.setTextColor(255, 255, 255);
  doc.rect(x, currentY, pageWidth - 2 * margin, 10, 'F');
  
  headers.forEach((header, i) => {
    const xPos = x + (i === 0 ? 5 : colWidths[i] / 2);
    doc.text(header, xPos, currentY + 7, { 
      align: i === 0 ? 'left' : 'center'
    });
    x += colWidths[i];
  });
  currentY += 12;

  // Contenu du tableau
  doc.setTextColor(0, 0, 0);
  data.salaries.forEach(salary => {
    if (currentY > pageHeight - margin - 20) {
      doc.addPage();
      currentY = margin;
    }

    x = margin;
    // Période (aligné à gauche avec plus d'espace)
    doc.text(salary.period, x + 5, currentY + 5);
    x += colWidths[0];
    
    // Autres colonnes (centrées ou alignées à droite)
    doc.text(salary.duration.toString(), x + colWidths[1] / 2, currentY + 5, { align: 'center' });
    x += colWidths[1];
    
    doc.text(formatCurrency(salary.baseSalary), x + colWidths[2] - 5, currentY + 5, { align: 'right' });
    x += colWidths[2];
    
    doc.text(formatCurrency(salary.allowance), x + colWidths[3] - 5, currentY + 5, { align: 'right' });
    x += colWidths[3];
    
    doc.text(formatCurrency(salary.cnss), x + colWidths[4] - 5, currentY + 5, { align: 'right' });
    x += colWidths[4];
    
    doc.text(formatCurrency(salary.ipts), x + colWidths[5] - 5, currentY + 5, { align: 'right' });
    x += colWidths[5];
    
    doc.text(formatCurrency(salary.net), x + colWidths[6] - 5, currentY + 5, { align: 'right' });
    x += colWidths[6];
    
    doc.text(formatCurrency(salary.dueAmount), x + colWidths[7] - 5, currentY + 5, { align: 'right' });

    currentY += 10;
    doc.line(margin, currentY, pageWidth - margin, currentY);
  });

  // Total des rappels dus
  currentY += 10;
  doc.text(
    `Total Rappels dus: ${formatCurrency(data.totalDue)}`,
    pageWidth - margin,
    currentY,
    { align: 'right' }
  );

  // Date d'impression
  doc.setFontSize(8);
  doc.text(
    `Imprimé le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`,
    pageWidth - margin,
    pageHeight - margin,
    { align: 'right' }
  );

  // Sauvegarder le PDF
  doc.save(`salaires_${data.employee.matricule}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}; 