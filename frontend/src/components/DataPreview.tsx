import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  TableChart as TableIcon,
  Analytics as StatsIcon,
  Info as InfoIcon,
  Timeline as ChartIcon,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';
import DataVisualization from './DataVisualization';

interface DataPreviewProps {
  fileId: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const DataPreview: React.FC<DataPreviewProps> = ({ fileId }) => {
  const [tabValue, setTabValue] = useState(0);
  const [previewRows, setPreviewRows] = useState(10);

  const { data: fileData, isLoading: fileLoading, error: fileError } = useQuery(
    ['file', fileId],
    () => apiService.getFile(fileId),
    { enabled: !!fileId }
  );

  const { data: previewData, isLoading: previewLoading, error: previewError, refetch: refetchPreview } = useQuery(
    ['preview', fileId, previewRows],
    () => apiService.getFilePreview(fileId, { rows: previewRows }),
    { enabled: !!fileId }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? value.toString() : value.toFixed(2);
    }
    return String(value);
  };

  const getColumnTypeColor = (dtype: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (dtype.toLowerCase()) {
      case 'int64':
      case 'integer':
        return 'primary';
      case 'float64':
      case 'float':
        return 'secondary';
      case 'object':
      case 'string':
        return 'default';
      case 'datetime64[ns]':
      case 'datetime':
        return 'info';
      case 'bool':
      case 'boolean':
        return 'success';
      default:
        return 'default';
    }
  };

  if (fileLoading || previewLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, minHeight: 200 }}>
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading preview data...
        </Typography>
      </Box>
    );
  }

  if (fileError || previewError) {
    const errorMessage = (fileError as any)?.message || (previewError as any)?.message;
    toast.error(`Failed to load file data: ${errorMessage}`);
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Failed to load preview data
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {errorMessage}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            if (refetchPreview) refetchPreview();
          }}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  if (!fileData) {
    return (
      <Alert severity="info">
        No file data available. Please upload and select a file to view preview.
      </Alert>
    );
  }

  if (!previewData) {
    return (
      <Alert severity="warning">
        No preview data available. The file might be empty or still processing.
      </Alert>
    );
  }

  const { processed_data } = fileData;
  const { dataframe_info, numeric_stats, column_analysis } = processed_data || {};

  // Extract data with multiple fallback strategies
  const getColumns = () => {
    return fileData?.processed_data?.dataframe_info?.columns ||
           previewData?.columns ||
           [];
  };

  const getSampleData = () => {
    return previewData?.data || fileData?.processed_data?.preview_rows || [];
  };

  const getColumnAnalysis = () => {
    return fileData?.processed_data?.column_analysis || {};
  };

  const getNumericStats = () => {
    return fileData?.processed_data?.numeric_stats || {};
  };

  const columns = getColumns();
  const sampleData = getSampleData();
  const columnAnalysis = getColumnAnalysis();
  const numericStats = getNumericStats();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Data Analysis: {fileData.original_filename || fileData.filename}
        </Typography>
        <Chip
          label={`${fileData.total_rows?.toLocaleString() || sampleData.length} rows × ${columns.length} columns`}
          size="small"
          variant="outlined"
        />
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="data analysis tabs" variant="scrollable">
          <Tab icon={<TableIcon />} label="Data Preview" />
          <Tab icon={<StatsIcon />} label="Statistics" />
          <Tab icon={<InfoIcon />} label="Column Info" />
          <Tab icon={<ChartIcon />} label="Visualization" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Showing {Math.min(sampleData.length, previewRows)} of {fileData.total_rows?.toLocaleString() || sampleData.length} rows
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Rows to preview</InputLabel>
            <Select
              value={previewRows}
              label="Rows to preview"
              onChange={(e) => setPreviewRows(Number(e.target.value))}
            >
              <MenuItem value={5}>5 rows</MenuItem>
              <MenuItem value={10}>10 rows</MenuItem>
              <MenuItem value={25}>25 rows</MenuItem>
              <MenuItem value={50}>50 rows</MenuItem>
              <MenuItem value={100}>100 rows</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {columns.length > 0 && sampleData.length > 0 ? (
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                  {columns.map((column: string, index: number) => (
                    <TableCell key={index} sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {sampleData.slice(0, previewRows).map((row: any, rowIndex: number) => (
                  <TableRow key={rowIndex} sx={{ '&:nth-of-type(odd)': { backgroundColor: 'rgba(0,0,0,0.02)' } }}>
                    {columns.map((column: string, colIndex: number) => (
                      <TableCell key={colIndex}>
                        {formatValue(row[column])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">
            No data available to preview. The dataset might be empty or still processing.
          </Alert>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {Object.keys(numericStats).length > 0 ? (
          <Grid container spacing={3}>
            {Object.entries(numericStats).map(([column, stats]: [string, any]) => (
              <Grid item xs={12} md={6} lg={4} key={column}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                      {column}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Mean
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatValue(stats.mean)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Median
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatValue(stats.median)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Std Dev
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatValue(stats.std)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Min
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatValue(stats.min)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Max
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatValue(stats.max)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Count
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {stats.count?.toLocaleString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            No numeric statistics available. This could be because the dataset has no numeric columns or the statistics haven't been calculated yet.
          </Alert>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {Object.keys(columnAnalysis).length > 0 ? (
          <Grid container spacing={2}>
            {Object.entries(columnAnalysis).map(([column, analysis]: [string, any]) => (
              <Grid item xs={12} md={6} key={column}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        {column}
                      </Typography>
                      <Chip
                        label={analysis.dtype || analysis.detected_data_type}
                        size="small"
                        color={getColumnTypeColor(analysis.dtype || analysis.detected_data_type)}
                      />
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Unique Values
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {analysis.unique_count?.toLocaleString() || analysis.unique_values_count?.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Null Count
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {analysis.null_count?.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Null %
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatValue(analysis.null_percentage)}%
                      </Typography>
                    </Box>

                    {analysis.is_numeric && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Numeric Properties
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
                          <Typography variant="body2">Mean: {formatValue(analysis.mean)}</Typography>
                          <Typography variant="body2">Std: {formatValue(analysis.std)}</Typography>
                        </Box>
                      </Box>
                    )}

                    {analysis.is_categorical && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Sample Values
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            {typeof analysis.unique_values === 'string'
                              ? analysis.unique_values
                              : analysis.unique_values?.slice(0, 3).join(', ') +
                                (analysis.unique_values?.length > 3 ? '...' : '')
                            }
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            No column analysis available. Column analysis provides detailed information about each column's data type, null values, and other properties.
          </Alert>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {sampleData.length > 0 && columns.length > 0 ? (
          <DataVisualization
            data={sampleData}
            columns={columns}
            numericColumns={
              columns.filter((col: string) => {
                const colAnalysisData = columnAnalysis[col];
                return colAnalysisData?.is_numeric ||
                       colAnalysisData?.dtype?.includes('int') ||
                       colAnalysisData?.dtype?.includes('float') ||
                       colAnalysisData?.dtype === 'float64' ||
                       colAnalysisData?.dtype === 'int64';
              })
            }
          />
        ) : (
          <Alert severity="info">
            No data available for visualization. Please ensure your dataset has both columns and sample data.
          </Alert>
        )}
      </TabPanel>
    </Box>
  );
};

export default DataPreview;