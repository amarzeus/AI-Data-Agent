import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Avatar,
  IconButton,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Stack,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  SaveOutlined as SaveOutlinedIcon,
  ViewCompact as ViewCompactIcon,
  ViewComfy as ViewComfyIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

import { useDataContext } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import AvatarCropModal from './AvatarCropModal';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface ProfileSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  open,
  onClose
}) => {
  const { currentUser } = useDataContext();
  const { reloadUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  // Profile form state
  const [profileData, setProfileData] = useState({
    job_title: '',
    department: '',
    bio: '',
    location: '',
    phone_number: '',
    avatar_url: '',
    preferences: {}
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    theme: 'light',
    notifications: true,
    auto_save: true,
    compact_mode: false,
    default_chart_type: 'bar',
    dashboard_layout: 'default',
    data_export_format: 'csv',
    query_history_limit: 50,
    auto_refresh_dashboard: false,
    sound_effects: false,
    language: 'en',
    timezone: 'UTC',
    date_format: 'MM/DD/YYYY',
    profile_visibility: 'team',
    show_activity_status: true,
    allow_profile_sharing: false,
    show_query_count: true
  });

  // Profile completeness calculation
  const profileCompleteness = React.useMemo(() => {
    const fields = ['job_title', 'department', 'bio', 'location', 'phone_number'];
    const completedFields = fields.filter(field => profileData[field as keyof typeof profileData]).length;
    return Math.round((completedFields / fields.length) * 100);
  }, [profileData]);

  // Initialize form data when modal opens
  useEffect(() => {
    if (open && currentUser?.profile) {
      setProfileData({
        job_title: currentUser.profile?.job_title || '',
        department: currentUser.profile?.department || '',
        bio: currentUser.profile?.bio || '',
        location: currentUser.profile?.location || '',
        phone_number: currentUser.profile?.phone_number || '',
        avatar_url: currentUser.profile?.avatar_url || '',
        preferences: currentUser.profile?.preferences || {}
      });
      setPreferences(prev => ({
        ...prev,
        ...(currentUser.profile?.preferences || {})
      }));
    }
  }, [open, currentUser?.profile]);

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await apiService.updateProfile({
        ...profileData,
        preferences: { ...preferences, ...profileData.preferences }
      });
      await reloadUser();
      toast.success('Profile updated successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setSaving(true);
    try {
      await apiService.updatePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      toast.success('Password updated successfully!');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      toast.error('Failed to update password');
      console.error('Password update error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Basic file validation
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image');
      return;
    }

    setSelectedImageFile(file);
    setCropModalOpen(true);
    // Reset the input so the same file can be uploaded again if needed
    event.target.value = '';
  };

  const handleCroppedImage = async (croppedImageBlob: Blob) => {
    setLoading(true);
    try {
      // Convert blob to File
      const croppedFile = new File([croppedImageBlob], selectedImageFile?.name || 'cropped-avatar.jpg', {
        type: 'image/jpeg'
      });

      const response = await apiService.uploadAvatar(croppedFile);
      handleProfileChange('avatar_url', response.avatar_url);
      toast.success('Avatar updated successfully!');
    } catch (error) {
      toast.error('Failed to upload cropped avatar');
      console.error('Avatar upload error:', error);
    } finally {
      setLoading(false);
      setCropModalOpen(false);
      setSelectedImageFile(null);
    }
  };

  const handleDataExport = async (format: 'json' | 'csv' | 'pdf') => {
    setLoading(true);
    try {
      const blob = await apiService.exportUserData(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `ai-data-agent-data-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Data exported successfully as ${format.toUpperCase()}!`);
    } catch (error) {
      toast.error('Failed to export data');
      console.error('Data export error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '600px'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5" fontWeight={600}>
            Profile Settings
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Profile Completeness Progress */}
        <Box sx={{ mt: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Profile Completeness
            </Typography>
            <Typography variant="body2" color="primary.main" fontWeight={600}>
              {profileCompleteness}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={profileCompleteness}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: profileCompleteness === 100 ? 'success.main' : 'primary.main'
              }
            }}
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab
            icon={<PersonIcon />}
            label="Profile"
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab
            icon={<SecurityIcon />}
            label="Security"
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab
            icon={<PaletteIcon />}
            label="Preferences"
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: 'center', p: 3 }}>
                <Box position="relative" display="inline-block">
                  <Avatar
                    src={profileData.avatar_url}
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: profileData.avatar_url ? 'transparent' : 'primary.main',
                      fontSize: '3rem',
                      mb: 2
                    }}
                  >
                    {!profileData.avatar_url && (currentUser?.full_name?.charAt(0) || currentUser?.email?.charAt(0))?.toUpperCase()}
                  </Avatar>

                  <IconButton
                    component="label"
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: -8,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      width: 40,
                      height: 40
                    }}
                  >
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleAvatarUpload}
                    />
                    {loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <PhotoCameraIcon fontSize="small" />
                    )}
                  </IconButton>
                </Box>

                <Typography variant="h6" gutterBottom>
                  {currentUser?.full_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentUser?.email}
                </Typography>

                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                  <Chip
                    label={`${profileCompleteness}% Complete`}
                    color={profileCompleteness === 100 ? 'success' : 'warning'}
                    size="small"
                  />
                </Stack>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Personal Information
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={currentUser?.full_name || ''}
                        disabled
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={currentUser?.email || ''}
                        disabled
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Job Title"
                        value={profileData.job_title}
                        onChange={(e) => handleProfileChange('job_title', e.target.value)}
                        placeholder="e.g. Data Analyst"
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Department"
                        value={profileData.department}
                        onChange={(e) => handleProfileChange('department', e.target.value)}
                        placeholder="e.g. Analytics"
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Bio"
                        value={profileData.bio}
                        onChange={(e) => handleProfileChange('bio', e.target.value)}
                        placeholder="Tell us about yourself..."
                        multiline
                        rows={3}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Location"
                        value={profileData.location}
                        onChange={(e) => handleProfileChange('location', e.target.value)}
                        placeholder="e.g. San Francisco, CA"
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={profileData.phone_number}
                        onChange={(e) => handleProfileChange('phone_number', e.target.value)}
                        placeholder="e.g. +1 (555) 123-4567"
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Change Password
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                Password must be at least 8 characters long and contain a mix of letters, numbers, and special characters.
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Current Password"
                    value={passwordData.current_password}
                    onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="New Password"
                    value={passwordData.new_password}
                    onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Confirm New Password"
                    value={passwordData.confirm_password}
                    onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                App Preferences
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                      Theme
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {['light', 'dark', 'auto'].map((theme) => (
                        <Button
                          key={theme}
                          variant={preferences.theme === theme ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handlePreferenceChange('theme', theme)}
                          sx={{ textTransform: 'capitalize' }}
                        >
                          {theme}
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                      Default Chart Type
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {['bar', 'line', 'pie', 'scatter'].map((chartType) => (
                        <Button
                          key={chartType}
                          variant={preferences.default_chart_type === chartType ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handlePreferenceChange('default_chart_type', chartType)}
                          sx={{ textTransform: 'capitalize' }}
                        >
                          {chartType}
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle1" fontWeight={500}>
                      Notifications
                    </Typography>
                    <Button
                      variant={preferences.notifications ? 'contained' : 'outlined'}
                      color={preferences.notifications ? 'success' : 'inherit'}
                      size="small"
                      onClick={() => handlePreferenceChange('notifications', !preferences.notifications)}
                      startIcon={preferences.notifications ? <NotificationsIcon /> : <NotificationsNoneIcon />}
                    >
                      {preferences.notifications ? 'Enabled' : 'Disabled'}
                    </Button>
                  </Stack>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle1" fontWeight={500}>
                      Auto Save
                    </Typography>
                    <Button
                      variant={preferences.auto_save ? 'contained' : 'outlined'}
                      color={preferences.auto_save ? 'success' : 'inherit'}
                      size="small"
                      onClick={() => handlePreferenceChange('auto_save', !preferences.auto_save)}
                      startIcon={preferences.auto_save ? <SaveIcon /> : <SaveOutlinedIcon />}
                    >
                      {preferences.auto_save ? 'Enabled' : 'Disabled'}
                    </Button>
                  </Stack>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle1" fontWeight={500}>
                      Compact Mode
                    </Typography>
                    <Button
                      variant={preferences.compact_mode ? 'contained' : 'outlined'}
                      color={preferences.compact_mode ? 'primary' : 'inherit'}
                      size="small"
                      onClick={() => handlePreferenceChange('compact_mode', !preferences.compact_mode)}
                      startIcon={preferences.compact_mode ? <ViewCompactIcon /> : <ViewComfyIcon />}
                    >
                      {preferences.compact_mode ? 'Enabled' : 'Disabled'}
                    </Button>
                  </Stack>
                </Grid>
              </Grid>

              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                      Dashboard Layout
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {[
                        { value: 'default', label: 'Default' },
                        { value: 'compact', label: 'Compact' },
                        { value: 'wide', label: 'Wide' }
                      ].map((layout) => (
                        <Button
                          key={layout.value}
                          variant={preferences.dashboard_layout === layout.value ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handlePreferenceChange('dashboard_layout', layout.value)}
                        >
                          {layout.label}
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                      Data Export Format
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {[
                        { value: 'csv', label: 'CSV' },
                        { value: 'excel', label: 'Excel' },
                        { value: 'json', label: 'JSON' }
                      ].map((format) => (
                        <Button
                          key={format.value}
                          variant={preferences.data_export_format === format.value ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handlePreferenceChange('data_export_format', format.value)}
                        >
                          {format.label}
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                      Query History Limit
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {[25, 50, 100, 200].map((limit) => (
                        <Button
                          key={limit}
                          variant={preferences.query_history_limit === limit ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handlePreferenceChange('query_history_limit', limit)}
                        >
                          {limit}
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                      Language
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {[
                        { value: 'en', label: 'English' },
                        { value: 'es', label: 'Español' },
                        { value: 'fr', label: 'Français' },
                        { value: 'de', label: 'Deutsch' }
                      ].map((lang) => (
                        <Button
                          key={lang.value}
                          variant={preferences.language === lang.value ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handlePreferenceChange('language', lang.value)}
                        >
                          {lang.label}
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle1" fontWeight={500}>
                      Auto Refresh Dashboard
                    </Typography>
                    <Button
                      variant={preferences.auto_refresh_dashboard ? 'contained' : 'outlined'}
                      color={preferences.auto_refresh_dashboard ? 'success' : 'inherit'}
                      size="small"
                      onClick={() => handlePreferenceChange('auto_refresh_dashboard', !preferences.auto_refresh_dashboard)}
                    >
                      {preferences.auto_refresh_dashboard ? 'Enabled' : 'Disabled'}
                    </Button>
                  </Stack>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle1" fontWeight={500}>
                      Sound Effects
                    </Typography>
                    <Button
                      variant={preferences.sound_effects ? 'contained' : 'outlined'}
                      color={preferences.sound_effects ? 'primary' : 'inherit'}
                      size="small"
                      onClick={() => handlePreferenceChange('sound_effects', !preferences.sound_effects)}
                    >
                      {preferences.sound_effects ? 'Enabled' : 'Disabled'}
                    </Button>
                  </Stack>
                </Grid>
              </Grid>

              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Profile & Privacy
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                      Profile Visibility
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {[
                        { value: 'private', label: 'Private' },
                        { value: 'team', label: 'Team Only' },
                        { value: 'public', label: 'Public' }
                      ].map((visibility) => (
                        <Button
                          key={visibility.value}
                          variant={preferences.profile_visibility === visibility.value ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handlePreferenceChange('profile_visibility', visibility.value)}
                          color={visibility.value === 'private' ? 'error' : visibility.value === 'public' ? 'success' : 'primary'}
                        >
                          {visibility.label}
                        </Button>
                      ))}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {preferences.profile_visibility === 'private' && 'Only you can see your profile'}
                      {preferences.profile_visibility === 'team' && 'Team members can view your profile'}
                      {preferences.profile_visibility === 'public' && 'Anyone with the link can view your profile'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                      Activity Status
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant={preferences.show_activity_status ? 'contained' : 'outlined'}
                        color={preferences.show_activity_status ? 'success' : 'inherit'}
                        size="small"
                        onClick={() => handlePreferenceChange('show_activity_status', !preferences.show_activity_status)}
                      >
                        {preferences.show_activity_status ? 'Visible' : 'Hidden'}
                      </Button>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Show when you're active on the platform
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                      Profile Sharing
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant={preferences.allow_profile_sharing ? 'contained' : 'outlined'}
                        color={preferences.allow_profile_sharing ? 'primary' : 'inherit'}
                        size="small"
                        onClick={() => handlePreferenceChange('allow_profile_sharing', !preferences.allow_profile_sharing)}
                      >
                        {preferences.allow_profile_sharing ? 'Enabled' : 'Disabled'}
                      </Button>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Allow others to share your public profile
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                      Show Query Count
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant={preferences.show_query_count ? 'contained' : 'outlined'}
                        color={preferences.show_query_count ? 'info' : 'inherit'}
                        size="small"
                        onClick={() => handlePreferenceChange('show_query_count', !preferences.show_query_count)}
                      >
                        {preferences.show_query_count ? 'Visible' : 'Hidden'}
                      </Button>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Display your total query count on your profile
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Data Export & Privacy
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                      Export Your Data
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Download a copy of your profile information, query history, and account data.
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDataExport('json')}
                        disabled={loading}
                      >
                        Export as JSON
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDataExport('csv')}
                        disabled={loading}
                      >
                        Export as CSV
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDataExport('pdf')}
                        disabled={loading}
                      >
                        Export as PDF
                      </Button>
                    </Stack>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Your data export will include your profile information, preferences, query history, and other account data.
                      This process may take a few moments for large accounts.
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>

        {activeTab === 0 && (
          <Button
            variant="contained"
            onClick={handleSaveProfile}
            disabled={saving}
            startIcon={<SaveIcon />}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        )}

        {activeTab === 1 && (
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={saving || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
            startIcon={<SecurityIcon />}
          >
            {saving ? 'Updating...' : 'Update Password'}
          </Button>
        )}

        {activeTab === 2 && (
          <Button
            variant="contained"
            onClick={() => {
              handlePreferenceChange('preferences', preferences);
              toast.success('Preferences saved!');
            }}
            disabled={saving}
            startIcon={<SaveIcon />}
          >
            Save Preferences
          </Button>
        )}
      </DialogActions>

      <AvatarCropModal
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        onCrop={handleCroppedImage}
        imageFile={selectedImageFile}
      />
    </Dialog>
  );
};

export default ProfileSettingsModal;
