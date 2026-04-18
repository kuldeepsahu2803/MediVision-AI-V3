
import React, { useState } from 'react';
import Cropper from 'react-easy-crop';
import { RotateCw, Check, X } from 'lucide-react';

interface OCRCorrectionSheetProps {
  imageUrl: string;
  onConfirm: (croppedImage: string) => void;
  onCancel: () => void;
}

export const OCRCorrectionSheet: React.FC<OCRCorrectionSheetProps> = ({
  imageUrl,
  onConfirm,
  onCancel
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const onCropComplete = (_: any, __: any) => {
    // Crop logic
  };

  const handleConfirm = async () => {
    // In a real app, we would use canvas to crop the image here
    // For now, we'll just pass back the original URL or a placeholder
    onConfirm(imageUrl);
  };

  return (
    <div className="fixed inset-0 z-[250] bg-slate-950/90 backdrop-blur-2xl flex flex-col">
      <div className="p-6 flex items-center justify-between border-b border-white/10">
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">Review Scan</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pre-Analysis Correction</p>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
          <X className="size-6" />
        </button>
      </div>

      <div className="flex-1 relative bg-black">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={3 / 4}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
        />
      </div>

      <div className="p-8 bg-slate-900 border-t border-white/10 flex flex-col gap-8">
        <div className="flex items-center justify-center gap-12">
          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="size-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90"
            >
              <RotateCw className="size-6" />
            </button>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rotate</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-6 py-4">
              <span className="text-white font-black text-xs">Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-32 accent-brand-blue"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 py-5 rounded-2xl bg-white/5 text-white font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all"
          >
            Retake
          </button>
          <button 
            onClick={handleConfirm}
            className="flex-2 py-5 rounded-2xl bg-brand-blue text-white font-black uppercase tracking-widest shadow-xl shadow-brand-blue/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Check className="size-5" />
            Confirm & Analyze
          </button>
        </div>
      </div>
    </div>
  );
};
