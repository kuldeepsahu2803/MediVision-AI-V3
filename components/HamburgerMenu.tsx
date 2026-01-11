
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleIcon } from './icons/GoogleIcon.tsx';
import { PrescriptionData } from '../types.ts';
import { SunIcon } from './icons/SunIcon.tsx';
import { MoonIcon } from './icons/MoonIcon.tsx';
import { ComputerDesktopIcon } from './icons/ComputerDesktopIcon.tsx';
import { exportBulkPDF } from '../lib/pdfUtils.ts';
import { Spinner } from './Spinner.tsx';
import { useHaptic } from '../hooks/useHaptic.ts';
import { motion, AnimatePresence } from 'framer-motion';
import { AppTab } from '../constants/navigation.ts';
import { ProfileView } from './ProfileView.tsx';

// --- ICONS ---
const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);
const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995a6.473 6.473 0 010 1.248c0 .382.145.755.438.995l1.003.827c.48.398.664 1.023.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995a6.473 6.473 0 010-1.248c0-.382-.145-.755-.438-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 016 0z" />
  </svg>
);
const QuestionMarkCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
  </svg>
);
const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);
const CameraIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
    <path fillRule="evenodd" d="M.667 5.5a3 3 0 013-3h12.666a3 3 0 013 3v9a3 3 0 01-3 3H3.667a3 3 0 01-3-3v-9zM3.5 5.5a.5.5 0 00-.5.5v9a.5.5 0 00.5.5h13a.5.5 0 00.5-.5v-9a.5.5 0 00-.5-.5h-13z" clipRule="evenodd" />
  </svg>
);


// --- HOOKS ---
type Theme = 'light' | 'dark' | 'auto';
const useTheme = (): [Theme, (theme: Theme) => void] => {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('theme_mode') as Theme) || 'light');

  const applyTheme = useCallback((t: Theme) => {
    const root = window.document.documentElement;
    if (t === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', t === 'dark');
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('theme_mode', theme);
    applyTheme(theme);
    
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('auto');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, applyTheme]);
  
  return [theme, setThemeState];
};

// --- SUB-COMPONENTS ---
type User = { name: string; email: string; id: string };

