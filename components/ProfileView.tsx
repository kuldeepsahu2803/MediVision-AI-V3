
import React from 'react';
import { motion } from 'framer-motion';

interface ProfileViewProps {
  user: { name: string; email: string; id: string } | null;
  isGuest: boolean;
  joinedDate?: string;
  onClose: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, isGuest, joinedDate, onClose }) => {
    return (
        <div className="p-6 space-y-8 animate-fadeIn">
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-brand-blue/10 flex items-center justify-center text-3xl font-black text-brand-blue border-4 border-white dark:border-zinc-800 shadow-xl">
                    {user?.name?.[0] || 'G'}
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">{user?.name || 'Guest User'}</h2>
                    <p className="text-sm text-slate-500">{user?.email || 'Temporary Session'}</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-3">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Account Metadata</h3>
                    <div className="grid grid-cols-2 gap-y-4">
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Status</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isGuest ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                {isGuest ? 'Standard Guest' : 'Verified Professional'}
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Clinical Tier</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{isGuest ? 'Limited' : 'Full Access'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Internal UID</p>
                            <p className="text-xs font-mono text-slate-500 truncate">{user?.id || 'LOCAL-GUEST-SESSION'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Registration</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{joinedDate || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {!isGuest && (
                    <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                        <p className="text-[10px] text-blue-500 font-bold uppercase mb-2">Professional Credentials</p>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Verified License</span>
                            <span className="text-xs font-black text-blue-600">CERT-PRO-2024</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-4">
                <button onClick={onClose} className="w-full btn-secondary py-3 rounded-xl font-bold">Close Profile</button>
            </div>
        </div>
    );
};
