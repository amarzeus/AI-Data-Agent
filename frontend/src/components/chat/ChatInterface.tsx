import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  TextField,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Card,
  CardContent,
  Tooltip,
  Alert
} from '@mui/material'
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as UserIcon,
  Lightbulb as SuggestionIcon,
  ThumbUp as LikeIcon,
  ThumbDown as DislikeIcon
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { useData } from '../../contexts/DataContext'
import { wsService } from '../../services/websocketService'
import { aiService, Intent, AIInsight, QueryAnalysis } from '../../services/aiService'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sqlQuery?: string
  artifacts?: any[]
  feedback?: 'like' | 'dislike'
  insights?: AIInsight[]
  followUpQuestions?: string[]
}

interface IntentSuggestion {
  id: string
  label: string
  query: string
  category: 'analysis' | 'summary' | 'visualization' | 'export'
}

const ChatInterface: React.FC = () => {
  const { currentFile, messages: contextMessages } = useData()
  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [_detectedIntents, setDetectedIntents] = useState<Intent[]>([]) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [_aiInsights, setAiInsights] = useState<AIInsight[]>([]) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [_queryAnalysis, setQueryAnalysis] = useState<QueryAnalysis | null>(null) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [_showInsights, setShowInsights] = useState(false) // eslint-disable-line @typescript-eslint/no-unused-vars
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Define intent suggestions for the UI
  const intentSuggestions: IntentSuggestion[] = [
    { id: '1', label: 'Show me trends', query: 'What are the main trends in this data?', category: 'analysis' },
    { id: '2', label: 'Summary statistics', query: 'Give me a summary of this dataset', category: 'summary' },
    { id: '3', label: 'Create visualization', query: 'Create a chart showing the data distribution', category: 'visualization' },
    { id: '4', label: 'Export data', query: 'Export this data to CSV', category: 'export' }
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleAIResponse = useCallback(async (data: any) => {
    // Generate AI insights from the data
    const insights = await aiService.generateInsights(data.executed_results || [])

    // Generate follow-up questions
    const followUpQuestions = aiService.generateFollowUpQuestions(data.explanation || '')

    const assistantMessage: Message = {
      id: Date.now(),
      role: 'assistant',
      content: data.explanation || 'Analysis complete',
      timestamp: new Date().toISOString(),
      sqlQuery: data.sql_query,
      artifacts: data.visualizations || data.executed_results,
      insights: insights,
      followUpQuestions: followUpQuestions
    }

    setMessages(prev => [...prev, assistantMessage])
    setAiInsights(insights)
    setShowInsights(true)

    // Update conversation context
    aiService.updateContext(inputMessage, data)
  }, [inputMessage])

  // WebSocket connection and message handling
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        // Use session ID 1 for now, in a real app this would be dynamic
        await wsService.connect(undefined, '1')
        setIsConnected(true)
        setConnectionError(null)
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error)
        setConnectionError('Failed to connect to AI service')
        setIsConnected(false)
      }
    }

    connectWebSocket()

    // Subscribe to AI response events
    const unsubscribeResponse = wsService.subscribe('ai_response', (data) => {
      handleAIResponse(data)
    })

    // Subscribe to typing indicators
    const unsubscribeTyping = wsService.subscribe('typing_start', () => {
      setIsTyping(true)
    })

    const unsubscribeTypingEnd = wsService.subscribe('typing_end', () => {
      setIsTyping(false)
    })

    // Subscribe to connection status
    const unsubscribeStatus = wsService.subscribe('connection_status', (data) => {
      setIsConnected(data.connected)
      if (!data.connected) {
        setConnectionError('Connection lost')
      } else {
        setConnectionError(null)
      }
    })

    return () => {
      unsubscribeResponse()
      unsubscribeTyping()
      unsubscribeTypingEnd()
      unsubscribeStatus()
      wsService.disconnect()
    }
  }, [handleAIResponse])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Convert context messages to local state
    setMessages(contextMessages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.created_at,
      sqlQuery: msg.sql_query,
      artifacts: msg.payload?.visualizations || msg.payload?.executed_results
    })))
  }, [contextMessages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentFile || !isConnected) return

    const currentQuery = inputMessage

    // Analyze query for intents and insights
    const analysis = aiService.analyzeQuery(currentQuery)
    setQueryAnalysis(analysis)
    setDetectedIntents([analysis.intent])

    // Generate contextual suggestions
    const contextualSuggestions = aiService.generateContextualSuggestions()

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: currentQuery,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')

    // Send message through WebSocket
    wsService.sendMessage({
      type: 'user_query',
      query: currentQuery,
      file_id: currentFile.id,
      session_id: '1',
      analysis: analysis,
      contextual_suggestions: contextualSuggestions
    })

    // Start typing indicator
    wsService.sendMessage({
      type: 'typing_start',
      session_id: '1'
    })
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestionClick = (suggestion: IntentSuggestion) => {
    setInputMessage(suggestion.query)
  }

  const handleFeedback = (messageId: number, feedback: 'like' | 'dislike') => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, feedback }
        : msg
    ))
  }

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === 'user'

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        style={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginBottom: '1rem'
        }}
      >
        <div className="message-container">
          {!isUser && (
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 32,
                height: 32,
                mt: 0.5
              }}
            >
              <BotIcon sx={{ fontSize: 16 }} />
            </Avatar>
          )}

          <div className="message-content">
            <div className="message-bubble" data-user={isUser}>
              <Typography variant="body1" sx={{ mb: message.sqlQuery ? 2 : 0 }}>
                {message.content}
              </Typography>

              {message.sqlQuery && (
                <div className="sql-query">
                  <Typography variant="caption" sx={{ opacity: 0.8, fontFamily: 'monospace' }}>
                    Generated SQL:
                  </Typography>
                  <pre className="sql-code">
                    {message.sqlQuery}
                  </pre>
                </div>
              )}

              {/* Artifacts would go here - charts, tables, etc. */}
              {message.artifacts && message.artifacts.length > 0 && (
                <div className="message-artifacts">
                  {message.artifacts.map((artifact, idx) => (
                    <Card key={idx} sx={{ mb: 2, borderRadius: 2 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          {artifact.title || 'Data Visualization'}
                        </Typography>
                        {/* Placeholder for actual chart/table component */}
                        <div className="chart-placeholder">
                          <Typography variant="body2" color="primary.main">
                            📊 Interactive Chart
                          </Typography>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Feedback buttons for assistant messages */}
              {!isUser && (
                <div className="message-feedback">
                  <Tooltip title="Helpful">
                    <IconButton
                      size="small"
                      onClick={() => handleFeedback(message.id, 'like')}
                      sx={{
                        color: message.feedback === 'like' ? 'success.main' : 'text.secondary',
                        '&:hover': { color: 'success.main' }
                      }}
                    >
                      <LikeIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Not helpful">
                    <IconButton
                      size="small"
                      onClick={() => handleFeedback(message.id, 'dislike')}
                      sx={{
                        color: message.feedback === 'dislike' ? 'error.main' : 'text.secondary',
                        '&:hover': { color: 'error.main' }
                      }}
                    >
                      <DislikeIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>
              )}
            </div>

            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 0.5,
                textAlign: isUser ? 'right' : 'left',
                color: 'text.secondary',
                fontSize: '0.7rem'
              }}
            >
              {new Date(message.timestamp).toLocaleTimeString()}
            </Typography>
          </div>

          {isUser && (
            <Avatar
              sx={{
                bgcolor: 'secondary.main',
                width: 32,
                height: 32,
                mt: 0.5
              }}
            >
              <UserIcon sx={{ fontSize: 16 }} />
            </Avatar>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="header-content">
          <Typography variant="h6" gutterBottom>
            AI Data Assistant
          </Typography>
          <Chip
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            size="small"
            variant="outlined"
          />
        </div>
        <Typography variant="body2" color="text.secondary">
          Ask questions about your data in natural language
        </Typography>

        {connectionError && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
            {connectionError}
          </Alert>
        )}
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="chat-empty">
                <BotIcon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.3, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Start a conversation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ask me anything about your data!
                </Typography>
              </div>
            </motion.div>
          ) : (
            messages.map(renderMessage)
          )}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              marginBottom: '1rem'
            }}
          >
            <div className="typing-indicator">
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                <BotIcon sx={{ fontSize: 16 }} />
              </Avatar>
              <div className="typing-bubble">
                <div className="typing-dots">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Intent Suggestions */}
      {messages.length === 0 && (
        <div className="intent-suggestions">
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SuggestionIcon fontSize="small" />
            Try asking:
          </Typography>
          <div className="suggestion-chips">
            {intentSuggestions.map((suggestion) => (
              <Chip
                key={suggestion.id}
                label={suggestion.label}
                onClick={() => handleSuggestionClick(suggestion)}
                variant="outlined"
                size="small"
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'white'
                  },
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input">
        <div className="input-container">
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              currentFile
                ? "Ask me anything about your data..."
                : "Please upload a file first to start chatting"
            }
            disabled={!currentFile || !isConnected}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: 'background.paper',
                opacity: isConnected ? 1 : 0.6
              }
            }}
          />
          <IconButton
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !currentFile || !isConnected}
            sx={{
              bgcolor: isConnected ? 'primary.main' : 'action.disabledBackground',
              color: 'white',
              borderRadius: 2,
              width: 48,
              height: 48,
              '&:hover': {
                bgcolor: isConnected ? 'primary.dark' : 'action.disabledBackground'
              },
              '&:disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'action.disabled'
              }
            }}
          >
            <SendIcon />
          </IconButton>
        </div>

        {!currentFile && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            💡 Upload an Excel file to start analyzing your data
          </Typography>
        )}
      </div>

      {/* Add CSS animation for typing indicator */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 80%, 100% {
              transform: scale(0);
              opacity: 0.5;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `
      }} />
    </div>
  )
}

export default ChatInterface
