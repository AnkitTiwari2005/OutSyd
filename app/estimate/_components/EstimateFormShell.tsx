'use client';

// app/estimate/_components/EstimateFormShell.tsx
// Unified deterministic 3-step controller (Basics → Structure → Review)
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FullInputSchema, type FullInput } from '@/lib/validation/input-schema';
import { useEstimateStore } from '@/stores/estimate-store';
import { Step1Basics } from './Step1Basics';
import { Step2Building } from './Step2Building';
import { Step4Review } from './Step4Review';
import { ProgressStepper } from './ProgressStepper';
import { ArrowLeft, ArrowRight, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { id: 0, label: 'Basics' },
  { id: 1, label: 'Structure' },
  { id: 2, label: 'Review' },
];

const STEP_TITLES = [
  'Step 1 of 3: Project Dimensions & Identity',
  'Step 2 of 3: Structural & Building Specifications',
  'Step 3 of 3: Review Inputs & Calculate BOQ',
];

export function EstimateFormShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawStep = searchParams?.get('step');
  const mode = searchParams?.get('mode');

  // Derive current step from URL (?step=1 -> 0, ?step=2 -> 1, ?step=3 -> 2)
  const currentStep = rawStep === '2' ? 1 : rawStep === '3' ? 2 : 0;

  const { formData, updateFormData, setResult, setLoading, setError, resetForm, isLoading, error } = useEstimateStore();
  const [tier2ToastShown, setTier2ToastShown] = useState(false);

  // Guarantee isLoading is always reset when entering or leaving wizard
  useEffect(() => {
    setLoading(false);
    return () => {
      setLoading(false);
    };
  }, [setLoading]);

  // Clean draft on fresh visit to /estimate (unless arriving with mode=edit)
  useEffect(() => {
    if (mode !== 'edit' && !rawStep) {
      resetForm();
    }
  }, [mode, rawStep, resetForm]);

  const methods = useForm<FullInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(FullInputSchema) as any,
    defaultValues: {
      structuralSystem: 'Not_sure',
      foundationType: 'Not_sure',
      seismicZone: 'Not_sure',
      windLoadZone: 'Not_sure',
      facadeType: 'Not_sure',
      fireHvacScope: 'Not_sure',
      numStaircases: 1,
      numLifts: 0,
      parkingLevels: 0,
      ...(formData as Partial<FullInput>),
    },
    mode: 'onChange',
  });

  const watched = methods.watch();
  const isTier2 = (Number(watched.numFloors) || 1) > 3 || ['Commercial', 'Institutional', 'Industrial'].includes(watched.typology ?? '');
  const isTier3 = Boolean(watched.structuralDrawingUrl || (Number(watched.numFloors) || 1) > 7);

  // Show tier unlock toast once
  useEffect(() => {
    if (isTier2 && !tier2ToastShown && currentStep === 0) {
      setTier2ToastShown(true);
    }
  }, [isTier2, tier2ToastShown, currentStep]);

  const isStep1Valid = Boolean(
    watched.typology &&
    watched.buildingUse &&
    watched.soilType &&
    watched.locationRegion &&
    watched.qualityTier &&
    Number(watched.lengthFt) > 0 &&
    Number(watched.breadthFt) > 0 &&
    Number(watched.heightFt) > 0 &&
    Number(watched.plotAreaSqft) > 0 &&
    Number(watched.numFloors) >= 1
  );

  const handleNavigateToStep = (stepIdx: number) => {
    if (stepIdx >= 0 && stepIdx <= 2) {
      const data = methods.getValues();
      updateFormData(data);
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      params.set('step', String(stepIdx + 1));
      router.push(`/estimate?${params.toString()}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentStep < 2) {
      handleNavigateToStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      handleNavigateToStep(currentStep - 1);
    }
  };

  const handleSubmit = methods.handleSubmit(async (data) => {
    updateFormData(data);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? json.error ?? 'Calculation error. Please verify inputs.');
        setLoading(false);
        return;
      }
      setResult(json, json.estimateId, json.guestToken);
      setLoading(false); // Clear loading state on success path
      router.push('/estimate/result');
    } catch {
      setError('Connection error. Please check your network and try again.');
      setLoading(false);
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="card-standard bg-white border border-[#E2E8F0] overflow-hidden">
        {/* ── Compact Sub-Header: Stepper + One-line Step Title + Persistent Badge ── */}
        <div className="border-b border-[#E2E8F0] bg-[#F7F8FA] px-4 sm:px-6 pt-3 pb-3 sticky top-16 z-20">
          <ProgressStepper
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={handleNavigateToStep}
          />
          <div className="flex items-center justify-between mt-1 pt-2 border-t border-[#E2E8F0]">
            <h2 className="text-sm font-bold text-[#1E3A5F]">
              {STEP_TITLES[currentStep]}
            </h2>
            <div className="flex items-center gap-2">
              {isTier3 ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A]">
                  Tier 3 · ±5–10%
                </span>
              ) : isTier2 ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#EFF4FA] border border-[#CBD5E1] text-[#1E3A5F]">
                  Tier 2 · ±10–15%
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309]">
                  Tier 1 · ±15–20%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Step Form Content Area ───────────────────────────────────── */}
        <div className="p-4 sm:p-6 md:p-8">
          {currentStep === 0 && <Step1Basics />}
          {currentStep === 1 && <Step2Building />}
          {currentStep === 2 && <Step4Review onNavigateToStep={handleNavigateToStep} />}
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mx-4 sm:mx-8 mb-4 p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Navigation Actions Bar ──────────────────────────────────── */}
        <div className="border-t border-[#E2E8F0] bg-[#F7F8FA] px-4 sm:px-8 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="btn-secondary px-4 py-2"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>

          <div className="text-xs text-[#64748B] font-medium hidden sm:block">
            Step {currentStep + 1} of 3
          </div>

          {currentStep < 2 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={currentStep === 0 && !isStep1Valid}
              className="btn-primary px-6 py-2.5"
            >
              <span>Continue</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="btn-primary px-7 py-2.5"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Calculating BOQ…
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Zap size={15} />
                  Calculate Estimate
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </FormProvider>
  );
}
