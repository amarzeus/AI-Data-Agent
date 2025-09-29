import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import TimelapseIcon from '@mui/icons-material/Timelapse';
import PersonIcon from '@mui/icons-material/Person';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import ForumIcon from '@mui/icons-material/Forum';
import HistoryIcon from '@mui/icons-material/History';
import { formatDistanceToNow } from 'date-fns';
import { useDataContext } from '../contexts/DataContext';
import { apiService, ChatSessionSummary } from '../services/apiService';

interface ToolsPanelProps {
  selectedFileId: number | null;
  fileName?: string;
  onFileSelect: (fileId: number) => void;
  onOpenUploadModal: () => void;
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({
  selectedFileId,
  fileName,
  onFileSelect,
  onOpenUploadModal,
}) => {
  const {
    fileDetail,
    queryHistory,
    sharedViz,
    latestResults,
    dataQualityDisclaimer,
    currentUser,
    activeSession,
    setActiveSession,
  } = useDataContext();

  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!selectedFileId) {
      setIsCollapsed(false);
    }
  }, [selectedFileId]);

  const recentQualityIssues = useMemo(() => {
    if (!fileDetail?.sheets) {
      return [];
    }
    return fileDetail.sheets.flatMap((sheet) =>
      (sheet.cleaning_metadata?.issues || []).map((issue) => ({
        sheet: sheet.sheet_name,
        issue,
      })),
    );
  }, [fileDetail?.sheets]);

  const lastQuery = useMemo(() => queryHistory[0], [queryHistory]);

  const loadSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      setSessionsError(null);
      const response = await apiService.listChatSessions();
      setSessions(response.sessions);
    } catch (error: any) {
      setSessionsError(error.message || 'Failed to load chat sessions');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadSessions();
    } else {
      setSessions([]);
    }
  }, [currentUser, loadSessions]);

  const handleSessionSelect = async (session: ChatSessionSummary) => {
    setActiveSession(session);
    setChatMessages([]);
    try {
      setSessionsLoading(true);
      const result = await apiService.listChatMessages(session.id, 200);
      setChatMessages(result.messages);
    } catch (error) {
      console.error('Failed to load chat messages', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const renderNoFile = () => (
    <Alert severity="info" sx={{ mt: 2 }}>
      Upload a dataset to access cleaning reports, quick filters, and AI insights.
    </Alert>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6">Tools & Insights</Typography>
          {sessionsLoading && <TimelapseIcon color="primary" fontSize="small" />}
        </Stack>
        <IconButton size="small" onClick={() => setIsCollapsed((prev) => !prev)}>
          {isCollapsed ? <AddIcon /> : <FilterAltIcon />}
        </IconButton>
      </Stack>

      <Stack spacing={1}>
        <Button
          variant="contained"
          startIcon={<UploadFileIcon />}
          onClick={onOpenUploadModal}
          fullWidth
        >
          Upload New Dataset
        </Button>
        {currentUser && (
          <Button
            variant="outlined"
            startIcon={<ForumIcon />}
            onClick={loadSessions}
            fullWidth
            disabled={sessionsLoading}
          >
            Refresh Sessions
          </Button>
        )}
      </Stack>

      {currentUser && (
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <PersonIcon color="primary" />
              <Box>
                <Typography variant="subtitle1">Signed in as</Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentUser.full_name ?? currentUser.email}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {!selectedFileId && renderNoFile()}

      {selectedFileId && !isCollapsed && (
        <Stack spacing={2} sx={{ flexGrow: 1, overflow: 'auto' }} className="scrollbar-thin">
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Dataset Overview
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  <strong>File:</strong> {fileName}
                </Typography>
                <Typography variant="body2">
                  <strong>Sheets:</strong> {fileDetail?.total_sheets ?? '—'}
                </Typography>
                <Typography variant="body2">
                  <strong>Rows:</strong> {fileDetail?.total_rows?.toLocaleString() ?? '—'}
                </Typography>
                <Typography variant="body2">
                  <strong>Columns:</strong> {fileDetail?.total_columns ?? '—'}
                </Typography>
              </Stack>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                startIcon={<CloudDownloadIcon />}
                onClick={() => onOpenUploadModal()}
              >
                Replace dataset
              </Button>
            </CardActions>
          </Card>

          {currentUser && (
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <ForumIcon color="primary" />
                  <Typography variant="subtitle1">Saved Sessions</Typography>
                </Stack>
                {sessionsError && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    {sessionsError}
                  </Alert>
                )}
                {sessions.length === 0 ? (
                  <Alert severity="info">Run a query to start your first session.</Alert>
                ) : (
                  <List dense>
                    {sessions.slice(0, 5).map((session) => (
                      <ListItem
                        key={session.id}
                        button
                        selected={activeSession?.id === session.id}
                        onClick={() => handleSessionSelect(session)}
                      >
                        <ListItemText
                          primary={session.title ?? `Session ${session.id}`}
                          secondary={
                            session.last_interaction_at
                              ? `Updated ${formatDistanceToNow(new Date(session.last_interaction_at), {
                                  addSuffix: true,
                                })}`
                              : 'No activity yet'
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<HistoryIcon />}
                  onClick={() => sessions[0] && handleSessionSelect(sessions[0])}
                  disabled={sessions.length === 0}
                >
                  Open latest session
                </Button>
                <Button size="small" onClick={() => setIsCollapsed(false)}>
                  View all
                </Button>
              </CardActions>
            </Card>
          )}

          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <CleaningServicesIcon color="primary" />
                <Typography variant="subtitle1">Quality Highlights</Typography>
              </Stack>
              {recentQualityIssues.length === 0 ? (
                <Alert severity="success" icon={<AutoAwesomeIcon />}>
                  No outstanding cleaning issues detected.
                </Alert>
              ) : (
                <List dense>
                  {recentQualityIssues.slice(0, 4).map((item, index) => (
                    <ListItem key={`${item.sheet}-${index}`}>
                      <ListItemText
                        primary={item.issue}
                        secondary={`Sheet: ${item.sheet}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              {dataQualityDisclaimer && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {dataQualityDisclaimer}
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <HistoryIcon color="primary" />
                <Typography variant="subtitle1">Recent AI Query</Typography>
              </Stack>
              {lastQuery ? (
                <>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {lastQuery.query}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lastQuery.created_at
                      ? formatDistanceToNow(new Date(lastQuery.created_at), { addSuffix: true })
                      : 'Just now'}
                  </Typography>
                  {latestResults && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Returned {latestResults.row_count.toLocaleString()} rows across {latestResults.columns?.length ?? 0} columns.
                    </Alert>
                  )}
                </>
              ) : (
                <Alert severity="info">
                  No queries yet. Ask the AI assistant to generate insights.
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <QueryStatsIcon color="primary" />
                <Typography variant="subtitle1">Visualization Summary</Typography>
              </Stack>
              {sharedViz && sharedViz.length > 0 ? (
                <>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {sharedViz.length} visualization{sharedViz.length > 1 ? 's' : ''} ready.
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Stack spacing={1}>
                    {sharedViz.slice(0, 3).map((viz, index) => (
                      <Typography key={index} variant="body2">
                        • {viz.title || viz.type}
                      </Typography>
                    ))}
                  </Stack>
                </>
              ) : (
                <Alert severity="info">
                  Run an AI query to generate visualizations.
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <TimelapseIcon color="primary" />
                <Typography variant="subtitle1">Quick Actions</Typography>
              </Stack>
              <Stack spacing={1}>
                <Button variant="outlined" onClick={onOpenUploadModal} startIcon={<UploadFileIcon />}>
                  Upload another file
                </Button>
                {latestResults && (
                  <Button
                    variant="outlined"
                    onClick={() => setIsCollapsed(false)}
                    startIcon={<QueryStatsIcon />}
                  >
                    Review latest results
                  </Button>
                )}
                <Button
                  variant="outlined"
                  onClick={() => setIsCollapsed(false)}
                  startIcon={<FolderSharedIcon />}
                  disabled={!selectedFileId}
                >
                  View upload history
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  startIcon={<AutoAwesomeIcon />}
                >
                  Ask a new AI question
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
};

export default ToolsPanel;

