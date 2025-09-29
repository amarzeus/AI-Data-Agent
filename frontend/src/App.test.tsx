import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { DataProvider } from './contexts/DataContext';
import App from './App';

const queryClient = new QueryClient();
const theme = createTheme();

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = jest.fn();

test('renders AI Data Agent', () => {
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <DataProvider>
          <App />
        </DataProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
  const titleElement = screen.getByText(/AI Data Agent/i);
  expect(titleElement).toBeInTheDocument();
});
