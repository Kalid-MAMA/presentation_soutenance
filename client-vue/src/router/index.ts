import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Layouts
import AdminLayout from '@/layouts/AdminLayout.vue'
import AccountantLayout from '@/layouts/AccountantLayout.vue'
import EmployeeLayout from '@/layouts/EmployeeLayout.vue'

// Views
import Login from '@/views/Login.vue'

// Admin views
import AdminDashboard from '@/views/admin/Dashboard.vue'
import AdminEmployees from '@/views/admin/Employees.vue'
import AdminComplaints from '@/views/admin/Complaints.vue'
import AdminUserAccounts from '@/views/admin/UserAccounts.vue'

// Accountant views
import AccountantDashboard from '@/views/accountant/Dashboard.vue'
import AccountantEmployees from '@/views/accountant/Employees.vue'
import AccountantRates from '@/views/accountant/Rates.vue'
import AccountantReports from '@/views/accountant/Reports.vue'

// Employee views
import EmployeeProfile from '@/views/employee/Profile.vue'
import EmployeeSalaries from '@/views/employee/Salaries.vue'
import EmployeeComplaints from '@/views/employee/Complaints.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: to => {
        const auth = useAuthStore()
        if (!auth.isAuthenticated) return '/login'
        switch (auth.userRole) {
          case 'admin':
            return '/admin'
          case 'accountant':
            return '/accountant'
          case 'employee':
            return '/employee/profile'
          default:
            return '/login'
        }
      }
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { requiresAuth: false }
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, role: 'admin' },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: AdminDashboard
        },
        {
          path: 'employees',
          name: 'admin-employees',
          component: AdminEmployees
        },
        {
          path: 'complaints',
          name: 'admin-complaints',
          component: AdminComplaints
        },
        {
          path: 'user-accounts',
          name: 'admin-user-accounts',
          component: AdminUserAccounts
        }
      ]
    },
    {
      path: '/accountant',
      component: AccountantLayout,
      meta: { requiresAuth: true, role: 'accountant' },
      children: [
        {
          path: '',
          name: 'accountant-dashboard',
          component: AccountantDashboard,
          meta: { noCache: true }
        },
        {
          path: 'employees',
          name: 'accountant-employees',
          component: AccountantEmployees,
          meta: { noCache: true }
        },
        {
          path: 'rates',
          name: 'accountant-rates',
          component: AccountantRates,
          meta: { noCache: true }
        },
        {
          path: 'reports',
          name: 'accountant-reports',
          component: AccountantReports,
          meta: { noCache: true }
        }
      ]
    },
    {
      path: '/employee',
      component: EmployeeLayout,
      meta: { requiresAuth: true, role: 'employee' },
      children: [
        {
          path: 'profile',
          name: 'employee-profile',
          component: EmployeeProfile
        },
        {
          path: 'salaries',
          name: 'employee-salaries',
          component: EmployeeSalaries
        },
        {
          path: 'complaints',
          name: 'employee-complaints',
          component: EmployeeComplaints
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

let isInitialized = false

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  
  try {
    if (!auth.initialized) {
    await auth.initialize()
    }

    // Si la route nécessite une authentification
    if (to.meta.requiresAuth) {
      // Si l'utilisateur n'est pas authentifié
      if (!auth.isAuthenticated) {
        next('/login')
        return
      }
      
      // Si la route nécessite un rôle spécifique
      if (to.meta.role && auth.userRole !== to.meta.role) {
        // Rediriger vers la page appropriée en fonction du rôle
        switch (auth.userRole) {
          case 'admin':
            next('/admin')
            break
          case 'accountant':
            next('/accountant')
            break
          case 'employee':
            next('/employee/profile')
            break
          default:
            next('/login')
        }
        return
      }
    }
    
    // Si l'utilisateur est sur la page de login mais est déjà authentifié
    if (to.path === '/login' && auth.isAuthenticated) {
      switch (auth.userRole) {
        case 'admin':
          next('/admin')
          break
        case 'accountant':
          next('/accountant')
          break
        case 'employee':
          next('/employee/profile')
          break
        default:
          next()
      }
      return
    }
    
    next()
  } catch (error) {
    console.error('Erreur lors de la navigation:', error)
    auth.logout()
    next('/login')
  }
})

export default router 