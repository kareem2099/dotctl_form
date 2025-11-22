'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Mail, Shield, Zap, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'credentials' | 'magic-link'>('credentials');
  const router = useRouter();

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.requires2FA) {
          // Redirect to 2FA verification
          localStorage.setItem('admin_temp_user_id', result.user.id);
          router.push('/admin/verify-2fa');
          return;
        }

        // Store tokens and redirect
        localStorage.setItem('admin_token', result.token);
        localStorage.setItem('admin_refresh_token', result.refreshToken);
        router.push('/admin/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        // Show success message and redirect to verification
        router.push('/admin/magic-link/sent');
      } else {
        setError(result.error || 'Failed to send magic link');
      }
    } catch (err) {
      console.error('Magic link error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl max-w-md w-full animate-fadeInUp">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-linear-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">DotCTL Admin</h1>
          <p className="text-white/70">Secure Administrative Access</p>
        </div>

        {/* Login Method Toggle */}
        <div className="flex bg-white/5 rounded-lg p-1 mb-6">
          <button
            onClick={() => setLoginMethod('credentials')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              loginMethod === 'credentials'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Password
          </button>
          <button
            onClick={() => setLoginMethod('magic-link')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              loginMethod === 'magic-link'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Magic Link
          </button>
        </div>

        {error && <p className="text-red-300 text-center mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</p>}

        {loginMethod === 'credentials' ? (
          <form onSubmit={handleCredentialLogin} className="space-y-6">
            <div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Username or Email"
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all duration-200 backdrop-blur-sm"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all duration-200 backdrop-blur-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 bg-linear-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-purple-500 hover:to-blue-500 transform transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Secure Login
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMagicLinkLogin} className="space-y-6">
            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Admin Email Address"
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all duration-200 backdrop-blur-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 bg-linear-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-green-500 hover:to-blue-500 transform transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Send Magic Link
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-white/50 text-sm">
          <p>🔐 Enterprise-grade security with AES-256 encryption</p>
        </div>
      </div>
    </div>
  );
}
