'use client';

import React, { useState, useId } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  id?: string;
  content: string;
  className?: string;
}

export function InfoTooltip({ id, content, className = '' }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const generatedId = useId();
  const tooltipId = id ?? generatedId;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label="More information"
        aria-describedby={open ? tooltipId : undefined}
        className="text-[#64748B] hover:text-[#1E3A5F] p-0.5 rounded cursor-help transition-colors"
      >
        <Info size={14} />
      </button>
      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2.5 bg-[#0F172A] text-white text-xs leading-relaxed rounded-md shadow-lg z-50 pointer-events-none"
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0F172A]" />
        </div>
      )}
    </div>
  );
}
