import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { getErrorMessage } from '../../services/api';
import AnimatedBackground from '../../components/AnimatedBackground';

const SignIn: React.FC = () => {

  const { signIn } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signIn(email, password);
      addToast('Successfully signed in!', 'success');
      // Navigation handled by App.tsx
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-liberia-blue via-blue-200 to-liberia-red/30 relative overflow-hidden">
      <AnimatedBackground />

      <div className="absolute top-6 left-6 z-10">
        <Link to="/" className="text-white flex items-center hover:underline bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm shadow-lg">
          <ArrowLeft size={16} className="mr-1" /> Back to Home
        </Link>
      </div>

      <div className="bg-white/90 p-10 rounded-3xl shadow-2xl w-full max-w-md border-t-4 border-liberia-red z-10 backdrop-blur-xl animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-liberia-blue to-liberia-red text-white rounded-full flex items-center justify-center mx-auto mb-4 font-serif font-bold text-3xl border-4 border-gray-100 shadow-lg animate-bounce-slow">
            LC
          </div>
          <h2 className="text-3xl font-serif font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-500 mt-2">Sign in to access your LiberiaConnect account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">
              {error}
            </p>
            <p className="text-xs text-red-600 mt-1">
              Please check your email and password and try again.
            </p>
          </div>
        )}

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
                type={showPassword ? "text" : "password"}
                required
                className="pl-10 pr-10 block w-full border-gray-300 rounded-md focus:ring-liberia-blue focus:border-liberia-blue shadow-sm py-2 border"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
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
