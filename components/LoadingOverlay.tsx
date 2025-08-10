
import React from 'react';
import { SolvoLogoIcon } from './Icons';

export const LoadingOverlay: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-core-bg z-50 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-24 h-24">
                 <SolvoLogoIcon className="absolute inset-0 w-full h-full text-core-border/50" />
                 <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M36 12C36 18.6274 30.6274 24 24 24C17.3726 24 12 18.6274 12 12" stroke="url(#gradient-top)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                     <defs>
                         <linearGradient id="gradient-top" x1="12" y1="12" x2="36" y2="12" gradientUnits="userSpaceOnUse">
                           <stop stopColor="var(--color-core-accent)" stopOpacity="0" />
                           <stop offset="1" stopColor="var(--color-core-accent)" />
                         </linearGradient>
                     </defs>
                 </svg>
                 <svg className="absolute inset-0 w-full h-full animate-spin-medium" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M12 36C12 29.3726 17.3726 24 24 24C30.6274 24 36 29.3726 36 36" stroke="url(#gradient-bottom)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                     <defs>
                         <linearGradient id="gradient-bottom" x1="12" y1="36" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                           <stop stopColor="var(--color-core-accent)" stopOpacity="0" />
                           <stop offset="1" stopColor="var(--color-core-accent)" />
                         </linearGradient>
                     </defs>
                 </svg>
            </div>
            <p className="text-core-text-secondary mt-4">Loading Workspace...</p>
            <style>{`
                .animate-spin-slow { animation: spin 3s linear infinite; }
                .animate-spin-medium { animation: spin 2s linear infinite reverse; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};
