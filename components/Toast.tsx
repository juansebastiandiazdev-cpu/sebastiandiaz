import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, AlertTriangleIcon, InfoIcon, XIcon } from './Icons';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    onDismiss: (id: string) => void;
}

const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircleIcon className="w-6 h-6 text-green-400" />,
    error: <AlertTriangleIcon className="w-6 h-6 text-red-400" />,
    info: <InfoIcon className="w-6 h-6 text-blue-400" />,
};

const borderColors: Record<ToastType, string> = {
    success: 'border-green-500/50',
    error: 'border-red-500/50',
    info: 'border-blue-500/50',
};

export const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 5000, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animate in
        setIsVisible(true);
        // Set timer to dismiss
        const timer = setTimeout(() => {
            setIsVisible(false);
            // Allow time for fade out animation before removing from DOM
            setTimeout(() => onDismiss(id), 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onDismiss]);

    return (
        <div 
            className={`w-full max-w-sm bg-slate-800/80 backdrop-blur-md shadow-2xl rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border ${borderColors[type]} overflow-hidden transition-all duration-300 ease-in-out ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
        >
            <div className="p-4 flex items-start">
                <div className="flex-shrink-0">{icons[type]}</div>
                <div className="ml-3 w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200">{message}</p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                    <button
                        onClick={() => onDismiss(id)}
                        className="inline-flex rounded-md text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-800"
                    >
                        <span className="sr-only">Close</span>
                        <XIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );
};