
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdjustmentsIcon } from './icons/AdjustmentsIcon.tsx';
import { useHaptic } from '../hooks/useHaptic.ts';
import { Medicine } from '../types.ts';

interface PrescriptionImageProps {
  imageUrls: string[] | null;
  medications: Medicine[];
  activeMedIndex: number | null;
  onMedClick?: (index: number) => void;
}

const EyeSlashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
);

export const PrescriptionImage: React.FC<PrescriptionImageProps> = ({ 
  imageUrls, 
  medications, 
  activeMedIndex,
  onMedClick 
}) => {
  const [showOriginalImage, setShowOriginalImage] = useState(false);
  const [imageFilters, setImageFilters] = useState({ contrast: false, brightness: false, grayscale: false });
  const [showImageControls, setShowImageControls] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { triggerHaptic } = useHaptic();

  const handleRotate = () => {
    triggerHaptic('light');
    setRotation(prev => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    triggerHaptic('medium');
    setIsFullscreen(!isFullscreen);
  };

  const getFilterString = () => {
    const filters = [];
    if (imageFilters.grayscale) filters.push('grayscale(100%)');
    if (imageFilters.contrast) filters.push('contrast(150%)');
    if (imageFilters.brightness) filters.push('brightness(120%)');
    return filters.join(' ');
  };

  const transform = activeMedIndex !== null && medications[activeMedIndex]?.coordinates 
      ? { scale: 2, x: `${50 - (medications[activeMedIndex].coordinates![1] + medications[activeMedIndex].coordinates![3]) / 2 / 10}%`, y: `${50 - (medications[activeMedIndex].coordinates![0] + medications[activeMedIndex].coordinates![2]) / 2 / 10}%`, rotate: rotation }
      : { scale: 1, x: 0, y: 0, rotate: rotation };

  const renderContent = () => (
    <div className={`relative w-full h-full overflow-hidden bg-black/5 dark:bg-black/30 flex items-center justify-center rounded-2xl group border border-white/20 dark:border-white/5 ${isFullscreen ? 'fixed inset-0 z-[200] bg-black rounded-none' : 'min-h-[350px] aspect-square lg:aspect-auto'}`}>
      {imageUrls && (
        <motion.div className="relative max-w-full max-h-full" animate={transform} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
          <img 
            src={imageUrls[0]} 
            className={`max-h-full max-w-full object-contain shadow-2xl rounded-lg transition-all duration-300`} 
            style={{ filter: showOriginalImage ? 'none' : getFilterString() }} 
            alt="Prescription Source" 
          />
          {!showOriginalImage && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 1000" preserveAspectRatio="none">
              {medications.map((med, i) => {
                if (!med.coordinates) return null;
                
                const confidence = med.confidence || 0;
                let strokeColor = '#3DA35D'; // Default emerald
                let fillColor = 'transparent';
                
                if (i === activeMedIndex) {
                  strokeColor = med.verification?.color === 'rose' ? '#EF4444' : '#007ACC';
                  fillColor = med.verification?.color === 'rose' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 122, 204, 0.2)';
                } else if (confidence < 0.6) {
                  strokeColor = '#EF4444'; // Rose for low confidence
                  fillColor = 'rgba(239, 68, 68, 0.1)';
                } else if (confidence < 0.85) {
                  strokeColor = '#F59E0B'; // Amber for medium confidence
                  fillColor = 'rgba(245, 158, 11, 0.05)';
                }

                return (
                  <motion.rect 
                    key={i} 
                    initial={{ opacity: 0 }} 
                    animate={{ 
                      opacity: i === activeMedIndex ? 1 : 0.6, 
                      strokeWidth: i === activeMedIndex ? 4 : 2,
                      fillOpacity: i === activeMedIndex ? 1 : 0.5
                    }}
                    x={med.coordinates[1]} 
                    y={med.coordinates[0]} 
                    width={med.coordinates[3] - med.coordinates[1]} 
                    height={med.coordinates[2] - med.coordinates[0]}
                    fill={fillColor} 
                    stroke={strokeColor} 
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray={confidence < 0.6 ? "4 2" : "none"}
                    className="cursor-pointer pointer-events-auto"
                    onClick={() => onMedClick?.(i)}
                  />
                );
              })}
            </svg>
          )}
        </motion.div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={() => { triggerHaptic('light'); setShowImageControls(!showImageControls); }} 
          className={`size-11 rounded-full shadow-lg backdrop-blur-md border border-white/20 flex items-center justify-center transition-colors ${showImageControls ? 'bg-brand-blue text-white' : 'bg-black/40 text-white'}`}
        >
          <AdjustmentsIcon className="w-5 h-5" />
        </motion.button>
        <AnimatePresence>
          {showImageControls && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: -10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.8, y: -10 }} 
              className="flex flex-col gap-2 bg-black/60 backdrop-blur-md p-2 rounded-2xl border border-white/10"
            >
              <button onClick={() => { triggerHaptic('light'); setImageFilters(p => ({...p, grayscale: !p.grayscale})); }} className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl ${imageFilters.grayscale ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>B&W</button>
              <button onClick={() => { triggerHaptic('light'); setImageFilters(p => ({...p, contrast: !p.contrast})); }} className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl ${imageFilters.contrast ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>Contrast</button>
              <button onClick={() => { triggerHaptic('light'); setImageFilters(p => ({...p, brightness: !p.brightness})); }} className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl ${imageFilters.brightness ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>Bright</button>
              <div className="h-px bg-white/10 my-1" />
              <button onClick={handleRotate} className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl text-white hover:bg-white/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">rotate_right</span>
                Rotate
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={toggleFullscreen} 
          className="size-11 rounded-full shadow-lg backdrop-blur-md border border-white/20 bg-black/40 text-white flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[20px]">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
        </motion.button>
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-3 pointer-events-auto">
        <button 
          aria-label="Hold to view original image" 
          className="bg-white/90 dark:bg-black/90 text-gray-800 dark:text-white size-12 rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all" 
          onMouseDown={() => setShowOriginalImage(true)} 
          onMouseUp={() => setShowOriginalImage(false)} 
          onTouchStart={() => setShowOriginalImage(true)} 
          onTouchEnd={() => setShowOriginalImage(false)}
        >
          <EyeSlashIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );

  return isFullscreen ? (
    <div className="fixed inset-0 z-[200] bg-black">
      {renderContent()}
    </div>
  ) : renderContent();
};
