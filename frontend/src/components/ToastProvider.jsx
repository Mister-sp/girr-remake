import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = 'success', timeout = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((toasts) => [...toasts, { id, msg, type }]);
    setTimeout(() => {
      setToasts((toasts) => toasts.filter((t) => t.id !== id));
    }, timeout);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 9999 }}>
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>{toast.msg}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
