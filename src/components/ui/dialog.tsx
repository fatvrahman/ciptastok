import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

export type DialogVariant = 'success' | 'warning' | 'info' | 'error';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message?: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  children?: React.ReactNode;
}

const variantStyles = {
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    confirmBtn: 'bg-green-600 hover:bg-green-700',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    confirmBtn: 'bg-yellow-600 hover:bg-yellow-700',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    confirmBtn: 'bg-blue-600 hover:bg-blue-700',
  },
  error: {
    icon: XCircle,
    iconColor: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    confirmBtn: 'bg-red-600 hover:bg-red-700',
  },
};

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'info',
  confirmText = 'Save',
  cancelText = 'Cancel',
  showCancel = true,
  children,
}) => {
  // Lock scroll when dialog opens - NO BLUR
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* Backdrop - Darker overlay for better focus */}
      <div 
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Dialog with scale animation */}
      <div 
        className="relative bg-white dark:bg-boxdark rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-in"
      >
        {/* Icon */}
        <div className="flex justify-center pt-6 pb-4">
          <div className={`${styles.iconBg} rounded-full p-3`}>
            <Icon className={`h-8 w-8 ${styles.iconColor}`} />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 text-center">
          <h3 className="text-xl font-bold text-black dark:text-white mb-2">
            {title}
          </h3>
          
          {message && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {message}
            </p>
          )}

          {children && (
            <div className="mt-4 text-left">
              {children}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            {showCancel && (
              <button
                onClick={onClose}
                className="flex-1 px-6 py-2.5 rounded-lg border border-stroke bg-white text-black hover:bg-gray-50 dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:bg-gray-800 font-medium text-sm transition-colors"
              >
                {cancelText}
              </button>
            )}
            
            {onConfirm && (
              <button
                onClick={onConfirm}
                className={`flex-1 px-6 py-2.5 rounded-lg text-white font-medium text-sm transition-colors ${styles.confirmBtn}`}
              >
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dialog;
