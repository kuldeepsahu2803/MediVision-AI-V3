
import React, { useState } from 'react';
import BrandLogo from './BrandLogo.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from './Spinner.tsx';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';

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

  const isConfigured = isSupabaseConfigured();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // ARCHITECTURAL FIX: Allow attempt even if misconfigured to provide real network feedback
    if (!isConfigured) {
      console.warn("Login attempt in unconfigured environment.");
    }
    
    setLoading(true);
    try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(authError.message === 'Database error saving new user' 
            ? "Clinical Node Error: Storage keys are invalid or misconfigured."
            : authError.message);
        } else if (data.user) {
          onLogin({ 
            name: data.user.user_metadata?.full_name || email.split('@')[0], 
            email: data.user.email || '' 
          });
        }
    } catch {
        setError("Network Error: Could not connect to the clinical authentication node.");
    } finally {
        setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage('Registration successful! Please check your email to confirm your account.');
        setView('login');
      }
    } catch {
      setError("Infrastructure Error: Cloud registration is unavailable.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (resetError) {
          setError(resetError.message);
        } else {
          setMessage('Check your email for the password reset link.');
          setView('login');
        }
      } catch {
        setError("Reset service unavailable.");
      } finally {
        setLoading(false);
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
        <div className="flex justify-between items-start mb-6">
            <BrandLogo variant="header" className="origin-left" />
            <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400">&times;</button>
        </div>
        
        <AnimatePresence mode="wait">
            {view === 'login' && (
                <motion.div key="login" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Clinical Portal</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Authorized medical access required.</p>
                    </div>

                    {!isConfigured && (
                        <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-3">
                            <span className="material-symbols-outlined text-emerald-600 text-lg">clinical_notes</span>
                            <div>
                                <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest leading-none">Clinical Node Discovery</p>
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-1 font-medium italic">Standard environment detected. Cloud sync features may be limited.</p>
                            </div>
                        </div>
                    )}
                    
                    <form onSubmit={handleLogin} className="mt-8 space-y-4">
                        {message && <p className="text-green-500 text-xs font-bold text-center bg-green-500/10 p-2 rounded">{message}</p>}
                        {error && <p className="text-red-500 text-xs font-bold text-center bg-red-500/10 p-2 rounded">{error}</p>}
                        
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Medical Email</label>
                            <input 
                                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                className="mt-1 block w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="clinician@hospital.com"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Security PIN</label>
                                <button type="button" onClick={() => setView('forgot')} className="text-[10px] text-primary font-black uppercase tracking-widest hover:underline">Reset</button>
                            </div>
                            <input 
                                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                className="mt-1 block w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        
                        <motion.button whileTap={{ scale: 0.96 }} type="submit" disabled={loading}
                            className="w-full btn-gradient-cta inline-flex items-center justify-center px-8 py-4 text-sm font-black rounded-xl shadow-lg disabled:opacity-70 mt-4 uppercase tracking-widest">
                            {loading ? <Spinner className="w-5 h-5 text-white" /> : 'Enter Clinical Workspace'}
                        </motion.button>

                        <div className="text-center mt-6">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">New Clinician? </span>
                            <button type="button" onClick={() => setView('signup')} className="text-primary font-black hover:underline uppercase tracking-widest text-[10px] ml-1">Create ID</button>
                        </div>
                    </form>
                </motion.div>
            )}

            {view === 'signup' && (
                <motion.div key="signup" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}>
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Registration</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure your clinical identity.</p>
                    </div>
                    
                    <form onSubmit={handleSignUp} className="mt-6 space-y-4">
                        {error && <p className="text-red-500 text-xs font-bold text-center bg-red-500/10 p-2 rounded">{error}</p>}
                        
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Legal Name</label>
                            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 block w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Dr. Jane Smith" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="name@clinic.com" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Workspace Password</label>
                            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="••••••••" />
                        </div>
                        
                        <motion.button whileTap={{ scale: 0.96 }} type="submit" disabled={loading}
                            className="w-full btn-gradient inline-flex items-center justify-center px-8 py-4 text-sm font-black rounded-xl shadow-lg disabled:opacity-70 mt-4 uppercase tracking-widest">
                            {loading ? <Spinner className="w-5 h-5 text-white" /> : 'Request Clinical Account'}
                        </motion.button>

                        <div className="text-center mt-6">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Already have an ID? </span>
                            <button type="button" onClick={() => setView('login')} className="text-primary font-black hover:underline uppercase tracking-widest text-[10px] ml-1">Login</button>
                        </div>
                    </form>
                </motion.div>
            )}

            {view === 'forgot' && (
                <motion.div key="forgot" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}>
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Security Reset</h2>
                        <p className="text-sm text-slate-500 mt-1">Verification link will be dispatched.</p>
                    </div>

                    <form onSubmit={handleResetSubmit} className="mt-8 space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registered Email</label>
                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="clinician@hospital.com" />
                        </div>
                        
                        <motion.button whileTap={{ scale: 0.96 }} type="submit" disabled={loading}
                            className="w-full btn-gradient inline-flex items-center justify-center px-8 py-4 text-sm font-black rounded-xl shadow-lg disabled:opacity-70 uppercase tracking-widest">
                            {loading ? <Spinner className="w-5 h-5 text-white" /> : 'Dispatch Reset Email'}
                        </motion.button>
                        
                        <button type="button" onClick={() => setView('login')} className="w-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors text-center">
                            Back to Entrance
                        </button>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
