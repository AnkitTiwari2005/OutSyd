// stores/estimate-store.ts — Zustand store with localStorage persistence
// Persists form draft + result for guest users across page navigations
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { FullInput } from '@/lib/validation/input-schema';
import type { EstimateResult } from '@/lib/engine/types';

interface EstimateStore {
  // Multi-step form state
  currentStep: number;
  formData   : Partial<FullInput>;
  setStep    : (step: number) => void;
  updateFormData: (data: Partial<FullInput>) => void;
  resetForm  : () => void;

  // Estimate result
  result     : EstimateResult | null;
  estimateId : string | null;
  guestToken : string | null;
  isLoading  : boolean;
  error      : string | null;
  setResult  : (result: EstimateResult, estimateId: string, guestToken?: string) => void;
  setLoading : (loading: boolean) => void;
  setError   : (error: string | null) => void;
  clearResult: () => void;
}

export const useEstimateStore = create<EstimateStore>()(
  persist(
    (set) => ({
      currentStep : 0,
      formData    : {},
      result      : null,
      estimateId  : null,
      guestToken  : null,
      isLoading   : false,
      error       : null,

      setStep         : (step) => set({ currentStep: step }),
      updateFormData  : (data) => set((s) => ({ formData: { ...s.formData, ...data } })),
      resetForm       : () => set({ currentStep: 0, formData: {}, result: null, estimateId: null, error: null }),
      setResult       : (result, estimateId, guestToken) => set({ result, estimateId, guestToken: guestToken ?? null }),
      setLoading      : (isLoading) => set({ isLoading }),
      setError        : (error) => set({ error }),
      clearResult     : () => set({ result: null, estimateId: null }),
    }),
    {
      name   : 'outsyd-estimate-draft',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        currentStep: s.currentStep,
        formData   : s.formData,
        result     : s.result,
        estimateId : s.estimateId,
        guestToken : s.guestToken,
      }),
    },
  ),
);
