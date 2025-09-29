import React, { useState, useCallback, DragEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Fade,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachmentIcon from '@mui/icons-material/Attachment';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ReplayIcon from '@mui/icons-material/Replay';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/apiService';
import { useDataContext } from '../contexts/DataContext';

interface DragDropUploadProps {
  onUploadSuccess?: (fileId: number, metadata?: any) => void;
  onUploadError?: (error: string) => void;
  maxSize?: number;
  multiple?: boolean;
}

const DragDropUpload: React.FC<DragDropUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  maxSize = 50,
  multiple = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);
  const [lastUploadedAt, setLastUploadedAt] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { setActiveFileId } = useDataContext();

  const handleDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    setProgress(0);
    setFileName(file.name);
    const uploadStart = performance.now();

    try {
      const result = await apiService.uploadFile(file, (event) => {
        if (event.total) {
          setProgress(Math.round((event.loaded / event.total) * 100));
          const elapsed = (performance.now() - uploadStart) / 1000;
          if (elapsed > 0) {
            setUploadSpeed((event.loaded / 1024 / 1024) / elapsed);
          }
        }
      });
      toast.success('File uploaded successfully!');
      setActiveFileId?.(result.file_id);
      onUploadSuccess?.(result.file_id, result.cleaning_metadata);
      setLastUploadedAt(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      toast.error('Upload failed');
      onUploadError?.(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUploadSuccess, onUploadError, setActiveFileId]);

  const handleDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        await uploadFile(file);
      } else {
        setError('Please upload only Excel files (.xlsx, .xls)');
      }
    }
  }, [uploadFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleClick = () => {
    document.getElementById('file-input')?.click();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  const renderUploadMeta = () => {
    if (!fileName && !lastUploadedAt) {
      return null;
    }

    return (
      <Fade in>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mt: 2 }}>
          {fileName && (
            <Chip
              size="small"
              color="primary"
              label={`Last file: ${fileName}`}
              sx={{ maxWidth: '100%' }}
            />
          )}
          {typeof uploadSpeed === 'number' && uploadSpeed > 0 && (
            <Chip
              size="small"
              label={`Avg speed: ${uploadSpeed.toFixed(2)} MB/s`}
              variant="outlined"
            />
          )}
          {lastUploadedAt && (
            <Chip size="small" label={`Updated ${lastUploadedAt}`} variant="outlined" />
          )}
        </Stack>
      </Fade>
    );
  };

  return (
    <Box
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      sx={{ cursor: uploading ? 'wait' : 'pointer' }}
      tabIndex={uploading ? -1 : 0}
      role="button"
      aria-label="Upload Excel files"
      onKeyDown={handleKeyDown}
    >
      <Paper
        variant="outlined"
        sx={{
          p: 4,
          textAlign: 'center',
          border: isDragging ? `2px dashed ${theme.palette.primary.main}` : '2px dashed #e0e0e0',
          backgroundColor: isDragging ? theme.palette.action.hover : 'transparent',
          transition: 'all 0.2s ease',
          borderRadius: 2,
          position: 'relative',
          minHeight: isMobile ? 200 : 250,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CloudUploadIcon
            sx={{
              fontSize: 64,
              color: isDragging ? 'primary.main' : 'grey.400',
              transition: 'transform 0.2s ease',
              transform: uploading ? 'scale(1.05)' : 'scale(1)',
            }}
          />

          <Stack spacing={0.5} alignItems="center">
            <Typography variant="h6">
              {isDragging ? 'Drop your files here' : 'Drag & drop Excel files here'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Support for .xlsx, .xls up to {maxSize}MB
              {multiple && ' • Multiple files allowed'}
            </Typography>
          </Stack>

          <Stack direction={isMobile ? 'column' : 'row'} spacing={1} alignItems="center">
            <Button
              onClick={handleClick}
              disabled={uploading}
              startIcon={<AttachmentIcon />}
              variant="outlined"
            >
              Browse files
            </Button>
            <Tooltip title="Retry last upload" disableHoverListener={!error}>
              <span>
                <Button
                  disabled={!error || uploading || !fileName}
                  startIcon={<ReplayIcon />}
                  onClick={() => {
                    if (fileName) {
                      toast('Pick a file to retry upload', { icon: '📂' });
                      handleClick();
                    }
                  }}
                >
                  Retry
                </Button>
              </span>
            </Tooltip>
          </Stack>

          {uploading && (
            <Box sx={{ width: '100%' }}>
              <LinearProgress variant={progress ? 'determinate' : 'indeterminate'} value={progress} />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Uploading… {progress ? `${progress}%` : ''}
              </Typography>
            </Box>
          )}
        </Stack>

        {renderUploadMeta()}

        {!uploading && !error && fileName && lastUploadedAt && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
            <TaskAltIcon color="success" fontSize="small" />
            <Typography variant="body2" color="success.main">
              Upload complete! Your latest file is ready for exploration.
            </Typography>
          </Stack>
        )}

        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls"
          multiple={multiple}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </Paper>

      {error && (
        <Alert
          severity="error"
          icon={<ErrorOutlineIcon fontSize="small" />}
          sx={{ mt: 2 }}
          action={(
            <Button size="small" startIcon={<ReplayIcon />} onClick={handleClick} disabled={uploading}>
              Try again
            </Button>
          )}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default DragDropUpload;
