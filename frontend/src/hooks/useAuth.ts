import { useCallback, useEffect } from 'react';
import {
  apiService,
  LoginRequest,
  UserCreateRequest,
} from '../services/apiService';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  storeTokens,
} from '../utils/authStorage';
import { useDataContext } from '../contexts/DataContext';

export const useAuth = () => {
  const {
    currentUser,
    setCurrentUser,
    authLoading,
    setAuthLoading,
  } = useDataContext();

  const loadCurrentUser = useCallback(async () => {
    try {
      console.log('useAuth: Loading current user data');
      setAuthLoading(true);
      const fetchedUser = await apiService.getCurrentUser();
      console.log('useAuth: User data fetched successfully:', fetchedUser.email);
      setCurrentUser(fetchedUser);
    } catch (err) {
      console.error('useAuth: Failed to load user data:', err);
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, [setAuthLoading, setCurrentUser]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setAuthLoading(false);
      setCurrentUser(null);
      return;
    }
    if (!authLoading && currentUser !== null) {
      return;
    }
    if (authLoading) {
      loadCurrentUser();
    }
  }, [authLoading, currentUser, loadCurrentUser, setAuthLoading, setCurrentUser]);

  const register = useCallback(async (payload: UserCreateRequest) => {
    console.log('useAuth: Registering user with email:', payload.email);
    await apiService.registerUser(payload);
    console.log('useAuth: User registration successful');
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    console.log('useAuth: Logging in user with email:', payload.email);
    const tokens = await apiService.login(payload);
    console.log('useAuth: Login successful, storing tokens');
    storeTokens(tokens);
    console.log('useAuth: Tokens stored, loading user data');
    await loadCurrentUser();
    console.log('useAuth: User data loaded successfully');
  }, [loadCurrentUser]);

  const refreshTokens = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const tokens = await apiService.refreshTokens(refreshToken);
    storeTokens(tokens);
    return tokens;
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setCurrentUser(null);
  }, [setCurrentUser]);

  return {
    user: currentUser,
    loading: authLoading,
    register,
    login,
    refreshTokens,
    logout,
    reloadUser: loadCurrentUser,
  };
};

