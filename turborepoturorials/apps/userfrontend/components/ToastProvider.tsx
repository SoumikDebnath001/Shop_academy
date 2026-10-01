"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastContextType = {
  triggerToast: (msg: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setVisible(true);
    setTimeout(() => {
      setVisible(false);
    }, 2400);
  }, []);

  return (
    <ToastContext.Provider value={{ triggerToast }}>
      {children}
      {visible && (
        <div 
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] transform transition-all duration-300 bg-inverse-surface text-inverse-on-surface px-space-md py-2.5 rounded-full shadow-lg flex items-center gap-space-xs animate-fade-in"
        >
          <span className="material-symbols-outlined text-[18px] text-primary-fixed">check_circle</span>
          <span className="font-label-sm text-label-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
};
