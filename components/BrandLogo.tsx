
import React from 'react';

// Replicating the Pill/Capsule logo from the Figma screenshots
const Icon = ({ iconClassName = "" }: { iconClassName?: string }) => (
    <svg className={iconClassName} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
            {/* Cyan Gradient for Left Side */}
            <linearGradient id="pillBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan-400 */}
                <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan-500 */}
            </linearGradient>
            
            {/* Pink Gradient for Right Side */}
            <linearGradient id="pillPink" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fb7185" /> {/* Rose-400 */}
                <stop offset="100%" stopColor="#e11d48" /> {/* Rose-600 */}
            </linearGradient>
            
            {/* Soft Glow Filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        
        {/* Main Group: Rotated ~25 degrees to match the 'Symbol Mark' and 'App Icon' */}
        <g transform="rotate(25, 50, 50)">
            
            {/* Left/Top Half - Blue Capsule Part */}
            {/* Path draws from center-top to left-arc and back to center-bottom */}
            <path d="M50 30 L30 30 A 20 20 0 0 0 30 70 L50 70 Z" fill="url(#pillBlue)" />
            
            {/* Right/Bottom Half - Pink Capsule Part */}
            {/* Path draws from center-top to right-arc and back to center-bottom */}
            <path d="M50 30 L70 30 A 20 20 0 0 1 70 70 L50 70 Z" fill="url(#pillPink)" />
            
            {/* Divider Line (Subtle white line separating the two halves) */}
            <rect x="49" y="30" width="2" height="40" fill="white" fillOpacity="0.2" />

            {/* --- SPARKLES (Magic Dust) --- */}
            
            {/* Blue Side Sparkles */}
            <circle cx="35" cy="42" r="3" fill="white" fillOpacity="0.95" />
            <circle cx="28" cy="52" r="1.8" fill="white" fillOpacity="0.7" />
            <circle cx="38" cy="58" r="2.2" fill="white" fillOpacity="0.8" />

            {/* Pink Side Sparkles */}
            <circle cx="65" cy="40" r="2.2" fill="white" fillOpacity="0.8" />
            <circle cx="72" cy="50" r="3" fill="white" fillOpacity="0.95" />
            <circle cx="62" cy="60" r="1.8" fill="white" fillOpacity="0.7" />
            
            {/* Gloss/Reflection Highlight on top */}
            <path d="M30 36 Q 50 36 70 36" stroke="white" strokeWidth="2.5" strokeOpacity="0.25" strokeLinecap="round" fill="none" />
        </g>
    </svg>
);


interface BrandLogoProps {
  className?: string;
  variant?: 'full' | 'header';
}

const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = "", 
  variant = 'full' 
}) => {
    
    // The "full" variant for login screen and main page title
    if (variant === 'full') {
        return (
            <div className={`flex items-center gap-4 ${className}`} aria-label="MediVision AI">
                <Icon iconClassName="w-16 h-16 drop-shadow-lg" />
                <div className="text-left flex flex-col justify-center">
                    <h1 className="text-3xl font-extrabold tracking-tight leading-none">
                        <span className="text-cyan-500 dark:text-cyan-400">Medi</span>
                        <span className="text-rose-500 dark:text-rose-500">Vision</span>
                        <span className="text-rose-500 dark:text-rose-500 ml-1.5">AI</span>
                    </h1>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-1.5 tracking-[0.2em] uppercase">
                        Smart Healthcare Technology
                    </p>
                </div>
            </div>
        )
    }
    
    // Header variant (Compact)
    return (
        <div className={`flex items-center gap-2.5 ${className}`} aria-label="MediVision AI">
            <Icon iconClassName="w-9 h-9 drop-shadow-md" />
            <span className="hidden sm:inline-block font-extrabold text-xl tracking-tight">
                <span className="text-cyan-600 dark:text-cyan-400">Medi</span>
                <span className="text-rose-500 dark:text-rose-500">Vision</span>
                <span className="text-rose-500 dark:text-rose-500 ml-1">AI</span>
            </span>
        </div>
    );
};

export default BrandLogo;
