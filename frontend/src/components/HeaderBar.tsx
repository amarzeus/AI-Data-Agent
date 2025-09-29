import React from 'react';
import { Avatar, Box, Button, Stack, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { toast } from 'react-hot-toast';

import { useDataContext } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';

const HeaderBar: React.FC = () => {
  const { currentUser } = useDataContext();
  const { logout, loading } = useAuth();

  const initials = currentUser?.full_name
    ?.split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') ?? currentUser?.email?.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="h6" fontWeight={600}>
        AI Data Agent
      </Typography>

      {currentUser && (
        <Stack direction="row" spacing={2} alignItems="center">
          <Stack spacing={0.25} textAlign="right">
            <Typography variant="subtitle2">
              {currentUser.full_name ?? currentUser.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currentUser.email}
            </Typography>
          </Stack>
          <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            {initials}
          </Avatar>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<LogoutIcon fontSize="small" />}
            onClick={handleLogout}
            disabled={loading}
          >
            Sign out
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default HeaderBar;

