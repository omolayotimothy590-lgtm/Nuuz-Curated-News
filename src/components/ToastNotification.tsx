import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastNotificationProps {
  type: 'success' | 'error';
  title: string;
  message: string;
  duration?: number;
  onClose: () => void;
}

export const ToastNotification = ({
  type,
  title,
  message,
  duration = 4000,
  onClose
}: ToastNotificationProps) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 right-4 z-[200] animate-slide-in max-w-md">
      <div
        className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg border-l-4 overflow-hidden ${
          type === 'success'
            ? 'border-green-500'
            : 'border-red-500'
        }`}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {type === 'success' ? (
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle size={20} className="text-red-600 dark:text-red-400" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                {title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {message}
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
