import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import toast from 'react-hot-toast';

import { useAuth } from '../hooks/useAuth';

type AuthMode = 'login' | 'register';

const AuthPanel: React.FC = () => {
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      toast.error('Please provide both email and password.');
      return;
    }

    setSubmitting(true);

    try {
      if (mode === 'register') {
        await register({ email, password, full_name: fullName || undefined });
        toast.success('Account created successfully!');
        await login({ email, password });
      } else {
        await login({ email, password });
        toast.success('Welcome back!');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                AI Data Agent
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to analyze your datasets, craft insights, and build visualizations.
              </Typography>
            </Box>

            <Tabs
              value={mode}
              onChange={(_, value) => setMode(value)}
              variant="fullWidth"
              aria-label="Authentication mode"
            >
              <Tab label="Sign In" value="login" />
              <Tab label="Create Account" value="register" />
            </Tabs>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2.5}>
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  fullWidth
                />

                {mode === 'register' && (
                  <TextField
                    label="Full Name (optional)"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    fullWidth
                  />
                )}

                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  fullWidth
                />

                <Button
                  type="submit"
                  size="large"
                  variant="contained"
                  disabled={submitting}
                  endIcon={(loading || submitting) && <CircularProgress size={18} color="inherit" />}
                >
                  {mode === 'login' ? 'Sign In' : 'Register'}
                </Button>

                {mode === 'login' && (
                  <Alert severity="info" variant="outlined">
                    Don’t have an account yet? Switch to “Create Account” to get started.
                  </Alert>
                )}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuthPanel;

