'use client';
// app/estimate/_components/FormField.tsx

import { cn } from '@/lib/utils';
import { AlertCircle, Info } from 'lucide-react';
import React, { cloneElement, isValidElement, type ReactNode } from 'react';

interface FormFieldProps {
  label     : string;
  htmlFor?  : string;
  error?    : string;
  hint?     : string;
  required? : boolean;
  children  : ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, error, hint, required, children, className }: FormFieldProps) {
  const fieldId = htmlFor ?? label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;

  const renderedChild = isValidElement(children)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? cloneElement(children as React.ReactElement<any>, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: (children.props as any).id ?? fieldId,
        'aria-invalid': Boolean(error),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'aria-describedby': (children.props as any)['aria-describedby'] ?? describedBy,
      })
    : children;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={fieldId} className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1 select-none">
        {label}
        {required && <span className="text-[var(--error-text)] text-xs font-bold" aria-label="required">*</span>}
      </label>
      {hint && (
        <p id={hintId} className="text-[11px] text-[var(--text-muted)] leading-normal flex items-start gap-1 -mt-0.5">
          <Info size={11} className="mt-0.5 shrink-0 text-[var(--text-subtle)]" aria-hidden />
          {hint}
        </p>
      )}
      {renderedChild}
      {error && (
        <p id={errorId} role="alert" className="text-[11px] text-[var(--error-text)] flex items-start gap-1 mt-0.5 font-medium">
          <AlertCircle size={11} className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
