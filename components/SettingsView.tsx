
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic.ts';
import { StethoscopeIcon } from './icons/StethoscopeIcon.tsx';
import { LockClosedIcon } from './icons/LockClosedIcon.tsx';
import { FolderIcon } from './icons/FolderIcon.tsx';
import { SettingsIcon } from './icons/SettingsIcon.tsx';
import { HistoryIcon } from './icons/HistoryIcon.tsx';

interface SettingsViewProps {
    onBack?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
    const { triggerHaptic } = useHaptic();
    const [searchQuery, setSearchQuery] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [hapticFeedback, setHapticFeedback] = useState(true);
    const [autoSync, setAutoSync] = useState(true);

    const [activeModule, setActiveModule] = useState<string | null>(null);

    const cards = [
        { id: 'profile', title: 'Profile & Clinic', desc: 'Manage practice locations and clinical identity details.', icon: <StethoscopeIcon className="size-8" />, color: 'brand-green' },
        { id: 'security', title: 'Security & Audit', desc: 'High-precision access logs and role permissions.', icon: <LockClosedIcon className="size-8" />, color: 'brand-blue' },
        { id: 'engine', title: 'Clinical Engine', desc: 'RxNorm/FDA real-time database synchronization.', icon: <FolderIcon className="size-8" />, color: 'brand-green' },
        { id: 'accessibility', title: 'Accessibility', desc: 'Dynamic text scaling and high-contrast visual modes.', icon: <span className="material-symbols-outlined text-3xl">accessibility_new</span>, color: 'brand-blue' },
        { id: 'multilingual', title: 'Multilingual Support', desc: 'Configure precision translation for sig instructions.', icon: <span className="material-symbols-outlined text-3xl">translate</span>, color: 'brand-blue' },
        { id: 'education', title: 'Patient Education', desc: 'Customize informational materials and guides.', icon: <span className="material-symbols-outlined text-3xl">menu_book</span>, color: 'brand-green' },
        { id: 'notifications', title: 'Notifications', desc: 'Alert thresholds for clinical contradictions.', icon: <span className="material-symbols-outlined text-3xl">notifications_active</span>, color: 'brand-blue' },
        { id: 'integrations', title: 'Integrations', desc: 'Connect EHR and external lab API systems.', icon: <span className="material-symbols-outlined text-3xl">hub</span>, color: 'brand-blue', beta: true },
    ];

    const handleApplyChanges = () => {
        triggerHaptic('success');
        setActiveModule(null);
    };

