import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/authStore';
import { Loading } from '../components/Loading';

export function DashboardPage() {
  const { user, logout, isLoading: authLoading } = useAuthStore();
  const { profile, loadProfile, isLoading: profileLoading } = useUserStore();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user && !profile) {
      loadProfile();
    }
  }, [user, profile, loadProfile]);

  if (authLoading || profileLoading) {
    return <Loading text="Loading dashboard..." />;
  }

  if (!user) {
    window.location.href = '/login';
    return null;
  }

  return (
    <div className="min-h-screen bg-var(--bg)">
      {/* Header */}
      <header className="sticky top-0 z-100 bg-var(--card) border-b border-var(--border) p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            FIT<span className="text-var(--text2)">TRACK</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-var(--text2)">{user.email}</span>
            <button
              onClick={logout}
              className="btn btn-secondary text-sm"
              aria-label="Sign out"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-var(--adim) to-var(--tdim) border border-var(--border) rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, <span className="text-var(--accent)">{user.name?.split(' ')[0]}</span>!
          </h2>
          <p className="text-var(--text2)">Let's crush your fitness goals today! 💪</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-var(--border) overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'tasks', label: '📅 Tasks' },
            { id: 'profile', label: '👤 Profile' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-var(--accent) text-var(--accent)'
                  : 'text-var(--text2) hover:text-var(--text)'
              }`}
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fadeUp">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-var(--card) border border-var(--border) rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-var(--text2) text-sm font-semibold">Streak</h3>
                  <span className="text-2xl">🔥</span>
                </div>
                <p className="text-3xl font-bold text-var(--accent)">
                  {profile?.streak?.current_streak || 0}
                </p>
                <p className="text-xs text-var(--text3) mt-2">Day Streak</p>
              </div>

              <div className="bg-var(--card) border border-var(--border) rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-var(--text2) text-sm font-semibold">Tasks</h3>
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-3xl font-bold text-var(--teal)">
                  {profile?.stats?.completed_tasks || 0}
                </p>
                <p className="text-xs text-var(--text3) mt-2">Completed</p>
              </div>

              <div className="bg-var(--card) border border-var(--border) rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-var(--text2) text-sm font-semibold">Weight</h3>
                  <span className="text-2xl">⚖️</span>
                </div>
                <p className="text-3xl font-bold">
                  {profile?.profile?.weight_kg || '—'}
                </p>
                <p className="text-xs text-var(--text3) mt-2">kg</p>
              </div>

              <div className="bg-var(--card) border border-var(--border) rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-var(--text2) text-sm font-semibold">BMI</h3>
                  <span className="text-2xl">📊</span>
                </div>
                <p className="text-3xl font-bold text-var(--orange)">
                  {profile?.profile?.weight_kg && profile?.profile?.height_cm
                    ? (
                        profile.profile.weight_kg /
                        ((profile.profile.height_cm / 100) ** 2)
                      ).toFixed(1)
                    : '—'}
                </p>
                <p className="text-xs text-var(--text3) mt-2">Index</p>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="bg-var(--card) border border-var(--border) rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Today's Tasks</h3>
              <p className="text-var(--text2)">Task management coming soon...</p>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-var(--card) border border-var(--border) rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Profile Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <p className="text-var(--text)">{user.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <p className="text-var(--text)">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fitness Goal</label>
                  <p className="text-var(--text)">{user.goal || 'Not set'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
