'use client';

import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface NumberStepperInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: number | string;
  onValueChange?: (val: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

export const NumberStepperInput = React.forwardRef<HTMLInputElement, NumberStepperInputProps>(
  ({ value, onValueChange, step = 1, min = 0, max, className = '', onChange, ...props }, ref) => {
    const handleStep = (direction: 1 | -1) => {
      const current = Number(value) || 0;
      let next = current + direction * step;
      if (min !== undefined && next < min) next = min;
      if (max !== undefined && next > max) next = max;
      // Round to 1 decimal place if fractional
      next = Math.round(next * 10) / 10;
      if (onValueChange) {
        onValueChange(next);
      }
    };

    return (
      <div className="relative w-full flex items-center">
        <input
          ref={ref}
          type="number"
          inputMode="numeric"
          onWheel={(e) => {
            e.currentTarget.blur();
            props.onWheel?.(e);
          }}
          value={value ?? ''}
          onChange={onChange}
          step={step}
          min={min}
          max={max}
          className={`form-input pr-8 ${className}`}
          {...props}
        />
        <div className="absolute right-1 top-1 bottom-1 w-6 flex flex-col border-l border-slate-200">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => handleStep(1)}
            aria-label="Increase value"
            className="flex-1 flex items-center justify-center text-slate-500 hover:text-[var(--accent-navy)] hover:bg-slate-100 rounded-tr cursor-pointer"
          >
            <ChevronUp size={12} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => handleStep(-1)}
            aria-label="Decrease value"
            className="flex-1 flex items-center justify-center text-slate-500 hover:text-[var(--accent-navy)] hover:bg-slate-100 rounded-br border-t border-slate-200 cursor-pointer"
          >
            <ChevronDown size={12} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }
);

NumberStepperInput.displayName = 'NumberStepperInput';
