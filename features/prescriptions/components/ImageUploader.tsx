import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';

interface ImageUploaderProps {
  onImagesAdd: (files: File[]) => void;
  onImageRemove: (index: number) => void;
  imageUrls: string[];
}

const m = motion as any;

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesAdd }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      onImagesAdd(Array.from(files));
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [onImagesAdd]);

  return (
    <div className="relative w-full h-full min-h-[400px] group transition-all duration-500">
      <m.label
        htmlFor="file-upload"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        whileHover={{ scale: 1.005 }}
        className={`relative flex flex-col items-center justify-center w-full h-full rounded-[3rem] cursor-pointer bg-white dark:bg-zinc-900/50 border transition-all duration-300 overflow-hidden
          ${isDragging ? 'border-primary scale-[1.01] shadow-2xl shadow-primary/20' : 'border-primary/20 hover:border-primary/50 shadow-xl shadow-slate-200/50 dark:shadow-none'}`}
      >
        {/* Inner Dashed Outline */}
        <div className="absolute inset-5 rounded-[2.2rem] border-2 border-dashed border-primary/20 group-hover:border-primary/40 transition-colors duration-300 flex flex-col items-center justify-center overflow-hidden">
          
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ 
                 backgroundImage: 'radial-gradient(circle, #0dd7f2 1px, transparent 1px)', 
                 backgroundSize: '30px 30px' 
               }} 
          />

          <div className="relative z-10 flex flex-col items-center text-center p-10 gap-8">
            <div className={`size-24 rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-inner
              ${isDragging ? 'bg-primary text-white scale-110 rotate-6' : 'bg-primary/10 text-primary group-hover:scale-110 group-hover:-rotate-3'}`}>
              <span className="material-symbols-outlined text-5xl">cloud_upload</span>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Drag & Drop prescriptions</h3>
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
                or <span className="text-primary font-black underline decoration-2 underline-offset-8 decoration-primary/20 hover:decoration-primary transition-all">browse files</span> from your terminal
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {['JPG', 'PNG', 'JPEG', 'PDF', 'MAX 20MB'].map(tag => (
                <span key={tag} className="px-5 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 uppercase">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <input 
          id="file-upload" 
          type="file" 
          multiple 
          className="hidden" 
          accept="image/*,.pdf" 
          onChange={(e) => handleFiles(e.target.files)} 
        />
      </m.label>
    </div>
  );
};
