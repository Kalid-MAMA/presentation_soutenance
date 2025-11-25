import { api } from './api'

export interface Complaint {
  id: number
  employeeId: number
  type: string
  description: string
  periodStart: number
  periodEnd: number
  attachments?: string[]
  status: 'pending' | 'in_progress' | 'resolved'
  resolvedAt?: number
  resolvedBy?: number
  createdAt: number
  employee?: {
    matricule: string
    firstName: string
    lastName: string
    department: string
    service: string
  }
}

export interface CreateComplaintDTO {
  type: string
  description: string
  periodStart: string | number
  periodEnd: string | number
  attachments?: File[]
}

export interface ComplaintFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  sortBy?: string
  sortDesc?: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export class ComplaintService {
  private readonly baseUrl = '/api/complaints'

  async getAll(filters: ComplaintFilters = {}) {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.search) params.append('search', filters.search)
    if (filters.status) params.append('status', filters.status)

    const response = await api.get<PaginatedResponse<Complaint>>(`${this.baseUrl}?${params.toString()}`)
    return response.data
  }

  async getById(id: number) {
    const response = await api.get<Complaint>(`${this.baseUrl}/${id}`)
    return response.data
  }

  async create(complaint: Omit<Complaint, 'id'>) {
    const response = await api.post<Complaint>(this.baseUrl, complaint)
    return response.data
  }

  async update(id: number, complaint: Partial<Complaint>) {
    const response = await api.put<Complaint>(`${this.baseUrl}/${id}`, complaint)
    return response.data
  }

  async resolve(id: number) {
    const response = await api.put<Complaint>(`${this.baseUrl}/${id}/resolve`)
    return response.data
  }

  async getByEmployee(employeeId: number) {
    const response = await api.get<Complaint[]>(`${this.baseUrl}/employee/${employeeId}`)
    return response.data
  }

  async getMyComplaints(): Promise<Complaint[]> {
    console.log('[ComplaintService] Fetching my complaints...');
    try {
      const response = await api.get<Complaint[]>(`${this.baseUrl}/me`);
      console.log('[ComplaintService] Complaints received:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ComplaintService] Error fetching complaints:', error);
      throw error;
    }
  }

  async createComplaint(complaint: CreateComplaintDTO): Promise<Complaint> {
    console.log('[ComplaintService] Creating complaint:', complaint);
    try {
      const formData = new FormData();
      formData.append('type', complaint.type);
      formData.append('description', complaint.description);
      formData.append('periodStart', complaint.periodStart.toString());
      formData.append('periodEnd', complaint.periodEnd.toString());
      formData.append('status', 'pending');
      formData.append('attachments', '[]'); // Ajouter un tableau vide par défaut

      if (complaint.attachments && complaint.attachments.length > 0) {
        complaint.attachments.forEach((file, index) => {
          if (file.size > 5 * 1024 * 1024) { // 5MB limit
            throw new Error(`Le fichier ${file.name} dépasse la limite de 5MB`);
          }
          formData.append('attachments', file);
        });
      }

      console.log('[ComplaintService] Sending FormData...');
      const response = await api.post<Complaint>(this.baseUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('[ComplaintService] Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ComplaintService] Error creating complaint:', error);
      if (error instanceof Error) {
        throw new Error(`Erreur lors de la création de la réclamation : ${error.message}`);
      }
      throw new Error('Une erreur est survenue lors de la création de la réclamation');
    }
  }

  async updateComplaint(id: number, complaint: Partial<CreateComplaintDTO>): Promise<Complaint> {
    const response = await api.patch(`${this.baseUrl}/${id}`, complaint)
    return response.data
  }

  async deleteComplaint(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`)
  }
}

export const complaintService = new ComplaintService() 