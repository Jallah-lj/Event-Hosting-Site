import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import AnimatedBackground from '../../components/AnimatedBackground';

const ForgotPassword: React.FC = () => {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setIsSubmitted(true);
    addToast('Password reset email sent!', 'success');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-liberia-blue via-blue-200 to-liberia-red/30 relative overflow-hidden">
        <AnimatedBackground />
        <div className="bg-white/90 p-10 rounded-3xl shadow-2xl w-full max-w-md text-center z-10 backdrop-blur-xl">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 mb-6">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <Link to="/auth/signin">
            <Button variant="outline" className="w-full justify-center">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-liberia-blue via-blue-200 to-liberia-red/30 relative overflow-hidden">
      <AnimatedBackground />
      <div className="absolute top-6 left-6 z-10">
        <Link to="/auth/signin" className="text-white flex items-center hover:underline bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm shadow-lg">
          <ArrowLeft size={16} className="mr-1" /> Back to Sign In
        </Link>
      </div>
      
      <div className="bg-white/90 p-10 rounded-3xl shadow-2xl w-full max-w-md border-t-4 border-liberia-red z-10 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-liberia-blue to-liberia-red text-white rounded-full flex items-center justify-center mx-auto mb-4 font-serif font-bold text-2xl border-4 border-gray-100 shadow-lg">
            LC
          </div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Forgot Password?</h2>
          <p className="text-gray-500 mt-2">Enter your email and we'll send you a reset link</p>
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

          <Button type="submit" className="w-full justify-center py-3" isLoading={isLoading}>
            Send Reset Link
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <Link to="/auth/signin" className="font-medium text-liberia-blue hover:text-blue-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
