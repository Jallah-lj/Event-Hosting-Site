import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { getErrorMessage } from '../../services/api';

const SignIn: React.FC = () => {

  const { signIn } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(email, password);
      addToast('Successfully signed in!', 'success');
      // Navigation handled by App.tsx
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pattern-bg relative">
      <div className="absolute top-6 left-6">
        <Link to="/" className="text-white flex items-center hover:underline bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
          <ArrowLeft size={16} className="mr-1" /> Back to Home
        </Link>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-liberia-red z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-liberia-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 font-serif font-bold text-2xl border-4 border-gray-100">
            LC
          </div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-500 mt-2">Sign in to access your LiberiaConnect account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                className="pl-10 block w-full border-gray-300 rounded-md focus:ring-liberia-blue focus:border-liberia-blue shadow-sm py-2 border"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                className="pl-10 block w-full border-gray-300 rounded-md focus:ring-liberia-blue focus:border-liberia-blue shadow-sm py-2 border"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 text-liberia-blue focus:ring-liberia-blue border-gray-300 rounded"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>

            <Link
              to="/auth/forgot-password"
              className="text-sm font-medium text-liberia-blue hover:text-blue-800"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full justify-center py-3" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="font-medium text-liberia-blue hover:text-blue-800">
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t">
          <p className="text-xs text-center text-gray-400 mb-3">Demo Accounts:</p>
          <div className="text-xs text-center text-gray-500 space-y-1">
            <p>Admin: admin@liberiaconnect.com</p>
            <p>Organizer: org@example.com</p>
            <p>Attendee: attendee@example.com</p>
            <p className="text-gray-400">Password: demo123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
