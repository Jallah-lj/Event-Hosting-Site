import React, { useState } from 'react';
import { Button } from '../components/Button';
import { UserRole } from '../../types';
import { ArrowLeft, Mail, Lock, User, ChevronRight, LogOut, CheckCircle, Key, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../components/Toast';

interface SignInProps {
  onLogin: (email: string, role: UserRole) => void;
  onNavigateToSignUp: () => void;
  onBack: () => void;
  onNavigateForgotPassword: () => void;
}

interface SignUpProps {
  onSignup: (name: string, email: string, role: UserRole) => void;
  onNavigateToSignIn: () => void;
  onBack: () => void;
}

interface SignOutProps {
  onNavigateHome: () => void;
  onNavigateSignIn: () => void;
}

interface ForgotPasswordProps {
  onNavigateToSignIn: () => void;
  onNavigateToReset?: () => void; // For demo purposes
}

interface ResetPasswordProps {
  onNavigateToSignIn: () => void;
}

// Google Icon Component for reuse
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export const SignIn: React.FC<SignInProps> = ({ onLogin, onNavigateToSignUp, onBack, onNavigateForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      // For demo purposes, we'll default to ATTENDEE unless it's a specific email
      const role = email.includes('admin') ? UserRole.ADMIN :
        email.includes('org') ? UserRole.ORGANIZER : UserRole.ATTENDEE;
      if (rememberMe) {
        localStorage.setItem('demo_remember_me', 'true');
      }
      onLogin(email, role);
      setIsLoading(false);
    }, 1000);
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setTimeout(() => {
      // Mock Google Login response
      onLogin('google.user@gmail.com', UserRole.ATTENDEE);
      setIsGoogleLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pattern-bg relative">
      <div className="absolute top-6 left-6">
        <button onClick={onBack} className="text-white flex items-center hover:underline bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
          <ArrowLeft size={16} className="mr-1" /> Back to Home
        </button>
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

            <button
              type="button"
              onClick={onNavigateForgotPassword}
              className="text-sm font-medium text-liberia-blue hover:text-blue-800"
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" className="w-full justify-center py-3" isLoading={isLoading} disabled={isGoogleLoading}>
            Sign In
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
            className="mt-6 w-full flex items-center justify-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-liberia-blue transition-colors"
          >
            {isGoogleLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </span>
            ) : (
              <>
                <GoogleIcon />
                Sign in with Google
              </>
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button onClick={onNavigateToSignUp} className="font-medium text-liberia-red hover:text-red-800">
              Sign up now
            </button>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-center text-gray-400">
          Protected by LiberiaConnect Security
        </div>
      </div>
    </div>
  );
};

export const SignUp: React.FC<SignUpProps> = ({ onSignup, onNavigateToSignIn, onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.ATTENDEE);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      onSignup(name, email, role);
      setIsLoading(false);
    }, 1000);
  };

  const handleGoogleSignup = () => {
    setIsGoogleLoading(true);
    setTimeout(() => {
      // Mock Google Signup
      onSignup('Google User', 'google.user@gmail.com', role);
      setIsGoogleLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pattern-bg relative py-12">
      <div className="absolute top-6 left-6">
        <button onClick={onBack} className="text-white flex items-center hover:underline bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
          <ArrowLeft size={16} className="mr-1" /> Back to Home
        </button>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-liberia-blue z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-500 mt-2">Join the community celebrating Liberian culture</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">I want to...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole(UserRole.ATTENDEE)}
                className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${role === UserRole.ATTENDEE
                    ? 'bg-blue-50 border-liberia-blue text-liberia-blue ring-1 ring-liberia-blue'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
              >
                <span className="font-semibold text-sm">Attend Events</span>
              </button>
              <button
                type="button"
                onClick={() => setRole(UserRole.ORGANIZER)}
                className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${role === UserRole.ORGANIZER
                    ? 'bg-blue-50 border-liberia-blue text-liberia-blue ring-1 ring-liberia-blue'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
              >
                <span className="font-semibold text-sm">Host Events</span>
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 text-liberia-blue focus:ring-liberia-blue border-gray-300 rounded"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
          </div>

          <Button type="submit" className="w-full justify-center py-3 mt-4" isLoading={isLoading} disabled={isGoogleLoading}>
            Create Account <ChevronRight size={16} className="ml-1" />
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign up with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading || isGoogleLoading}
            className="mt-6 w-full flex items-center justify-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-liberia-blue transition-colors"
          >
            {isGoogleLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </span>
            ) : (
              <>
                <GoogleIcon />
                Sign up with Google
              </>
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button onClick={onNavigateToSignIn} className="font-medium text-liberia-blue hover:text-blue-800">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigateToSignIn, onNavigateToReset }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);

      // Email Simulation Log
      console.group("📧 Email Service Simulation");
      console.log(`To: ${email}`);
      console.log(`Subject: Reset Your Password`);
      console.log(`Body: Click here to reset your password: https://liberiaconnect.com/reset-password?token=${Math.random().toString(36).substr(2, 9)}`);
      console.groupEnd();

      addToast('Password reset link sent to your email.', 'success');
    }, 1200);
  };

  const handleResend = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Email Simulation Log
      console.group("📧 Email Service Simulation");
      console.log(`To: ${email}`);
      console.log(`Subject: [Resend] Reset Your Password`);
      console.log(`Body: Click here to reset your password: https://liberiaconnect.com/reset-password?token=${Math.random().toString(36).substr(2, 9)}`);
      console.groupEnd();

      addToast('Password reset link resent.', 'success');
    }, 800);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pattern-bg relative animate-in fade-in duration-500">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border-t-4 border-liberia-blue z-10">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CheckCircle size={32} />
          </div>

          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Check Your Email</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            We have sent a password reset link to <span className="font-semibold text-gray-900">{email}</span>.
            Please check your inbox (and spam folder) to proceed.
          </p>

          <div className="space-y-3">
            <Button onClick={onNavigateToSignIn} className="w-full justify-center py-3">
              Back to Sign In
            </Button>
            <Button onClick={handleResend} variant="outline" className="w-full justify-center py-3" isLoading={isLoading}>
              Resend Email
            </Button>
            {/* Demo Link */}
            {onNavigateToReset && (
              <button onClick={onNavigateToReset} className="text-xs text-gray-400 hover:text-gray-600 mt-2 underline">
                Demo: Click here to simulate email link
              </button>
            )}
          </div>

          <p className="mt-4 text-xs text-gray-400">
            Wrong email? <button onClick={() => setIsSubmitted(false)} className="text-liberia-blue hover:underline">Try again</button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pattern-bg relative">
      <div className="absolute top-6 left-6">
        <button onClick={onNavigateToSignIn} className="text-white flex items-center hover:underline bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
          <ArrowLeft size={16} className="mr-1" /> Back to Login
        </button>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-liberia-red z-10">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-50 text-liberia-blue rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Key size={24} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Reset Password</h2>
          <p className="text-gray-500 mt-2 text-sm">Enter your email and we'll send you instructions to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="mt-6 text-center pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <button onClick={onNavigateToSignIn} className="font-medium text-liberia-blue hover:text-blue-800">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onNavigateToSignIn }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      addToast("Passwords do not match.", 'error');
      return;
    }

    if (password.length < 8) {
      addToast("Password must be at least 8 characters.", 'warning');
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);

      // Email Simulation Log
      console.group("📧 Email Service Simulation");
      console.log(`To: User`);
      console.log(`Subject: Password Changed Successfully`);
      console.log(`Body: Your password for LiberiaConnect has been updated. If this wasn't you, contact support immediately.`);
      console.groupEnd();

      addToast('Password successfully reset. Please sign in.', 'success');
      onNavigateToSignIn();
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pattern-bg relative animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-green-500 z-10">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
            <Lock size={24} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">New Password</h2>
          <p className="text-gray-500 mt-2 text-sm">Create a strong password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="pl-10 pr-10 block w-full border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 shadow-sm py-2 border"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CheckCircle className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="pl-10 block w-full border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 shadow-sm py-2 border"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
            <li className={password.length >= 8 ? 'text-green-600' : ''}>At least 8 characters</li>
            <li className={password && password === confirmPassword ? 'text-green-600' : ''}>Passwords match</li>
          </ul>

          <Button type="submit" className="w-full justify-center py-3 bg-green-600 hover:bg-green-700 focus:ring-green-500" isLoading={isLoading}>
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
};

export const SignOut: React.FC<SignOutProps> = ({ onNavigateHome, onNavigateSignIn }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pattern-bg relative animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border-t-4 border-liberia-blue z-10">
        <div className="w-20 h-20 bg-blue-50 text-liberia-blue rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <LogOut size={36} className="ml-1" />
        </div>

        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-3">Signed Out</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          You have successfully signed out of your account. We hope to see you again soon at our next event!
        </p>

        <div className="space-y-4">
          <Button onClick={onNavigateSignIn} className="w-full justify-center py-3 text-lg shadow-lg hover:translate-y-[-2px] transition-transform">
            Sign In Again
          </Button>
          <Button onClick={onNavigateHome} variant="outline" className="w-full justify-center py-3 text-lg border-gray-300 text-gray-600 hover:text-liberia-blue hover:border-liberia-blue">
            Return to Home
          </Button>
        </div>

        <div className="mt-8 flex justify-center space-x-2 text-xs text-gray-400">
          <span className="flex items-center"><CheckCircle size={10} className="mr-1" /> Secure Logout</span>
          <span>•</span>
          <span>Session Cleared</span>
        </div>
      </div>
    </div>
  );
};