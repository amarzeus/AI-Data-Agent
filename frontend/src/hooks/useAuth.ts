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
      setAuthLoading(true);
      const fetchedUser = await apiService.getCurrentUser();
      setCurrentUser(fetchedUser);
    } catch (err) {
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
    await apiService.registerUser(payload);
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    const tokens = await apiService.login(payload);
    storeTokens(tokens);
    await loadCurrentUser();
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

