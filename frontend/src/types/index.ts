// API Response Types
export interface ApiResponse<T = any> {
  status: 'success' | 'error'
  data?: T
  message?: string
  error?: string
}

// File Types
export interface FileMetadata {
  id: number
  filename: string
  original_filename: string
  file_size: number
  mime_type: string
  upload_date: string
  columns: string[]
  row_count: number
  dynamic_table_name?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
}

export interface FileUploadResponse {
  id: number
  filename: string
  status: string
  message: string
}

// Chat Types
export interface ChatMessage {
  id: number
  session_id: number
  user_id?: number
  role: 'user' | 'assistant'
  content: string
  sql_query?: string
  payload?: {
    executed_results?: any[]
    visualizations?: any[]
    data_quality_disclaimer?: string
    feedback?: Array<{
      type: string
      text?: string
      timestamp: string
      user_id: number
    }>
  }
  created_at: string
  updated_at?: string
}

export interface ChatSession {
  id: number
  title: string
  summary?: string
  file_id: number
  is_archived: boolean
  created_at: string
  updated_at: string
  last_interaction_at?: string
  message_count: number
  assistant_preview?: string
}

export interface ChatSessionResponse {
  sessions: ChatSession[]
}

export interface CreateChatSessionRequest {
  title?: string
  file_id: number
}

export interface SendMessageRequest {
  query: string
  file_id: number
  session_id?: number
  session_title?: string
  context?: any
}

export interface SendMessageResponse {
  status: string
  query: string
  sql_query?: string
  executed_results?: any[]
  visualizations?: any[]
  explanation?: string
  data_quality_disclaimer?: string
  session_id: number
  created_session?: ChatSession
  messages: ChatMessage[]
}

// Query Types
export interface AIQueryRequest {
  query: string
  file_id: number
  context?: any
}

export interface AIQueryResponse {
  explanation: string
  sql_query?: string
  executed_results?: any[]
  visualizations?: any[]
  data_quality_disclaimer?: string
}

export interface SQLExecutionRequest {
  file_id: number
  sql_query: string
}

export interface SQLExecutionResponse {
  status: string
  data: any[]
  columns: Array<{
    name: string
    type: string
  }>
  row_count: number
}

// Visualization Types
export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | '3d'
  title: string
  data: any[]
  xAxis?: string
  yAxis?: string
  config?: {
    colors?: string[]
    height?: number
    width?: number
    [key: string]: any
  }
}

export interface TableData {
  columns: Array<{
    key: string
    title: string
    type?: string
  }>
  data: any[]
  pagination?: {
    page: number
    pageSize: number
    total: number
  }
}

// UI State Types
export interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
}

export interface ErrorState {
  hasError: boolean
  message?: string
  details?: any
}

// Theme Types
export type ThemeMode = 'light' | 'dark'

// Data Context Types
export interface DataContextType {
  // File Management
  files: FileMetadata[]
  currentFile: FileMetadata | null
  uploadFile: (file: File) => Promise<void>
  selectFile: (fileId: number) => void
  refreshFiles: () => Promise<void>

  // Chat Management
  chatSessions: ChatSession[]
  currentSession: ChatSession | null
  messages: ChatMessage[]
  sendMessage: (request: SendMessageRequest) => Promise<void>
  createSession: (request: CreateChatSessionRequest) => Promise<void>
  selectSession: (sessionId: number) => void
  loadSessionMessages: (sessionId: number) => Promise<void>

  // Loading States
  loading: LoadingState
  error: ErrorState

  // Actions
  clearError: () => void
  resetState: () => void
}

// Component Props Types
export interface BentoGridProps {
  children: React.ReactNode
  className?: string
}

export interface ChatInterfaceProps {
  className?: string
}

export interface FileUploadProps {
  onUploadSuccess?: (file: FileMetadata) => void
  onUploadError?: (error: string) => void
  className?: string
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Constants
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440
} as const

export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500
} as const

export const Z_INDEX = {
  modal: 1300,
  popover: 1200,
  tooltip: 1100,
  appBar: 1000
} as const
