import React, { useEffect } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { useDataContext } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';

type AuthGateProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export const AuthGate: React.FC<AuthGateProps> = ({ children, fallback }) => {
  const { currentUser, authLoading, setCurrentUser } = useDataContext();
  const { user, reloadUser, loading } = useAuth();

  useEffect(() => {
    if (!currentUser && !authLoading) {
      reloadUser();
    }
  }, [currentUser, authLoading, reloadUser]);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [setCurrentUser, user]);

  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    return <>{fallback ?? null}</>;
  }

  return <>{children}</>;
};
