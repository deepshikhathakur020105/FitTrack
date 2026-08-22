import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Loading } from '../components/Loading';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      window.location.href = '/dashboard';
    } catch (err) {
      // Error is handled by store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-var(--bg) via-var(--bg2) to-var(--bg)">
      <div className="w-full max-w-md">
        <div className="bg-var(--card) border border-var(--border2) rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-2">
            FIT<span className="text-var(--text2)">TRACK</span>
          </h1>
          <p className="text-var(--text2) mb-8">Elite Fitness Platform</p>

          {error && (
            <div className="mb-4 p-3 bg-var(--rdim) border border-var(--red) rounded-lg text-var(--red) text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input"
                required
                aria-label="Email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-10"
                  required
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-var(--text2) hover:text-var(--text)"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="flex gap-2 text-sm">
              <a href="#forgot" className="text-var(--accent) hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-full btn-lg"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'SIGN IN →'
              )}
            </button>
          </form>

          <p className="text-center text-var(--text2) mt-6 text-sm">
            New here?{' '}
            <a href="/signup" className="text-var(--accent) font-semibold hover:underline">
              Create an account
            </a>
          </p>

          <div className="mt-6 pt-6 border-t border-var(--border) text-xs text-var(--text3)">
            <p className="mb-2">🛡️ Demo Admin Account:</p>
            <p>Email: deepshikha@gmail.com</p>
            <p>Password: deepshikha01</p>
          </div>
        </div>
      </div>
    </div>
  );
}
