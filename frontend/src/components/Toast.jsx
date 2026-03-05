import React, { useState, useEffect, createContext, useContext } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaExclamationCircle } from 'react-icons/fa';

// Toast Context
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message, duration) => addToast(message, 'success', duration);
  const showError = (message, duration) => addToast(message, 'error', duration);
  const showWarning = (message, duration) => addToast(message, 'warning', duration);
  const showInfo = (message, duration) => addToast(message, 'info', duration);

  const value = {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Individual Toast Component
const Toast = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <FaCheckCircle className="w-5 h-5" />;
      case 'error':
        return <FaExclamationCircle className="w-5 h-5" />;
      case 'warning':
        return <FaExclamationTriangle className="w-5 h-5" />;
      case 'info':
      default:
        return <FaInfoCircle className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "flex items-center p-4 mb-3 rounded-lg shadow-lg border-l-4 transition-all duration-300 transform";
    
    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-500 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-500 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-500 text-yellow-800`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-50 border-blue-500 text-blue-800`;
    }
  };

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  return (
    <div 
      className={`${getStyles()} ${isExiting ? 'opacity-0 transform translate-x-full' : 'opacity-100 transform translate-x-0'}`}
    >
      <div className="flex items-center flex-1">
        <div className="mr-3">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      </div>
      <button
        onClick={handleRemove}
        className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <FaTimes className="w-4 h-4" />
      </button>
    </div>
  );
};

// Toast Container Component
const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-sm">
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          toast={toast} 
          onRemove={removeToast}
        />
      ))}
    </div>
  );
};

export default Toast;
