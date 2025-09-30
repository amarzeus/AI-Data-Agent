import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HistoryIcon from '@mui/icons-material/History';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ForumIcon from '@mui/icons-material/Forum';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import DownloadIcon from '@mui/icons-material/Download';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

import {
  ChatMessageResponse,
  ChatSessionSummary,
  ExecutedResults,
  QueryHistoryEntry,
  VisualizationConfig,
  MessageSearchResponse,
} from '../services/apiService';
import { apiService } from '../services/apiService';
import { useDataContext } from '../contexts/DataContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: Date;
  sql?: string;
  visualizations?: VisualizationConfig[];
  disclaimer?: string;
  rowCount?: number;
  isEditing?: boolean;
  editedText?: string;
  searchMatch?: boolean;
  sessionMessageId?: number;
}

interface ChatInterfaceProps {
  selectedFileId: number | null;
  fileName?: string;
  onOpenUploadModal?: () => void;
  onFileSelect?: (fileId: number) => void;
}

const mapApiMessageToChatMessage = (
  apiMessage: ChatMessageResponse,
  fallbackTitle?: string,
): ChatMessage => {
  const payload = apiMessage.payload ?? {};
  const executedResults = payload.executed_results as ExecutedResults | undefined;
  const visualizations = payload.visualizations as VisualizationConfig[] | undefined;
  const disclaimer = payload.disclaimer as string | undefined;

  return {
    id: `session-msg-${apiMessage.id}`,
    role: apiMessage.role === 'user' ? 'user' : 'assistant',
    text: apiMessage.content || fallbackTitle || '',
    createdAt: new Date(apiMessage.created_at),
    sql: apiMessage.sql_query || undefined,
    visualizations,
    disclaimer,
    rowCount: executedResults?.row_count,
    sessionMessageId: apiMessage.id,
  };
};

const createAssistantIntro = (fileName?: string): ChatMessage => ({
  id: `assistant-intro-${Date.now()}`,
  role: 'assistant',
  text: fileName
    ? `Ready to explore **${fileName}**. Ask me about trends, comparisons, or anomalies.`
    : 'Upload an Excel file to begin. I can answer business questions, surface insights, and build charts for you.',
  createdAt: new Date(),
});

