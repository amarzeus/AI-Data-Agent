import React, { useState, useEffect } from 'react'
import { Typography, Card, CardContent, Button, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { motion } from 'framer-motion'
import {
  Analytics as AnalyticsIcon,
  History as HistoryIcon,
  TrendingUp as TrendingIcon,
  ViewInAr as ThreeDIcon,
  TableChart as TableIcon
} from '@mui/icons-material'
import BentoGrid from '../components/layout/BentoGrid'
import ChatInterface from '../components/chat/ChatInterface'
import FileUpload from '../components/ui/FileUpload'
import Chart3D from '../components/visualizations/Chart3D'
import Chart2D from '../components/visualizations/Chart2D'
import { ChartData } from '../types'
import { apiService } from '../services/apiService'
import { FileMetadata } from '../types'

// Sample data for demonstration
const sampleChartData: ChartData = {
  type: 'bar',
  title: 'Sales Performance',
  data: [
    { month: 'Jan', sales: 4000, profit: 2400 },
    { month: 'Feb', sales: 3000, profit: 1398 },
    { month: 'Mar', sales: 2000, profit: 9800 },
    { month: 'Apr', sales: 2780, profit: 3908 },
    { month: 'May', sales: 1890, profit: 4800 },
    { month: 'Jun', sales: 2390, profit: 3800 }
  ],
  xAxis: 'month',
  yAxis: 'sales'
}

// Real components for the bento grid sections
const ChatSection: React.FC<{ currentFile: FileMetadata | null }> = ({ currentFile }) => (
  <Card
    component={motion.div}
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    sx={{
      height: '100%',
      minHeight: 400,
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)'
    }}
  >
    <ChatInterface />
  </Card>
)

const UploadSection: React.FC<{ onUploadSuccess: (file: FileMetadata) => void }> = ({ onUploadSuccess }) => (
  <Card
    component={motion.div}
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: 0.1 }}
    sx={{
      height: '100%',
      minHeight: 300,
      display: 'flex',
      flexDirection: 'column'
    }}
  >
    <CardContent sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AnalyticsIcon color="primary" />
        File Upload
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload your Excel files to start analyzing data with AI
      </Typography>
      <FileUpload onUploadSuccess={onUploadSuccess} />
    </CardContent>
  </Card>
)

const VisualizationSection: React.FC<{ currentFile: FileMetadata | null }> = ({ currentFile }) => {
  const [vizType, setVizType] = useState<'2d' | '3d'>('2d')

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      sx={{
        height: '100%',
        minHeight: 500,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(239, 68, 68, 0.05) 100%)'
      }}
    >
      <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="viz-controls">
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0 }}>
            <TrendingIcon color="secondary" />
            Data Visualizations
          </Typography>

          <ToggleButtonGroup
            value={vizType}
            exclusive
            onChange={(_, newType) => newType && setVizType(newType)}
            aria-label="visualization type"
            size="small"
          >
            <ToggleButton value="2d" aria-label="2D charts">
              <TableIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="3d" aria-label="3D charts">
              <ThreeDIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>

        <div className="viz-area">
          {vizType === '2d' ? (
            <Chart2D data={sampleChartData} height={400} />
          ) : (
            <Chart3D data={sampleChartData} height={400} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const HistorySection: React.FC = () => (
  <Card
    component={motion.div}
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: 0.3 }}
    sx={{
      height: '100%',
      minHeight: 300,
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)'
    }}
  >
    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 4 }}>
      <HistoryIcon sx={{ fontSize: 48, color: 'info.main', mb: 2, opacity: 0.7 }} />
      <Typography variant="h6" gutterBottom>
        Query History
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        View and manage your previous queries, sessions, and generated insights.
      </Typography>
      <Button
        variant="outlined"
        startIcon={<HistoryIcon />}
        onClick={() => window.location.href = '/history'}
        sx={{
          borderRadius: 2,
          textTransform: 'none'
        }}
      >
        View History
      </Button>
    </CardContent>
  </Card>
)

const Dashboard: React.FC = () => {
  const [_files, setFiles] = useState<FileMetadata[]>([]) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [currentFile, setCurrentFile] = useState<FileMetadata | null>(null)

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const filesData = await apiService.getFiles()
        setFiles(filesData)
        if (filesData.length > 0) {
          setCurrentFile(filesData[0])
        }
      } catch (error) {
        console.error('Failed to load files:', error)
      }
    }

    loadFiles()
  }, [])

  return (
    <div className="dashboard-container">
      <BentoGrid minHeight={600}>
        <ChatSection currentFile={currentFile} />
        <UploadSection onUploadSuccess={(file) => setCurrentFile(file)} />
        <VisualizationSection currentFile={currentFile} />
        <HistorySection />
      </BentoGrid>
    </div>
  )
}

export default Dashboard
