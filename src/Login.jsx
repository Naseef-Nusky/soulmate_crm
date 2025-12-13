import { useState } from 'react';
import { adminLogin } from './api.js';
import { setAuthToken, setAdminUser } from './auth.js';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await adminLogin(username, password);
      if (data.ok && data.token) {
        setAuthToken(data.token);
        setAdminUser(data.admin);
        onLogin(data.admin);
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Login failed';
      if (errorMessage.includes('Failed to authenticate') || errorMessage.includes('Database not available')) {
        setError('Database connection error. Please ensure the backend is running and the admin user exists.');
      } else if (errorMessage.includes('Invalid credentials')) {
        setError('Invalid username or password. Please check your credentials and try again.');
      } else if (errorMessage.includes('fetch')) {
        setError('Cannot connect to backend. Please ensure the backend server is running.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gurulink-bgLight flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border p-8" style={{ borderColor: 'rgba(212, 163, 75, 0.3)' }}>
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img
                src="/logoicon.png"
                alt="GuruLink"
                className="h-12 w-12 rounded-lg object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="text-2xl font-black" style={{ color: '#1A2336' }}>
                GuruLink<span style={{ color: '#D4A34B' }}> CRM</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gurulink-primary">Login</h1>
            <p className="text-sm text-gurulink-textSecondary mt-2">
              Sign in to access the CRM dashboard
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <div className="font-semibold mb-1">Login Failed</div>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gurulink-primary mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-xl border px-4 py-2.5 text-base bg-white"
                style={{ borderColor: '#E5E7EB', color: '#111827' }}
                placeholder="Enter username"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gurulink-primary mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border px-4 py-2.5 pr-12 text-base bg-white"
                  style={{ borderColor: '#E5E7EB', color: '#111827' }}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gurulink-textSecondary hover:text-gurulink-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl px-4 py-2.5 text-base font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1A2336' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

