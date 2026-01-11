
import React, { useState } from 'react';
import { GoogleIcon } from './icons/GoogleIcon.tsx';
import BrandLogo from './BrandLogo.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from './Spinner.tsx';
import { supabase } from '../lib/supabaseClient.ts';

interface LoginModalProps {
  onLogin: (user: { name: string; email: string }) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose }) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else if (data.user) {
      onLogin({ 
        name: data.user.user_metadata?.full_name || email.split('@')[0], 
        email: data.user.email || '' 
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setMessage('Registration successful! Please check your email to confirm your account.');
      setView('login');
    }
  };
  
  const handleResetSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) return;
      
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      setLoading(false);

      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for the password reset link.');
        setView('login');
      }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-light-panel dark:bg-dark-panel w-full max-w-md m-4 rounded-2xl shadow-2xl p-8 border border-light-border dark:border-dark-border overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <BrandLogo variant="full" className="mx-auto mb-6" />
        
        <AnimatePresence mode="wait">
            {view === 'login' && (
                <motion.div
                    key="login"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">Welcome Back</h2>
                        <p className="text-sm text-light-text-mid dark:text-dark-text-mid mt-1">Please log in to access your dashboard.</p>
                    </div>
                    
                    <form onSubmit={handleLogin} className="mt-8 space-y-4">
                        {message && <p className="text-green-500 text-sm text-center bg-green-500/10 p-2 rounded">{message}</p>}
                        {error && <p className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded">{error}</p>}
                        
                        <div>
                            <label className="text-sm font-medium text-light-text-mid dark:text-dark-text-mid">Email</label>
                            <input 
                                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-md text-sm"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-light-text-mid dark:text-dark-text-mid">Password</label>
                                <button type="button" onClick={() => setView('forgot')} className="text-xs text-brand-blue hover:underline">Forgot?</button>
                            </div>
                            <input 
                                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-md text-sm"
                            />
                        </div>
                        
                        <motion.button whileTap={{ scale: 0.96 }} type="submit" disabled={loading}
                            className="w-full btn-gradient inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg shadow-lg text-white disabled:opacity-70">
                            {loading ? <Spinner className="w-5 h-5 text-white" /> : 'Login'}
                        </motion.button>

                        <div className="text-center text-sm mt-4">
                            <span className="text-gray-500">Don't have an account? </span>
                            <button type="button" onClick={() => setView('signup')} className="text-brand-blue font-semibold hover:underline">Sign Up</button>
                        </div>
                    </form>
                </motion.div>
            )}

            {view === 'signup' && (
                <motion.div
                    key="signup"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">Create Account</h2>
                    </div>
                    
                    <form onSubmit={handleSignUp} className="mt-6 space-y-4">
                        {error && <p className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded">{error}</p>}
                        
                        <div>
                            <label className="text-sm font-medium">Full Name</label>
                            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-black/5 dark:bg-white/5 border rounded-md text-sm" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Email</label>
                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-black/5 dark:bg-white/5 border rounded-md text-sm" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Password</label>
                            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-black/5 dark:bg-white/5 border rounded-md text-sm" />
                        </div>
                        
                        <motion.button whileTap={{ scale: 0.96 }} type="submit" disabled={loading}
                            className="w-full btn-gradient inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg shadow-lg text-white disabled:opacity-70">
                            {loading ? <Spinner className="w-5 h-5 text-white" /> : 'Sign Up'}
                        </motion.button>

                        <div className="text-center text-sm mt-4">
                            <span className="text-gray-500">Already have an account? </span>
                            <button type="button" onClick={() => setView('login')} className="text-brand-blue font-semibold hover:underline">Login</button>
                        </div>
                    </form>
                </motion.div>
            )}

            {view === 'forgot' && (
                <motion.div
                    key="forgot"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                     <div className="text-center">
                        <h2 className="text-2xl font-bold">Reset Password</h2>
                        <p className="text-sm text-gray-500 mt-1">We'll email you a link to reset it.</p>
                    </div>

                    <form onSubmit={handleResetSubmit} className="mt-8 space-y-6">
                         <div>
                            <label className="text-sm font-medium">Email Address</label>
                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-black/5 dark:bg-white/5 border rounded-md text-sm" />
                        </div>
                        
                        <motion.button whileTap={{ scale: 0.96 }} type="submit" disabled={loading}
                            className="w-full btn-gradient inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg shadow-lg text-white disabled:opacity-70">
                            {loading ? <Spinner className="w-5 h-5 text-white" /> : 'Send Reset Link'}
                        </motion.button>
                        
                        <button type="button" onClick={() => setView('login')} className="w-full text-sm text-gray-500 hover:text-gray-800 transition-colors">
                            Back to Login
                        </button>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
