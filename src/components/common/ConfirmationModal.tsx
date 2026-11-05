import React from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  type,
  variant,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const activeType = variant || type || 'warning';
  const activeConfirmLabel = confirmText || confirmLabel || 'Ya, Lanjutkan';
  const activeCancelLabel = cancelText || cancelLabel || 'Batal';

  const typeConfig = {
    danger: {
      icon: <AlertCircle className="w-6 h-6 text-red-600" />,
      iconBg: 'bg-red-100 border-red-200',
      confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
      iconBg: 'bg-amber-100 border-amber-200',
      confirmBtn: 'bg-brand-terracotta hover:bg-brand-terracotta-dark text-white',
    },
    info: {
      icon: <Info className="w-6 h-6 text-brand-secondary" />,
      iconBg: 'bg-sky-100 border-sky-200',
      confirmBtn: 'bg-brand-espresso hover:bg-black text-brand-gold',
    },
  }[activeType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-3xl bg-surface-card border border-border-subtle shadow-2xl p-5 sm:p-6 text-left animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto no-scrollbar"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 rounded-xl text-secondary hover:text-brand-espresso hover:bg-surface-container transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 sm:gap-4 pr-6 sm:pr-8">
          {/* Icon Badge */}
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border shrink-0 ${typeConfig.iconBg}`}
          >
            {typeConfig.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-black text-brand-espresso leading-snug">
              {title}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-secondary leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons (Touch Target >= 44px, Stacks vertically on small phone to prevent squishing) */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto min-h-[44px] px-5 rounded-xl border border-border-strong text-xs sm:text-sm font-bold text-brand-espresso hover:bg-surface-container transition-colors cursor-pointer active:scale-[0.98] text-center"
          >
            {activeCancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto min-h-[44px] px-5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 text-center ${typeConfig.confirmBtn}`}
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            <span>{activeConfirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
