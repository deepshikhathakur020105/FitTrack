import React from 'react';

export function Loading({ text = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-var(--border) border-t-var(--accent) rounded-full animate-spin" />
        <p className="text-var(--text2)">{text}</p>
      </div>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`bg-var(--card2) animate-pulse rounded ${className}`} />;
}
