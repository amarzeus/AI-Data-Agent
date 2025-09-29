import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  ButtonGroup,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  PieChart as PieChartIcon,
  ScatterPlot as ScatterIcon,
  TrendingUp as TrendIcon,
  Assessment as HistogramIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
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
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DataVisualizationProps {
  data: any[];
  columns: string[];
  numericColumns: string[];
  onExport?: (format: 'png' | 'svg' | 'csv') => void;
}

type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'histogram';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const DataVisualization: React.FC<DataVisualizationProps> = ({
  data,
  columns,
  numericColumns,
  onExport,
}: DataVisualizationProps) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [xColumn, setXColumn] = useState<string>('');
  const [yColumn, setYColumn] = useState<string>('');
  const [categoryColumn, setCategoryColumn] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [chartTitle, setChartTitle] = useState('');
  const [showLegend, setShowLegend] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [aggregationType, setAggregationType] = useState<'sum' | 'avg' | 'count' | 'min' | 'max'>('sum');

  // Export function
  const exportChart = (format: 'png' | 'svg' | 'csv') => {
    // TODO: Implement chart export functionality
    console.log(`Exporting chart as ${format}`);
    // For now, just show a message
    alert(`Chart export as ${format.toUpperCase()} - Feature coming soon!`);
  };

  // Pivot table data
  const pivotData = useMemo(() => {
    if (!data || data.length === 0 || !xColumn || !yColumn) return [];

    // Group by xColumn and aggregate yColumn
    const groupedData: any = {};
    data.forEach((row: any) => {
      const xValue = row[xColumn];
      const yValue = parseFloat(row[yColumn]) || 0;

      if (!groupedData[xValue]) {
        groupedData[xValue] = { [xColumn]: xValue, [yColumn]: 0 };
      }
      groupedData[xValue][yColumn] += yValue;
    });

    return Object.values(groupedData);
  }, [data, xColumn, yColumn]);

  // Initialize default columns
  React.useEffect(() => {
    if (columns.length > 0 && !xColumn) {
      setXColumn(columns[0]);
    }
    if (numericColumns.length > 0 && !yColumn) {
      setYColumn(numericColumns[0]);
    }
    if (columns.length > 1 && !categoryColumn) {
      setCategoryColumn(columns[1]);
    }
  }, [columns, numericColumns, xColumn, yColumn, categoryColumn]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    switch (chartType) {
      case 'bar':
      case 'line':
        if (!xColumn || !yColumn) return [];

        // Group by xColumn and aggregate yColumn
        const groupedData = data.reduce((acc: any, row: any) => {
          const xValue = row[xColumn];
          const yValue = parseFloat(row[yColumn]) || 0;

          if (!acc[xValue]) {
            acc[xValue] = { [xColumn]: xValue, [yColumn]: 0 };
          }
          acc[xValue][yColumn] += yValue;

          return acc;
        }, {});

        return Object.values(groupedData);

      case 'pie':
        if (!categoryColumn || !yColumn) return [];

        // Group by category and sum values
        const pieData = data.reduce((acc: any, row: any) => {
          const category = row[categoryColumn];
          const value = parseFloat(row[yColumn]) || 0;

          if (!acc[category]) {
            acc[category] = { [categoryColumn]: category, [yColumn]: 0 };
          }
          acc[category][yColumn] += value;

          return acc;
        }, {});

        return Object.values(pieData);

      case 'scatter':
        if (!xColumn || !yColumn) return [];

        // Use raw data points for scatter plot
        return data
          .filter((row) => {
            const xVal = parseFloat(row[xColumn]);
            const yVal = parseFloat(row[yColumn]);
            return !isNaN(xVal) && !isNaN(yVal);
          })
          .map((row) => ({
            [xColumn]: parseFloat(row[xColumn]),
            [yColumn]: parseFloat(row[yColumn]),
          }))
          .slice(0, 100); // Limit to 100 points for performance

      case 'area':
        if (!xColumn || !yColumn) return [];

        // Group by xColumn and aggregate yColumn for area chart
        const areaData = data.reduce((acc: any, row: any) => {
          const xValue = row[xColumn];
          const yValue = parseFloat(row[yColumn]) || 0;

          if (!acc[xValue]) {
            acc[xValue] = { [xColumn]: xValue, [yColumn]: 0 };
          }
          acc[xValue][yColumn] += yValue;

          return acc;
        }, {});

        return Object.values(areaData);

      case 'histogram':
        if (!yColumn) return [];

        // Create histogram data
        const values = data
          .map(row => parseFloat(row[yColumn]))
          .filter(val => !isNaN(val));

        if (values.length === 0) return [];

        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        const binCount = Math.min(20, Math.max(5, Math.ceil(Math.sqrt(values.length))));

        const binSize = range / binCount;
        const bins = Array.from({ length: binCount }, (_, i) => ({
          bin: `${(min + i * binSize).toFixed(2)} - ${(min + (i + 1) * binSize).toFixed(2)}`,
          count: 0,
          range: [min + i * binSize, min + (i + 1) * binSize]
        }));

        values.forEach(value => {
          const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
          bins[binIndex].count++;
        });

        return bins.filter(bin => bin.count > 0);

      default:
        return [];
    }
  }, [data, chartType, xColumn, yColumn, categoryColumn]);

  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <Alert severity="info">
          No data available for visualization. Please select appropriate columns.
        </Alert>
      );
    }

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={xColumn} />
              <YAxis />
              <Tooltip />
              {showLegend && <Legend />}
              <Bar dataKey={yColumn} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={xColumn} />
              <YAxis />
              <Tooltip />
              {showLegend && <Legend />}
              <Line type="monotone" dataKey={yColumn} stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ [categoryColumn]: name, [yColumn]: value }) =>
                  `${name}: ${value?.toFixed(1) || 0}`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey={yColumn}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid />
              <XAxis type="number" dataKey={xColumn} name={xColumn} />
              <YAxis type="number" dataKey={yColumn} name={yColumn} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name={`${xColumn} vs ${yColumn}`} dataKey={yColumn} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xColumn} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey={yColumn}
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'histogram':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bin" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  if (columns.length === 0) {
    return (
      <Alert severity="info">
        No data columns available for visualization.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Data Visualization
      </Typography>

      {/* Chart Type Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Typography variant="subtitle1">Chart Type:</Typography>
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={(event, newType) => newType && setChartType(newType)}
              aria-label="chart type"
            >
              <ToggleButton value="bar" aria-label="bar chart">
                <BarChartIcon />
              </ToggleButton>
              <ToggleButton value="line" aria-label="line chart">
                <LineChartIcon />
              </ToggleButton>
              <ToggleButton value="area" aria-label="area chart">
                <TrendIcon />
              </ToggleButton>
              <ToggleButton value="pie" aria-label="pie chart">
                <PieChartIcon />
              </ToggleButton>
              <ToggleButton value="scatter" aria-label="scatter plot">
                <ScatterIcon />
              </ToggleButton>
              <ToggleButton value="histogram" aria-label="histogram">
                <HistogramIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Column Selection */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>
                  {chartType === 'scatter' ? 'X-Axis Column' : 'X-Axis / Category Column'}
                </InputLabel>
                <Select
                  value={xColumn}
                  label={chartType === 'scatter' ? 'X-Axis Column' : 'X-Axis / Category Column'}
                  onChange={(e) => setXColumn(e.target.value)}
                >
                  {columns.map((col) => (
                    <MenuItem key={col} value={col}>
                      {col}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Value Column</InputLabel>
                <Select
                  value={yColumn}
                  label="Value Column"
                  onChange={(e) => setYColumn(e.target.value)}
                >
                  {numericColumns.map((col) => (
                    <MenuItem key={col} value={col}>
                      {col}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {chartType === 'pie' && (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category Column</InputLabel>
                  <Select
                    value={categoryColumn}
                    label="Category Column"
                    onChange={(e) => setCategoryColumn(e.target.value)}
                  >
                    {columns.map((col) => (
                      <MenuItem key={col} value={col}>
                        {col}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Chart Display */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {chartTitle || `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={() => setShowSettings(true)} size="small">
                <SettingsIcon />
              </IconButton>
              <ButtonGroup variant="outlined" size="small">
                <Button onClick={() => exportChart('png')}>PNG</Button>
                <Button onClick={() => exportChart('svg')}>SVG</Button>
                <Button onClick={() => exportChart('csv')}>CSV</Button>
              </ButtonGroup>
            </Box>
          </Box>
          {renderChart()}
        </CardContent>
      </Card>

      {/* Pivot Table View */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pivot Table View
          </Typography>
          {pivotData.length > 0 ? (
            <Box sx={{ overflow: 'auto', maxHeight: 400 }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f5f5f5' }}>
                      {xColumn}
                    </th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f5f5f5' }}>
                      {yColumn}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pivotData.map((row: any, index: number) => (
                    <tr key={index}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {row[xColumn]}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {typeof row[yColumn] === 'number' ? row[yColumn].toFixed(2) : row[yColumn]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          ) : (
            <Alert severity="info">No pivot data available. Select appropriate columns.</Alert>
          )}
        </CardContent>
      </Card>

      {/* Chart Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Chart Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Chart Title"
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Aggregation Type</InputLabel>
              <Select
                value={aggregationType}
                label="Aggregation Type"
                onChange={(e) => setAggregationType(e.target.value as any)}
              >
                <MenuItem value="sum">Sum</MenuItem>
                <MenuItem value="avg">Average</MenuItem>
                <MenuItem value="count">Count</MenuItem>
                <MenuItem value="min">Minimum</MenuItem>
                <MenuItem value="max">Maximum</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={showLegend}
                  onChange={(e) => setShowLegend(e.target.checked)}
                />
              }
              label="Show Legend"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                />
              }
              label="Show Grid"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataVisualization;