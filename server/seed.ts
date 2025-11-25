import { db } from './db';
import { employees } from '@shared/schema';

async function seed() {
  try {
    // Liste des employés fictifs
    const employeesList = [
      {
        matricule: 'EMP004',
        firstName: 'Pierre',
        lastName: 'Martin',
        grade: 'A1',
        gradeIndex: 1,
        service: 'Développement',
        department: 'IT',
        entryDate: new Date('2023-01-15').getTime(),
        phone: '+229 97123456',
        email: 'pierre.martin@kalid.com'
      },
      {
        matricule: 'EMP005',
        firstName: 'Marie',
        lastName: 'Dubois',
        grade: 'B2',
        gradeIndex: 2,
        service: 'Comptabilité',
        department: 'Finance',
        entryDate: new Date('2023-02-01').getTime(),
        phone: '+229 97234567',
        email: 'marie.dubois@kalid.com'
      },
      {
        matricule: 'EMP006',
        firstName: 'Paul',
        lastName: 'Bernard',
        grade: 'A2',
        gradeIndex: 2,
        service: 'Marketing',
        department: 'Commercial',
        entryDate: new Date('2023-03-15').getTime(),
        phone: '+229 97345678',
        email: 'paul.bernard@kalid.com'
      }
    ];

    // Insérer les employés dans la table employees
    for (const emp of employeesList) {
      await db.insert(employees).values(emp);
    }

    console.log('Données de test ajoutées avec succès !');

  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
  }
}

seed(); 