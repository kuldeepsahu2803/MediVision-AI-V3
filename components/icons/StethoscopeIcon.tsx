
import React from 'react';

export const StethoscopeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M4.5 10.5c-2.5 0-4.5-2-4.5-4.5S2 1.5 4.5 1.5s4.5 2 4.5 4.5-2 4.5-4.5 4.5zM19.5 10.5c-2.5 0-4.5-2-4.5-4.5S17 1.5 19.5 1.5s4.5 2 4.5 4.5-2 4.5-4.5 4.5z" />
    <path d="M4.5 10.5v2c0 3.3 2.7 6 6 6h3c3.3 0 6-2.7 6-6v-2" />
    <path d="M10.5 18.5V21a1.5 1.5 0 001.5 1.5h0a1.5 1.5 0 001.5-1.5v-2.5" />
  </svg>
);
