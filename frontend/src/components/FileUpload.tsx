import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  LinearProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { apiService } from '../services/apiService';

interface FileUploadProps {
  onUploadSuccess: (fileId: number) => void;
}

interface UploadedFile {
  id: number;
  filename: string;
  original_filename: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  progress?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file, index) => ({
      id: Date.now() + index,
      filename: file.name,
      original_filename: file.name,
      size: file.size,
      status: 'uploading' as const,
      progress: 0,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setIsUploading(true);

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const fileId = newFiles[i].id;

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? { ...f, progress: Math.min((f.progress || 0) + 10, 90) }
                : f
            )
          );
        }, 100);

        const response = await apiService.uploadFile(file);

        clearInterval(progressInterval);

        // Update file status to success
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: 'success' as const,
                  progress: 100,
                  id: response.file_id,
                  filename: response.filename,
                  original_filename: response.filename,
                  size: response.size,
                }
              : f
          )
        );

        toast.success(`File "${file.name}" uploaded successfully!`);
        onUploadSuccess(response.file_id);

      } catch (error: any) {
        console.error('Upload error:', error);

        // Update file status to error
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: 'error' as const,
                  error: error.response?.data?.detail || error.message || 'Upload failed',
                }
              : f
          )
        );

        toast.error(`Failed to upload "${file.name}": ${error.response?.data?.detail || error.message || 'Unknown error'}`);
      }
    }

    setIsUploading(false);
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <FileIcon color="action" />;
    }
  };

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'uploading':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
          Upload Excel Files
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Drag and drop your Excel files here or click to browse
        </Typography>
      </Box>

      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'primary.50' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'primary.50',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)',
          },
        }}
      >
        <input {...getInputProps()} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <CloudUploadIcon
            sx={{
              fontSize: 48,
              color: isDragActive ? 'primary.main' : 'grey.400',
              mb: 2,
            }}
          />

          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop files here' : 'Drag & drop Excel files here'}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            or click to select files
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Chip label=".xlsx files" size="small" />
            <Chip label=".xls files" size="small" />
            <Chip label="Max 10MB" size="small" />
          </Box>
        </Box>
      </Paper>

      {fileRejections.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Invalid files:</Typography>
          <ul>
            {fileRejections.map(({ file, errors }: any) => (
              <li key={file.name}>
                {file.name}: {errors.map((e: any) => e.message).join(', ')}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {uploadedFiles.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 0.5 }}>
              Upload Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {uploadedFiles.filter(f => f.status === 'uploading').length} of {uploadedFiles.length} files uploading
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {uploadedFiles.map((file) => (
              <Paper key={file.id} elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flexShrink: 0 }}>
                    {getStatusIcon(file.status)}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.original_filename}
                      </Typography>
                      <Chip
                        label={file.status}
                        size="small"
                        color={getStatusColor(file.status)}
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {formatFileSize(file.size)}
                    </Typography>
                    {file.error && (
                      <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                        {file.error}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {file.status === 'uploading' && (
                  <Box sx={{ width: '100%', mt: 2 }}>
                    <LinearProgress variant="determinate" value={file.progress || 0} />
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;