import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NotifyModal = ({ serviceName, onClose }: { serviceName: string, onClose: () => void }) => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        // Simulation of API waitlist registration
        setTimeout(onClose, 2500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xl" onClick={onClose}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-slate-200 dark:border-white/10"
            >
                {!submitted ? (
                    <>
                        <div className="w-16 h-16 bg-secondary-light dark:bg-secondary-dark/20 rounded-2xl flex items-center justify-center text-secondary mb-6">
                            <span className="material-symbols-outlined text-3xl">notifications_active</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{serviceName}</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed">
                            This clinical module is currently in private beta training. Join our medical waitlist to get early access when we go live.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-xl">mail</span>
                                <input 
                                    type="email" 
                                    required 
                                    placeholder="Medical ID Email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                            </div>
                            <button type="submit" className="w-full bg-secondary text-white py-4 rounded-2xl font-bold shadow-lg shadow-secondary/20 hover:bg-secondary-dark transition-all active:scale-95">
                                Join Waitlist
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-10">
                        <motion.div 
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }} 
                            className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                            <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
                        </motion.div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Registration Successful</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                            We've added your clinical profile to the queue. You'll receive an invitation once {serviceName} is ready for verification.
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

const ServiceCard = ({ title, desc, icon, active, onClick, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    onClick={onClick}
    className={`group relative bg-white dark:bg-zinc-900 border ${active ? 'border-primary cursor-pointer hover:shadow-glow' : 'border-slate-200 dark:border-white/5 opacity-60 grayscale-[0.5] cursor-pointer'} rounded-[2.5rem] p-8 hover:scale-[1.02] active:bg-slate-50 dark:active:bg-slate-800/50 h-full flex flex-col justify-between overflow-hidden transition-all duration-300`}
  >
    <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
            <div className={`w-16 h-16 rounded-2xl ${active ? 'bg-primary-light dark:bg-primary-dark/20 text-primary' : 'bg-slate-100 dark:bg-white/5 text-slate-400'} flex items-center justify-center shrink-0 transition-colors group-hover:scale-110 duration-500`}>
                <span className="material-symbols-outlined text-[32px]">{icon}</span>
            </div>
            {active ? (
                <span className="px-4 py-1.5 rounded-full bg-primary-dark text-primary-light text-[10px] font-black uppercase tracking-widest shrink-0">Available Now</span>
            ) : (
                <span className="px-4 py-1.5 rounded-full bg-secondary-dark text-secondary-light text-[10px] font-black uppercase tracking-widest shrink-0">Coming Soon</span>
            )}
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 leading-tight tracking-tight">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">{desc}</p>
    </div>
    
    <div className={`mt-8 flex items-center font-black text-xs uppercase tracking-[0.15em] opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 ${active ? 'text-primary' : 'text-secondary'}`}>
        {active ? (
            <>Launch Analyzer <span className="material-symbols-outlined text-sm ml-2">arrow_forward</span></>
        ) : (
            <>Request Access <span className="material-symbols-outlined text-sm ml-2">notifications</span></>
        )}
    </div>

    {/* Subtle Background Pattern for Active Cards */}
    {active && (
        <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
            <span className="material-symbols-outlined text-[160px]">{icon}</span>
        </div>
    )}
  </motion.div>
);

interface ServicesViewProps {
  onSelectService: (service: string) => void;
  onBack: () => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ onSelectService, onBack }) => {
  const [notifyTarget, setNotifyTarget] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'soon'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const services = [
    { 
      id: 'rx', 
      title: 'Handwritten Prescription', 
      icon: 'description', 
      desc: 'Transcribe and verify handwritten medical documents using clinical-grade vision AI.', 
      active: true 
    },
    { 
      id: 'xray', 
      title: 'X-Ray Report', 
      icon: 'radiology', 
      desc: 'AI-assisted analysis of radiology imaging to identify fractures and structural abnormalities.', 
      active: false 
    },
    { 
      id: 'ct', 
      title: 'CT Scan Report', 
      icon: 'layers', 
      desc: 'Cross-sectional imaging analysis for precision diagnostics and internal tissue mapping.', 
      active: false 
    },
    { 
      id: 'blood', 
      title: 'Blood Test Report', 
      icon: 'bloodtype', 
      desc: 'Automated extraction and trend analysis for clinical hematology and biochemistry data.', 
      active: false 
    },
    { 
      id: 'mri', 
      title: 'MRI Scan Report', 
      icon: 'neurology', 
      desc: 'Neural network interpretation of magnetic resonance imaging for soft tissue diagnostics.', 
      active: false 
    },
  ];

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            s.desc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'all' || 
                            (filter === 'active' && s.active) || 
                            (filter === 'soon' && !s.active);
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filter]);

  return (
    <div className="min-h-screen w-full flex flex-col font-display bg-[#f8f9fa] dark:bg-black relative overflow-x-hidden">
      <AnimatePresence>
        {notifyTarget && <NotifyModal serviceName={notifyTarget} onClose={() => setNotifyTarget(null)} />}
      </AnimatePresence>

      {/* Persistent Navigation Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>medical_services</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">MediVision AI</h1>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={onBack} 
                className="text-slate-500 hover:text-primary transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-5 py-2.5 rounded-full hover:shadow-lg active:scale-95"
            >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Change Workspace
            </button>
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-400">account_circle</span>
            </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto p-6 md:p-16 flex flex-col gap-16">
        
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-10">
          <div className="flex flex-col gap-5 max-w-2xl text-center md:text-left">
            <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 w-fit mx-auto md:mx-0"
            >
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Clinical Service Selection</span>
            </motion.div>
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.95]">
                Select an <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">AI Module</span>
            </h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-lg leading-relaxed">
                Connect your medical data to our specialized diagnostic engines.
            </p>
          </div>
          
          <button 
            onClick={() => onSelectService('rx')}
            className="hidden md:flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-black px-10 py-5 rounded-full font-black text-sm shadow-2xl hover:scale-105 transition-all group active:scale-95"
          >
            <span>Clinical Dashboard</span>
            <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">dashboard</span>
          </button>
        </div>

        {/* Dynamic Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 sticky top-[96px] z-40 py-2">
          {/* Enhanced Search */}
          <div className="relative w-full md:w-[450px] group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            </div>
            <input 
                className="block w-full pl-14 pr-6 py-5 bg-white dark:bg-zinc-900 border-2 border-slate-100 dark:border-white/5 text-slate-900 dark:text-white rounded-[2rem] focus:ring-4 focus:ring-primary/10 focus:border-primary placeholder-slate-400 transition-all shadow-xl shadow-slate-200/50 dark:shadow-none outline-none font-medium" 
                placeholder="Search medical modules..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Logic-driven Chips */}
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar px-1">
            {[
                { label: 'All Modules', val: 'all' },
                { label: 'Live Now', val: 'active' },
                { label: 'Waitlist', val: 'soon' }
            ].map(item => (
                <button 
                    key={item.val}
                    onClick={() => setFilter(item.val as any)}
                    className={`px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-widest transition-all active:scale-95 border-2 ${
                        filter === item.val 
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white shadow-xl' 
                        : 'bg-white dark:bg-zinc-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-white/5 hover:border-primary/20 hover:text-primary'
                    }`}
                >
                    {item.label}
                </button>
            ))}
          </div>
        </div>

        {/* Adaptive Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-32">
          {filteredServices.map((s, i) => (
            <ServiceCard 
              key={s.id} 
              {...s} 
              onClick={() => s.active ? onSelectService(s.id) : setNotifyTarget(s.title)} 
              delay={i * 0.08}
            />
          ))}
          
          {/* Empty State */}
          {filteredServices.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="col-span-full py-32 flex flex-col items-center justify-center text-center bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-white/5"
              >
                  <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6">
                    <span className="material-symbols-outlined text-5xl">search_off</span>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">No Matching Modules</h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">We couldn't find any clinical modules matching your current search parameters.</p>
                  <button 
                    onClick={() => { setSearchQuery(''); setFilter('all'); }}
                    className="mt-8 text-primary font-black text-xs uppercase tracking-widest hover:underline"
                  >
                    Clear All Filters
                  </button>
              </motion.div>
          )}
        </div>
      </main>

      {/* Mobile Floating Access - Reactive to active state */}
      <div className="md:hidden fixed bottom-8 right-8 z-50">
        <button 
            onClick={() => onSelectService('rx')}
            className="w-16 h-16 rounded-[2rem] bg-gradient-to-r from-primary to-secondary flex items-center justify-center shadow-2xl shadow-primary/40 text-white active:scale-90 transition-transform"
        >
            <span className="material-symbols-outlined text-3xl">add_task</span>
        </button>
      </div>

      {/* Footer Metadata */}
      <footer className="w-full max-w-7xl mx-auto px-8 py-10 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            MediVision AI Systems • Professional Clinical Tier
         </p>
         <div className="flex gap-8 items-center grayscale opacity-40">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-400 rounded-md" />
                <span className="text-[9px] font-black uppercase tracking-widest">ISO 27001</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-400 rounded-md" />
                <span className="text-[9px] font-black uppercase tracking-widest">HIPAA Ready</span>
            </div>
         </div>
      </footer>
    </div>
  );
}