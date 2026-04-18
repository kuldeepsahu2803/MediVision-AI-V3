
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastItem, ToastType } from '@/shared/types/ui.types.ts';

type UserRole = 'guest' | 'professional' | null;

interface UIContextType {
    userRole: UserRole;
    setUserRole: (role: UserRole) => void;
    isMenuOpen: boolean;
    setIsMenuOpen: (open: boolean) => void;
    showLoginModal: boolean;
    setShowLoginModal: (show: boolean) => void;
    toasts: ToastItem[];
    showToast: (message: string, type?: ToastType) => void;
    removeToast: (id: string) => void;
    showTreatments: boolean;
    setShowTreatments: (show: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

const STORAGE_KEYS = {
    USER_ROLE: 'rxsnap_user_role',
    SHOW_TREATMENTS: 'rxsnap_show_treatments'
};

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize state from localStorage
    const [userRole, setUserRoleState] = useState<UserRole>(() => {
        return (localStorage.getItem(STORAGE_KEYS.USER_ROLE) as UserRole) || null;
    });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [showTreatments, setShowTreatmentsState] = useState<boolean>(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.SHOW_TREATMENTS);
        return saved !== null ? saved === 'true' : true;
    });

    // Wrappers to persist changes
    const setUserRole = useCallback((role: UserRole) => {
        setUserRoleState(role);
        if (role) {
            localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
        } else {
            localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
        }
    }, []);

    const setShowTreatments = useCallback((show: boolean) => {
        setShowTreatmentsState(show);
        localStorage.setItem(STORAGE_KEYS.SHOW_TREATMENTS, String(show));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <UIContext.Provider value={{
            userRole, setUserRole,
            isMenuOpen, setIsMenuOpen,
            showLoginModal, setShowLoginModal,
            toasts, showToast, removeToast,
            showTreatments, setShowTreatments
        }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
