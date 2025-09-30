import React from 'react'
import { Typography, Card, CardContent, Button, Chip, List, ListItem, ListItemText } from '@mui/material'
import { motion } from 'framer-motion'
import {
  History as HistoryIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Message as MessageIcon
} from '@mui/icons-material'

const ChatHistory: React.FC = () => {
  // Mock data for chat sessions
  const mockSessions = [
    {
      id: 1,
      title: 'Sales Analysis Q4 2024',
      lastActivity: '2 hours ago',
      messageCount: 15,
      fileName: 'sales_data.xlsx',
      status: 'active'
    },
    {
      id: 2,
      title: 'Customer Segmentation',
      lastActivity: '1 day ago',
      messageCount: 8,
      fileName: 'customer_data.xlsx',
      status: 'completed'
    },
    {
      id: 3,
      title: 'Revenue Forecasting',
      lastActivity: '3 days ago',
      messageCount: 22,
      fileName: 'financial_data.xlsx',
      status: 'archived'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'completed': return 'primary'
      case 'archived': return 'default'
      default: return 'default'
    }
  }

  return (
    <div className="chat-history-container">
      <div className="chat-history-header">
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Chat History
        </Typography>
        <Typography variant="h6" color="text.secondary">
          View and manage your previous conversations and insights
        </Typography>
      </div>

      <div className="chat-history-grid">
        {/* Sidebar with sessions list */}
        <Card
          component={motion.div}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ height: 600 }}
        >
          <CardContent sx={{ p: 3 }}>
            <div className="sessions-header">
              <HistoryIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Sessions</Typography>
            </div>

            <List sx={{ p: 0 }}>
              {mockSessions.map((session, index) => (
                <ListItem
                  key={session.id}
                  component={motion.div}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    cursor: 'pointer',
                    backgroundColor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {session.title}
                      </Typography>
                    }
                    secondary={
                      <div>
                        <Typography variant="caption" color="text.secondary">
                          {session.messageCount} messages • {session.lastActivity}
                        </Typography>
                        <div style={{ marginTop: '8px' }}>
                          <Chip
                            label={session.status}
                            size="small"
                            color={getStatusColor(session.status)}
                            variant="outlined"
                          />
                        </div>
                      </div>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Main content area */}
        <Card
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          sx={{ height: 600 }}
        >
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="session-details-header">
              <Typography variant="h6">Session Details</Typography>
              <div className="session-actions">
                <Button size="small" startIcon={<SearchIcon />} variant="outlined">
                  Search
                </Button>
                <Button size="small" startIcon={<DownloadIcon />} variant="outlined">
                  Export
                </Button>
                <Button size="small" startIcon={<DeleteIcon />} variant="outlined" color="error">
                  Delete
                </Button>
              </div>
            </div>

            {/* Messages area */}
            <div className="messages-area">
              <div className="messages-container">
                {/* Mock messages */}
                <div className="user-message">
                  <Typography variant="body2">
                    What are the top 5 products by revenue this quarter?
                  </Typography>
                </div>

                <div className="assistant-message">
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Based on your sales data, here are the top 5 products by revenue:
                  </Typography>
                  <div className="product-chips">
                    <Chip label="Product A: $125K" size="small" />
                    <Chip label="Product B: $98K" size="small" />
                    <Chip label="Product C: $87K" size="small" />
                    <Chip label="Product D: $76K" size="small" />
                    <Chip label="Product E: $65K" size="small" />
                  </div>
                </div>
              </div>
            </div>

            {/* Message input area */}
            <div className="message-input-area">
              <input
                type="text"
                placeholder="Continue the conversation..."
                className="message-input"
              />
              <Button
                variant="contained"
                startIcon={<MessageIcon />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ChatHistory
