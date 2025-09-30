import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { createAppTheme } from '../theme'

type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
  mode: ThemeMode
  toggleTheme: () => void
  setTheme: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Check localStorage first, then system preference
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme-mode') as ThemeMode
      if (stored && (stored === 'light' || stored === 'dark')) {
        return stored
      }

      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      return prefersDark ? 'dark' : 'light'
    }
    return 'light'
  })

  const theme = createAppTheme(mode)

  useEffect(() => {
    // Store theme preference
    localStorage.setItem('theme-mode', mode)

    // Update document class for better styling
    document.documentElement.setAttribute('data-theme', mode)

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', mode === 'dark' ? '#0f172a' : '#ffffff')
    }
  }, [mode])

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't set a preference
      const stored = localStorage.getItem('theme-mode')
      if (!stored) {
        setMode(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light')
  }

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode)
  }

  const value: ThemeContextType = {
    mode,
    toggleTheme,
    setTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeProvider
