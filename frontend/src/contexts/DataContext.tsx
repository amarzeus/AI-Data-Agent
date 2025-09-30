import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'
import { DataContextType, FileMetadata, ChatSession, ChatMessage, SendMessageRequest, CreateChatSessionRequest, LoadingState, ErrorState } from '../types'
import { apiService } from '../services/apiService'

// Action Types
type DataAction =
  | { type: 'SET_LOADING'; payload: LoadingState }
  | { type: 'SET_ERROR'; payload: ErrorState }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_FILES'; payload: FileMetadata[] }
  | { type: 'ADD_FILE'; payload: FileMetadata }
  | { type: 'SET_CURRENT_FILE'; payload: FileMetadata | null }
  | { type: 'SET_CHAT_SESSIONS'; payload: ChatSession[] }
  | { type: 'ADD_CHAT_SESSION'; payload: ChatSession }
  | { type: 'SET_CURRENT_SESSION'; payload: ChatSession | null }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: number; updates: Partial<ChatMessage> } }
  | { type: 'RESET_STATE' }

// Initial State
const initialState: {
  files: FileMetadata[]
  currentFile: FileMetadata | null
  chatSessions: ChatSession[]
  currentSession: ChatSession | null
  messages: ChatMessage[]
  loading: LoadingState
  error: ErrorState
} = {
  files: [],
  currentFile: null,
  chatSessions: [],
  currentSession: null,
  messages: [],
  loading: { isLoading: false },
  error: { hasError: false }
}

// Reducer
function dataReducer(state: typeof initialState, action: DataAction): typeof initialState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'CLEAR_ERROR':
      return { ...state, error: { hasError: false } }

    case 'SET_FILES':
      return { ...state, files: action.payload }

    case 'ADD_FILE':
      return { ...state, files: [...state.files, action.payload] }

    case 'SET_CURRENT_FILE':
      return { ...state, currentFile: action.payload }

    case 'SET_CHAT_SESSIONS':
      return { ...state, chatSessions: action.payload }

    case 'ADD_CHAT_SESSION':
      return { ...state, chatSessions: [...state.chatSessions, action.payload] }

    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload }

    case 'SET_MESSAGES':
      return { ...state, messages: action.payload }

    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] }

    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id
            ? { ...msg, ...action.payload.updates }
            : msg
        )
      }

    case 'RESET_STATE':
      return initialState

    default:
      return state
  }
}

// Context
const DataContext = createContext<DataContextType | undefined>(undefined)

// Provider Component
interface DataProviderProps {
  children: ReactNode
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState)

  // File Management Functions
  const uploadFile = useCallback(async (file: File) => {
    dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Uploading file...' } })

    try {
      const response = await apiService.uploadFile(file)
      dispatch({ type: 'ADD_FILE', payload: response })
      dispatch({ type: 'SET_CURRENT_FILE', payload: response })
      dispatch({ type: 'CLEAR_ERROR' })
    } catch (error: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: { hasError: true, message: error.message || 'Upload failed' }
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { isLoading: false } })
    }
  }, [])

  const selectFile = useCallback((fileId: number) => {
    const file = state.files.find(f => f.id === fileId)
    if (file) {
      dispatch({ type: 'SET_CURRENT_FILE', payload: file })
      dispatch({ type: 'CLEAR_ERROR' })
    }
  }, [state.files])

  const refreshFiles = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Refreshing files...' } })

    try {
      const files = await apiService.getFiles()
      dispatch({ type: 'SET_FILES', payload: files })
      dispatch({ type: 'CLEAR_ERROR' })
    } catch (error: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: { hasError: true, message: error.message || 'Failed to refresh files' }
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { isLoading: false } })
    }
  }, [])

  // Chat Management Functions
  const sendMessage = useCallback(async (request: SendMessageRequest) => {
    dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Sending message...' } })

    try {
      await apiService.sendMessage(request)

      // Add user message if not already added
      if (request.session_id) {
        // Message will be added by the API response
      }

      dispatch({ type: 'CLEAR_ERROR' })
    } catch (error: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: { hasError: true, message: error.message || 'Failed to send message' }
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { isLoading: false } })
    }
  }, [])

  const createSession = useCallback(async (request: CreateChatSessionRequest) => {
    dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Creating session...' } })

    try {
      const session = await apiService.createChatSession(request)
      dispatch({ type: 'ADD_CHAT_SESSION', payload: session })
      dispatch({ type: 'SET_CURRENT_SESSION', payload: session })
      dispatch({ type: 'CLEAR_ERROR' })
    } catch (error: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: { hasError: true, message: error.message || 'Failed to create session' }
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { isLoading: false } })
    }
  }, [])

  const selectSession = useCallback((sessionId: number) => {
    const session = state.chatSessions.find(s => s.id === sessionId)
    if (session) {
      dispatch({ type: 'SET_CURRENT_SESSION', payload: session })
      dispatch({ type: 'CLEAR_ERROR' })
    }
  }, [state.chatSessions])

  const loadSessionMessages = useCallback(async (sessionId: number) => {
    dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Loading messages...' } })

    try {
      const messages = await apiService.getSessionMessages(sessionId)
      dispatch({ type: 'SET_MESSAGES', payload: messages })
      dispatch({ type: 'CLEAR_ERROR' })
    } catch (error: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: { hasError: true, message: error.message || 'Failed to load messages' }
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { isLoading: false } })
    }
  }, [])

  // Utility Functions
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' })
  }, [])

  // Load initial data on mount
  React.useEffect(() => {
    refreshFiles()
  }, [refreshFiles])

  const contextValue: DataContextType = {
    // File Management
    files: state.files,
    currentFile: state.currentFile,
    uploadFile,
    selectFile,
    refreshFiles,

    // Chat Management
    chatSessions: state.chatSessions,
    currentSession: state.currentSession,
    messages: state.messages,
    sendMessage,
    createSession,
    selectSession,
    loadSessionMessages,

    // Loading States
    loading: state.loading,
    error: state.error,

    // Actions
    clearError,
    resetState
  }

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

// Hook for using the context
export const useData = (): DataContextType => {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export default DataProvider
