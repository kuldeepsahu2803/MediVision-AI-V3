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

const NetworkStatusBanner = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <motion.div 
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            className="w-full bg-rose-600 text-white py-2 px-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest z-[60]"
        >
            <span className="material-symbols-outlined text-sm">cloud_off</span>
            Offline Mode: Clinical Sync and AI Analysis are disabled
        </motion.div>
    );
};

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
        console.warn("Rear camera failed, attempting fallback...", err);
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            setStream(s);
            if (videoRef.current) videoRef.current.srcObject = s;
        } catch (fallbackErr) {
            alert("Camera access denied.");
            onClose();
        }
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
      <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between px-16">
        <button onClick={onClose} className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors pointer-events-auto">
          <span className="material-symbols-outlined text-3xl">close</span>
        </button>
        <button onClick={takePhoto} className="size-20 rounded-full border-4 border-white bg-white/20 p-1 pointer-events-auto transition-transform active:scale-90">
          <div className="size-full rounded-full bg-white shadow-xl" />
        </button>
        <div className="size-14" />
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

const HelpModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={onClose}>
    <m.div 
      initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
      onClick={e => e.stopPropagation()}
      className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full border border-slate-200 dark:border-white/10"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-3xl">menu_book</span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Prescription Upload Guide</h3>
      <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
        <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
          <span className="font-black text-primary">01</span>
          <p>Ensure the prescription is well-lit and flat. Avoid shadows or extreme angles for best AI recognition.</p>
        </div>
        <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
          <span className="font-black text-secondary">02</span>
          <p>We support multiple pages (JPG, PNG, PDF). You can upload them one by one or as a batch.</p>
        </div>
        <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
          <span className="font-black text-primary">03</span>
          <p>Once uploaded, click "Analyze" to extract clinical data. You can verify and correct the results in the next step.</p>
        </div>
      </div>
      <button onClick={onClose} className="w-full mt-8 bg-slate-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95">Got it, thanks</button>
    </m.div>
  </div>
);

