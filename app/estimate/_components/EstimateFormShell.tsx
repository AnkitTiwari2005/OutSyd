'use client';

// app/estimate/_components/EstimateFormShell.tsx
// Unified deterministic 3-step controller (Basics → Structure → Review)
import { useForm, FormProvider, useWatch, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FullInputSchema, Tier1Schema, type FullInput } from '@/lib/validation/input-schema';
import { useEstimateStore } from '@/stores/estimate-store';
import { Step1Basics } from './Step1Basics';
import { Step2Building } from './Step2Building';
import { Step4Review } from './Step4Review';
import { ProgressStepper } from './ProgressStepper';
import { ArrowLeft, ArrowRight, Zap, AlertCircle } from 'lucide-react';
import { classifyBuilding } from '@/lib/engine/classifier';
import { resolveAccuracyBandForInput } from '@/lib/engine/cost-calculator';

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

  // URL-driven step navigation (0-indexed internally: 0, 1, 2)
  const stepFromUrl = rawStep ? parseInt(rawStep, 10) - 1 : 0;
  const currentStep = Math.min(Math.max(stepFromUrl, 0), 2);

  const { formData, updateFormData, setResult, resetForm, isLoading, setLoading, _hasHydrated } = useEstimateStore();
  const [error, setError] = useState<string | null>(null);
  const tier2ToastShown = useRef(false);

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
      podiumLevels: 0,
      serviceFloors: 0,
      soilBearingCapacity: undefined,
      greenCertTarget: 'None',
      targetTimelineMonths: undefined,
      unitsPerFloor: undefined,
      structuralDrawingUrl: '',
      ...(formData as Partial<FullInput>),
    },
    mode: 'onChange',
  });

  // Re-populate form once Zustand persist store finishes hydration
  useEffect(() => {
    if (_hasHydrated && formData && Object.keys(formData).length > 0) {
      methods.reset({
        structuralSystem: 'Not_sure',
        foundationType: 'Not_sure',
        seismicZone: 'Not_sure',
        windLoadZone: 'Not_sure',
        facadeType: 'Not_sure',
        fireHvacScope: 'Not_sure',
        numStaircases: 1,
        numLifts: 0,
        parkingLevels: 0,
        podiumLevels: 0,
        serviceFloors: 0,
        soilBearingCapacity: undefined,
        greenCertTarget: 'None',
        targetTimelineMonths: undefined,
        unitsPerFloor: undefined,
        structuralDrawingUrl: '',
        ...(formData as Partial<FullInput>),
      });
    }
  }, [_hasHydrated, formData, methods]);

  const watched = useWatch({ control: methods.control });
  const cls = classifyBuilding({
    numFloors: Number(watched.numFloors) || 1,
    typology: watched.typology ?? 'Residential',
    structuralSystem: watched.structuralSystem,
    seismicZone: watched.seismicZone,
  });
  const accuracyBand = resolveAccuracyBandForInput(watched as Partial<FullInput>);

  // Show tier unlock toast once
  useEffect(() => {
    if (cls.tier >= 2 && !tier2ToastShown.current && currentStep === 0) {
      tier2ToastShown.current = true;
    }
  }, [cls.tier, currentStep]);

  const step1Validation = Tier1Schema.safeParse(watched);
  const isStep1Valid = step1Validation.success;

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

  const handleNext = async () => {
    if (currentStep === 0) {
      const valid = await methods.trigger([
        'lengthFt',
        'breadthFt',
        'heightFt',
        'plotAreaSqft',
        'numFloors',
        'typology',
        'buildingUse',
        'soilType',
        'locationRegion',
        'qualityTier',
      ]);
      const step1Result = Tier1Schema.safeParse(methods.getValues());
      if (!valid || !step1Result.success) {
        if (!step1Result.success) {
          const firstErr = step1Result.error.errors[0]?.message;
          setError(firstErr || 'Please check the entered dimensions and inputs.');
        } else {
          setError('Please complete all required fields correctly before continuing.');
        }
        return;
      }
      setError(null);
      handleNavigateToStep(1);
    } else if (currentStep === 1) {
      const valid = await methods.trigger([
        'structuralSystem',
        'foundationType',
        'seismicZone',
        'windLoadZone',
        'numStaircases',
        'numLifts',
        'parkingLevels',
        'unitsPerFloor',
        'facadeType',
        'fireHvacScope',
        'structuralDrawingUrl',
      ]);
      if (!valid) return;
      setError(null);
      handleNavigateToStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setError(null);
      handleNavigateToStep(currentStep - 1);
    }
  };

  const onValid = async (data: FullInput) => {
    if (isLoading) return;
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
        const errorDetail = json.fieldErrors
          ? Object.entries(json.fieldErrors)
              .map(([f, msgs]) => `${f}: ${(msgs as string[]).join(', ')}`)
              .join(' | ')
          : null;
        setError(json.message ?? errorDetail ?? json.error ?? 'Calculation error. Please verify inputs.');
        setLoading(false);
        return;
      }
      setResult(json, json.estimateId, json.guestToken);
      setLoading(false); // Clear loading state on success path
      router.push('/estimate/result');
    } catch {
      setError('Connection error. Please check your network and try again.');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const onInvalid = (fieldErrors: FieldErrors<FullInput>) => {
    console.warn('Form validation failed on calculate click:', fieldErrors);
    setLoading(false);

    const errorEntries = Object.entries(fieldErrors) as [string, { message?: string }][];
    const firstEntry = errorEntries[0];
    const firstMsg = firstEntry?.[1]?.message || 'Please verify highlighted inputs before calculating.';
    setError(`Validation notice: ${firstMsg}`);

    // If an invalid field belongs to an earlier step, redirect user directly to that step
    const step1Keys = ['lengthFt', 'breadthFt', 'heightFt', 'plotAreaSqft', 'numFloors', 'typology', 'buildingUse', 'soilType', 'locationRegion', 'qualityTier'];
    const hasStep1 = errorEntries.some(([k]) => step1Keys.includes(k));
    if (hasStep1) {
      handleNavigateToStep(0);
      return;
    }

    const step2Keys = ['structuralSystem', 'foundationType', 'seismicZone', 'windLoadZone', 'numStaircases', 'numLifts', 'parkingLevels', 'unitsPerFloor', 'facadeType', 'fireHvacScope', 'structuralDrawingUrl'];
    const hasStep2 = errorEntries.some(([k]) => step2Keys.includes(k));
    if (hasStep2) {
      handleNavigateToStep(1);
      return;
    }
  };

  const handleSubmit = methods.handleSubmit(onValid, onInvalid);

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
              {accuracyBand === 'Advanced_5_10' ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A]">
                  Tier 3 · ±5–10%
                </span>
              ) : accuracyBand === 'Standard_10_15' ? (
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

        {/* ── Form wrapper enabling Enter key submission (U-10) ─────────── */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (currentStep < 2) {
              handleNext();
            } else {
              handleSubmit();
            }
          }}
        >
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
                type="submit"
                disabled={currentStep === 0 && !isStep1Valid}
                className="btn-primary px-6 py-2.5"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
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
        </form>
      </div>
    </FormProvider>
  );
}
