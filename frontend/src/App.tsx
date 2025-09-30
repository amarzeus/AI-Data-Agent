import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from './contexts/ThemeContext'
import { DataProvider } from './contexts/DataContext'
import { ErrorBoundary } from 'react-error-boundary'
import CssBaseline from '@mui/material/CssBaseline'
import { Container } from '@mui/material'

// Layout Components
import Header from './components/layout/Header'

// Page Components
import Dashboard from './pages/Dashboard'
import Playground from './pages/Playground'
import ChatHistory from './pages/ChatHistory'

// Error Fallback Component
const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ error, resetErrorBoundary }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
    textAlign: 'center'
  }}>
    <div style={{ marginBottom: '24px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '8px' }}>
        Something went wrong
      </h1>
      <div style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        {error.message}
      </div>
      <button
        onClick={resetErrorBoundary}
        style={{
          padding: '12px 24px',
          backgroundColor: 'var(--primary-main)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 500,
          transition: 'opacity 0.2s ease'
        }}
        onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
      >
        Try again
      </button>
    </div>
  </div>
)


// Query Client Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return error?.response?.status === 408 || error?.response?.status === 429
        }
        return failureCount < 3
      },
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 1
    }
  }
})

// Main App Component
const App: React.FC = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <DataProvider>
            <CssBaseline />
            <Router>
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Header />
                <Container
                  maxWidth={false}
                  sx={{
                    flex: 1,
                    py: 2,
                    px: { xs: 1, sm: 2, md: 3 }
                  }}
                >
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/playground" element={<Playground />} />
                    <Route path="/history" element={<ChatHistory />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Container>
              </div>
            </Router>
          </DataProvider>
        </ThemeProvider>

        {/* Development tools - only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

// Add CSS keyframes for loading spinner
const style = document.createElement('style')
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`
document.head.appendChild(style)

export default App
