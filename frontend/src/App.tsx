import React, { useCallback, useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import Dashboard from './components/Dashboard';
import FileUploadModal from './components/FileUploadModal';
import { AuthGate } from './components/AuthGate';
import AuthPanel from './components/AuthPanel';
import { DataProvider, useDataContext } from './contexts/DataContext';
import { apiService } from './services/apiService';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#ec4899',
      light: '#f472b6',
      dark: '#db2777',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow:
            '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
        elevation1: {
          boxShadow:
            '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
        elevation2: {
          boxShadow:
            '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
        elevation3: {
          boxShadow:
            '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgb(0 0 0 / 0.15)',
          },
        },
        contained: {
          boxShadow:
            '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgb(0 0 0 / 0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent: React.FC = () => {
  const {
    activeFileId,
    setActiveFileId,
    fileDetail,
    setFileDetail,
    setSharedViz,
    setDataQualityDisclaimer,
    setQueryHistory,
  } = useDataContext();

  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const handleOpenUploadModal = useCallback(() => {
    setUploadModalOpen(true);
  }, []);

  const handleCloseUploadModal = useCallback(() => {
    setUploadModalOpen(false);
  }, []);

  const handleFileUploadSuccess = useCallback(
    (fileId: number) => {
      setActiveFileId(fileId);
      setUploadModalOpen(false);
    },
    [setActiveFileId],
  );

  const handleFileSelect = useCallback(
    (fileId: number) => {
      setActiveFileId(fileId);
    },
    [setActiveFileId],
  );

  const displayFileName = useMemo(() => {
    if (fileDetail?.original_filename) {
      return fileDetail.original_filename;
    }
    if (activeFileId != null) {
      return `File ${activeFileId}`;
    }
    return undefined;
  }, [fileDetail?.original_filename, activeFileId]);

  useQuery({
    queryKey: ['file-detail', activeFileId],
    queryFn: () => apiService.getFile(activeFileId!),
    enabled: activeFileId !== null,
    onSuccess: (detail) => {
      setFileDetail(detail);
      setSharedViz([]);
      setDataQualityDisclaimer(undefined);
    },
  });

  useQuery({
    queryKey: ['query-history', activeFileId],
    queryFn: () => apiService.getQueryHistory(activeFileId!),
    enabled: activeFileId !== null,
    onSuccess: (response) => {
      setQueryHistory(response.history);
    },
  });

  return (
    <AuthGate fallback={<AuthPanel />}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <img src="/logo192.png" alt="AI Data Agent" style={{ height: 40 }} />
        </Box>

        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <Dashboard
            selectedFileId={activeFileId}
            fileName={displayFileName}
            onOpenUploadModal={handleOpenUploadModal}
            onFileSelect={handleFileSelect}
          />
        </Box>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />

        <FileUploadModal
          open={uploadModalOpen}
          onClose={handleCloseUploadModal}
          onUploadSuccess={handleFileUploadSuccess}
        />
      </Box>
    </AuthGate>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DataProvider>
          <AppContent />
        </DataProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
