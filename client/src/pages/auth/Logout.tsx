import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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
      {/* Animated background shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-liberia-blue/20 rounded-full blur-3xl animate-float-slow z-0" style={{animationDelay: '0s'}} />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-liberia-red/20 rounded-full blur-3xl animate-float-slower z-0" style={{animationDelay: '2s'}} />
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-liberia-blue/10 rounded-full blur-2xl animate-float-fast z-0" style={{animationDelay: '1s', transform: 'translate(-50%, -50%)'}} />
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(30px) scale(1.08); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.03); }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 12s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 6s ease-in-out infinite; }
      `}</style>
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
