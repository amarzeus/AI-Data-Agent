import React from 'react'
import { Typography, Card, CardContent, Button } from '@mui/material'
import { motion } from 'framer-motion'
import {
  Analytics as AnalyticsIcon,
  Palette as PaletteIcon,
  Science as ScienceIcon
} from '@mui/icons-material'

const Playground: React.FC = () => {
  return (
    <div className="playground-container">
      <div
        className="playground-header"
      >
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Data Playground
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Advanced data exploration and visualization tools
        </Typography>
      </div>

      <div className="playground-grid">
        {/* 3D Visualization Card */}
        <Card
          component={motion.div}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -4 }}
          sx={{
            height: 300,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
            cursor: 'pointer'
          }}
        >
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <AnalyticsIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              3D Visualizations
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Interactive 3D charts and graphs for immersive data exploration
            </Typography>
            <Button variant="outlined" size="small">
              Launch 3D Viewer
            </Button>
          </CardContent>
        </Card>

        {/* Advanced Analytics Card */}
        <Card
          component={motion.div}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -4 }}
          sx={{
            height: 300,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
            cursor: 'pointer'
          }}
        >
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <ScienceIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Advanced Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Statistical analysis, correlation matrices, and predictive modeling
            </Typography>
            <Button variant="outlined" size="small">
              Start Analysis
            </Button>
          </CardContent>
        </Card>

        {/* Custom Dashboards Card */}
        <Card
          component={motion.div}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -4 }}
          sx={{
            height: 300,
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            cursor: 'pointer'
          }}
        >
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <PaletteIcon sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Custom Dashboards
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Build personalized dashboards with drag-and-drop widgets
            </Typography>
            <Button variant="outlined" size="small">
              Create Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Playground
