import type { TokenPair } from '../services/apiService';

export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

export const getAccessToken = (): string | null => {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to read access token', error);
    return null;
  }
};

export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to read refresh token', error);
    return null;
  }
};

export const storeTokens = (tokens: TokenPair): void => {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  } catch (error) {
    console.error('Failed to persist auth tokens', error);
  }
};

export const clearTokens = (): void => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear auth tokens', error);
  }
};

