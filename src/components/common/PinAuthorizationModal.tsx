import React, { useState } from 'react';
import { ShieldAlert, X, Delete } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface PinModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const PinAuthorizationModal: React.FC<PinModalProps> = ({
  isOpen,
  title,
  description,
  onSuccess,
  onClose,
}) => {
  const { verifyPin, showNotification } = useApp();
  const [pin, setPin] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        validatePin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setIsError(false);
  };

  const validatePin = (inputPin: string) => {
    if (verifyPin(inputPin)) {
      setPin('');
      setIsError(false);
      onSuccess();
    } else {
      setIsError(true);
      showNotification('PIN Supervisor Salah! Gunakan PIN default: 1234', 'error');
      setTimeout(() => {
        setPin('');
        setIsError(false);
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 flex flex-col items-center text-center relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-secondary hover:bg-surface-container transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-brand-terracotta/10 text-brand-terracotta flex items-center justify-center mb-3">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h3 className="font-serif-title font-bold text-xl text-brand-espresso">
          {title}
        </h3>
        <p className="text-xs text-secondary mt-1 max-w-[260px] leading-relaxed">
          {description}
        </p>

        {/* Warning Audit Note */}
        <div className="w-full mt-3 p-2 rounded-xl bg-status-unpaid-bg border border-status-unpaid-border text-status-unpaid-text text-[11px] font-semibold">
          ⚠️ Otorisasi Supervisor / Owner (Default PIN: 1234)
        </div>

        {/* PIN Indicators (4 dots) */}
        <div
          className={`flex items-center gap-3 my-5 ${
            isError ? 'animate-bounce text-red-500' : ''
          }`}
        >
          {[0, 1, 2, 3].map((idx) => {
            const filled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  filled
                    ? 'bg-brand-espresso border-brand-espresso scale-110'
                    : isError
                    ? 'border-red-500 bg-red-100'
                    : 'border-border-strong bg-surface-canvas'
                }`}
              />
            );
          })}
        </div>

        {/* Numeric Keypad for touchscreen convenience */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="h-12 rounded-2xl bg-surface-container hover:bg-surface-container-high active:scale-95 text-base font-bold text-brand-espresso shadow-xs transition-all"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            className="h-12 rounded-2xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-secondary active:scale-95 transition-all"
          >
            C
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-12 rounded-2xl bg-surface-container hover:bg-surface-container-high active:scale-95 text-base font-bold text-brand-espresso shadow-xs transition-all"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-surface-container hover:bg-surface-container-high active:scale-95 flex items-center justify-center text-brand-espresso transition-all"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
