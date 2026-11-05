import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Search, AlertCircle } from 'lucide-react';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface CustomSelectProps<T = string> {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  menuClassName?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  searchable?: boolean;
  id?: string;
}

export function CustomSelect<T extends string | number>({
  options,
  value,
  onChange,
  label,
  placeholder = 'Pilih opsi...',
  disabled = false,
  error,
  helperText,
  className = '',
  menuClassName = '',
  icon,
  size = 'md',
  searchable = false,
  id: customId,
}: CustomSelectProps<T>) {
  const autoId = useId();
  const selectId = customId || autoId;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected Option
  const selectedOption = options.find((opt) => opt.value === value);

  // Filtered options based on search
  const filteredOptions = options.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
      (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  });

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen, searchable]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = filteredOptions.findIndex((opt) => opt.value === value);
        const nextIndex = currentIndex < filteredOptions.length - 1 ? currentIndex + 1 : 0;
        if (filteredOptions[nextIndex] && !filteredOptions[nextIndex].disabled) {
          onChange(filteredOptions[nextIndex].value);
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen) {
        const currentIndex = filteredOptions.findIndex((opt) => opt.value === value);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredOptions.length - 1;
        if (filteredOptions[prevIndex] && !filteredOptions[prevIndex].disabled) {
          onChange(filteredOptions[prevIndex].value);
        }
      }
    }
  };

  const handleSelectOption = (opt: SelectOption<T>) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setIsOpen(false);
  };

  // Size specific styling
  const sizeClasses = {
    sm: 'py-2 px-3 text-xs min-h-[38px]',
    md: 'py-2.5 px-3.5 text-xs sm:text-sm min-h-[44px]',
    lg: 'py-3.5 px-4 text-sm sm:text-base min-h-[50px]',
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={selectId}
          className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-secondary mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2.5 rounded-2xl bg-surface-card border transition-all text-left cursor-pointer active:scale-[0.99] ${
          sizeClasses[size]
        } ${
          error
            ? 'border-red-400 ring-2 ring-red-100 bg-red-50/20'
            : isOpen
            ? 'border-brand-terracotta ring-3 ring-brand-terracotta/15 shadow-sm'
            : 'border-border-subtle hover:border-border-strong hover:bg-surface-container-low shadow-xs'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-muted' : ''}`}
      >
        {/* Left Side: Icon & Selected Label */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {icon && <span className="text-secondary shrink-0">{icon}</span>}
          {selectedOption?.icon && (
            <span className="text-brand-terracotta shrink-0">{selectedOption.icon}</span>
          )}
          <div className="truncate flex-1">
            {selectedOption ? (
              <span className="font-bold text-brand-espresso block truncate">
                {selectedOption.label}
              </span>
            ) : (
              <span className="text-secondary/70 font-normal">{placeholder}</span>
            )}
          </div>
        </div>

        {/* Right Side: Badge & Custom Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedOption?.badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-gold/20 text-brand-espresso border border-brand-gold/40">
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-secondary transition-transform duration-200 stroke-[2.5] ${
              isOpen ? 'rotate-180 text-brand-terracotta' : ''
            }`}
          />
        </div>
      </button>

      {/* Error or Helper Message */}
      {error ? (
        <div className="flex items-center gap-1 text-[11px] font-medium text-red-600 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <span className="block text-[11px] text-secondary mt-1">{helperText}</span>
      ) : null}

      {/* Floating Animated Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 right-0 mt-1.5 z-50 rounded-2xl bg-surface-card border border-border-subtle shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150 ${menuClassName}`}
          style={{ maxHeight: '280px' }}
        >
          {/* Internal Instant Search if enabled */}
          {searchable && (
            <div className="p-2 border-b border-border-subtle bg-surface-container-low/50 sticky top-0 z-10 backdrop-blur-md">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-secondary absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari opsi..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface text-xs text-brand-espresso placeholder:text-secondary/60 border border-border-subtle focus:outline-none focus:border-brand-terracotta"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="p-1.5 overflow-y-auto max-h-[220px] space-y-0.5 no-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-secondary">
                Tidak ada opsi yang cocok
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all text-xs sm:text-sm cursor-pointer select-none active:scale-[0.99] ${
                      isSelected
                        ? 'bg-brand-gold/15 text-brand-espresso font-bold'
                        : opt.disabled
                        ? 'opacity-40 cursor-not-allowed text-secondary'
                        : 'text-brand-espresso hover:bg-surface-container font-medium'
                    }`}
                  >
                    {/* Option Icon & Text */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {opt.icon && (
                        <span
                          className={`shrink-0 ${
                            isSelected ? 'text-brand-terracotta' : 'text-secondary'
                          }`}
                        >
                          {opt.icon}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="block truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="block text-[10px] text-secondary font-normal truncate">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Option Badge & Active Checkmark */}
                    <div className="flex items-center gap-2 shrink-0">
                      {opt.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isSelected
                              ? 'bg-brand-gold text-brand-espresso'
                              : 'bg-surface-container text-secondary'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-brand-terracotta stroke-[3] shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
