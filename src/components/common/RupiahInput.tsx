import React from 'react';
import { formatRupiahInput, parseRupiahInput } from '../../utils/currencyUtils';

export interface RupiahInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNumericChange?: (numericValue: number, cleanDigits: string) => void;
  label?: string;
  prefix?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const RupiahInput: React.FC<RupiahInputProps> = ({
  value,
  onChange,
  onNumericChange,
  label,
  prefix = 'Rp',
  error,
  helperText,
  containerClassName = '',
  className = '',
  placeholder = 'Contoh: 10.000',
  disabled = false,
  required = false,
  ...restProps
}) => {
  // Display value with thousand separator dots (e.g. "10.000")
  const displayValue = formatRupiahInput(value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const cleanDigits = parseRupiahInput(rawInput);
    const numericValue = cleanDigits ? parseInt(cleanDigits, 10) : 0;

    if (onNumericChange) {
      onNumericChange(numericValue, cleanDigits);
    }

    // Call standard onChange with clean digits as target value so existing math/handlers work seamlessly
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: cleanDigits,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange(syntheticEvent);
  };

  return (
    <div className={`flex flex-col gap-1 w-full ${containerClassName}`}>
      {label && (
        <label className="text-xs font-bold text-brand-espresso flex items-center justify-between">
          <span>
            {label} {required && <span className="text-red-500">*</span>}
          </span>
          {displayValue && (
            <span className="text-[10px] font-mono text-secondary">
              Rp {displayValue}
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {prefix && (
          <span className="absolute left-3 text-secondary font-bold text-xs pointer-events-none select-none">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full ${
            prefix ? 'pl-9 pr-3' : 'px-3'
          } py-2.5 rounded-xl bg-surface-container text-sm font-bold text-brand-espresso placeholder:text-secondary/50 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-brand-gold/40 border transition-all ${
            error
              ? 'border-red-400 bg-red-50/20'
              : 'border-border-subtle hover:border-border-strong focus:border-brand-gold'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-muted' : ''} ${className}`}
          {...restProps}
        />
      </div>

      {error ? (
        <span className="text-[11px] text-red-600 font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-[10px] text-secondary">{helperText}</span>
      ) : null}
    </div>
  );
};
