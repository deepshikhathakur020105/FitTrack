import { create } from 'zustand';
import { authService, userService } from '../services/api-service';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,

  signup: async (name, email, password, goal) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.signup(name, email, password, goal);
      set({ isLoading: false });
      return response;
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(email, password);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return response;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  verifyEmail: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.verifyEmail(token);
      set({ isLoading: false });
      return response;
    } catch (error) {
      const message = error.response?.data?.message || 'Verification failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.forgotPassword(email);
      set({ isLoading: false });
      return response;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset email';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.resetPassword(token, password);
      set({ isLoading: false });
      return response;
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const user = await userService.getProfile();
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error) {
      set({ isAuthenticated: false, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));

export const useUserStore = create((set) => ({
  profile: null,
  preferences: {},
  isLoading: false,
  error: null,

  loadProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await userService.getProfile();
      set({ profile, isLoading: false });
      return profile;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load profile';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      await userService.updateProfile(profileData);
      const profile = await userService.getProfile();
      set({ profile, isLoading: false });
      return profile;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  loadPreferences: async () => {
    set({ isLoading: true, error: null });
    try {
      const preferences = await userService.getPreferences();
      set({ preferences, isLoading: false });
      return preferences;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load preferences';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updatePreferences: async (preferences) => {
    set({ isLoading: true, error: null });
    try {
      await userService.updatePreferences(preferences);
      set({ preferences, isLoading: false });
      return preferences;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update preferences';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
