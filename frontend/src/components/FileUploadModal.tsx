import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import DragDropUpload from './DragDropUpload';

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploadSuccess: (fileId: number) => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  open,
  onClose,
  onUploadSuccess,
}) => {
  const handleUploadSuccess = (fileId: number) => {
    onUploadSuccess(fileId);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '400px',
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUpload color="primary" />
          <Typography variant="h6" component="div">
            Upload Excel File
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Upload your Excel file (.xlsx or .xls) for AI-powered analysis. The system will automatically clean and process your data.
            </Typography>

            <Box sx={{ mb: 3 }}>
              <DragDropUpload onUploadSuccess={handleUploadSuccess} />
            </Box>
          </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileUploadModal;
