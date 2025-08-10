import { useContext } from 'react';
import { ToastContext, ToastContextType } from '../contexts/ToastContext';

export const useToasts = (): Omit<ToastContextType, 'toasts'> => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToasts must be used within a ToastProvider');
    }
    return {
        addToast: context.addToast,
        dismissToast: context.dismissToast,
    };
};