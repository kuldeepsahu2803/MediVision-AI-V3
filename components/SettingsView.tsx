
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic.ts';
import { useAuthSession } from '../hooks/useAuthSession.ts';
import { SettingsIcon } from './icons/SettingsIcon.tsx';
import BrandLogo from './BrandLogo.tsx';

const m = motion as any;

interface SettingsViewProps {
    onBack?: () => void;
}

type SettingsTab = 'profile' | 'security' | 'notifications';

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
    const { triggerHaptic } = useHaptic();
    const { user, isLoggedIn } = useAuthSession();
    
    // Internal Navigation State
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [bio, setBio] = useState('Specializing in AI-driven clinical diagnostics and medical data architecture.');
    
    // Preferences State
    const [twoFactor, setTwoFactor] = useState(false);
    const [sessionTimeout, setSessionTimeout] = useState(true);
    const [notifNewPatient, setNotifNewPatient] = useState(true);
    const [notifAnalysis, setNotifAnalysis] = useState(true);
    const [notifSystem, setNotifSystem] = useState(false);

    useEffect(() => {
        if (user) {
            const names = user.name.split(' ');
            setFirstName(names[0] || '');
            setLastName(names.slice(1).join(' ') || '');
            setEmail(user.email);
        }
    }, [user]);

    const handleSave = () => {
        triggerHaptic('success');
        alert("Settings saved successfully.");
    };

    const handleCancel = () => {
        triggerHaptic('medium');
        if (user) {
            const names = user.name.split(' ');
            setFirstName(names[0]);
            setLastName(names.slice(1).join(' '));
            setEmail(user.email);
        }
    };

    const TabButton = ({ id, label, icon }: { id: SettingsTab, label: string, icon: string }) => (
        <button
            onClick={() => { triggerHaptic('light'); setActiveTab(id); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                ${activeTab === id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
        >
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
            {label}
        </button>
    );

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn flex flex-col gap-8">
            
            {/* Page Header */}
            <div className="flex flex-col gap-1">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                    <button onClick={onBack} className="hover:text-primary transition-colors">Home</button>
                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    <span className="text-primary">Settings</span>
                </nav>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Account Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                    Manage your profile details, security preferences, and system notifications.
                </p>
            </div>

            {/* Horizontal Pill Navigation */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 p-1.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 w-fit">
                <TabButton id="profile" label="Profile" icon="person" />
                <TabButton id="security" label="Security" icon="lock" />
                <TabButton id="notifications" label="Notifications" icon="notifications" />
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                    <m.div 
                        key="profile-tab"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col gap-8"
                    >
                        {/* Profile Main Card */}
                        <section className="glass-panel rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-white/60 dark:border-white/10">
                            <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-12">
                                <div className="flex items-center gap-8">
                                    <div className="relative group">
                                        <div className="size-28 rounded-full bg-slate-100 dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 shadow-xl overflow-hidden">
                                            <img 
                                                src={`https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=00BCD4&color=fff&size=128`} 
                                                alt="Profile" 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <button className="absolute bottom-0 right-0 size-10 bg-primary text-white rounded-full border-4 border-white dark:border-zinc-900 shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                                        </button>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                            {firstName} {lastName}
                                        </h2>
                                        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                                            Chief Medical Officer • ID: MV-8821
                                        </p>
                                        <button className="text-xs font-black text-primary uppercase tracking-widest mt-3 hover:underline">Remove Avatar</button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <button 
                                        onClick={handleCancel}
                                        className="flex-1 md:flex-none px-8 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSave}
                                        className="flex-1 md:flex-none px-8 py-3 rounded-2xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">First Name</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300">badge</span>
                                        <input 
                                            type="text" 
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50/50 dark:bg-black/20 border border-slate-100 dark:border-white/5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Last Name</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300">badge</span>
                                        <input 
                                            type="text" 
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50/50 dark:bg-black/20 border border-slate-100 dark:border-white/5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300">mail</span>
                                        <input 
                                            type="email" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50/50 dark:bg-black/20 border border-slate-100 dark:border-white/5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Clinical Role</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300">workspace_premium</span>
                                        <input 
                                            type="text" 
                                            value="Chief Medical Officer"
                                            disabled
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-sm font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Professional Bio</label>
                                    <textarea 
                                        rows={4}
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="w-full p-6 rounded-[2rem] bg-slate-50/50 dark:bg-black/20 border border-slate-100 dark:border-white/5 text-sm font-medium leading-relaxed focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Security Preview Panel */}
                            <section className="glass-panel rounded-[2.5rem] p-8 shadow-xl border border-white/60 dark:border-white/10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">shield</span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Security</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">Two-Factor Auth</p>
                                            <p className="text-xs text-slate-500 font-medium">Secure your medical credentials.</p>
                                        </div>
                                        <button 
                                            onClick={() => { triggerHaptic('light'); setTwoFactor(!twoFactor); }}
                                            className={`w-12 h-6 rounded-full relative transition-colors ${twoFactor ? 'bg-primary' : 'bg-slate-200 dark:bg-zinc-700'}`}
                                        >
                                            <m.div animate={{ x: twoFactor ? 26 : 4 }} className="absolute top-1 size-4 bg-white rounded-full shadow-sm" />
                                        </button>
                                    </div>
                                    <div className="h-px bg-slate-50 dark:bg-white/5 w-full" />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">Session Timeout</p>
                                            <p className="text-xs text-slate-500 font-medium">Auto-lock after 15 minutes.</p>
                                        </div>
                                        <button 
                                            onClick={() => { triggerHaptic('light'); setSessionTimeout(!sessionTimeout); }}
                                            className={`w-12 h-6 rounded-full relative transition-colors ${sessionTimeout ? 'bg-primary' : 'bg-slate-200 dark:bg-zinc-700'}`}
                                        >
                                            <m.div animate={{ x: sessionTimeout ? 26 : 4 }} className="absolute top-1 size-4 bg-white rounded-full shadow-sm" />
                                        </button>
                                    </div>
                                    <button className="w-full mt-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                                        Change System Password
                                    </button>
                                </div>
                            </section>

                            {/* Notifications Preview Panel */}
                            <section className="glass-panel rounded-[2.5rem] p-8 shadow-xl border border-white/60 dark:border-white/10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="size-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                                        <span className="material-symbols-outlined">notifications_active</span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Alerts</h3>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { id: 'np', label: 'New Patient Alerts', desc: 'Real-time scan notifications.', val: notifNewPatient, set: setNotifNewPatient },
                                        { id: 'ac', label: 'Analysis Complete', desc: 'Verification status updates.', val: notifAnalysis, set: setNotifAnalysis },
                                        { id: 'su', label: 'System Safety Updates', desc: 'Critical clinical news.', val: notifSystem, set: setNotifSystem }
                                    ].map(item => (
                                        <label key={item.id} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={item.val} 
                                                onChange={(e) => { triggerHaptic('light'); item.set(e.target.checked); }}
                                                className="mt-1 size-5 rounded border-slate-200 dark:border-white/10 text-primary focus:ring-primary/20 bg-white dark:bg-black/40"
                                            />
                                            <div>
                                                <p className="text-sm font-black text-slate-800 dark:text-white">{item.label}</p>
                                                <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Danger Zone */}
                        <section className="rounded-[2rem] border border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-900/10 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-center md:text-left">
                                <h4 className="text-base font-black text-rose-700 dark:text-rose-400 uppercase tracking-tight">Clinical Record Termination</h4>
                                <p className="text-sm text-rose-600/80 dark:text-rose-500/60 font-medium">Permanently purge your clinical profile and all associated PHI history.</p>
                            </div>
                            <button className="px-8 py-3 rounded-xl bg-white dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-sm font-black text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all shadow-sm">
                                Delete Account
                            </button>
                        </section>
                    </m.div>
                )}

                {activeTab !== 'profile' && (
                    <m.div 
                        key="other-tabs"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-32 flex flex-col items-center justify-center text-center glass-panel rounded-[2.5rem] border-dashed border-slate-200 dark:border-white/10"
                    >
                        <div className="size-20 rounded-3xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6">
                            <span className="material-symbols-outlined text-4xl">construction</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Module Restricted</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm font-medium">
                            Full access to {activeTab} settings is restricted to institutional administrators during the pilot program.
                        </p>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
};
