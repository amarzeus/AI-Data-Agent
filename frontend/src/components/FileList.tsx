import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { apiService, FileInfo } from '../services/apiService';

interface FileListProps {
  onFileSelect: (fileId: number) => void;
}

const FileList: React.FC<FileListProps> = ({ onFileSelect }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileInfo | null>(null);
  const queryClient = useQueryClient();

  const { data: filesResponse, isLoading, error, refetch } = useQuery(
    ['files'],
    () => apiService.getFiles(),
    {
      refetchInterval: 5000, // Refetch every 5 seconds
    }
  );

  const deleteMutation = useMutation(apiService.deleteFile, {
    onSuccess: (response) => {
      toast.success(`File "${response.filename}" deleted successfully`);
      queryClient.invalidateQueries(['files']);
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to delete file: ${error.message}`);
    },
  });

  const handleDeleteClick = (file: FileInfo) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (fileToDelete) {
      deleteMutation.mutate(fileToDelete.id);
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('File list refreshed');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'failed':
      case 'error':
        return 'error';
      case 'processing':
        return 'info';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load files: {(error as any).message}
        <Button size="small" onClick={handleRefresh} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  const files = filesResponse?.files || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Uploaded Files ({files.length})
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          size="small"
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      {files.length === 0 ? (
        <Alert severity="info">
          No files uploaded yet. Upload an Excel file to get started.
        </Alert>
      ) : (
        <List>
          {files.map((file) => (
            <ListItem
              key={file.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                backgroundColor: 'background.paper',
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">{file.original_filename}</Typography>
                    <Chip
                      label={file.status}
                      size="small"
                      color={getStatusColor(file.status)}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Size: {formatFileSize(file.file_size)} •
                      Rows: {file.total_rows.toLocaleString()} •
                      Columns: {file.total_columns}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Uploaded: {formatDate(file.created_at || '')}
                      {file.processed_at && (
                        <> • Processed: {formatDate(file.processed_at)}</>
                      )}
                    </Typography>
                    {file.processing_time_seconds && (
                      <Typography variant="body2" color="text.secondary">
                        Processing time: {file.processing_time_seconds.toFixed(2)}s
                      </Typography>
                    )}
                    {file.error_message && (
                      <Typography variant="body2" color="error">
                        Error: {file.error_message}
                      </Typography>
                    )}
                  </Box>
                }
              />

              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="view"
                  onClick={() => onFileSelect(file.id)}
                  color="primary"
                >
                  <ViewIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDeleteClick(file)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{fileToDelete?.original_filename}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileList;