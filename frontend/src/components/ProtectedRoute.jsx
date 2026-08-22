import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Loading } from './Loading';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <Loading text="Initializing..." />;
  }

  if (!isAuthenticated) {
    window.location.href = '/login';
    return null;
  }

  return children;
}
