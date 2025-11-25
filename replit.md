# Employee Salary Management System - Mairie de Cotonou

## Overview

This is a full-stack web application designed for managing employee salary advancement records at the Mairie de Cotonou (Cotonou City Hall). The system provides role-based access control with three distinct user types: administrators, employees, and accountants. Each role has specific functionalities for managing personnel data, salary records, complaints, and financial reports.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured via Neon serverless)
- **Authentication**: Session-based authentication with bcrypt for password hashing
- **API Design**: RESTful API with role-based endpoint protection

### Project Structure
```
├── client/           # React frontend application
├── server/           # Express.js backend server
├── shared/           # Shared TypeScript schemas and types
├── migrations/       # Database migration files
└── dist/             # Production build output
```

## Key Components

### Database Schema (Drizzle ORM)
The system uses a PostgreSQL database with the following main entities:
- **Users**: Authentication and role management
- **Employees**: Detailed employee information
- **Salary Records**: Advancement salary calculations and records
- **Complaints**: Employee complaint tracking system
- **Grade Rates**: CNSS and IPTS rate configuration
- **Career History**: Employee career progression tracking

### Authentication System
- Session-based authentication using Express middleware
- Password hashing with bcrypt
- Role-based access control (admin, employee, accountant)
- Secure API endpoints with user session validation

### Role-Based Access Control
1. **Administrator**:
   - User account management
   - Employee data oversight
   - Complaint resolution
   - System-wide dashboard access

2. **Employee**:
   - Personal profile viewing
   - Salary history access
   - Complaint submission
   - Personal document management

3. **Accountant**:
   - Salary record creation and management
   - Rate configuration (CNSS/IPTS)
   - Financial report generation
   - Employee salary calculations

## Data Flow

### Authentication Flow
1. User submits login credentials (matricule/password)
2. Server validates credentials against users table
3. Session created and stored server-side
4. Client receives user data and role information
5. Frontend routes user to appropriate dashboard

### Salary Calculation Flow
1. Accountant selects employee and period
2. System retrieves grade rates and employee information
3. Calculations performed: base salary, allowances, deductions (CNSS, IPTS)
4. Net salary and recall amounts computed
5. Record saved to salary_records table
6. Employee can view record in their dashboard

### Complaint Management Flow
1. Employee submits complaint with type and description
2. Complaint stored with pending status
3. Admin receives notification in dashboard
4. Admin can review and resolve complaints
5. Status updates reflected in employee view

## External Dependencies

### Production Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI components
- **bcrypt**: Password hashing
- **drizzle-orm**: Type-safe ORM
- **express**: Web server framework
- **wouter**: Lightweight React router
- **zod**: Schema validation

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type checking
- **tailwindcss**: Utility-first CSS framework
- **drizzle-kit**: Database migrations and introspection

## Deployment Strategy

### Replit Configuration
- **Platform**: Replit with Node.js 20, Web, and PostgreSQL 16 modules
- **Development**: `npm run dev` - Runs TypeScript server with hot reload
- **Production Build**: `npm run build` - Builds client and server bundles
- **Production Start**: `npm run start` - Runs compiled server bundle
- **Database**: `npm run db:push` - Applies schema changes to database

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Environment mode (development/production)

### Build Process
1. Client built with Vite (React app bundled to `dist/public`)
2. Server compiled with esbuild (Express app bundled to `dist/index.js`)
3. Static assets served from server in production
4. Database schema pushed using Drizzle migrations

### Port Configuration
- Development: Port 5000 (with external port 80 mapping)
- Production: Configured for autoscale deployment
- WebSocket support for development features

## Changelog
- June 25, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.