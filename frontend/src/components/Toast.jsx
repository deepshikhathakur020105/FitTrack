import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export function Toast() {
  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  // Expose global toast function
  React.useEffect(() => {
    window.showToast = addToast;
  }, [addToast]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-auto">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg text-sm font-medium animate-fadeUp ${
            toast.type === 'success'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : toast.type === 'error'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  return window.showToast;
}
