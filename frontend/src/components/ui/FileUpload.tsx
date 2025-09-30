import React, { useCallback, useState } from 'react'
import { Typography, Button, LinearProgress, Alert, IconButton } from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { apiService } from '../../services/apiService'
import { FileMetadata } from '../../types'

interface FileUploadProps {
  onUploadError?: (error: string) => void
  onUploadSuccess?: (file: FileMetadata) => void
  className?: string
  acceptedFileTypes?: string[]
  maxFileSize?: number // in MB
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadError,
  onUploadSuccess,
  className = '',
  acceptedFileTypes = ['.xlsx', '.xls', '.csv'],
  maxFileSize = 50 // 50MB default
}) => {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [_uploadedFile, setUploadedFile] = useState<FileMetadata | null>(null) // eslint-disable-line @typescript-eslint/no-unused-vars

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      const error = `File size must be less than ${maxFileSize}MB`
      setErrorMessage(error)
      setUploadStatus('error')
      onUploadError?.(error)
      return
    }

    setUploadStatus('uploading')
    setUploadProgress(0)
    setErrorMessage('')
    setUploadedFileName(file.name)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const uploadedFileData = await apiService.uploadFile(file)
      setUploadedFile(uploadedFileData)

      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadStatus('success')

      // Call success callback
      onUploadSuccess?.(uploadedFileData)

      // Reset after success
      setTimeout(() => {
        setUploadStatus('idle')
        setUploadProgress(0)
        setUploadedFileName('')
        setUploadedFile(null)
      }, 3000)

      onUploadError?.('') // Clear any previous errors

    } catch (error: any) {
      setUploadStatus('error')
      setErrorMessage(error.message || 'Upload failed')
      onUploadError?.(error.message || 'Upload failed')
    }
  }, [maxFileSize, onUploadError, onUploadSuccess])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false,
    maxSize: maxFileSize * 1024 * 1024,
    noClick: true, // We'll handle click manually
    noKeyboard: true // We'll handle keyboard manually
  })

  const resetUpload = () => {
    setUploadStatus('idle')
    setUploadProgress(0)
    setErrorMessage('')
    setUploadedFileName('')
  }

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'success':
        return <SuccessIcon sx={{ fontSize: 48, color: 'success.main' }} />
      case 'error':
        return <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />
      default:
        return <UploadIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.7 }} />
    }
  }

  const getStatusColor = () => {
    if (isDragReject) return 'error.main'
    if (isDragActive) return 'success.main'
    return uploadStatus === 'error' ? 'error.main' : 'primary.main'
  }

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className="file-drop-zone"
        style={{
          border: `2px dashed ${getStatusColor}`,
          borderRadius: '16px',
          padding: '32px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive
            ? 'rgba(99, 102, 241, 0.05)'
            : 'transparent',
          transition: 'all 0.3s ease',
          position: 'relative',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <input {...getInputProps()} />
        <div
          style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <AnimatePresence mode="wait">
          {uploadStatus === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {getStatusIcon()}
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                {isDragActive ? 'Drop your file here' : 'Upload Excel File'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Drag and drop your Excel file here, or click to browse
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supported formats: {acceptedFileTypes.join(', ')} (Max: {maxFileSize}MB)
              </Typography>
            </motion.div>
          )}

          {uploadStatus === 'uploading' && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                Uploading {uploadedFileName}
              </Typography>
              <div className="progress-container">
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: 'linear-gradient(90deg, #6366f1 0%, #ec4899 100%)'
                    }
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {uploadProgress}% uploaded
                </Typography>
              </div>
            </motion.div>
          )}

          {uploadStatus === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <SuccessIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="success.main" sx={{ mb: 1 }}>
                Upload Successful!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {uploadedFileName} has been processed
              </Typography>
            </motion.div>
          )}

          {uploadStatus === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <ErrorIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
              <Typography variant="h6" color="error.main" sx={{ mb: 1 }}>
                Upload Failed
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {errorMessage}
              </Typography>
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* Reset button for error/success states */}
        {(uploadStatus === 'error' || uploadStatus === 'success') && (
          <IconButton
            onClick={resetUpload}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.2)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {errorMessage && uploadStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Alert
              severity="error"
              sx={{ mt: 2, borderRadius: 2 }}
              onClose={() => setErrorMessage('')}
            >
              {errorMessage}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alternative upload button */}
      {uploadStatus === 'idle' && (
        <div className="upload-button-container">
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 4
            }}
          >
            Or browse files
          </Button>
        </div>
      )}
    </div>
  )
}

export default FileUpload
