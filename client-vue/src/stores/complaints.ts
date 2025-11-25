import { defineStore } from 'pinia'
import { ref } from 'vue'
import { complaintService, type Complaint, type CreateComplaintDTO, type ComplaintFilters, type PaginatedResponse } from '@/services/complaint.service'
import { useToast } from '@/composables/useToast'

export const useComplaintStore = defineStore('complaints', () => {
  const complaints = ref<Complaint[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const toast = useToast()

  const fetchComplaints = async (filters: ComplaintFilters = {}) => {
    try {
      loading.value = true
      error.value = null
      const response = await complaintService.getAll(filters)
      complaints.value = response.items
      total.value = response.total
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des réclamations'
      toast.error({
        title: 'Erreur',
        message: 'Impossible de charger les réclamations'
      })
    } finally {
      loading.value = false
    }
  }

  const fetchMyComplaints = async () => {
    try {
      loading.value = true
      error.value = null
      complaints.value = await complaintService.getMyComplaints()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des réclamations'
      toast.error({
        title: 'Erreur',
        message: 'Impossible de charger les réclamations'
      })
    } finally {
      loading.value = false
    }
  }

  const createComplaint = async (complaint: CreateComplaintDTO) => {
    try {
      loading.value = true
      error.value = null
      const newComplaint = await complaintService.createComplaint(complaint)
      complaints.value.unshift(newComplaint)
      toast.success({
        title: 'Succès',
        message: 'Réclamation créée avec succès'
      })
      return newComplaint
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la création de la réclamation'
      toast.error({
        title: 'Erreur',
        message: 'Impossible de créer la réclamation'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  const addComplaint = (complaint: Complaint) => {
    const existingIndex = complaints.value.findIndex(c => c.id === complaint.id)
    if (existingIndex === -1) {
      complaints.value.unshift(complaint)
      total.value++
    }
  }

  const resolveComplaint = async (id: number) => {
    try {
      loading.value = true
      error.value = null
      const resolvedComplaint = await complaintService.resolve(id)
      const index = complaints.value.findIndex(c => c.id === id)
        if (index !== -1) {
        complaints.value[index] = resolvedComplaint
      }
      toast.success({
        title: 'Succès',
        message: 'Réclamation résolue avec succès'
      })
      return resolvedComplaint
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la résolution de la réclamation'
      toast.error({
        title: 'Erreur',
        message: 'Impossible de résoudre la réclamation'
      })
      throw err
      } finally {
      loading.value = false
      }
  }

  const updateComplaint = async (id: number, complaint: Partial<CreateComplaintDTO>) => {
    try {
      loading.value = true
      error.value = null
      const updatedComplaint = await complaintService.updateComplaint(id, complaint)
      const index = complaints.value.findIndex(c => c.id === id)
        if (index !== -1) {
        complaints.value[index] = updatedComplaint
        }
      toast.success({
        title: 'Succès',
        message: 'Réclamation mise à jour avec succès'
      })
      return updatedComplaint
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la réclamation'
      toast.error({
        title: 'Erreur',
        message: 'Impossible de mettre à jour la réclamation'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteComplaint = async (id: number) => {
    try {
      loading.value = true
      error.value = null
      await complaintService.deleteComplaint(id)
      complaints.value = complaints.value.filter(c => c.id !== id)
      toast.success({
        title: 'Succès',
        message: 'Réclamation supprimée avec succès'
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la suppression de la réclamation'
      toast.error({
        title: 'Erreur',
        message: 'Impossible de supprimer la réclamation'
      })
      throw err
    } finally {
      loading.value = false
      }
    }

  return {
    complaints,
    loading,
    error,
    total,
    fetchComplaints,
    fetchMyComplaints,
    createComplaint,
    updateComplaint,
    deleteComplaint,
    resolveComplaint,
    addComplaint
  }
}) 