
import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface HoldToConfirmButtonProps {
    onConfirm: () => void;
    label: string;
    confirmLabel?: string;
    icon?: React.ReactNode;
    holdDuration?: number;
    className?: string;
}

export const HoldToConfirmButton: React.FC<HoldToConfirmButtonProps> = ({
    onConfirm, label, confirmLabel = "Confirmed", icon, holdDuration = 2000, className = ""
}) => {
    const [isHolding, setIsHolding] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const timerRef = useRef<any>(null);
    const controls = useAnimation();

    const startHold = () => {
        if (isConfirmed) return;
        setIsHolding(true);
        controls.start({
            width: '100%',
            transition: { duration: holdDuration / 1000, ease: "linear" }
        });
        timerRef.current = setTimeout(() => {
            setIsConfirmed(true);
            setIsHolding(false);
            onConfirm();
        }, holdDuration);
    };

    const stopHold = () => {
        setIsHolding(false);
        if (!isConfirmed) {
            clearTimeout(timerRef.current);
            controls.start({ width: '0%', transition: { duration: 0.2 } });
        }
    };

    return (
        <button
            onMouseDown={startHold}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={startHold}
            onTouchEnd={stopHold}
            className={`relative overflow-hidden ${className} group`}
            disabled={isConfirmed}
        >
            <div className="relative z-10 flex items-center justify-center gap-2">
                {isConfirmed ? (
                    <span className="material-symbols-outlined text-white">check_circle</span>
                ) : icon}
                <span className="font-bold uppercase tracking-widest text-[11px]">
                    {isConfirmed ? confirmLabel : (isHolding ? "HOLD TO LOCK..." : label)}
                </span>
            </div>
            
            {/* Progress Bar Background */}
            <motion.div 
                initial={{ width: '0%' }}
                animate={controls}
                className="absolute inset-0 bg-white/20 z-0"
            />
            
            {/* Success Overlay */}
            {isConfirmed && (
                <div className="absolute inset-0 bg-emerald-500 z-0" />
            )}
        </button>
    );
};