const ChatInterface: React.FC<ChatInterfaceProps> = ({ selectedFileId, fileName, onOpenUploadModal, onFileSelect }) => {
  const {
    queryHistory,
    setQueryHistory,
    setSharedViz,
    setDataQualityDisclaimer,
    latestResults,
    setLatestResults,
    activeSession,
    setActiveSession,
    appendChatMessages,
    setChatMessages,
  } = useDataContext();

  const [messages, setMessages] = useState<ChatMessage[]>([createAssistantIntro(fileName)]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);

  // Enhanced chat features state
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MessageSearchResponse | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [messageMenuAnchor, setMessageMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMessageForMenu, setSelectedMessageForMenu] = useState<number | null>(null);
  const [sessionMenuAnchor, setSessionMenuAnchor] = useState<null | HTMLElement>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'txt'>('json');

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages([createAssistantIntro(fileName)]);
    setLatestResults(undefined);
    setActiveSession(null);
    setChatMessages([]);
  }, [selectedFileId, fileName, setLatestResults, setActiveSession, setChatMessages]);

  useEffect(() => {
    const loadExistingSession = async () => {
      if (!activeSession || !activeSession.id) {
        return;
      }
      try {
        setLoadingSession(true);
        const sessionMessages = await apiService.listChatMessages(activeSession.id, 200);
        const mappedMessages = sessionMessages.messages.map((message) =>
          mapApiMessageToChatMessage(message, fileName),
        );
        setMessages(mappedMessages);
        appendChatMessages(sessionMessages.messages);
      } catch (error) {
        console.error('Failed to load chat session messages', error);
      } finally {
        setLoadingSession(false);
      }
    };

    if (activeSession) {
      loadExistingSession();
    }
  }, [activeSession, appendChatMessages, fileName, setMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const suggestions = useMemo(
    () => [
      'Show me the revenue trend by quarter this year.',
      'Which products had the highest growth compared to last month?',
      'Identify any regions with declining performance.',
      'What are the top 5 customers by total spend?'
    ],
    [],
  );

  const handleRunQuery = async (prompt?: string) => {
    const query = (prompt ?? inputValue).trim();

    if (!query) {
      return;
    }

    if (!selectedFileId) {
      toast.error('Upload and select a dataset before running a query.');
      onOpenUploadModal?.();
      return;
    }

    // Authentication removed, allow queries without signin

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      createdAt: new Date(),
    };

    const assistantId = `assistant-${Date.now()}`;
    const placeholder: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      text: 'Analyzing your data... hold tight.',
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, placeholder]);
    setInputValue('');
    setIsSubmitting(true);

    try {
      const response = await apiService.runAIQuery({
        query,
        file_id: selectedFileId,
        session_id: activeSession?.id,
        session_title: activeSession?.title || fileName || undefined,
      });

      if (response.created_session) {
        setActiveSession(response.created_session);
      } else if (response.session_id && !activeSession) {
        setActiveSession({
          id: response.session_id,
          title: response.session_title ?? `Session ${response.session_id}`,
          summary: undefined,
          file_id: selectedFileId ?? undefined,
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_interaction_at: new Date().toISOString(),
          message_count: 0,
          assistant_preview: undefined,
        } as ChatSessionSummary);
      }

      const enrichedMessages = response.messages?.map((message) =>
        mapApiMessageToChatMessage(message, fileName),
      );

      setMessages((prev) => {
        const others = prev.filter(
          (msg) => msg.id !== userMessage.id && msg.id !== assistantId,
        );

        if (enrichedMessages && enrichedMessages.length > 0) {
          return [...others, ...enrichedMessages].sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
          );
        }

        const assistantFallback = prev.find((msg) => msg.id === assistantId);
        const assistantReplacement = assistantFallback
          ? {
              ...assistantFallback,
              text: response.explanation || 'Here is what I found based on your question.',
              sql: response.sql_query || undefined,
              visualizations: response.visualizations,
              disclaimer: response.data_quality_disclaimer || undefined,
              rowCount: response.executed_results?.row_count,
            }
          : undefined;

        return assistantReplacement
          ? [...others, assistantReplacement].sort(
              (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
            )
          : others;
      });

      if (response.messages && response.messages.length > 0) {
        appendChatMessages(response.messages);
      }

      setSharedViz(response.visualizations ?? []);
      setDataQualityDisclaimer(response.data_quality_disclaimer);
      setLatestResults(response.executed_results ?? undefined);

      if (selectedFileId) {
        apiService
          .getQueryHistory(selectedFileId)
          .then((history) => setQueryHistory(history.history))
          .catch((historyError) => console.error('Failed to refresh history', historyError));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI query failed.';
      toast.error(message);
      setMessages((prev) =>
        prev.map((entry) =>
          entry.id === assistantId
            ? {
                ...entry,
                text: message,
              }
            : entry,
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleRunQuery();
  };

  // Enhanced chat functionality
  const handleEditMessage = (messageId: number, currentText: string) => {
    setEditingMessageId(messageId);
    setEditingMessageText(currentText);
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId) return;

    try {
      await apiService.updateChatMessage(editingMessageId, { content: editingMessageText });

      // Update local message state
      setMessages(prev => prev.map(msg =>
        msg.sessionMessageId === editingMessageId
          ? { ...msg, text: editingMessageText, isEditing: false }
          : msg
      ));

      setEditingMessageId(null);
      setEditingMessageText('');
      toast.success('Message updated successfully');
    } catch (error) {
      toast.error('Failed to update message');
      console.error('Edit message error:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingMessageText('');
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!activeSession) return;

    try {
      await apiService.deleteChatMessage(messageId);

      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.sessionMessageId !== messageId));

      // Refresh messages from server to ensure consistency
      const sessionMessages = await apiService.listChatMessages(activeSession.id, 200);
      const mappedMessages = sessionMessages.messages.map((message) =>
        mapApiMessageToChatMessage(message, fileName),
      );
      setMessages(mappedMessages);

      setMessageMenuAnchor(null);
      setSelectedMessageForMenu(null);
      toast.success('Message deleted successfully');
    } catch (error) {
      toast.error('Failed to delete message');
      console.error('Delete message error:', error);
    }
  };

  const handleSearchMessages = async () => {
    if (!activeSession || !searchQuery.trim()) return;

    try {
      const results = await apiService.searchSessionMessages(activeSession.id, searchQuery);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      toast.error('Search failed');
      console.error('Search error:', error);
    }
  };

  const handleExportSession = async () => {
    if (!activeSession) return;

    try {
      const exportData = await apiService.exportSession(activeSession.id, exportFormat);

      if (exportFormat === 'txt') {
        // Download as text file
        const blob = new Blob([exportData.content || ''], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportData.filename || `chat_session_${activeSession.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Download as JSON file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat_session_${activeSession.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setExportDialogOpen(false);
      toast.success('Session exported successfully');
    } catch (error) {
      toast.error('Export failed');
      console.error('Export error:', error);
    }
  };

  const handleMessageFeedback = async (messageId: number, feedbackType: 'thumbs_up' | 'thumbs_down' | 'helpful' | 'not_helpful') => {
    try {
      await apiService.addMessageFeedback(messageId, { feedback_type: feedbackType });
      toast.success('Feedback submitted');
    } catch (error) {
      toast.error('Failed to submit feedback');
      console.error('Feedback error:', error);
    }
  };

  const handleMessageMenuOpen = (event: React.MouseEvent<HTMLElement>, messageId: number) => {
    setMessageMenuAnchor(event.currentTarget);
    setSelectedMessageForMenu(messageId);
  };

  const handleMessageMenuClose = () => {
    setMessageMenuAnchor(null);
    setSelectedMessageForMenu(null);
  };

  const handleSessionMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSessionMenuAnchor(event.currentTarget);
  };

  const handleSessionMenuClose = () => {
    setSessionMenuAnchor(null);
  };

  const handleRenameSession = async (newTitle: string) => {
    if (!activeSession) return;

    try {
      await apiService.updateChatSession(activeSession.id, { title: newTitle });

      // Update local state
      setActiveSession(activeSession ? { ...activeSession, title: newTitle } : null);

      setSessionMenuAnchor(null);
      toast.success('Session renamed successfully');
    } catch (error) {
      toast.error('Failed to rename session');
      console.error('Rename session error:', error);
    }
  };

  const handleDeleteSession = async () => {
    if (!activeSession) return;

    try {
      await apiService.deleteChatSession(activeSession.id);

      // Reset to initial state
      setActiveSession(null);
      setChatMessages([]);
      setMessages([createAssistantIntro(fileName)]);

      setSessionMenuAnchor(null);
      toast.success('Session deleted successfully');
    } catch (error) {
      toast.error('Failed to delete session');
      console.error('Delete session error:', error);
    }
  };

  const handleArchiveSession = async () => {
    if (!activeSession) return;

    try {
      await apiService.updateChatSession(activeSession.id, { is_archived: true });

      // Reset to initial state
      setActiveSession(null);
      setChatMessages([]);
      setMessages([createAssistantIntro(fileName)]);

      setSessionMenuAnchor(null);
      toast.success('Session archived successfully');
    } catch (error) {
      toast.error('Failed to archive session');
      console.error('Archive session error:', error);
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const isEditing = editingMessageId === message.sessionMessageId;

    return (
      <Stack
        key={message.id}
        direction="column"
        alignItems={isUser ? 'flex-end' : 'flex-start'}
        spacing={0.5}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: isUser ? 'primary.main' : 'background.paper',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            maxWidth: '100%',
            borderRadius: 2,
            border: isUser ? 'none' : '1px solid',
            borderColor: isUser ? 'transparent' : 'divider',
            whiteSpace: 'pre-line',
            position: 'relative',
          }}
        >
          {/* Message actions menu button */}
          {!isEditing && message.sessionMessageId && (
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                opacity: 0.6,
                '&:hover': { opacity: 1 }
              }}
              onClick={(e) => handleMessageMenuOpen(e, message.sessionMessageId!)}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}

          {isEditing ? (
            <Box sx={{ mt: 1 }}>
              <TextField
                fullWidth
                multiline
                value={editingMessageText}
                onChange={(e) => setEditingMessageText(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ mb: 1 }}
              />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button size="small" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button size="small" variant="contained" onClick={handleSaveEdit}>
                  Save
                </Button>
              </Stack>
            </Box>
          ) : (
            <Typography variant="body1" sx={{ lineHeight: 1.5 }}>
              {message.text}
            </Typography>
          )}

            {message.sql && (
              <Box
                sx={{
                mt: 1.5,
                  p: 1.5,
                borderRadius: 1.5,
                bgcolor: isUser ? 'rgba(255,255,255,0.2)' : 'grey.50',
                border: '1px solid',
                borderColor: isUser ? 'rgba(255,255,255,0.3)' : 'grey.200',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
                Generated SQL
              </Typography>
                <Typography
                variant="body2"
                component="pre"
                  sx={{
                  fontFamily: 'monospace',
                  m: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {message.sql}
                </Typography>
              </Box>
            )}

          {message.rowCount != null && (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip
                size="small"
                color={isUser ? 'default' : 'primary'}
                variant={isUser ? 'filled' : 'outlined'}
                label={`${message.rowCount.toLocaleString()} rows returned`}
              />
          {message.visualizations && message.visualizations.length > 0 && (
                <Chip
                  size="small"
                  color="secondary"
                  variant="outlined"
                  label={`${message.visualizations.length} visualization${message.visualizations.length > 1 ? 's' : ''} ready`}
                />
              )}
            </Stack>
          )}

          {message.disclaimer && (
            <Alert severity="warning" sx={{ mt: 1.5 }}>
              {message.disclaimer}
            </Alert>
          )}

          {/* Message feedback buttons for assistant messages */}
          {message.role === 'assistant' && message.sessionMessageId && (
            <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
              <Tooltip title="Helpful">
                <IconButton
                  size="small"
                  onClick={() => handleMessageFeedback(message.sessionMessageId!, 'helpful')}
                  sx={{ color: 'success.main' }}
                >
                  <ThumbUpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Not helpful">
                <IconButton
                  size="small"
                  onClick={() => handleMessageFeedback(message.sessionMessageId!, 'not_helpful')}
                  sx={{ color: 'error.main' }}
                >
                  <ThumbDownIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Paper>
        <Typography variant="caption" color="text.secondary">
          {formatDistanceToNow(message.createdAt, { addSuffix: true })}
        </Typography>
      </Stack>
    );
  };

  const lastHistoryItems = useMemo<QueryHistoryEntry[]>(
    () => queryHistory.slice(0, 4),
    [queryHistory],
  );

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        gap: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack spacing={0.25}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ForumIcon fontSize="small" color="primary" />
            <Typography variant="h6">AI Analyst</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Ask natural language questions about your uploaded Excel data. Answers are saved to your session.
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          {activeSession && (
            <>
              <Chip
                size="small"
                label={activeSession.title ?? `Session #${activeSession.id}`}
                color="secondary"
                variant="outlined"
                onClick={handleSessionMenuOpen}
                sx={{ cursor: 'pointer' }}
              />
              <Menu
                anchorEl={sessionMenuAnchor}
                open={Boolean(sessionMenuAnchor)}
                onClose={handleSessionMenuClose}
              >
                <MenuItem onClick={() => {
                  const newTitle = prompt('Enter new session title:');
                  if (newTitle) handleRenameSession(newTitle);
                }}>
                  <EditIcon fontSize="small" sx={{ mr: 1 }} />
                  Rename
                </MenuItem>
                <MenuItem onClick={() => setExportDialogOpen(true)}>
                  <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
                  Export
                </MenuItem>
                <MenuItem onClick={handleArchiveSession}>
                  Archive
                </MenuItem>
                <MenuItem onClick={handleDeleteSession} sx={{ color: 'error.main' }}>
                  <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                  Delete
                </MenuItem>
              </Menu>
            </>
          )}
          <Tooltip title="Upload new dataset">
            <IconButton color="primary" onClick={onOpenUploadModal} size="small">
              <UploadFileIcon />
            </IconButton>
          </Tooltip>
          {messages.length > 1 && (
            <Tooltip title="Start a fresh session">
              <IconButton
                color="primary"
                onClick={() => {
                  setActiveSession(null);
                  setChatMessages([]);
                  setMessages([createAssistantIntro(fileName)]);
                }}
                size="small"
              >
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      {!selectedFileId && (
        <Alert severity="info" icon={<InfoOutlinedIcon />}>
          Upload an Excel file to unlock the AI assistant.
        </Alert>
      )}

      {loadingSession && (
        <Alert severity="info" icon={<CircularProgress size={16} />}>
          Loading saved conversation...
        </Alert>
      )}

      <Box
        ref={scrollRef}
        className="scrollbar-thin"
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          pr: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {messages.map(renderMessage)}
      </Box>

      <Divider />

      {/* Search functionality */}
      {activeSession && (
        <>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchMessages()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleSearchMessages}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
          </Stack>

          {/* Search results */}
          {showSearchResults && searchResults && (
            <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Search Results ({searchResults.total_results})
              </Typography>
              <Stack spacing={1}>
                {searchResults.results.map((result) => (
                  <Box key={result.id} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {result.role.toUpperCase()}: {result.content.substring(0, 100)}...
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {result.match_context}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}
        </>
      )}

      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AutoAwesomeIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2">Try asking:</Typography>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {suggestions.map((suggestion) => (
            <Chip
              key={suggestion}
              label={suggestion}
              size="small"
              variant="outlined"
              onClick={() => handleRunQuery(suggestion)}
              sx={{ maxWidth: '100%' }}
                      />
                    ))}
        </Stack>
      </Stack>

      {latestResults && typeof latestResults.row_count === 'number' && (
        <Alert severity="success" icon={<AutoAwesomeIcon />}>
          Latest query returned {latestResults.row_count.toLocaleString()} rows. Visualizations are available in the Playground.
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder={selectedFileId ? 'Ask a question about your data…' : 'Upload a dataset to get started'}
          multiline
          minRows={2}
          maxRows={6}
          disabled={!selectedFileId || isSubmitting}
        />

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Button
            startIcon={<HistoryIcon />}
            size="small"
            color="inherit"
            onClick={() => setHistoryExpanded((prev) => !prev)}
            disabled={queryHistory.length === 0}
          >
            Recent queries
          </Button>

          <Tooltip title={selectedFileId ? 'Send query' : 'Upload a dataset first'}>
            <span>
            <Button
                type="submit"
                variant="contained"
                endIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                disabled={!selectedFileId || isSubmitting || !inputValue.trim()}
              >
                Ask AI
            </Button>
            </span>
          </Tooltip>
          </Stack>
        </Box>

        {/* Message actions menu */}
        <Menu
          anchorEl={messageMenuAnchor}
          open={Boolean(messageMenuAnchor)}
          onClose={handleMessageMenuClose}
        >
          <MenuItem onClick={() => {
            if (selectedMessageForMenu) {
              const message = messages.find(m => m.sessionMessageId === selectedMessageForMenu);
              if (message) {
                handleEditMessage(selectedMessageForMenu, message.text);
              }
            }
            handleMessageMenuClose();
          }}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={() => {
            if (selectedMessageForMenu) {
              handleDeleteMessage(selectedMessageForMenu);
            }
          }} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Export dialog */}
        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
          <DialogTitle>Export Session</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ minWidth: 300, pt: 1 }}>
              <Typography variant="body2">
                Export your chat session in the selected format.
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant={exportFormat === 'json' ? 'contained' : 'outlined'}
                  onClick={() => setExportFormat('json')}
                >
                  JSON
                </Button>
                <Button
                  variant={exportFormat === 'txt' ? 'contained' : 'outlined'}
                  onClick={() => setExportFormat('txt')}
                >
                  Text
                </Button>
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleExportSession}>
              Export
            </Button>
          </DialogActions>
        </Dialog>

      {historyExpanded && queryHistory.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <HistoryIcon fontSize="small" />
            <Typography variant="subtitle2">Last {lastHistoryItems.length} queries</Typography>
          </Stack>
          <Stack spacing={1}>
            {lastHistoryItems.map((entry) => (
              <Stack key={entry.query_id} spacing={0.5}>
                <Typography variant="body2" fontWeight={600}>
                  {entry.query}
        </Typography>
                {entry.response && (
                  <Typography variant="body2" color="text.secondary">
                    {entry.response}
                  </Typography>
                )}
                <Divider sx={{ my: 0.5 }} />
              </Stack>
            ))}
          </Stack>
    </Paper>
      )}
    </Box>
  );
};

export default ChatInterface;
