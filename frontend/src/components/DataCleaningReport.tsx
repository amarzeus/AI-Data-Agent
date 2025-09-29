import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material';
import { useDataContext } from '../contexts/DataContext';

const DataCleaningReport: React.FC = () => {
  const { fileMetadata } = useDataContext();

  if (!fileMetadata?.cleaning_metadata) {
    return (
      <Alert severity="info">
        No cleaning report available. Upload a file to see data quality information.
      </Alert>
    );
  }

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const getQualityIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle />;
    if (score >= 0.6) return <Warning />;
    return <Error />;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Data Cleaning Report
      </Typography>

      {Object.entries(fileMetadata.cleaning_metadata).map(([sheetName, metadata]: [string, any]) => (
        <Accordion key={sheetName} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <Typography variant="subtitle1">{sheetName}</Typography>
              <Chip
                label={`Quality: ${(metadata.quality_score * 100).toFixed(1)}%`}
                color={getQualityColor(metadata.quality_score)}
                size="small"
                icon={getQualityIcon(metadata.quality_score)}
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                {metadata.original_row_count} rows → {metadata.cleaned_row_count} rows
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Original Rows:</strong> {metadata.original_row_count}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Cleaned Rows:</strong> {metadata.cleaned_row_count}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Rows Removed:</strong> {metadata.rows_removed}
              </Typography>
            </Box>

            {metadata.issues && metadata.issues.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Issues Found:
                </Typography>
                <List dense>
                  {metadata.issues.map((issue: string, index: number) => (
                    <ListItem key={index}>
                      <ListItemText primary={issue} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {metadata.cleaning_steps && metadata.cleaning_steps.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Cleaning Steps Applied:
                </Typography>
                <List dense>
                  {metadata.cleaning_steps.map((step: string, index: number) => (
                    <ListItem key={index}>
                      <ListItemText primary={step} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default DataCleaningReport;
