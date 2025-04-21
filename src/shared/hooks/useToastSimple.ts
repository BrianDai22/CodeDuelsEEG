// Simplified version of the toast hook
import { toast } from 'sonner';

type ToastProps = {
  title?: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'info' | 'warning';
};

export const useToastSimple = () => {
  const showToast = ({ title, description, type = 'default' }: ToastProps) => {
    switch (type) {
      case 'success':
        toast.success(title, { description });
        break;
      case 'error':
        toast.error(title, { description });
        break;
      case 'info':
        toast.info(title, { description });
        break;
      case 'warning':
        toast.warning(title, { description });
        break;
      default:
        toast(title, { description });
        break;
    }
  };

  return { toast: showToast };
}; 