    const renderModuleDetail = () => {
        switch (activeModule) {
            case 'engine':
                return <ClinicalEngineModule onBack={() => setActiveModule(null)} />;
            case 'billing':
                return <BillingModule onBack={() => setActiveModule(null)} />;
            case 'integrations':
                return <IntegrationsModule onBack={() => setActiveModule(null)} />;
            case 'accessibility':
                return <AccessibilityModule onBack={() => setActiveModule(null)} />;
            default:
                return (
                    <div className="p-12 text-center space-y-6">
                        <div className="size-24 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto">
                            <span className="material-symbols-outlined text-4xl text-slate-400">construction</span>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Module Under Construction</h3>
                            <p className="text-slate-500 max-w-md mx-auto font-medium">This high-precision clinical module is currently being calibrated for your environment.</p>
                        </div>
                        <button 
                            onClick={() => setActiveModule(null)}
                            className="px-8 py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                        >
                            Return to Grid
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-12 pb-32">
            
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <button onClick={onBack} className="hover:text-brand-blue transition-colors">Home</button>
                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                <button 
                    onClick={() => setActiveModule(null)}
                    className={`transition-colors ${activeModule ? 'hover:text-brand-blue' : 'text-brand-blue'}`}
                >
                    Settings
                </button>
                {activeModule && (
                    <>
                        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                        <span className="text-brand-blue">{cards.find(c => c.id === activeModule)?.title}</span>
                    </>
                )}
            </nav>

            <AnimatePresence mode="wait">
                {!activeModule ? (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-12"
                    >
                        {/* Hero Section */}
                        <section className="relative overflow-hidden rounded-[3rem] bg-white dark:bg-slate-900 shadow-2xl shadow-brand-blue/5 border border-brand-blue/10 p-8 md:p-16">
                            <div className="absolute inset-0 opacity-30 pointer-events-none">
                                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[80%] bg-brand-blue/20 blur-[120px] rounded-full" />
                                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[70%] bg-brand-green/20 blur-[100px] rounded-full" />
                            </div>

                            <div className="relative grid lg:grid-cols-2 gap-12 items-center">
                                <div className="flex flex-col gap-8">
                                    <div className="space-y-4">
                                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                                            Settings <span className="text-slate-400 font-light">&amp;</span><br />
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-green">Preferences</span>
                                        </h1>
                                        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-md leading-relaxed">
                                            Manage your clinical profile, security protocols, and system configurations with AI-driven insights.
                                        </p>
                                    </div>

                                    <div className="relative max-w-md group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/20 to-brand-green/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full" />
                                        <div className="relative flex items-center bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-6 py-4 shadow-sm group-focus-within:border-brand-blue/50 transition-all">
                                            <span className="material-symbols-outlined text-slate-400 mr-3">search</span>
                                            <input 
                                                type="text" 
                                                placeholder="Search settings..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 w-full font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="relative flex justify-center lg:justify-end">
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="relative w-72 h-72 md:w-80 md:h-80"
                                    >
                                        <div className="absolute inset-0 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/60 dark:border-white/10 shadow-2xl" />
                                        
                                        <motion.div 
                                            animate={{ y: [0, -10, 0] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                            className="absolute -top-4 -right-8 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-xl border border-slate-100 dark:border-white/10 flex items-center gap-2 z-10 animate-pulse-ai"
                                        >
                                            <div className="size-2 rounded-full bg-brand-green animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">System Optimal</span>
                                        </motion.div>

                                        <motion.div 
                                            animate={{ y: [0, 10, 0] }}
                                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                            className="absolute bottom-12 -left-12 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 flex items-center gap-2 z-10"
                                        >
                                            <span className="material-symbols-outlined text-brand-green text-sm">shield</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Protected</span>
                                        </motion.div>

                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-gradient-to-br from-brand-blue to-brand-green blur-2xl opacity-40 rounded-full" />
                                                <div className="relative size-40 md:size-48 rounded-full bg-gradient-to-br from-brand-blue to-brand-green flex items-center justify-center shadow-2xl border-4 border-white/20">
                                                    <SettingsIcon className="size-24 text-white" />
                                                </div>
                                                <motion.div 
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="absolute -top-2 -right-2 size-8 bg-rose-500 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center"
                                                >
                                                    <div className="size-2 bg-white rounded-full" />
                                                </motion.div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </section>

                        {/* Category Grid */}
                        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {cards.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).map((card) => (
                                <motion.div
                                    key={card.id}
                                    whileHover={{ y: -5 }}
                                    onClick={() => { triggerHaptic('light'); setActiveModule(card.id); }}
                                    className={`group relative p-8 rounded-[2.5rem] border transition-all cursor-pointer bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 hover:border-brand-blue/20 hover:shadow-2xl hover:shadow-brand-blue/5`}
                                >
                                    <div className={`size-16 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110
                                        ${card.color === 'brand-green' 
                                            ? 'bg-brand-green/10 text-brand-green' 
                                            : 'bg-brand-blue/10 text-brand-blue'
                                        }`}
                                    >
                                        {card.icon}
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                        {card.title}
                                        {card.beta && (
                                            <span className="text-[10px] bg-brand-blue text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Beta</span>
                                        )}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                        {card.desc}
                                    </p>
                                </motion.div>
                            ))}
                        </section>

                        {/* System Preferences */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-brand-blue">tune</span>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">System Preferences</h2>
                            </div>
                            
                            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-white/5 overflow-hidden divide-y divide-slate-50 dark:divide-white/5">
                                {[
                                    { id: 'dark', label: 'Dark Mode', desc: 'Enable high-contrast dark interface for night shifts', icon: 'dark_mode', val: darkMode, set: setDarkMode },
                                    { id: 'haptic', label: 'Haptic Feedback', desc: 'Tactile confirmation on data validation steps', icon: 'vibration', val: hapticFeedback, set: setHapticFeedback },
                                    { id: 'sync', label: 'Auto-Sync Data', desc: 'Automatic background synchronization with central registry', icon: 'sync', val: autoSync, set: setAutoSync }
                                ].map((pref) => (
                                    <div key={pref.id} className="flex items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-6">
                                            <div className="size-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500">
                                                <span className="material-symbols-outlined text-2xl">{pref.icon}</span>
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{pref.label}</p>
                                                <p className="text-sm text-slate-500 font-medium">{pref.desc}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => { triggerHaptic('light'); pref.set(!pref.val); }}
                                            className={`w-14 h-8 rounded-full relative transition-all duration-300 flex items-center px-1 ${pref.val ? 'bg-brand-green' : 'bg-slate-200 dark:bg-slate-800'} min-h-[44px]`}
                                        >
                                            <motion.div 
                                                animate={{ x: pref.val ? 24 : 0 }}
                                                className="size-6 bg-white rounded-full shadow-lg"
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </motion.div>
                ) : (
                    <motion.div
                        key="detail"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-2xl overflow-hidden"
                    >
                        {renderModuleDetail()}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sticky Action Button */}
            <AnimatePresence>
                {activeModule && (
                    <div className="fixed bottom-8 right-8 z-50">
                        <motion.button
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleApplyChanges}
                            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-green text-white font-black shadow-2xl shadow-brand-blue/30 hover:shadow-brand-blue/50 transition-all uppercase tracking-widest text-xs animate-glimmer"
                        >
                            <span className="material-symbols-outlined">verified</span>
                            Save Module Changes
                        </motion.button>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AccessibilityModule: React.FC = () => {
    const [textSize, setTextSize] = useState(100);
    const [highContrast, setHighContrast] = useState(false);
    const [colorBlindMode, setColorBlindMode] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);

    return (
        <div className="p-8 md:p-12 space-y-12">
            <div className="space-y-1">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Accessibility</h2>
                <p className="text-slate-500 font-medium">Visual and Interaction Calibration</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <label className="clinical-label mb-0">Dynamic Text Scaling</label>
                            <span className="text-brand-blue font-mono font-bold">{textSize}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="80" 
                            max="150" 
                            value={textSize} 
                            onChange={(e) => setTextSize(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                        />
                        <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                            Adjusts the base font size across the clinical interface for improved readability in varied lighting.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {[
                            { id: 'contrast', label: 'High Contrast Mode', desc: 'Increases distinction between UI layers', val: highContrast, set: setHighContrast },
                            { id: 'colorblind', label: 'Color Blind Safe Icons', desc: 'Adds distinct shapes to status indicators', val: colorBlindMode, set: setColorBlindMode },
                            { id: 'motion', label: 'Reduced Motion', desc: 'Minimizes non-critical animations', val: reducedMotion, set: setReducedMotion }
                        ].map((pref) => (
                            <div key={pref.id} className="flex items-center justify-between p-6 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                                <div>
                                    <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">{pref.label}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">{pref.desc}</p>
                                </div>
                                <button 
                                    onClick={() => pref.set(!pref.val)}
                                    className={`w-12 h-7 rounded-full relative transition-all flex items-center px-1 ${pref.val ? 'bg-brand-blue' : 'bg-slate-300 dark:bg-slate-700'}`}
                                >
                                    <motion.div animate={{ x: pref.val ? 20 : 0 }} className="size-5 bg-white rounded-full shadow-sm" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-8 rounded-[3rem] bg-slate-900 text-white space-y-6 border border-white/10">
                        <h4 className="text-xs font-black uppercase tracking-widest text-brand-blue">Live Preview</h4>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <p style={{ fontSize: `${(textSize / 100) * 14}px` }} className="font-bold">
                                    Patient: John Doe
                                </p>
                                <p style={{ fontSize: `${(textSize / 100) * 12}px` }} className="text-slate-400">
                                    DOB: 12/05/1984
                                </p>
                            </div>
                            <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                <span className="material-symbols-outlined text-sm">verified</span>
                                <span style={{ fontSize: `${(textSize / 100) * 10}px` }} className="font-black uppercase tracking-widest">Clinically Verified</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ClinicalEngineModule: React.FC = () => {
    const [sensitivity, setSensitivity] = useState(85);
    const [realTimeSync, setRealTimeSync] = useState(true);
    const [testSig, setTestSig] = useState('1 tab po qid ac');
    const [lastSync, setLastSync] = useState(new Date());

    useEffect(() => {
        if (!realTimeSync) return;
        const interval = setInterval(() => {
            setLastSync(new Date());
        }, 3000);
        return () => clearInterval(interval);
    }, [realTimeSync]);
    
    return (
        <div className="p-8 md:p-12 space-y-12">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Clinical Engine</h2>
                    <p className="text-slate-500 font-medium">RxNorm & FDA Database Configuration</p>
                </div>
                <div className="flex items-center gap-3 bg-brand-green/10 text-brand-green px-4 py-2 rounded-full border border-brand-green/10">
                    <span className="size-2 rounded-full bg-brand-green animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Live Sync Active</span>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
                {/* Left Column: Calibration */}
                <div className="space-y-8">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <label className="clinical-label mb-0">AI Sensitivity Threshold</label>
                            <span className="text-brand-green font-mono font-bold">{sensitivity}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="50" 
                            max="100" 
                            value={sensitivity} 
                            onChange={(e) => setSensitivity(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-green focus:ring-2 focus:ring-brand-green/50 dark:ring-offset-slate-900"
                        />
                        <p className="text-[10px] text-slate-400 leading-relaxed italic font-medium">
                            {sensitivity > 90 ? 'Strict (FDA Only): Minimizes hallucinations, requires clear ink.' : 
                             sensitivity > 75 ? 'Balanced: Standard clinical calibration for handwritten Rx.' : 
                             'Aggressive: High recall, requires manual verification of all flags.'}
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <HistoryIcon className="size-5 text-brand-blue" />
                                <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">FDA Real-time Sync</span>
                            </div>
                            <button 
                                onClick={() => setRealTimeSync(!realTimeSync)}
                                className={`w-14 h-8 rounded-full relative transition-all flex items-center px-1 ${realTimeSync ? 'bg-brand-green' : 'bg-slate-300 dark:bg-slate-700'} min-h-[44px]`}
                            >
                                <motion.div animate={{ x: realTimeSync ? 24 : 0 }} className="size-6 bg-white rounded-full shadow-md border border-slate-200 dark:border-white/20" />
                            </button>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            <span>Last Database Update</span>
                            <span className="font-mono">{lastSync.toISOString().replace('T', ' ').split('.')[0]}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Test Bench */}
                <div className="space-y-6">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Sig Instruction Test Bench</label>
                    <div className="relative">
                        <textarea 
                            value={testSig}
                            onChange={(e) => setTestSig(e.target.value)}
                            className="w-full h-32 bg-slate-900 text-brand-blue font-mono text-sm p-6 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue/50"
                            placeholder="Enter sig code..."
                        />
                        <div className="absolute bottom-4 right-4 flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-blue/50">Parser v4.2.0</span>
                        </div>
                    </div>
                    <div className="p-6 rounded-2xl border border-brand-blue/20 bg-brand-blue/5 space-y-3">
                        <div className="flex items-center gap-2 text-brand-blue">
                            <span className="material-symbols-outlined text-sm">verified</span>
                            <span className="text-xs font-black uppercase tracking-widest">Parsed Output</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Frequency</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">4 times daily</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Timing</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Before meals</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BillingModule: React.FC = () => {
    const scansUsed = 842;
    const scansLimit = 1000;
    const percentage = (scansUsed / scansLimit) * 100;

    return (
        <div className="p-8 md:p-12 space-y-12">
            <div className="space-y-1">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Billing & Plans</h2>
                <p className="text-slate-500 font-medium">Enterprise Subscription Management</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div className="p-8 rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-6 shadow-2xl">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-green mb-1">Current Plan</p>
                                <h3 className="text-2xl font-black uppercase tracking-tight">Clinical Pro</h3>
                            </div>
                            <span className="bg-brand-green text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Active</span>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                <span className="text-slate-400">Monthly Usage</span>
                                <span>{scansUsed} / {scansLimit} Scans</span>
                            </div>
                            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    className="h-full bg-gradient-to-r from-brand-blue to-brand-green"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-between border-t border-white/10">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Next Billing Date</p>
                                <p className="font-bold">April 12, 2026</p>
                            </div>
                            <button className="text-xs font-black text-brand-green hover:text-brand-green/80 transition-colors uppercase tracking-widest">Manage Plan</button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Payment Methods</h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-6 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-500">credit_card</span>
                                </div>
                                <div>
                                    <p className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">•••• 4242</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Expires 12/28</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Default</span>
                        </div>
                        <button className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:border-brand-blue/50 hover:text-brand-blue transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-sm">add</span>
                            Add Payment Method
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const IntegrationsModule: React.FC = () => {
    return (
        <div className="p-8 md:p-12 space-y-12">
            <div className="space-y-1">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Integrations</h2>
                <p className="text-slate-500 font-medium">EHR & External API Connectivity</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">API Access Keys</label>
                        <div className="space-y-3">
                            {[
                                { name: 'Epic EHR Connector', key: 'sk_live_••••••••••••••••4e2a', status: 'connected' },
                                { name: 'Cerner Health API', key: 'sk_live_••••••••••••••••91b0', status: 'connected' },
                                { name: 'LabCorp Direct', key: 'Not Configured', status: 'disconnected' }
                            ].map((api) => (
                                <div key={api.name} className="p-6 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{api.name}</p>
                                        <p className="text-[10px] font-mono text-slate-400">{api.key}</p>
                                    </div>
                                    <div className={`size-3 rounded-full ${api.status === 'connected' ? 'bg-brand-green' : 'bg-slate-300'}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-8 rounded-[3rem] bg-brand-blue/5 border border-brand-blue/20 space-y-6">
                        <div className="flex items-center gap-3 text-brand-blue">
                            <span className="material-symbols-outlined">webhook</span>
                            <span className="text-xs font-black uppercase tracking-widest">Webhook Endpoints</span>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                            Receive real-time clinical alerts and verification updates directly in your hospital information system.
                        </p>
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                placeholder="https://api.yourclinic.com/webhooks/rxsnap"
                                className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                            />
                            <button className="w-full py-3 rounded-xl bg-brand-blue text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-blue/20 hover:shadow-brand-blue/40 transition-all">
                                Update Endpoint
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
