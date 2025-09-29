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
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HistoryIcon from '@mui/icons-material/History';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ForumIcon from '@mui/icons-material/Forum';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

import {
  ChatMessageResponse,
  ChatSessionSummary,
  ExecutedResults,
  QueryHistoryEntry,
  VisualizationConfig,
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
    currentUser,
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

    if (!currentUser) {
      toast.error('Please sign in to run queries.');
      return;
    }

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

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
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
          }}
        >
          <Typography variant="body1" sx={{ lineHeight: 1.5 }}>
              {message.text}
            </Typography>

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
            <Chip
              size="small"
              label={activeSession.title ?? `Session #${activeSession.id}`}
              color="secondary"
              variant="outlined"
            />
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
          disabled={!selectedFileId || isSubmitting || !currentUser}
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
                disabled={!selectedFileId || isSubmitting || !inputValue.trim() || !currentUser}
              >
                Ask AI
            </Button>
            </span>
          </Tooltip>
          </Stack>
        </Box>

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
