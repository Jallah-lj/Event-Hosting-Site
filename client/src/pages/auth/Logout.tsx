import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AnimatedBackground from '../../components/AnimatedBackground';

const Logout: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    signOut();
    setTimeout(() => {
      navigate('/auth/signin');
    }, 1500);
  }, [signOut, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-liberia-blue via-blue-200 to-liberia-red/30 relative overflow-hidden">
      <AnimatedBackground />
      <div className="bg-white/90 p-10 rounded-3xl shadow-2xl w-full max-w-md border-t-4 border-liberia-red z-10 backdrop-blur-xl animate-fade-in flex flex-col items-center">
        <div className="w-20 h-20 bg-gradient-to-br from-liberia-blue to-liberia-red text-white rounded-full flex items-center justify-center mb-6 font-serif font-bold text-3xl border-4 border-gray-100 shadow-lg animate-bounce-slow">
          LC
        </div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Signing you out...</h2>
        <p className="text-gray-500 text-center">You are being securely logged out. Redirecting to sign in page.</p>
      </div>
    </div>
  );
};

export default Logout;
