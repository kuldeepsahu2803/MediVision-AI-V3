import React, { useState } from 'react';
import BrandLogo from './BrandLogo.tsx';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingViewProps {
  onStart: () => void;
}

// --- Local Icons ---
const RocketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

// --- Sub-components (Moved outside to prevent re-creation) ---

const FeatureCard = ({ title, desc, icon, color, bg, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="glass-panel p-8 rounded-3xl flex flex-col gap-5 hover:border-cyan-400/30 dark:hover:border-cyan-400/30 transition-all group hover:-translate-y-1"
  >
    <div className={`size-14 rounded-2xl ${bg} ${color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
        {icon}
    </div>
    <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

const Step = ({ number, title, desc, color, delay }: any) => (
    <motion.div 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        className="mb-10 relative pl-8"
    >
        <span className={`absolute -left-[10px] top-0 size-5 rounded-full ${color} border-4 border-white dark:border-slate-900 shadow-md`}></span>
        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{number}. {title}</h4>
        <p className="text-slate-600 dark:text-slate-400 text-sm">{desc}</p>
    </motion.div>
);

const LandingView: React.FC<LandingViewProps> = ({ onStart }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const handleComingSoon = (e: React.MouseEvent) => {
      e.preventDefault();
      alert("This section is currently under development. Please check back soon!");
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-white font-sans overflow-x-hidden selection:bg-cyan-500 selection:text-white relative bg-[#f8f8f5] dark:bg-[#000000] flex flex-col">
      {/* Mesh Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full opacity-40 dark:opacity-20 bg-[radial-gradient(at_0%_0%,hsla(192,57%,92%,1)_0,transparent_50%),radial-gradient(at_50%_0%,hsla(180,48%,94%,1)_0,transparent_50%),radial-gradient(at_100%_0%,hsla(195,65%,90%,1)_0,transparent_50%)]"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-400/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation */}
      <div className="sticky top-0 z-50 w-full flex justify-center p-4">
        <nav className="glass-panel rounded-full px-6 py-3 flex items-center justify-between gap-8 shadow-2xl max-w-6xl w-full border border-white/60 dark:border-white/10 relative">
          <div className="flex items-center gap-3">
            <button onClick={() => scrollToSection('hero')} className="flex items-center gap-2 group" aria-label="MediVision Home">
               <BrandLogo variant="header" />
            </button>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            {['Platform', 'Process', 'Security', 'Resources'].map((label) => (
                <button 
                  key={label} 
                  onClick={() => scrollToSection(label.toLowerCase() === 'process' ? 'how-it-works' : label.toLowerCase())} 
                  className="text-sm font-bold text-slate-600 hover:text-cyan-500 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                    {label}
                </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button 
                onClick={onStart}
                className="hidden sm:flex bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-black px-8 py-2.5 rounded-full text-sm font-black transition-all shadow-lg hover:shadow-xl active:scale-95 items-center gap-2 group"
            >
              <span>Get Started</span>
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
            </button>
            
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
            </button>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <section id="hero" className="relative flex-1 flex flex-col justify-center pt-16 pb-24 px-4 sm:px-8 z-10 scroll-mt-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-10 text-center lg:text-left"
          >
            <div className="flex flex-col items-center lg:items-start gap-4 mb-2">
              <div className="inline-flex items-center gap-3 bg-white/40 dark:bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/60 dark:border-white/10 shadow-sm w-fit">
                <BrandLogo variant="header" className="h-6 origin-left" />
                <span className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1"></span>
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Clinical Cockpit v2.1</span>
              </div>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black leading-[1] tracking-tight text-slate-900 dark:text-white">
              Prescription Clarity <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-rose-500">at the Speed of Sight</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Turn handwritten scripts into verified data instantly with our AI-powered clinical cockpit. Experience the future of pharmacy workflows with high-fidelity accuracy.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5">
              <button 
                onClick={onStart}
                className="bg-cyan-500 text-white px-10 py-5 rounded-full text-lg font-black shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 hover:bg-cyan-600 transition-all flex items-center gap-3"
              >
                Enter Clinical Portal
                <RocketIcon />
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="glass-panel text-slate-800 dark:text-white px-10 py-5 rounded-full text-lg font-black hover:bg-white/80 dark:hover:bg-white/10 transition-all flex items-center gap-3 group"
              >
                <PlayIcon />
                Watch Workflow
              </button>
            </div>
            
            <div className="flex items-center justify-center lg:justify-start gap-4 pt-4 text-sm text-slate-500 font-bold uppercase tracking-widest">
                <div className="flex -space-x-3">
                    {[1,2,3].map(i => (
                        <img key={i} alt="Clinician" className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-900" src={`https://i.pravatar.cc/100?img=${i+10}`} />
                    ))}
                </div>
                <p>Trusted by 2,000+ clinicians</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative hidden lg:block h-[580px] perspective-1000"
          >
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px]"></div>
            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-rose-500/20 rounded-full blur-[100px]"></div>
            
            <div 
                className="relative transform rotate-y-[-10deg] rotate-x-[5deg] transition-all duration-1000 hover:rotate-0 hover:scale-[1.02] w-full h-full"
                style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="glass-panel rounded-[3rem] p-3 shadow-2xl border-white/50 dark:border-white/10 bg-white/40 dark:bg-slate-900/60 backdrop-blur-3xl h-full flex flex-col overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 flex-1 flex flex-col">
                  <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-red-400"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-yellow-400"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-green-400"></div>
                    </div>
                    <div className="text-xs font-black tracking-widest text-slate-400 uppercase">Analysis Cockpit v2.1</div>
                    <div className="w-10"></div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-8 flex gap-6 flex-1">
                    <div className="flex flex-col gap-6 w-14 items-center pt-4">
                      {['dashboard', 'description', 'analytics', 'settings'].map(icon => (
                        <div key={icon} className={`p-2.5 rounded-2xl ${icon === 'dashboard' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
                           <div className="w-6 h-6 border-2 border-current rounded" />
                        </div>
                      ))}
                    </div>

                    <div className="flex-1 flex flex-col gap-6">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h3 className="font-black text-xl text-slate-900 dark:text-white">Rx Processing Queue</h3>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Live Extraction Stream</p>
                        </div>
                        <div className="bg-green-500/10 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">Live</div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 flex gap-5 items-center border-l-[6px] border-l-cyan-500 transform hover:scale-[1.02] transition-transform">
                        <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl flex items-center justify-center text-cyan-600">
                           <RocketIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-black text-slate-900 dark:text-white truncate">Amoxicillin 500mg</h4>
                            <span className="text-[10px] font-black text-cyan-500 bg-cyan-50 dark:bg-cyan-900/40 px-2 py-0.5 rounded-md">Validated</span>
                          </div>
                          <p className="text-xs font-bold text-slate-500">Sarah Jenkins • Dr. Abraham Lee</p>
                        </div>
                        <div className="bg-cyan-500 text-white p-2.5 rounded-xl shadow-lg shadow-cyan-500/20">
                          <CheckIcon />
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 flex gap-5 items-center border-l-[6px] border-l-rose-500 opacity-80">
                         <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600">
                           <div className="w-6 h-6 border-2 border-current rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-slate-900 dark:text-white truncate">Lisinopril 10mg</h4>
                          <p className="text-xs font-bold text-slate-500 mt-1">Review Required • Signature Check</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 h-28 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 flex items-end justify-between gap-2 shadow-inner">
                         {[40, 70, 50, 85, 60, 45, 90].map((h, i) => (
                             <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-cyan-400' : 'bg-rose-400'} rounded-t-lg shadow-sm`} style={{ height: `${h}%` }}></div>
                         ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -right-12 top-1/4 glass-panel p-6 rounded-[2rem] shadow-2xl flex items-center gap-4 border-white/60 dark:border-white/10 animate-bounce" style={{ animationDuration: '4s' }}>
                <div className="bg-green-100 dark:bg-green-900/40 text-green-600 p-3 rounded-2xl">
                   <CheckIcon />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Safety Check</p>
                   <p className="text-sm font-black text-slate-900 dark:text-white">Zero Interactions Found</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="w-full border-y border-slate-200/60 dark:border-slate-800/60 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm py-12 overflow-hidden scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-10">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 whitespace-nowrap uppercase tracking-[0.3em]">Institutional Partners</p>
          <div className="flex-1 w-full overflow-hidden mask-linear-fade">
            <div className="flex items-center justify-between gap-16 opacity-40 grayscale dark:invert transition-all duration-500 hover:grayscale-0 hover:opacity-100">
                {['MediCare', 'HealthPlus', 'CardioSys', 'PharmaOne', 'BioLabs'].map(name => (
                    <span key={name} className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-800 dark:bg-white" />
                        {name}
                    </span>
                ))}
            </div>
          </div>
        </div>
      </div>

      <section id="platform" className="py-32 px-4 sm:px-8 relative scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Clinical-Grade Intelligence</h2>
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
              Advanced features designed for accuracy, safety, and compliance in a high-stakes medical environment.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
                title="AI Extraction" desc="Handwriting analysis and digitization powered by advanced vision models."
                icon={<RocketIcon />} color="text-cyan-500" bg="bg-cyan-50 dark:bg-cyan-900/20" delay={0.1}
            />
            <FeatureCard 
                title="Safety Checks" desc="Real-time drug interaction and dosage analysis warnings."
                icon={<PlayIcon />} color="text-rose-500" bg="bg-rose-50 dark:bg-rose-900/20" delay={0.2}
            />
            <FeatureCard 
                title="Audit Trails" desc="Immutable, HIPAA-compliant logs of every clinical action."
                icon={<RocketIcon />} color="text-cyan-500" bg="bg-cyan-50 dark:bg-cyan-900/20" delay={0.3}
            />
            <FeatureCard 
                title="Pharmacy Sync" desc="Seamless connection to major PMS and EHR platforms via clinical APIs."
                icon={<PlayIcon />} color="text-rose-500" bg="bg-rose-50 dark:bg-rose-900/20" delay={0.4}
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-32 px-4 sm:px-8 bg-white/40 dark:bg-slate-900/20 border-y border-white/50 dark:border-slate-800/50 backdrop-blur-md scroll-mt-24">
        <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
                <div>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-12 tracking-tight">From Chaos to Clarity</h2>
                    <div className="flex flex-col relative border-l-4 border-slate-200 dark:border-slate-800 ml-4">
                        <Step number="1" title="Scan & Upload" desc="Digitize paper prescriptions or receive electronic fax directly in the portal." color="bg-cyan-400" delay={0.1} />
                        <Step number="2" title="AI Extraction Engine" desc="Our Vision Model identifies drug name, dosage, and frequency with precision." color="bg-rose-400" delay={0.2} />
                        <Step number="3" title="Clinical Verification" desc="System flags potential interactions. Pharmacist reviews instantly." color="bg-cyan-400" delay={0.3} />
                        <Step number="4" title="Fulfillment" desc="Data is pushed to the PMS for automatic labeling and dispensing." color="bg-slate-800" delay={0.4} />
                    </div>
                </div>
                
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/20 to-rose-400/20 rounded-full blur-[100px] opacity-40"></div>
                    <div className="glass-panel p-8 rounded-[2.5rem] border-white/60 dark:border-white/10 shadow-2xl space-y-6">
                        <div className="bg-rose-50/50 dark:bg-rose-900/10 p-5 rounded-3xl border border-rose-100 dark:border-rose-900/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-3 rounded-full bg-rose-500 animate-ping"></div>
                                <span className="text-[10px] font-black text-rose-800 dark:text-rose-400 uppercase tracking-widest">Input: Raw Handwriting</span>
                            </div>
                            <div className="h-32 bg-white dark:bg-slate-950 rounded-2xl border-2 border-dashed border-rose-200 dark:border-rose-900/50 flex items-center justify-center overflow-hidden grayscale opacity-40">
                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAdUoMjEaP8b96_spXkjjOglXSw4XkRRBlQS6xmbDaS59jw1l9bZjoLNAyuA8N4ogukRD9NC4xY5JFLw83jP7-hG1UtrdIEBdt3dS9v8DyZsYb9VEyMwe5HiOg26FTKxOvfZLFRoQEKLbbb4rXXNJqm3jTYs86Zj8Rw-MoIc7Ar6KCVLp7qoj_SZoHqAnpj6t2RrAsURT-q-nZ716LHCJEuLLnHbhFYuFpRwQ1ZJbSvrb_WMU5YdzI_okBdaOEQVCEZRD3GQcbJYGH" className="object-cover w-full h-full" alt="Raw Scan" />
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                            </motion.div>
                        </div>
                        <div className="bg-cyan-50/50 dark:bg-cyan-900/10 p-5 rounded-3xl border border-cyan-100 dark:border-cyan-900/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-3 rounded-full bg-cyan-500"></div>
                                <span className="text-[10px] font-black text-cyan-800 dark:text-cyan-400 uppercase tracking-widest">Output: Verified JSON</span>
                            </div>
                            <div className="bg-slate-950 rounded-2xl p-6 font-mono text-xs text-cyan-400 shadow-2xl overflow-hidden leading-relaxed">
                                <p>{"{"}</p>
                                <p className="pl-4">"drug": "Amoxicillin",</p>
                                <p className="pl-4">"dosage": "500mg",</p>
                                <p className="pl-4">"status": "Validated"</p>
                                <p>{"}"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      <section className="py-32 px-4 sm:px-8">
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-7xl mx-auto rounded-[4rem] overflow-hidden relative min-h-[550px] flex items-end p-10 md:p-24 shadow-2xl"
        >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent"></div>
            <div className="relative z-10 max-w-2xl">
                <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight">Built for the future of healthcare.</h2>
                <p className="text-xl font-medium text-slate-300 mb-12 leading-relaxed">Join thousands of clinical users reducing error rates and reclaiming hours of administrative time every day.</p>
                <div className="flex flex-col sm:flex-row gap-6">
                    <button 
                        onClick={onStart}
                        className="bg-cyan-500 text-white px-10 py-5 rounded-full text-lg font-black shadow-2xl shadow-cyan-500/50 hover:scale-105 transition-all"
                    >
                        Launch Application
                    </button>
                    <button onClick={() => scrollToSection('platform')} className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-full text-lg font-black hover:bg-white/20 transition-all">
                        Explore Platform
                    </button>
                </div>
            </div>
        </motion.div>
      </section>

      <footer id="footer" className="bg-white/80 dark:bg-slate-950 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pt-24 pb-12 px-4 sm:px-8 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-16 mb-20">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                 <BrandLogo variant="header" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-10 max-w-sm leading-relaxed">
                Empowering clinical staff with pharmaceutical-grade artificial intelligence. Ensuring accuracy, safety, and speed in every medical interaction.
              </p>
              <div className="flex gap-6">
                 {[1,2,3].map(i => <div key={i} onClick={handleComingSoon} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-cyan-500 cursor-pointer transition-colors border border-slate-200 dark:border-slate-800" />)}
              </div>
            </div>
            
            <div className="flex flex-col gap-6">
               <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Platform</h4>
               <div className="flex flex-col gap-4">
                    <button onClick={handleComingSoon} className="text-left text-sm font-bold text-slate-500 hover:text-cyan-500 transition-colors">Features</button>
                    <button onClick={handleComingSoon} className="text-left text-sm font-bold text-slate-500 hover:text-cyan-500 transition-colors">Integrations</button>
                    <button onClick={handleComingSoon} className="text-left text-sm font-bold text-slate-500 hover:text-cyan-500 transition-colors">Security</button>
                    <button onClick={handleComingSoon} className="text-left text-sm font-bold text-slate-500 hover:text-cyan-500 transition-colors">Roadmap</button>
               </div>
            </div>

            <div className="flex flex-col gap-6">
               <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Legal</h4>
               <div className="flex flex-col gap-4">
                    <button onClick={handleComingSoon} className="text-left text-sm font-bold text-slate-500 hover:text-cyan-500 transition-colors">Privacy Policy</button>
                    <button onClick={handleComingSoon} className="text-left text-sm font-bold text-slate-500 hover:text-cyan-500 transition-colors">Terms of Service</button>
                    <button onClick={handleComingSoon} className="text-left text-sm font-bold text-slate-500 hover:text-cyan-500 transition-colors">HIPAA Compliance</button>
               </div>
            </div>
          </div>
          
          <div className="border-t border-slate-200 dark:border-slate-800 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">© {new Date().getFullYear()} MediVision AI. All rights reserved.</p>
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                    <div className="w-5 h-5 bg-slate-800 dark:bg-white rounded" />
                    <span className="text-[10px] font-black uppercase tracking-widest">SOC2 Type II</span>
                </div>
                <div className="flex items-center gap-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                    <div className="w-5 h-5 bg-slate-800 dark:bg-white rounded" />
                    <span className="text-[10px] font-black uppercase tracking-widest">HIPAA Ready</span>
                </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingView;