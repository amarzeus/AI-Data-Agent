import React, { useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
  ResponsiveContainer
} from 'recharts'
import {
  Typography,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material'
import {
  ShowChart as LineIcon,
  BarChart as BarIcon,
  PieChart as PieIcon,
  ScatterPlot as ScatterIcon,
  Timeline as AreaIcon
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { ChartData } from '../../types'

interface Chart2DProps {
  data: ChartData
  height?: number
  width?: string | number
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#ef4444', '#3b82f6', '#f97316'
]

const Chart2D: React.FC<Chart2DProps> = ({
  data,
  height = 400,
  width = '100%'
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie' | 'scatter' | 'area'>('bar')

  const renderChart = () => {
    const chartData = data.data || []

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis
                dataKey={data.xAxis || 'x'}
                stroke="rgba(0,0,0,0.6)"
                fontSize={12}
              />
              <YAxis
                stroke="rgba(0,0,0,0.6)"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={data.yAxis || 'y'}
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis
                dataKey={data.xAxis || 'x'}
                stroke="rgba(0,0,0,0.6)"
                fontSize={12}
              />
              <YAxis
                stroke="rgba(0,0,0,0.6)"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
              <Legend />
              <Bar
                dataKey={data.yAxis || 'y'}
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey={data.yAxis || 'value'}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis
                dataKey={data.xAxis || 'x'}
                type="number"
                stroke="rgba(0,0,0,0.6)"
                fontSize={12}
              />
              <YAxis
                dataKey={data.yAxis || 'y'}
                type="number"
                stroke="rgba(0,0,0,0.6)"
                fontSize={12}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
              <Scatter
                name="Data Points"
                dataKey={data.yAxis || 'y'}
                fill="#6366f1"
              />
            </ScatterChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis
                dataKey={data.xAxis || 'x'}
                stroke="rgba(0,0,0,0.6)"
                fontSize={12}
              />
              <YAxis
                stroke="rgba(0,0,0,0.6)"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey={data.yAxis || 'y'}
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      sx={{
        height,
        width,
        borderRadius: 3,
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Chart Controls */}
        <div className="chart-controls">
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {data.title || '2D Data Visualization'}
          </Typography>

          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={(_, newType) => newType && setChartType(newType)}
            aria-label="chart type"
            size="small"
          >
            <ToggleButton value="bar" aria-label="bar chart">
              <BarIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="line" aria-label="line chart">
              <LineIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="pie" aria-label="pie chart">
              <PieIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="scatter" aria-label="scatter plot">
              <ScatterIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="area" aria-label="area chart">
              <AreaIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>

        {/* Chart Area */}
        <div className="chart-area">
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  )
}

export default Chart2D
