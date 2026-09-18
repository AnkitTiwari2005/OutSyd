'use client';

// app/estimate/_components/ProgressStepper.tsx
// Stepper spec: circles 32px, connecting line 2px
// Completed: filled green #16A34A, checkmark
// Active: filled navy #1E3A5F, number
// Upcoming: outlined gray #CBD5E1, number
// Label below each circle at 12px

import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  label: string;
}

export function ProgressStepper({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between max-w-md mx-auto relative">
        {/* Connecting Lines */}
        <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-[2px] bg-[#E2E8F0] -z-0">
          <div
            className="h-full bg-[#16A34A] transition-all duration-300"
            style={{ width: `${(Math.min(currentStep, steps.length - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step Circles & Labels */}
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          const isUpcoming = idx > currentStep;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center relative z-10 select-none cursor-pointer"
              onClick={() => {
                // Allow jumping to previously completed steps
                if (isCompleted && onStepClick) {
                  onStepClick(idx);
                }
              }}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-150 ${
                  isCompleted
                    ? 'bg-[#16A34A] text-white border border-[#16A34A]'
                    : isActive
                    ? 'bg-[#1E3A5F] text-white border-2 border-[#1E3A5F]'
                    : 'bg-white text-[#94A3B8] border-2 border-[#CBD5E1]'
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                {isCompleted ? <Check size={16} strokeWidth={2.5} /> : idx + 1}
              </div>
              <span
                className={`text-[12px] font-medium mt-1.5 whitespace-nowrap ${
                  isActive
                    ? 'text-[#1E3A5F] font-bold'
                    : isCompleted
                    ? 'text-[#0F172A]'
                    : 'text-[#64748B]'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