export const AnalyzeView: React.FC<AnalyzeViewProps> = ({
  imageFiles, imageUrls, prescriptionData, isLoading, error, history,
  onAddImages, onRemoveImage, onClearQueue, onAnalyze, onVerify, onSelectHistory, onViewAll, triggerHaptic
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const recentHistory = history.slice(0, 4);

  const storageStats = useMemo(() => {
    const isProfessional = history.length > 10; 
    const limit = isProfessional ? 250 : 50;
    const count = history.length;
    const percentage = Math.min(Math.round((count / limit) * 100), 100);
    return { count, limit, percentage, tier: isProfessional ? 'Professional' : 'Standard' };
  }, [history]);

  const handleCameraClick = () => {
    if (!navigator.onLine) {
        triggerHaptic('error');
        return;
    }
    triggerHaptic('medium');
    setShowScanner(true);
  };

  const handleCapture = (file: File) => {
    triggerHaptic('success');
    onAddImages([file]);
    setShowScanner(false);
  };

  return (
    <div className="flex flex-col gap-10 animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <NetworkStatusBanner />
      <AnimatePresence>
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        {showScanner && <CameraScanner onCapture={handleCapture} onClose={() => setShowScanner(false)} />}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
        <div className="space-y-5">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 bg-white/50 dark:bg-white/5 px-5 py-2 rounded-full border border-slate-100 dark:border-white/5 w-fit shadow-sm backdrop-blur-md">
                <AnalyzeIcon className="size-3.5" />
                <span>AI Core v2.1</span>
                <span className="size-1 rounded-full bg-slate-300"></span>
                <span>Active Extraction</span>
                <span className="size-1 rounded-full bg-slate-300"></span>
                <span className="text-brand-blue">Queue Ready</span>
            </div>
            <h1 className="font-display text-5xl sm:text-7xl font-black tracking-tighter text-slate-900 dark:text-white">Scan & <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Analyze</span></h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl font-medium leading-relaxed">Transform handwritten clinical records into structured digital data using proprietary Vision AI logic.</p>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => { triggerHaptic('light'); setShowHelp(true); }} className="flex items-center gap-2.5 px-8 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"><span className="material-symbols-outlined text-[18px]">help</span> Help Guide</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">
        <div className="lg:col-span-7 flex flex-col gap-8">
          <div className="flex-1 flex flex-col"><ImageUploader onImagesAdd={onAddImages} onImageRemove={onRemoveImage} imageUrls={imageUrls} /></div>
          <AnimatePresence>
            {imageUrls.length > 0 && (
              <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col gap-4">
                <div className="flex justify-between items-center px-2">
                  <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Queue: {imageFiles.length} {imageFiles.length === 1 ? 'file' : 'files'} ready</span>
                  <button onClick={() => { triggerHaptic('medium'); onClearQueue(); }} className="text-xs font-black text-secondary uppercase tracking-widest hover:underline">Clear All</button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                  {imageUrls.map((url, idx) => (
                    <m.div key={url} layoutId={`thumb-${url}`} className="group relative aspect-square rounded-[1.5rem] overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm">
                      <img src={url} alt="Thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <button onClick={() => onRemoveImage(idx)} className="absolute top-2 right-2 size-6 bg-white/90 dark:bg-black/90 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-[14px]">close</span></button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md p-1.5"><p className="text-[9px] text-white font-bold truncate text-center uppercase tracking-tighter">SCAN_{String(idx + 1).padStart(2, '0')}</p></div>
                    </m.div>
                  ))}
                  {imageUrls.length < 5 && (
                    <m.label htmlFor="file-upload" className="aspect-square rounded-[1.5rem] flex flex-col items-center justify-center gap-1.5 bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 text-slate-400 hover:border-primary/50 hover:text-primary transition-all cursor-pointer group"><span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">add</span><span className="text-[10px] font-black uppercase tracking-widest">Add</span></m.label>
                  )}
                </div>
              </m.div>
            )}
          </AnimatePresence>
          <div className="flex justify-end mt-4">
            <m.button whileTap={{ scale: 0.98 }} onClick={onAnalyze} disabled={imageFiles.length === 0 || isLoading || !navigator.onLine} className="btn-gradient-cta rounded-full px-14 py-6 w-full sm:w-auto disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed border-none outline-none overflow-hidden relative group">
              <div className="relative z-10 flex items-center justify-center gap-3 font-black text-xl tracking-widest uppercase">
                {isLoading ? <Spinner className="size-6 text-white" /> : <><span className="material-symbols-outlined text-2xl">auto_fix_high</span>Analyze {imageFiles.length > 0 ? `${imageFiles.length} ` : ''}{imageFiles.length === 1 ? 'Prescription' : 'Files'}</>}
              </div>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </m.button>
          </div>
        </div>
        <div className="lg:col-span-5 flex flex-col h-full min-h-[500px]">
          <div className="glass-panel h-full rounded-[3rem] p-8 flex flex-col gap-8 shadow-2xl border border-white/60 dark:border-white/10 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {(prescriptionData || isLoading) ? (
                <m.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full"><ResultsDisplay data={prescriptionData} isLoading={isLoading} error={error} hasImage={imageUrls.length > 0} onVerifyClick={onVerify} onRetry={onAnalyze} /></m.div>
              ) : (
                <m.div key="context" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full gap-8">
                  <div onClick={handleCameraClick} className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5 flex items-center justify-between group cursor-pointer hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all active:scale-95">
                    <div className="flex items-center gap-5"><div className="size-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-3xl">photo_camera</span></div><div><h4 className="font-black text-slate-900 dark:text-white text-base">Launch Scanner</h4><p className="text-xs text-slate-500 font-medium">Real-time clinical document scan</p></div></div><span className="material-symbols-outlined text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
                  </div>
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-6"><h3 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">Recent Analysis</h3><button onClick={onViewAll} className="text-primary text-xs font-black uppercase tracking-widest hover:underline">View All</button></div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar">
                      {recentHistory.length > 0 ? recentHistory.map((item, i) => (
                          <m.div key={item.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} onClick={() => { triggerHaptic('light'); onSelectHistory(item); }} className="group flex items-center gap-5 p-4 rounded-3xl bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/20 cursor-pointer shadow-sm hover:shadow-md"><div className="size-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-slate-200 dark:border-white/5">{item.imageUrls && item.imageUrls[0] ? <img src={item.imageUrls[0]} alt="Rx" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><span className="material-symbols-outlined text-3xl">description</span></div>}</div><div className="flex-1 min-w-0"><h5 className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{item.patientName || 'Untitled Prescription'}</h5><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Verified: {formatDate(item.date)}</p></div><span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/30">Verified</span></m.div>
                        )) : <div className="flex flex-col items-center justify-center py-20 opacity-30"><span className="material-symbols-outlined text-5xl mb-3">history</span><p className="text-xs font-black uppercase tracking-widest text-center">No recent history</p></div>}
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                    <div className="flex justify-between items-end mb-3"><span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Clinical Storage</span><span className="text-[10px] font-black text-primary uppercase tracking-widest">{storageStats.percentage}% Full</span></div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden"><m.div initial={{ width: 0 }} animate={{ width: `${storageStats.percentage}%` }} className="h-full bg-primary rounded-full" /></div>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 text-right uppercase tracking-tighter">{storageStats.count} of {storageStats.limit} records in {storageStats.tier} tier</p>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
            <div className="absolute -right-16 -bottom-16 opacity-[0.03] pointer-events-none"><span className="material-symbols-outlined text-[300px]">medical_services</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};