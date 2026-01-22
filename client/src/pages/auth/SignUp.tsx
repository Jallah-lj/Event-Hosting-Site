import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { UserRole } from '../../types';
import { getErrorMessage } from '../../services/api';

const SignUp: React.FC = () => {

  const { signUp } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }

    setIsLoading(true);

    try {
      await signUp(name, email, password, UserRole.ATTENDEE);
      addToast('Account created successfully!', 'success');
      // Navigation handled by App.tsx
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pattern-bg relative py-12">
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
          <h2 className="text-2xl font-serif font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-500 mt-2">Join LiberiaConnect Events today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                className="pl-10 block w-full border-gray-300 rounded-md focus:ring-liberia-blue focus:border-liberia-blue shadow-sm py-2 border"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                className="pl-10 block w-full border-gray-300 rounded-md focus:ring-liberia-blue focus:border-liberia-blue shadow-sm py-2 border"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full justify-center py-3" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/auth/signin" className="font-medium text-liberia-blue hover:text-blue-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
