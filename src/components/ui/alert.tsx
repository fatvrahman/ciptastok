import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';

export type AlertVariant = 'warning' | 'success' | 'info' | 'error';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissLabel?: string;
  onDismiss?: () => void;
  className?: string;
}

const variantStyles = {
  warning: {
    container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    title: 'text-yellow-800 dark:text-yellow-300',
    message: 'text-yellow-700 dark:text-yellow-400',
    button: 'text-yellow-800 hover:text-yellow-900 dark:text-yellow-300 dark:hover:text-yellow-200',
  },
  success: {
    container: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    title: 'text-green-800 dark:text-green-300',
    message: 'text-green-700 dark:text-green-400',
    button: 'text-green-800 hover:text-green-900 dark:text-green-300 dark:hover:text-green-200',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-300',
    message: 'text-blue-700 dark:text-blue-400',
    button: 'text-blue-800 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200',
  },
  error: {
    container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-800 dark:text-red-300',
    message: 'text-red-700 dark:text-red-400',
    button: 'text-red-800 hover:text-red-900 dark:text-red-300 dark:hover:text-red-200',
  },
};

const iconMap = {
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
  error: XCircle,
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  message,
  onClose,
  action,
  dismissLabel,
  onDismiss,
  className = '',
}) => {
  const styles = variantStyles[variant];
  const Icon = iconMap[variant];

  return (
    <div
      className={`relative flex items-start gap-3 rounded-lg border p-4 shadow-lg ${styles.container} ${className}`}
      role="alert"
      style={{
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
      
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className={`text-sm font-semibold mb-1 ${styles.title}`}>
            {title}
          </h3>
        )}
        <p className={`text-sm ${styles.message}`}>
          {message}
        </p>
        
        {(action || dismissLabel) && (
          <div className="flex gap-3 mt-3">
            {action && (
              <button
                onClick={action.onClick}
                className={`text-sm font-medium underline ${styles.button}`}
              >
                {action.label}
              </button>
            )}
            {dismissLabel && onDismiss && (
              <button
                onClick={onDismiss}
                className={`text-sm font-medium underline ${styles.button}`}
              >
                {dismissLabel}
              </button>
            )}
          </div>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${styles.button}`}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

// Toast notification container
export interface ToastProps extends AlertProps {
  id: string;
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const addToast = React.useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const duration = toast.duration || 5000;

    setToasts((prev) => {
      const newToasts = [...prev, { ...toast, id }];
      return newToasts;
    });

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};

export const ToastContainer: React.FC<{ toasts: ToastProps[]; onRemove: (id: string) => void }> = ({
  toasts,
  onRemove,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[99999] flex flex-col gap-3 w-96"
      style={{ 
        maxWidth: '24rem',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className="animate-slide-in-down shadow-xl"
          style={{
            pointerEvents: 'auto'
          }}
        >
          <Alert
            {...toast}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};
