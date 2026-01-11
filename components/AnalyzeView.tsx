
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUploader } from './ImageUploader.tsx';
import { ResultsDisplay } from './ResultsDisplay.tsx';
import { Spinner } from './Spinner.tsx';
import { PrescriptionData } from '../types.ts';
import { formatDate } from '../lib/utils.ts';
import { AnalyzeIcon } from './icons/AnalyzeIcon.tsx';

interface AnalyzeViewProps {
  imageFiles: File[];
  imageUrls: string[];
  prescriptionData: PrescriptionData | null;
  isLoading: boolean;
  error: string | null;
  history: PrescriptionData[];
  onAddImages: (files: File[]) => void;
  onRemoveImage: (index: number) => void;
  onClearQueue: () => void;
  onAnalyze: () => void;
  onVerify: () => void;
  onSelectHistory: (report: PrescriptionData) => void;
  onViewAll?: () => void;
  triggerHaptic: (type: any) => void;
}

const m = motion as any;

const CameraScanner = ({ onCapture, onClose }: { onCapture: (file: File) => void, onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, 
          audio: false 
        });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        console.error("Camera access denied", err);
        alert("Camera access denied. Please ensure you have granted permission in your browser settings.");
        onClose();
      }
    }
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black flex flex-col items-center justify-center overflow-hidden">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      
      {/* Scanner Overlay UI */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="w-[85%] max-w-md aspect-[3/4] rounded-3xl border-2 border-white/30 relative shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-3xl" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-3xl" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-3xl" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-3xl" />
          
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/30 animate-pulse shadow-[0_0_15px_rgba(13,215,242,0.5)]" />
        </div>
        <p className="mt-8 text-white font-bold text-sm uppercase tracking-widest drop-shadow-md">Align prescription in frame</p>
      </div>

      {/* Control Panel */}
      <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between px-16">
        <button onClick={onClose} className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors pointer-events-auto">
          <span className="material-symbols-outlined text-3xl">close</span>
        </button>
        
        <button onClick={takePhoto} className="size-20 rounded-full border-4 border-white bg-white/20 p-1 pointer-events-auto transition-transform active:scale-90">
          <div className="size-full rounded-full bg-white shadow-xl" />
        </button>
        
        <div className="size-14" /> {/* Spacer */}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

const HelpModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={onClose}>
    <m.div 
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      onClick={e => e.stopPropagation()}
      className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full border border-slate-200 dark:border-white/10"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-2xl">menu_book</span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 tracking-tight uppercase">User Guide</h3>
      <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
        <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
          <span className="font-black text-primary">01</span>
          <p>Ensure the prescription is well-lit and flat. Avoid shadows for best AI recognition.</p>
        </div>
        <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
          <span className="font-black text-secondary">02</span>
          <p>We support multiple pages (JPG, PNG, PDF). Upload them one by one or as a batch.</p>
        </div>
      </div>
      <button 
        onClick={onClose} 
        className="w-full mt-8 bg-slate-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95"
      >
        Dismiss Guide
      </button>
    </m.div>
  </div>
);

