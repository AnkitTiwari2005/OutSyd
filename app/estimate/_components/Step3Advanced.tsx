'use client';
// app/estimate/_components/Step3Advanced.tsx — Tier 3 with grouped sections (Dual Theme)

import { useFormContext } from 'react-hook-form';
import type { FullInput } from '@/lib/validation/input-schema';
import { FormField } from './FormField';
import { Wind, Paintbrush, Thermometer, Link2, Sparkles } from 'lucide-react';

export function Step3Advanced() {
  const { register, formState: { errors } } = useFormContext<FullInput>();

  return (
    <div className="space-y-7 fade-in">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <Thermometer size={15} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Advanced Engineering Details</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            All fields default to &quot;Not sure&quot; — provide known values to unlock the ±5–10% Advanced Band
          </p>
        </div>
      </div>

      {/* Environment */}
      <div>
        <p className="section-title flex items-center gap-1.5">
          <Wind size={12} className="text-blue-500" />
          Environmental Loads
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <FormField label="Wind Load Zone (IS 875 Part 3)" error={errors.windLoadZone?.message}>
            <select {...register('windLoadZone')} className="form-input cursor-pointer">
              <option value="Not_sure" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Not sure (conservative default)</option>
              <option value="Low" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Low wind zone (Up to 33 m/s)</option>
              <option value="Moderate" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Moderate wind zone (39–44 m/s)</option>
              <option value="High" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">High wind zone (47–50 m/s)</option>
              <option value="Cyclone_prone" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Cyclone-prone coast (&gt;50 m/s)</option>
            </select>
          </FormField>
          <FormField
            label="Soil Bearing Capacity (kN/m²)"
            error={errors.soilBearingCapacity?.message}
            hint="From geotechnical report if available"
          >
            <input
              {...register('soilBearingCapacity')}
              type="number" step="0.1"
              placeholder="e.g. 150"
              className="form-input"
            />
          </FormField>
        </div>
      </div>

      {/* Exterior & Services */}
      <div>
        <p className="section-title flex items-center gap-1.5">
          <Paintbrush size={12} className="text-orange-500" />
          Exterior Facade & Building Services
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <FormField label="Facade Cladding Type" error={errors.facadeType?.message}>
            <select {...register('facadeType')} className="form-input cursor-pointer">
              <option value="Not_sure" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Not sure</option>
              <option value="Conventional" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Conventional — Plaster + Paint</option>
              <option value="ACP_Cladding" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">ACP Cladding</option>
              <option value="Curtain_Wall" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Curtain Wall / Structural Glazing</option>
            </select>
          </FormField>
          <FormField label="Fire & HVAC Scope" error={errors.fireHvacScope?.message}>
            <select {...register('fireHvacScope')} className="form-input cursor-pointer">
              <option value="Not_sure" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Not sure</option>
              <option value="Basic" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Basic — residential / small commercial</option>
              <option value="Full_Central" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Full Central HVAC + Fire suppression</option>
            </select>
          </FormField>
          <FormField label="Service Floors (M&E, Plant)" error={errors.serviceFloors?.message}>
            <input
              {...register('serviceFloors')}
              type="number" min={0} max={10} defaultValue={0}
              className="form-input" placeholder="0"
            />
          </FormField>
          <FormField label="Podium / Transfer Slab Levels" error={errors.podiumLevels?.message}>
            <input
              {...register('podiumLevels')}
              type="number" min={0} max={5} defaultValue={0}
              className="form-input" placeholder="0"
            />
          </FormField>
        </div>
      </div>

      {/* Sustainability & Timeline */}
      <div>
        <p className="section-title">Sustainability & Timeline</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <FormField label="Green Certification Target">
            <select {...register('greenCertTarget')} className="form-input cursor-pointer">
              <option value="None" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">None</option>
              <option value="IGBC" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">IGBC Green Homes / Commercial</option>
              <option value="GRIHA" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">GRIHA Certification</option>
            </select>
          </FormField>
          <FormField label="Target Timeline (months)" error={errors.targetTimelineMonths?.message}>
            <input
              {...register('targetTimelineMonths')}
              type="number" min={1}
              placeholder="e.g. 18"
              className="form-input"
            />
          </FormField>
        </div>
      </div>

      {/* Drawing URL */}
      <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 transition-colors">
        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles size={13} />
          Structural Drawing Upload — Maximum Precision
        </p>
        <FormField
          label="Structural Drawing Link (Optional)"
          error={errors.structuralDrawingUrl?.message}
          hint="Google Drive, Dropbox, or PDF link to floor plans — unlocks ±5–10% Advanced Band"
        >
          <div className="relative">
            <Link2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              {...register('structuralDrawingUrl')}
              type="url"
              placeholder="https://drive.google.com/..."
              className="form-input pl-9"
            />
          </div>
        </FormField>
      </div>
    </div>
  );
}
