import axios, { AxiosResponse } from 'axios'
import {
  FileMetadata,
  FileUploadResponse,
  ChatSession,
  ChatMessage,
  SendMessageRequest,
  SendMessageResponse,
  CreateChatSessionRequest,
  ChatSessionResponse,
  AIQueryRequest,
  AIQueryResponse,
  SQLExecutionRequest,
  SQLExecutionResponse
} from '../types'

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for adding auth token if needed
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth-token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export class ApiService {
  // File Management
  async uploadFile(file: File): Promise<FileMetadata> {
    const formData = new FormData()
    formData.append('file', file)

    const response: AxiosResponse<FileUploadResponse> = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return this.getFileById(response.data.id)
  }

  async getFiles(): Promise<FileMetadata[]> {
    const response: AxiosResponse<FileMetadata[]> = await api.get('/files')
    return response.data
  }

  async getFileById(id: number): Promise<FileMetadata> {
    const response: AxiosResponse<FileMetadata> = await api.get(`/files/${id}`)
    return response.data
  }

  async deleteFile(id: number): Promise<void> {
    await api.delete(`/files/${id}`)
  }

  // Chat Management
  async createChatSession(request: CreateChatSessionRequest): Promise<ChatSession> {
    const response: AxiosResponse<{ session: ChatSession }> = await api.post('/chat/sessions', request)
    return response.data.session
  }

  async getChatSessions(): Promise<ChatSession[]> {
    const response: AxiosResponse<ChatSessionResponse> = await api.get('/chat/sessions')
    return response.data.sessions
  }

  async getChatSession(id: number): Promise<ChatSession> {
    const response: AxiosResponse<{ session: ChatSession }> = await api.get(`/chat/sessions/${id}`)
    return response.data.session
  }

  async updateChatSession(id: number, updates: Partial<ChatSession>): Promise<ChatSession> {
    const response: AxiosResponse<{ session: ChatSession }> = await api.put(`/chat/sessions/${id}`, updates)
    return response.data.session
  }

  async deleteChatSession(id: number): Promise<void> {
    await api.delete(`/chat/sessions/${id}`)
  }

  async getSessionMessages(sessionId: number, limit = 200, offset = 0): Promise<ChatMessage[]> {
    const response: AxiosResponse<{ messages: ChatMessage[] }> = await api.get(
      `/chat/sessions/${sessionId}/messages`,
      {
        params: { limit, offset }
      }
    )
    return response.data.messages
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const response: AxiosResponse<SendMessageResponse> = await api.post('/chat/send-message', request)
    return response.data
  }

  async updateMessage(messageId: number, content: string): Promise<ChatMessage> {
    const response: AxiosResponse<ChatMessage> = await api.put(`/chat/messages/${messageId}`, { content })
    return response.data
  }

  async deleteMessage(messageId: number): Promise<void> {
    await api.delete(`/chat/messages/${messageId}`)
  }

  async searchSessionMessages(sessionId: number, query: string, limit = 50): Promise<any> {
    const response = await api.get(`/chat/sessions/${sessionId}/search`, {
      params: { query, limit }
    })
    return response.data
  }

  async exportSession(sessionId: number, format: 'json' | 'txt' = 'json'): Promise<any> {
    const response = await api.get(`/chat/sessions/${sessionId}/export`, {
      params: { format }
    })
    return response.data
  }

  async addMessageFeedback(messageId: number, feedbackType: string, feedbackText?: string): Promise<any> {
    const response = await api.post(`/chat/messages/${messageId}/feedback`, {
      feedback_type: feedbackType,
      feedback_text: feedbackText
    })
    return response.data
  }

  // AI Query Endpoints
  async generateSQL(request: AIQueryRequest): Promise<AIQueryResponse> {
    const response: AxiosResponse<AIQueryResponse> = await api.post('/ai/generate-sql', request)
    return response.data
  }

  async executeSQL(request: SQLExecutionRequest): Promise<SQLExecutionResponse> {
    const response: AxiosResponse<SQLExecutionResponse> = await api.post('/ai/execute-sql', request)
    return response.data
  }

  async aiQuery(request: AIQueryRequest): Promise<AIQueryResponse> {
    const response: AxiosResponse<AIQueryResponse> = await api.post('/ai/query', request)
    return response.data
  }

  // Utility methods
  async healthCheck(): Promise<boolean> {
    try {
      await api.get('/health')
      return true
    } catch {
      return false
    }
  }

  setAuthToken(token: string) {
    localStorage.setItem('auth-token', token)
  }

  removeAuthToken() {
    localStorage.removeItem('auth-token')
  }

  getAuthToken(): string | null {
    return localStorage.getItem('auth-token')
  }
}

// Export singleton instance
export const apiService = new ApiService()

export default apiService