export const AnalyzeView: React.FC<AnalyzeViewProps> = ({
  imageFiles,
  imageUrls,
  prescriptionData,
  isLoading,
  error,
  history,
  onAddImages,
  onRemoveImage,
  onClearQueue,
  onAnalyze,
  onVerify,
  onSelectHistory,
  onViewAll,
  triggerHaptic
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const recentHistory = history.slice(0, 4);

  // Storage Logic
  const storageStats = useMemo(() => {
    const isProfessional = history.length > 10; 
    const limit = isProfessional ? 250 : 50;
    const count = history.length;
    const percentage = Math.min(Math.round((count / limit) * 100), 100);
    return { count, limit, percentage, tier: isProfessional ? 'Pro' : 'Std' };
  }, [history]);

  const handleCameraClick = () => {
    triggerHaptic('medium');
    setShowScanner(true);
  };

  const handleCapture = (file: File) => {
    triggerHaptic('success');
    onAddImages([file]);
    setShowScanner(false);
  };

  return (
    <div className="flex flex-col gap-8 animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <AnimatePresence>
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        {showScanner && <CameraScanner onCapture={handleCapture} onClose={() => setShowScanner(false)} />}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 bg-white/50 dark:bg-white/5 px-4 py-1.5 rounded-full border border-slate-100 dark:border-white/5 w-fit shadow-sm">
                <AnalyzeIcon className="size-3" />
                <span>AI Core v2.1</span>
                <span className="size-1 rounded-full bg-slate-300"></span>
                <span className="text-brand-blue">Queue Ready</span>
            </div>
            
            <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
                Scan & <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Analyze</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base max-w-xl font-medium leading-relaxed">
                Convert clinical records into structured digital data with Vision AI.
            </p>
        </div>

        <div className="flex items-center gap-3">
            <button 
                onClick={() => { triggerHaptic('light'); setShowHelp(true); }}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
                <span className="material-symbols-outlined text-[16px]">help</span> Guide
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex-1 flex flex-col min-h-[350px]">
            <ImageUploader onImagesAdd={onAddImages} onImageRemove={onRemoveImage} imageUrls={imageUrls} />
          </div>

          <AnimatePresence>
            {imageUrls.length > 0 && (
              <m.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col gap-3"
              >
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Queue: {imageFiles.length} {imageFiles.length === 1 ? 'file' : 'files'}
                  </span>
                  <button 
                    onClick={() => { triggerHaptic('medium'); onClearQueue(); }}
                    className="text-[9px] font-black text-secondary uppercase tracking-widest hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
                  {imageUrls.map((url, idx) => (
                    <m.div 
                      key={url}
                      layoutId={`thumb-${url}`}
                      className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm"
                    >
                      <img src={url} alt="Thumbnail" className="w-full h-full object-cover opacity-80" />
                      <button 
                        onClick={() => onRemoveImage(idx)}
                        className="absolute top-1 right-1 size-5 bg-white dark:bg-black rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-[12px]">close</span>
                      </button>
                    </m.div>
                  ))}
                </div>
              </m.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end">
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAnalyze}
              disabled={imageFiles.length === 0 || isLoading}
              className="relative overflow-hidden rounded-2xl bg-slate-900 dark:bg-white px-10 py-4 text-white dark:text-black shadow-xl transition-all group w-full sm:w-auto disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            >
              <div className="relative z-10 flex items-center justify-center gap-3 font-black text-[11px] tracking-[0.2em] uppercase">
                {isLoading ? (
                  <Spinner className="size-4 text-white dark:text-black" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
                    Launch Analysis
                  </>
                )}
              </div>
            </m.button>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col h-full min-h-[450px]">
          <div className="glass-panel h-full rounded-[2.5rem] p-6 sm:p-8 flex flex-col gap-6 shadow-xl border border-white/60 dark:border-white/5 relative overflow-hidden">
            
            <AnimatePresence mode="wait">
              {(prescriptionData || isLoading) ? (
                <m.div key="results" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col h-full">
                  <ResultsDisplay 
                    data={prescriptionData} 
                    isLoading={isLoading} 
                    error={error} 
                    hasImage={imageUrls.length > 0} 
                    onVerifyClick={onVerify} 
                    onRetry={onAnalyze} 
                  />
                </m.div>
              ) : (
                <m.div key="context" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col h-full gap-6">
                  <div onClick={handleCameraClick} className="bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-white/5 flex items-center justify-between group cursor-pointer hover:border-primary/40 transition-all active:scale-95">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-xl">photo_camera</span>
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-tight">Launch Scanner</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Real-time clinical scan</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
                  </div>

                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-4 px-1">
                      <h3 className="font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">Recent Activity</h3>
                      <button onClick={onViewAll} className="text-primary text-[9px] font-black uppercase tracking-widest hover:underline">Full Archive</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                      {recentHistory.length > 0 ? (
                        recentHistory.map((item, i) => (
                          <m.div 
                            key={item.id}
                            initial={{ opacity: 0, x: 5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => { triggerHaptic('light'); onSelectHistory(item); }}
                            className="group flex items-center gap-4 p-3 rounded-2xl bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-white/10 cursor-pointer shadow-sm"
                          >
                            <div className="size-10 rounded-xl bg-slate-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-slate-200 dark:border-white/5">
                                {item.imageUrls && item.imageUrls[0] ? <img src={item.imageUrls[0]} alt="Rx" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><span className="material-symbols-outlined text-xl">description</span></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-[11px] font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{item.patientName || 'Untitled'}</h5>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{formatDate(item.date)}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase border border-emerald-100 dark:border-emerald-900/30">OK</span>
                          </m.div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 opacity-20">
                           <span className="material-symbols-outlined text-4xl mb-2">history</span>
                           <p className="text-[9px] font-black uppercase tracking-widest">No activity</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 dark:border-white/5">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Repository Load</span>
                      <span className="text-[9px] font-black text-primary uppercase tracking-widest">{storageStats.percentage}%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <m.div initial={{ width: 0 }} animate={{ width: `${storageStats.percentage}%` }} className="h-full bg-primary rounded-full" />
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
