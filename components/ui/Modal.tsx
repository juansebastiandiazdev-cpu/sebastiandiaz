


import React, { useEffect, useRef } from 'react';
import { XIcon } from '../Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, icon, children, footer, size = '2xl' }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements?.[0];
    const lastElement = focusableElements?.[focusableElements.length - 1];

    const handleFocusTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      if (event.shiftKey) { 
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          event.preventDefault();
        }
      } else { 
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          event.preventDefault();
        }
      }
    };
    
    firstElement?.focus();
    modalRef.current?.addEventListener('keydown', handleFocusTrap);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      modalRef.current?.removeEventListener('keydown', handleFocusTrap);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses: Record<typeof size, string> = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
  }

  return (
    <div 
        className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 animate-fade-in-up"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className={`bg-core-bg-soft/90 backdrop-blur-lg rounded-xl shadow-2xl w-full ${sizeClasses[size]} border border-core-border relative flex flex-col max-h-[90vh] overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 sm:p-6 border-b border-core-border flex-shrink-0 flex justify-between items-center">
          <h2 id="modal-title" className="text-xl font-bold text-core-text-primary flex items-center gap-3">
            {icon}
            {title}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-core-text-secondary hover:text-core-text-primary hover:bg-core-bg-soft/50 transition-colors" aria-label="Close modal">
            <XIcon className="w-5 h-5"/>
          </button>
        </header>
        
        <div className="flex-grow overflow-y-auto p-4 sm:p-6">
            {children}
        </div>
        
        {footer && (
            <footer className="flex justify-end items-center gap-3 p-4 bg-core-bg/50 border-t border-core-border flex-shrink-0">
                {footer}
            </footer>
        )}
      </div>
       <style>{`
          @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(10px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .animate-fade-in-up { 
            animation: fade-in-up 0.2s ease-out forwards; 
          }
        `}</style>
    </div>
  );
};
