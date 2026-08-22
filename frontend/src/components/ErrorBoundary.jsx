import React from 'react';

export function ErrorBoundary({ children }) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleError = (event) => {
      setHasError(true);
      setError(event.error || 'An unexpected error occurred');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-var(--card) border border-var(--border) rounded-xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-var(--red) mb-4">⚠️ Something went wrong</h2>
          <p className="text-var(--text2) mb-4">{error?.message || 'An error occurred'}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return children;
}