const Avatar: React.FC<{ user: User | null }> = ({ user }) => {
    const getInitials = (name: string) => name
        .split(' ')
        .map(n => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div className="relative group">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl ring-2 ring-offset-2 ring-offset-light-bg dark:ring-offset-dark-bg ring-[var(--glow-primary)]/50
                ${user ? 'bg-[var(--glow-primary)]/20 text-[var(--glow-primary)]' : 'bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-300'}`}>
                {user ? getInitials(user.name) : <UserIcon className="w-8 h-8" />}
            </div>
            {user && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" title="Change profile picture (coming soon)">
                    <CameraIcon className="w-6 h-6 text-white" />
                </div>
            )}
        </div>
    );
};

const SettingsToggle: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; tooltip?: string }> = ({ label, checked, onChange, tooltip }) => {
    const { triggerHaptic } = useHaptic();
    return (
        <div className="flex items-center justify-between py-2" title={tooltip}>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
        <div className="relative inline-flex items-center cursor-pointer settings-toggle">
            <input 
                type="checkbox" 
                checked={checked} 
                onChange={(e) => { triggerHaptic('light'); onChange(e.target.checked); }} 
                className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked-bg peer-checked:bg-[var(--glow-primary)]"></div>
        </div>
        </div>
    );
};

const FaqItem: React.FC<{ q: string, a: string }> = ({ q, a }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { triggerHaptic } = useHaptic();
    return (
        <div className="border-b border-light-border dark:border-dark-border last:border-b-0">
            <button 
                onClick={() => { triggerHaptic('light'); setIsOpen(!isOpen); }} 
                className="w-full flex justify-between items-center text-left py-3 px-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md"
            >
                <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{q}</span>
                <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="text-sm text-gray-600 dark:text-gray-400 pt-2 pb-4 px-1">{a}</p>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
interface HamburgerMenuProps {
    closeMenu: () => void;
    setActiveTab: (tab: AppTab) => void;
    isLoggedIn: boolean;
    user: User | null;
    history: PrescriptionData[];
    onLogin: () => void;
    onLogout: () => void;
    showTreatments: boolean;
    setShowTreatments: (show: boolean) => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
    closeMenu,
    setActiveTab,
    isLoggedIn,
    user,
    history,
    onLogin,
    onLogout,
    showTreatments,
    setShowTreatments,
    showToast
}) => {
    const [theme, setTheme] = useTheme();
    const [activeSection, setActiveSection] = useState<'main' | 'settings' | 'help' | 'profile'>('main');
    const [isBulkDownloading, setIsBulkDownloading] = useState(false);
    const { triggerHaptic } = useHaptic();

    const handleBulkDownload = useCallback(async () => {
        if (history.length > 0) {
            triggerHaptic('medium');
            setIsBulkDownloading(true);
            try {
                const { exportBulkPDF } = await import('../lib/pdfUtils.ts');
                await exportBulkPDF(history);
                triggerHaptic('success');
                showToast('Bulk PDF export started.', 'info');
            } catch (e) {
                console.error(e);
                showToast('Export failed.', 'error');
            } finally {
                setIsBulkDownloading(false);
            }
        } else {
            triggerHaptic('error');
            showToast('No reports to export.', 'error');
        }
    }, [history, showToast, triggerHaptic]);

    const handleThemeChange = (selectedTheme: Theme) => {
        triggerHaptic('light');
        setTheme(selectedTheme);
        showToast(`Theme changed to ${selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)}`, 'success');
    };
    
    const themeOptions: { value: Theme, label: string, icon: React.FC<any> }[] = [
        { value: 'light', label: 'Light', icon: SunIcon },
        { value: 'dark', label: 'Dark', icon: MoonIcon },
        { value: 'auto', label: 'System', icon: ComputerDesktopIcon },
    ];
    
    const faqs = [
        { q: "How accurate is the analysis?", a: "MediVision AI achieves 99.8% extraction accuracy, but human review is mandatory for all clinical decisions." },
        { q: "Is my data secure?", a: "Images are processed securely. Guests store data on device (IndexedDB); Professionals store encrypted data in Supabase Cloud." },
        { q: "What do the badge colors mean?", a: "Green means a definitive RxNorm match. Yellow suggests spelling review. Red indicates a strength mismatch for the ingredient." }
    ];

    const MenuButton = ({ icon: Icon, label, onClick }: { icon: React.FC<any>, label: string, onClick: () => void }) => (
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => { triggerHaptic('light'); onClick(); }} className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-left">
            <Icon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            <span className="font-medium text-gray-800 dark:text-gray-200">{label}</span>
        </motion.button>
    );

    const renderMainContent = () => (
        <>
            <div className="p-6 flex flex-col items-center gap-3 border-b border-light-border dark:border-dark-border">
                <Avatar user={user} />
                {isLoggedIn && user ? (
                    <div className="text-center">
                        <p className="font-bold text-lg text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="font-bold text-lg text-gray-900 dark:text-white">Guest Session</p>
                        <p className="text-xs text-orange-500 font-bold uppercase tracking-widest mt-1">Temporary Storage Active</p>
                    </div>
                )}
            </div>
            <div className="p-4 space-y-2">
                <MenuButton icon={UserIcon} label="Account Profile" onClick={() => setActiveSection('profile')} />
                <MenuButton icon={SettingsIcon} label="Interface Settings" onClick={() => setActiveSection('settings')} />
                <MenuButton icon={QuestionMarkCircleIcon} label="Help & Clinical FAQ" onClick={() => setActiveSection('help')} />
                
                {isLoggedIn ? (
                    <div className="pt-2 mt-2 border-t border-light-border dark:border-dark-border">
                        <motion.button whileTap={{ scale: 0.98 }} onClick={onLogout} className="w-full text-left px-4 py-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors font-medium">
                            Sign Out
                        </motion.button>
                    </div>
                ) : (
                    <div className="p-4">
                        <motion.button whileTap={{ scale: 0.96 }} onClick={onLogin} className="w-full btn-gradient text-white flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold shadow-lg">
                            <GoogleIcon /> Upgrade to Professional
                        </motion.button>
                    </div>
                )}
            </div>
        </>
    );

    const renderSettingsContent = () => (
        <div className="p-4">
            <button onClick={() => { triggerHaptic('light'); setActiveSection('main'); }} className="flex items-center gap-2 font-bold mb-6 text-brand-blue hover:opacity-80 transition-opacity">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                Back
            </button>
            <h3 className="text-lg font-bold px-1 mb-4 text-gray-900 dark:text-white">Settings</h3>
            <div className="space-y-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-700">
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Theme Preference</h4>
                <div className="flex justify-around bg-gray-200 dark:bg-black/30 p-1 rounded-lg">
                    {themeOptions.map(opt => (
                        <motion.button whileTap={{ scale: 0.95 }} key={opt.value} onClick={() => handleThemeChange(opt.value)} 
                            className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-md text-xs transition-colors ${theme === opt.value ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-blue font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                        >
                            <opt.icon className="w-5 h-5" />
                            {opt.label}
                        </motion.button>
                    ))}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                <SettingsToggle 
                    label="Active Regimen Insights"
                    checked={showTreatments}
                    onChange={setShowTreatments}
                    tooltip="Shows interaction checks and AI clinical guidance."
                />
                <SettingsToggle 
                    label="High Contrast Text"
                    checked={false}
                    onChange={() => showToast('High contrast mode coming soon!', 'info')}
                />
            </div>
            {isLoggedIn && (
                 <div className="mt-6 space-y-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-700">
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Archive Export</h4>
                     <motion.button whileTap={{ scale: 0.96 }} onClick={handleBulkDownload} disabled={isBulkDownloading} className="w-full btn-secondary text-sm flex items-center justify-center gap-2 px-4 py-2 rounded-lg disabled:opacity-70 text-gray-700 dark:text-gray-200 font-bold">
                        {isBulkDownloading ? <Spinner className="w-4 h-4" /> : 'Download All Reports (.ZIP)'}
                    </motion.button>
                 </div>
            )}
        </div>
    );

    const renderHelpContent = () => (
         <div className="p-4">
            <button onClick={() => { triggerHaptic('light'); setActiveSection('main'); }} className="flex items-center gap-2 font-bold mb-6 text-brand-blue">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                Back
            </button>
            <h3 className="text-lg font-bold px-1 mb-4 text-gray-900 dark:text-white">Clinical Support</h3>
            <div className="space-y-2 p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-700">
                {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
            </div>
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                    Need technical assistance? Our medical ops team is available at <span className="font-bold">support@medivision.ai</span>
                </p>
            </div>
        </div>
    );
    
    const sectionContent = {
        main: renderMainContent(),
        settings: renderSettingsContent(),
        help: renderHelpContent(),
        profile: <div className="animate-fadeIn"><button onClick={() => setActiveSection('main')} className="p-4 text-brand-blue font-bold flex items-center gap-2">&lt; Back</button><ProfileView user={user} isGuest={!isLoggedIn} onClose={() => setActiveSection('main')} joinedDate={isLoggedIn ? 'March 2024' : undefined} /></div>
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn" onClick={closeMenu}></div>
            <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-zinc-900 shadow-2xl z-[55] flex flex-col animate-slideInRight border-l border-gray-200 dark:border-gray-800">
                <div className="p-4 flex justify-end">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={closeMenu} className="p-2 rounded-full text-2xl font-light text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Close menu">&times;</motion.button>
                </div>
                <div className="flex-grow overflow-y-auto no-scrollbar">
                    {sectionContent[activeSection]}
                </div>
            </div>
        </>
    );
};
