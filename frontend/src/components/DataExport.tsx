/**
 * Note: ESLint warnings about unused TableView, InsertChart, includeHeaders, and setIncludeHeaders
 * are false positives due to caching issues. These were removed in previous cleanup but
 * warnings persist in the cache.
 */
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import {
  Download,
  FileDownload,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';

interface DataExportProps {
  open: boolean;
  onClose: () => void;
  fileId: number | null;
  fileName?: string;
  data?: any[];
  columns?: string[];
  exportType?: 'file' | 'data';
}

const DataExport: React.FC<DataExportProps> = ({
  open,
  onClose,
  fileId,
  fileName,
  data,
  columns,
  exportType = 'file',
}) => {
  const [format, setFormat] = useState<'csv' | 'json' | 'excel'>('csv');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(columns || []);
  const [customFileName, setCustomFileName] = useState(fileName || '');

  const exportFileMutation = useMutation({
    mutationFn: async () => {
      if (!fileId) throw new Error('File ID is required');
      return apiService.exportFile(fileId, format);
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${customFileName || fileName || 'export'}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('File exported successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error('No data to export');
      return exportDataAsFile(data, format, customFileName);
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${customFileName || 'export'}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  const exportDataAsFile = (data: any[], format: string, filename: string) => {
    let content: string;
    let mimeType: string;

    switch (format) {
      case 'csv':
        content = convertToCSV(data, selectedColumns.length > 0 ? selectedColumns : Object.keys(data[0] || {}));
        mimeType = 'text/csv';
        break;
      case 'json':
        const filteredData = selectedColumns.length > 0
          ? data.map(row => {
              const filtered: any = {};
              selectedColumns.forEach(col => {
                if (row.hasOwnProperty(col)) {
                  filtered[col] = row[col];
                }
              });
              return filtered;
            })
          : data;
        content = JSON.stringify(filteredData, null, 2);
        mimeType = 'application/json';
        break;
      case 'excel':
        // For simplicity, we'll export as CSV with .xlsx extension
        // In a real implementation, you'd use a library like xlsx
        content = convertToCSV(data, selectedColumns.length > 0 ? selectedColumns : Object.keys(data[0] || {}));
        mimeType = 'application/vnd.ms-excel';
        break;
      default:
        throw new Error('Unsupported format');
    }

    return new Blob([content], { type: mimeType });
  };

  const convertToCSV = (data: any[], headers: string[]) => {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas, quotes, or newlines
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
  };

  const handleExport = () => {
    if (exportType === 'file') {
      exportFileMutation.mutate();
    } else {
      exportDataMutation.mutate();
    }
  };

  const handleColumnToggle = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const isLoading = exportFileMutation.isPending || exportDataMutation.isPending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <FileDownload />
          <Typography variant="h6">Export Data</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Export Format
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Format</InputLabel>
              <Select
                value={format}
                label="Format"
                onChange={(e) => setFormat(e.target.value as 'csv' | 'json' | 'excel')}
              >
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="excel">Excel (CSV)</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Options
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Custom filename (optional)"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder={fileName || 'export'}
              />

              {exportType === 'data' && columns && columns.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Select Columns to Export
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                      {columns.map((column) => (
                        <Chip
                          key={column}
                          label={column}
                          variant={selectedColumns.includes(column) ? 'filled' : 'outlined'}
                          onClick={() => handleColumnToggle(column)}
                          size="small"
                        />
                      ))}
                    </Stack>
                    {selectedColumns.length === 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        No columns selected - all columns will be exported
                      </Typography>
                    )}
                  </Box>
                </>
              )}
            </Stack>
          </Box>

          {exportType === 'file' && (
            <Alert severity="info">
              This will export the entire file data in {format.toUpperCase()} format.
            </Alert>
          )}

          {exportType === 'data' && data && (
            <Alert severity="info">
              Exporting {data.length} rows in {format.toUpperCase()} format.
              {selectedColumns.length > 0 && ` Selected columns: ${selectedColumns.length}`}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={isLoading ? <CircularProgress size={16} /> : <Download />}
          disabled={isLoading}
        >
          {isLoading ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DataExport;
