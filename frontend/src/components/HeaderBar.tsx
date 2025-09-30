import React, { useState } from 'react';
import {
  Avatar,
  Box,
  Stack,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

import { useDataContext } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';
import ProfileSettingsModal from './ProfileSettingsModal';

const HeaderBar: React.FC = () => {
  const { currentUser } = useDataContext();
  const { logout, loading } = useAuth();
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const initials = currentUser?.full_name
    ?.split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') ?? currentUser?.email?.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    setProfileMenuAnchor(null);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleSettingsOpen = () => {
    setSettingsModalOpen(true);
    setProfileMenuAnchor(null);
  };

  const handleSettingsClose = () => {
    setSettingsModalOpen(false);
  };

  // Calculate profile completeness for badge
  const profileCompleteness = React.useMemo(() => {
    if (!currentUser?.profile) return 0;
    const fields = ['job_title', 'department', 'bio', 'location', 'phone_number'];
    const completedFields = fields.filter(field =>
      currentUser.profile && currentUser.profile[field as keyof typeof currentUser.profile]
    ).length;
    return Math.round((completedFields / fields.length) * 100);
  }, [currentUser]);

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

          <Badge
            badgeContent={profileCompleteness < 100 ? `${profileCompleteness}%` : undefined}
            color={profileCompleteness === 100 ? 'success' : 'warning'}
            variant="standard"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                minWidth: 'auto',
                height: '16px',
                padding: '0 4px',
                borderRadius: '8px',
                backgroundColor: profileCompleteness === 100 ? '#10b981' : '#f59e0b',
              }
            }}
          >
            <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0.5 }}>
              <Avatar
                src={currentUser.profile?.avatar_url}
                sx={{
                  bgcolor: currentUser.profile?.avatar_url ? 'transparent' : 'primary.main',
                  color: currentUser.profile?.avatar_url ? 'white' : 'primary.contrastText',
                  width: 40,
                  height: 40
                }}
              >
                {!currentUser.profile?.avatar_url && initials}
              </Avatar>
            </IconButton>
          </Badge>

          <IconButton onClick={handleProfileMenuOpen} color="inherit">
            <ExpandMoreIcon />
          </IconButton>

          <Menu
            anchorEl={profileMenuAnchor}
            open={Boolean(profileMenuAnchor)}
            onClose={handleProfileMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {currentUser.full_name ?? currentUser.email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentUser.email}
              </Typography>
              {currentUser.profile?.job_title && (
                <Typography variant="caption" display="block" color="text.secondary">
                  {currentUser.profile.job_title}
                </Typography>
              )}
            </Box>

            <Divider />

            <MenuItem onClick={handleSettingsOpen}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile Settings</ListItemText>
            </MenuItem>

            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <SecurityIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Account Security</ListItemText>
            </MenuItem>

            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <PaletteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Preferences</ListItemText>
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleLogout} disabled={loading}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Sign Out</ListItemText>
            </MenuItem>
          </Menu>
        </Stack>
      )}

      <ProfileSettingsModal
        open={settingsModalOpen}
        onClose={handleSettingsClose}
      />
    </Box>
  );
};

export default HeaderBar;

