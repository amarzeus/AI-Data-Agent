import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Fullscreen,
  FullscreenExit,
  Download,
} from '@mui/icons-material';

interface VizConfig {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'radar' | 'funnel' | 'table';
  xAxis?: string;
  yAxis?: string;
  data: any[];
  title: string;
  disclaimer?: string;
  columns?: any[];
}

interface QueryResultsVizProps {
  vizConfigs: VizConfig[];
  disclaimer?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const QueryResultsViz: React.FC<QueryResultsVizProps> = ({
  vizConfigs,
  disclaimer,
}) => {
  const [fullscreenChart, setFullscreenChart] = useState<VizConfig | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const handleFullscreen = (config: VizConfig) => {
    setFullscreenChart(config);
  };

  const handleCloseFullscreen = () => {
    setFullscreenChart(null);
  };

  const handleExportChart = (config: VizConfig) => {
    // Export functionality would be implemented here
    console.log('Export chart:', config.title);
  };

  const renderChart = (config: VizConfig) => {
    const { type, data, xAxis, yAxis } = config;

    if (!data || data.length === 0) {
      return (
        <Alert severity="info">
          No data available for visualization.
        </Alert>
      );
    }

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis || 'x'} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey={yAxis || 'y'} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis || 'x'} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey={yAxis || 'y'} stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis || 'x'} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Area type="monotone" dataKey={yAxis || 'y'} stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={yAxis || 'value'}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid />
              <XAxis type="number" dataKey={xAxis} name={xAxis} />
              <YAxis type="number" dataKey={yAxis} name={yAxis} />
              <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name={`${xAxis} vs ${yAxis}`} dataKey={yAxis} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        );


      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey={xAxis || 'x'} />
              <PolarRadiusAxis />
              <Radar name={yAxis || 'y'} dataKey={yAxis || 'y'} stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <RechartsTooltip />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'funnel':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="horizontal" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey={xAxis || 'x'} type="category" width={100} />
              <RechartsTooltip />
              <Bar dataKey={yAxis || 'y'} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'table':
        const columns = Object.keys(data[0] || {});
        return (
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell key={col} sx={{ fontWeight: 'bold' }}>
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.slice(0, 100).map((row, index) => (
                  <TableRow key={index}>
                    {columns.map((col) => (
                      <TableCell key={col}>
                        {typeof row[col] === 'number' ? row[col].toFixed(2) : String(row[col])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      default:
        return (
          <Alert severity="warning">
            Unsupported visualization type: {type}
          </Alert>
        );
    }
  };

  if (!vizConfigs || vizConfigs.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      {disclaimer && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {disclaimer}
        </Alert>
      )}

      {vizConfigs.map((config, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {config.title}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Toggle fullscreen">
                  <IconButton
                    size="small"
                    onClick={() => handleFullscreen(config)}
                  >
                    <Fullscreen />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Export chart">
                  <IconButton
                    size="small"
                    onClick={() => handleExportChart(config)}
                  >
                    <Download />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            {renderChart(config)}

            {config.disclaimer && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {config.disclaimer}
              </Typography>
            )}

            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
              <Chip size="small" label={config.type} color="primary" variant="outlined" />
              <Chip size="small" label={`${config.data?.length || 0} data points`} variant="outlined" />
            </Stack>
          </CardContent>
        </Card>
      ))}

      {/* Fullscreen Dialog */}
      <Dialog
        open={!!fullscreenChart}
        onClose={handleCloseFullscreen}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        {fullscreenChart && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{fullscreenChart.title}</Typography>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Export chart">
                    <IconButton onClick={() => handleExportChart(fullscreenChart)}>
                      <Download />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Close fullscreen">
                    <IconButton onClick={handleCloseFullscreen}>
                      <FullscreenExit />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              <Box sx={{ height: '100%', p: 2 }}>
                {renderChart(fullscreenChart)}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default QueryResultsViz;
