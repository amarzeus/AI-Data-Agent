import React from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  useTheme,
  useScrollTrigger,
  Slide,
  Chip
} from '@mui/material'
import {
  Brightness6 as ThemeIcon,
  Upload as UploadIcon,
  Analytics as AnalyticsIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme as useAppTheme } from '../../contexts/ThemeContext'

interface HeaderProps {
  onMenuClick?: () => void
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const theme = useTheme()
  const appTheme = useAppTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const scrollTrigger = useScrollTrigger()

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: AnalyticsIcon },
    { path: '/playground', label: 'Playground', icon: AnalyticsIcon },
    { path: '/history', label: 'History', icon: HistoryIcon }
  ]

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  return (
    <Slide appear={false} direction="down" in={!scrollTrigger}>
      <AppBar
        position="sticky"
        elevation={0}
        component={motion.div}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        sx={{
          background: theme.palette.gradients?.primary,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[1]
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          {/* Mobile Menu Button */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMenuClick}
            sx={{
              mr: 2,
              display: { sm: 'none' },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo and Title */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginRight: '32px',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/dashboard')}
          >
            <div className="logo-icon">
              <AnalyticsIcon sx={{ fontSize: 32, color: 'white' }} />
            </div>
            <div className="logo-text">
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 700,
                  color: 'white',
                  lineHeight: 1.2
                }}
              >
                AI Data Agent
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.75rem',
                  lineHeight: 1
                }}
              >
                Intelligent Excel Analysis
              </Typography>
            </div>
          </div>

          {/* Navigation Items - Desktop */}
          <div className="desktop-nav">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <Button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  startIcon={<Icon />}
                  variant={isActive ? 'contained' : 'text'}
                  sx={{
                    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.9)',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: isActive ? 600 : 400,
                    '&:hover': {
                      backgroundColor: isActive
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'rgba(255, 255, 255, 0.1)',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  {item.label}
                </Button>
              )
            })}
          </div>

          {/* Status Indicator */}
          <Chip
            label="Online"
            size="small"
            sx={{
              mr: 2,
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              fontSize: '0.75rem',
              height: 24,
              '& .MuiChip-label': {
                px: 1
              }
            }}
          />

          {/* Upload Button */}
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            sx={{
              mr: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              borderRadius: 2,
              px: 2,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                transform: 'translateY(-1px) scale(1.05)',
                boxShadow: theme.shadows[4],
                transition: 'all 0.2s ease'
              }
            }}
          >
            Upload
          </Button>

          {/* Theme Toggle */}
          <IconButton
            onClick={appTheme.toggleTheme}
            sx={{
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                transform: 'scale(1.1) rotate(180deg)',
                transition: 'all 0.3s ease'
              }
            }}
          >
            <ThemeIcon />
          </IconButton>

          {/* Settings Button */}
          <IconButton
            sx={{
              ml: 1,
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                transform: 'scale(1.1)',
                transition: 'all 0.2s ease'
              }
            }}
          >
            <SettingsIcon />
          </IconButton>
        </Toolbar>

        {/* Mobile Navigation Bar */}
        <div className="mobile-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <IconButton
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mx: 0.5,
                  color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <Icon />
              </IconButton>
            )
          })}
        </div>
      </AppBar>
    </Slide>
  )
}

export default Header
