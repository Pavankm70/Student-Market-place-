import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const success = useCallback((msg, duration) => showToast(msg, 'success', duration), [showToast]);
  const error = useCallback((msg, duration) => showToast(msg, 'error', duration), [showToast]);
  const warning = useCallback((msg, duration) => showToast(msg, 'warning', duration), [showToast]);
  const info = useCallback((msg, duration) => showToast(msg, 'info', duration), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, success, error, warning, info }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => {
          let Icon = Info;
          let toastClass = 'toast-info';
          if (toast.type === 'success') {
            Icon = CheckCircle2;
            toastClass = 'toast-success';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            toastClass = 'toast-error';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            toastClass = 'toast-warning';
          }

          return (
            <div key={toast.id} className={`toast-card ${toastClass}`}>
              <div className="toast-icon-wrapper">
                <Icon size={18} />
              </div>
              <div className="toast-message">
                {toast.message}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="toast-close-btn"
                aria-label="Close notification"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        .toast-container {
          position: fixed;
          top: 86px;
          right: 24px;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
          max-width: 420px;
          width: calc(100% - 48px);
        }
        @media (max-width: 640px) {
          .toast-container {
            top: auto;
            bottom: 24px;
            right: 20px;
            left: 20px;
            width: auto;
            max-width: none;
          }
        }
        .toast-card {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 10px 30px rgba(32, 35, 31, 0.12), 0 2px 8px rgba(32, 35, 31, 0.06);
          border: 1px solid rgba(221, 227, 218, 0.9);
          color: var(--charcoal, #20231F);
          animation: toastSlideIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          font-size: 0.9rem;
          font-weight: 500;
          line-height: 1.4;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @media (max-width: 640px) {
          @keyframes toastSlideIn {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        }
        .toast-icon-wrapper {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }
        .toast-success .toast-icon-wrapper {
          background-color: #EDF6F0;
          color: #235436;
        }
        .toast-success {
          border-left: 4px solid #3E7B54;
        }
        .toast-error .toast-icon-wrapper {
          background-color: #FDF1F0;
          color: #A7382E;
        }
        .toast-error {
          border-left: 4px solid #C24A3F;
        }
        .toast-warning .toast-icon-wrapper {
          background-color: #FDF5EA;
          color: #B86F1E;
        }
        .toast-warning {
          border-left: 4px solid #D9882E;
        }
        .toast-info .toast-icon-wrapper {
          background-color: #EDF2EB;
          color: #20231F;
        }
        .toast-info {
          border-left: 4px solid #20231F;
        }
        .toast-message {
          flex: 1;
          word-break: break-word;
        }
        .toast-close-btn {
          flex-shrink: 0;
          background: transparent;
          border: none;
          color: #747B72;
          cursor: pointer;
          padding: 4px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        .toast-close-btn:hover {
          background-color: #EDF2EB;
          color: #20231F;
        }
      `}</style>
    </ToastContext.Provider>
  );
};

