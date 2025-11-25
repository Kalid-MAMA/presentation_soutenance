import { useToast } from '@/composables/useToast'
import { useComplaintStore } from '@/stores/complaints'

class WebSocketService {
  private socket: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout = 1000 // 1 seconde
  private isConnecting = false

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return
    }

    this.isConnecting = true
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`

    try {
      this.socket = new WebSocket(wsUrl)

      this.socket.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
        this.isConnecting = false
      }

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.socket.onclose = () => {
        console.log('WebSocket disconnected')
        this.socket = null
        this.isConnecting = false
        this.tryReconnect()
      }

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.socket?.close()
      }
    } catch (error) {
      console.error('Error creating WebSocket:', error)
      this.isConnecting = false
      this.tryReconnect()
    }
  }

  private tryReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
    
    setTimeout(() => {
      this.connect()
    }, this.reconnectTimeout * Math.pow(2, this.reconnectAttempts - 1))
  }

  private async handleMessage(data: any) {
    const toast = useToast()
    const complaintStore = useComplaintStore()

    switch (data.type) {
      case 'NEW_COMPLAINT':
        if (data.complaint) {
          // Mettre à jour le store avec la nouvelle réclamation
          complaintStore.addComplaint(data.complaint)
          
          // Afficher une notification pour l'administrateur
          if (data.userRole === 'admin') {
            toast.info({
              title: 'Nouvelle réclamation',
              message: `Une nouvelle réclamation a été soumise par ${data.complaint.employee?.firstName} ${data.complaint.employee?.lastName}`
            })
          }
        }
        break

      // Ajouter d'autres types de messages si nécessaire
      default:
        console.log('Unknown message type:', data.type)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }
}

export const wsService = new WebSocketService() 