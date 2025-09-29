import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TableViewIcon from '@mui/icons-material/TableView';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useDataContext } from '../contexts/DataContext';
import DataPreview from './DataPreview';
import QueryResultsViz from './QueryResultsViz';
import DataCleaningReport from './DataCleaningReport';
import DataVisualization from './DataVisualization';
import DataExport from './DataExport';

const TAB_KEYS = ['preview', 'viz', 'clean', 'export'] as const;
type PlaygroundTab = (typeof TAB_KEYS)[number];

interface PlaygroundAreaProps {
  selectedFileId: number | null;
  fileName?: string;
  onOpenUploadModal?: () => void;
}

const PlaygroundArea: React.FC<PlaygroundAreaProps> = ({ selectedFileId, fileName, onOpenUploadModal }) => {
  const {
    fileDetail,
    sharedViz,
    dataQualityDisclaimer,
    latestResults,
  } = useDataContext();

  const [activeTab, setActiveTab] = useState<PlaygroundTab>('preview');
  const [exportOpen, setExportOpen] = useState(false);

  const numericColumns = useMemo(() => {
    if (!fileDetail?.processed_data?.column_analysis) {
      return [];
    }
    return Object.entries(fileDetail.processed_data.column_analysis)
      .filter(([, analysis]) => {
        const dtype = (analysis as any)?.dtype || (analysis as any)?.detected_data_type;
        return typeof dtype === 'string' && /(int|float|double|numeric|decimal)/i.test(dtype);
      })
      .map(([columnName]) => columnName);
  }, [fileDetail?.processed_data?.column_analysis]);

  const columns = useMemo(() => {
    return (
      fileDetail?.processed_data?.dataframe_info?.columns ||
      fileDetail?.processed_data?.preview_columns ||
      []
    );
  }, [fileDetail?.processed_data?.dataframe_info?.columns, fileDetail?.processed_data?.preview_columns]);

  const latestDataSample = useMemo(() => {
    if (latestResults?.data && latestResults.data.length > 0) {
      return latestResults.data;
    }
    return fileDetail?.processed_data?.preview_rows || [];
  }, [latestResults?.data, fileDetail?.processed_data?.preview_rows]);

  const handleRefresh = () => {
    if (!selectedFileId) {
      onOpenUploadModal?.();
      return;
    }
    // No direct refresh endpoint here; rely on global queries triggered from parent.
  };

  const renderNoFileState = () => (
    <Alert severity="info" icon={<InfoOutlinedIcon />}>
      Upload an Excel file and run an AI query to see results in the playground.
      </Alert>
  );

  const renderPreviewTab = () => {
    if (!selectedFileId) {
      return renderNoFileState();
    }
    return <DataPreview fileId={selectedFileId} />;
  };

  const renderVisualizationTab = () => {
    if (sharedViz && sharedViz.length > 0) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {latestResults && (
            <Alert severity="success">
              Latest AI query returned {latestResults.row_count.toLocaleString()} rows.
              {latestResults.columns && latestResults.columns.length > 0 &&
                ` Columns: ${latestResults.columns.map((col) => col.name).join(', ')}`}
            </Alert>
          )}
          <QueryResultsViz vizConfigs={sharedViz as any} disclaimer={dataQualityDisclaimer} />
        </Box>
      );
    }

    if (!selectedFileId) {
      return renderNoFileState();
    }

    if (!columns || columns.length === 0 || latestDataSample.length === 0) {
  return (
            <Alert severity="info">
          Upload data and run a query to unlock visualizations.
            </Alert>
      );
    }

  return (
      <DataVisualization
        data={latestDataSample}
        columns={columns}
        numericColumns={numericColumns}
      />
    );
  };

  const renderCleaningTab = () => {
    if (!selectedFileId || !fileDetail?.cleaning_metadata) {
  return (
        <Alert severity="info">
          Upload a dataset to see automated cleaning insights and quality reports.
        </Alert>
      );
    }
    return <DataCleaningReport />;
  };

  const renderExportTab = () => {
    if (!selectedFileId || !fileDetail) {
      return renderNoFileState();
    }

  return (
      <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
            Export Data
                  </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Download the processed dataset or the latest query result.
                      </Typography>
          <Stack direction="row" spacing={2}>
                                  <Chip
              icon={<TableViewIcon />}
              label="Export entire dataset"
              onClick={() => setExportOpen(true)}
            />
            {latestResults && (
              <Chip
                icon={<AutoAwesomeIcon />}
                label="Export latest query result"
                                    variant="outlined"
                onClick={() => setExportOpen(true)}
              />
                                )}
                              </Stack>
                            </CardContent>
                          </Card>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'preview':
        return renderPreviewTab();
      case 'viz':
        return renderVisualizationTab();
      case 'clean':
        return renderCleaningTab();
      case 'export':
        return renderExportTab();
      default:
        return null;
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
    <Box>
          <Typography variant="h6">Data Playground</Typography>
          <Typography variant="caption" color="text.secondary">
            Explore insights, visualizations, and cleaning results.
            {fileName ? ` Working with ${fileName}.` : ''}
      </Typography>
                  </Box>
        <Tooltip title="Refresh" placement="left">
          <span>
            <IconButton onClick={handleRefresh} disabled={!selectedFileId}>
              <RefreshIcon />
                        </IconButton>
          </span>
        </Tooltip>
                  </Stack>

      {dataQualityDisclaimer && (
        <Alert severity="warning" icon={<CleaningServicesIcon />}>
          {dataQualityDisclaimer}
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab value="preview" icon={<TableViewIcon />} iconPosition="start" label="Preview" />
        <Tab value="viz" icon={<AssessmentIcon />} iconPosition="start" label="Visualizations" />
        <Tab value="clean" icon={<CleaningServicesIcon />} iconPosition="start" label="Cleaning" />
        <Tab value="export" icon={<AutoAwesomeIcon />} iconPosition="start" label="Export" />
      </Tabs>

      <Divider />

      <Box sx={{ flexGrow: 1, overflow: 'auto' }} className="scrollbar-thin">
        {renderActiveTab()}
                    </Box>

      <DataExport
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        fileId={selectedFileId}
        fileName={fileName}
        data={latestDataSample}
        columns={columns}
        exportType={latestResults ? 'data' : 'file'}
      />
    </Box>
  );
};

export default PlaygroundArea;
