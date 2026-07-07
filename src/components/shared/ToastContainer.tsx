import { FaIcon } from './FaIcon';
import { useToastStore, ToastType } from '../../store/toast';

const getToastStyles = (type: ToastType) => {
  const styles: Record<ToastType, { bg: string; border: string; icon: React.ReactNode }> = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: <FaIcon icon="fa-solid fa-circle-check" className="w-5 h-5 text-green-600" />,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <FaIcon icon="fa-solid fa-circle-exclamation" className="w-5 h-5 text-red-600" />,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: <FaIcon icon="fa-solid fa-triangle-exclamation" className="w-5 h-5 text-yellow-600" />,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <FaIcon icon="fa-solid fa-circle-info" className="w-5 h-5 text-blue-600" />,
    },
  };
  return styles[type];
};

const getTextStyles = (type: ToastType) => {
  const styles: Record<ToastType, string> = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
  };
  return styles[type];
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type);
        const textStyle = getTextStyles(toast.type);

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border pointer-events-auto ${styles.bg} ${styles.border}`}
            role="alert"
          >
            {styles.icon}
            <span className={`text-sm font-medium ${textStyle}`}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-auto p-1 hover:bg-black/10 rounded transition-colors"
            >
              <FaIcon icon="fa-solid fa-xmark" className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
