import { useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export const Toast = ({ message, type = 'success', onClose, duration = 2000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div
        className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}
      >
        {type === 'success' ? (
          <Check size={18} strokeWidth={2.5} />
        ) : (
          <X size={18} strokeWidth={2.5} />
        )}
        <span className="font-medium text-sm">{message}</span>
      </div>
    </div>
  );
};
