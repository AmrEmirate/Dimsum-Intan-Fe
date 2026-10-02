import React from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NotificationToast: React.FC = () => {
  const { notification, showNotification } = useApp();

  if (!notification) return null;

  const getStyle = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-status-lunas-bg border-status-lunas-border text-status-lunas-text';
      case 'error':
        return 'bg-status-unpaid-bg border-status-unpaid-border text-status-unpaid-text';
      case 'warning':
        return 'bg-status-pending-bg border-status-pending-border text-status-pending-text';
      default:
        return 'bg-brand-espresso text-surface-canvas border-brand-espresso-muted';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />;
      default:
        return <Info className="w-5 h-5 flex-shrink-0 text-brand-gold" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl max-w-md ${getStyle()}`}
      >
        {getIcon()}
        <span className="text-xs font-semibold leading-snug">
          {notification.message}
        </span>
      </div>
    </div>
  );
};
