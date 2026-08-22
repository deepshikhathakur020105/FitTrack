import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/authStore';
import { Loading } from '../components/Loading';

export function SignupPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    goal: 'General Fitness',
  });
  const { signup, isLoading, error } = useAuthStore();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    try {
      await signup(
        formData.name,
        formData.email,
        formData.password,
        formData.goal
      );
      window.location.href = '/email-verification';
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-var(--bg) via-var(--bg2) to-var(--bg)">
      <div className="w-full max-w-md">
        <div className="bg-var(--card) border border-var(--border2) rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-2">
            FIT<span className="text-var(--text2)">TRACK</span>
          </h1>
          <p className="text-var(--text2) mb-8">Create your fitness account</p>

          {error && (
            <div className="mb-4 p-3 bg-var(--rdim) border border-var(--red) rounded-lg text-var(--red) text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="input"
                required
                aria-label="Full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                className="input"
                required
                aria-label="Email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password (min. 6 characters)
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="input"
                minLength="6"
                required
                aria-label="Password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="input"
                minLength="6"
                required
                aria-label="Confirm password"
              />
            </div>

            <div>
              <label htmlFor="goal" className="block text-sm font-medium mb-2">
                Fitness Goal
              </label>
              <select
                id="goal"
                name="goal"
                value={formData.goal}
                onChange={handleInputChange}
                className="input"
              >
                <option>General Fitness</option>
                <option>Lose Weight</option>
                <option>Build Muscle</option>
                <option>Improve Flexibility</option>
                <option>Boost Endurance</option>
                <option>Reduce Stress</option>
              </select>
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
                  Creating account...
                </>
              ) : (
                'CREATE ACCOUNT →'
              )}
            </button>
          </form>

          <p className="text-center text-var(--text2) mt-6 text-sm">
            Already have an account?{' '}
            <a href="/login" className="text-var(--accent) font-semibold hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
