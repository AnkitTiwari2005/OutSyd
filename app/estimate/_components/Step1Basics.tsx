'use client';

// app/estimate/_components/Step1Basics.tsx — Step 1: Project Basics
import { useFormContext, useWatch, Controller } from 'react-hook-form';
import type { FullInput } from '@/lib/validation/input-schema';
import { BUILDING_USE_OPTIONS } from '@/lib/validation/input-schema';
import { FormField } from './FormField';
import { NumberStepperInput } from '@/components/NumberStepperInput';
import {
  Home, Briefcase, BookOpen, Factory,
  Check, Mountain, Droplets, Layers, CircleDot,
  Coins, Star, Crown, CheckCircle2, MapPin
} from 'lucide-react';
import { REGIONAL_RATE_INDEX } from '@/lib/engine/coefficients';

const TYPOLOGY_OPTIONS = [
  { value: 'Residential',   label: 'Residential',   icon: Home },
  { value: 'Commercial',    label: 'Commercial',     icon: Briefcase },
  { value: 'Institutional', label: 'Institutional',  icon: BookOpen },
  { value: 'Industrial',    label: 'Industrial',     icon: Factory },
] as const;

const SOIL_TYPES = [
  { value: 'Normal',            label: 'Normal / Firm',      desc: 'Standard bearing capacity (150+ kN/m²)', icon: CircleDot },
  { value: 'Rocky',             label: 'Rocky / Hard',       desc: 'High capacity, reduced footing depth', icon: Mountain },
  { value: 'Filled-up',         label: 'Filled-up Ground',   desc: 'Engineered fill, extra foundation depth', icon: Layers },
  { value: 'Waterlogged-prone', label: 'Waterlogged / Soft', desc: 'Raft or pile foundation required', icon: Droplets },
] as const;

const QUALITY_TIERS = [
  {
    value: 'Economy',
    label: 'Economy Tier',
    range: '₹1,500 – ₹1,900 / sqft',
    desc: 'Standard ISI cement & Fe500 steel, ceramic tiles, basic sanitaryware',
    bestFor: 'Rental housing, budget hostels, warehousing',
    icon: Coins,
  },
  {
    value: 'Standard',
    label: 'Standard Tier',
    range: '₹1,900 – ₹2,900 / sqft',
    desc: 'Fe500D TMT, vitrified 800x800 tiles, CPVC plumbing, branded modular switches',
    bestFor: 'Urban homes, commercial offices, private villas',
    icon: Star,
  },
  {
    value: 'Premium',
    label: 'Premium Tier',
    range: '₹2,900 – ₹5,200+ / sqft',
    desc: 'Fe550D TMT, Italian marble, VRF central air, architectural acoustic glazing',
    bestFor: 'Luxury residences, corporate headquarters, high-end hotels',
    icon: Crown,
  },
] as const;

const REGIONS = Object.keys(REGIONAL_RATE_INDEX).filter(r => r !== 'default').sort();

export function Step1Basics() {
  const { register, control, setValue, formState: { errors } } = useFormContext<FullInput>();
  const [typology, length, breadth, floors, qualityTier, locationRegion, plotAreaSqft] = useWatch({
    name: ['typology', 'lengthFt', 'breadthFt', 'numFloors', 'qualityTier', 'locationRegion', 'plotAreaSqft'],
  });

  const useOptions = typology ? BUILDING_USE_OPTIONS[typology] ?? [] : [];
  const bua = (Number(length) || 0) * (Number(breadth) || 0) * (Number(floors) || 1);
  const footprint = (Number(length) || 0) * (Number(breadth) || 0);
  const plotArea = Number(plotAreaSqft) || 0;
  const coveragePct = footprint > 0 && plotArea > 0 ? (footprint / plotArea) * 100 : 0;
  const minPlotAreaFor85 = footprint > 0 ? Math.ceil(footprint / 0.85) : 0;

  return (
    <div className="space-y-8">
      {/* ── Section 1: Dimensions ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between pb-2 mb-4 border-b border-[#E2E8F0]">
          <h3 className="section-label">1. Building Footprint & Dimensions</h3>
          {bua > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#EFF4FA] text-[#1E3A5F] border border-[#CBD5E1]">
              Calculated BUA: {bua.toLocaleString('en-IN')} sqft
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <FormField label="Length (ft)" error={errors.lengthFt?.message} required>
            <Controller
              control={control}
              name="lengthFt"
              render={({ field }) => (
                <NumberStepperInput
                  placeholder="e.g. 50"
                  min={1}
                  step={1}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  onValueChange={(val) => field.onChange(val)}
                />
              )}
            />
          </FormField>

          <FormField label="Breadth (ft)" error={errors.breadthFt?.message} required>
            <Controller
              control={control}
              name="breadthFt"
              render={({ field }) => (
                <NumberStepperInput
                  placeholder="e.g. 30"
                  min={1}
                  step={1}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  onValueChange={(val) => field.onChange(val)}
                />
              )}
            />
          </FormField>

          <FormField label="Total Building Height (ft)" error={errors.heightFt?.message} required>
            <Controller
              control={control}
              name="heightFt"
              render={({ field }) => (
                <NumberStepperInput
                  placeholder="e.g. 35"
                  min={1}
                  step={1}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  onValueChange={(val) => field.onChange(val)}
                />
              )}
            />
          </FormField>

          <FormField label="Plot Area (sqft)" error={errors.plotAreaSqft?.message} required hint="Total land/site area">
            <Controller
              control={control}
              name="plotAreaSqft"
              render={({ field }) => (
                <div>
                  <NumberStepperInput
                    placeholder="e.g. 2400"
                    min={1}
                    step={50}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    onValueChange={(val) => field.onChange(val)}
                  />
                  {footprint > 0 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-[#64748B]">
                        Footprint: <strong className="text-[#1E3A5F]">{footprint.toLocaleString('en-IN')} sqft</strong>
                      </span>
                      {plotArea > 0 && (
                        <span className={`px-1.5 py-0.2 rounded font-medium ${
                          coveragePct > 85
                            ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]'
                            : 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                        }`}>
                          {coveragePct.toFixed(0)}% Coverage (max 85% norm)
                        </span>
                      )}
                      {coveragePct > 85 && (
                        <button
                          type="button"
                          onClick={() => setValue('plotAreaSqft', minPlotAreaFor85, { shouldValidate: true })}
                          className="text-[11px] text-[#1E3A5F] font-semibold underline hover:text-[#D97706] cursor-pointer ml-auto"
                        >
                          Set to {minPlotAreaFor85.toLocaleString('en-IN')} sqft
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            />
          </FormField>

          <FormField label="Number of Above-Ground Floors" error={errors.numFloors?.message} required hint="Ground floor counts as 1">
            <Controller
              control={control}
              name="numFloors"
              render={({ field }) => (
                <NumberStepperInput
                  placeholder="e.g. 3"
                  min={1}
                  max={120}
                  step={1}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  onValueChange={(val) => field.onChange(val)}
                />
              )}
            />
          </FormField>
        </div>
      </div>

      {/* ── Section 2: Building Typology (Selectable Cards) ─────────── */}
      <div>
        <div className="pb-2 mb-4 border-b border-[#E2E8F0]">
          <h3 className="section-label">2. Typology & Primary Use</h3>
        </div>

        <Controller
          control={control}
          name="typology"
          render={({ field }) => (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="radiogroup" aria-label="Building Typology">
              {TYPOLOGY_OPTIONS.map(({ value, label, icon: Icon }) => {
                const selected = field.value === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={0}
                    onClick={() => field.onChange(value)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        field.onChange(value);
                      }
                    }}
                    className={`relative flex flex-col items-start p-3.5 rounded-lg text-left transition-all cursor-pointer ${
                      selected
                        ? 'border-2 border-[#1E3A5F] bg-[#EFF4FA]'
                        : 'border border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                    }`}
                  >
                    {/* Top right checkmark badge */}
                    {selected && (
                      <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center">
                        <Check size={11} strokeWidth={3} />
                      </div>
                    )}
                    <Icon size={18} className={selected ? 'text-[#1E3A5F]' : 'text-[#64748B]'} />
                    <span className="font-bold text-sm text-[#0F172A] mt-2">{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.typology && (
          <p role="alert" className="mt-1 text-xs text-red-600 font-medium">{errors.typology.message}</p>
        )}

        {/* Specific use selector */}
        {typology && useOptions.length > 0 && (
          <div className="mt-4">
            <FormField label="Specific Building Use / Configuration" error={errors.buildingUse?.message} required>
              <select {...register('buildingUse')} className="form-input cursor-pointer">
                <option value="">Select specific configuration...</option>
                {useOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        )}
      </div>

      {/* ── Section 3: Soil & Location ──────────────────────────────── */}
      <div>
        <div className="pb-2 mb-4 border-b border-[#E2E8F0]">
          <h3 className="section-label">3. Site Ground Conditions & Location</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Soil condition selectable cards */}
          <div>
            <label className="text-xs font-semibold text-[#0F172A] block mb-2">Soil Bearing Condition</label>
            <Controller
              control={control}
              name="soilType"
              render={({ field }) => (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Soil condition">
                  {SOIL_TYPES.map(({ value, label, desc, icon: Icon }) => {
                    const selected = field.value === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        tabIndex={0}
                        onClick={() => field.onChange(value)}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            field.onChange(value);
                          }
                        }}
                        className={`relative flex flex-col items-start p-3 rounded-lg text-left transition-all cursor-pointer ${
                          selected
                            ? 'border-2 border-[#1E3A5F] bg-[#EFF4FA]'
                            : 'border border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                        }`}
                      >
                        {selected && (
                          <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center">
                            <Check size={9} strokeWidth={3} />
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon size={14} className={selected ? 'text-[#1E3A5F]' : 'text-[#64748B]'} />
                          <span className="text-xs font-bold text-[#0F172A]">{label}</span>
                        </div>
                        <span className="text-[11px] text-[#64748B] leading-tight">{desc}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.soilType && (
              <p role="alert" className="mt-1 text-xs text-red-600 font-medium">{errors.soilType.message}</p>
            )}
          </div>

          {/* Location lookup */}
          <div>
            <FormField
              label="Location / Indian City Rate Index"
              error={errors.locationRegion?.message}
              required
              hint="160+ cities calibrated to CPWD city cost indexes"
            >
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  {...register('locationRegion')}
                  placeholder="Type to search e.g. Bengaluru, Delhi, Mumbai, Patna, Leh..."
                  list="outsyd-city-index"
                  className="form-input pl-8"
                  autoComplete="off"
                />
                <datalist id="outsyd-city-index">
                  {REGIONS.map(r => <option key={r} value={r} />)}
                </datalist>
              </div>

              {locationRegion && (() => {
                const query = locationRegion.toLowerCase().trim();
                const matched = REGIONS.find(r => r.toLowerCase() === query || query.includes(r.toLowerCase()));
                if (matched) {
                  const idx = REGIONAL_RATE_INDEX[matched as keyof typeof REGIONAL_RATE_INDEX];
                  return (
                    <div className="mt-2 p-2 rounded bg-[#F0FDF4] border border-[#BBF7D0] flex items-center gap-1.5 text-xs text-[#16A34A] font-semibold">
                      <CheckCircle2 size={13} />
                      <span>Validated CPWD Regional Cost Index: <strong>{idx}×</strong> for {matched.toUpperCase()}</span>
                    </div>
                  );
                }
                if (locationRegion.length > 2) {
                  return (
                    <p className="text-xs text-[#B45309] mt-1.5">
                      City not indexed — applying national baseline CPWD rate (1.00×)
                    </p>
                  );
                }
                return null;
              })()}
            </FormField>
          </div>
        </div>
      </div>

      {/* ── Section 4: Quality Tier (Selectable Cards) ──────────────── */}
      <div>
        <div className="pb-2 mb-4 border-b border-[#E2E8F0]">
          <h3 className="section-label">4. Quality Specification Tier</h3>
        </div>

        <Controller
          control={control}
          name="qualityTier"
          render={({ field }) => (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3" role="radiogroup" aria-label="Quality Tier">
              {QUALITY_TIERS.map(({ value, label, range, desc, bestFor, icon: Icon }) => {
                const selected = field.value === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={0}
                    onClick={() => field.onChange(value)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        field.onChange(value);
                      }
                    }}
                    className={`relative flex flex-col p-4 rounded-lg text-left transition-all cursor-pointer ${
                      selected
                        ? 'border-2 border-[#1E3A5F] bg-[#EFF4FA]'
                        : 'border border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                    }`}
                  >
                    {selected && (
                      <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={16} className={selected ? 'text-[#1E3A5F]' : 'text-[#64748B]'} />
                      <span className="font-bold text-sm text-[#0F172A]">{label}</span>
                    </div>
                    {/* Neutral high-contrast price range (NEVER amber CTA color) */}
                    <span className="text-xs font-mono font-bold text-[#1E3A5F] tabular-nums mt-0.5">
                      {range}
                    </span>
                    <p className="text-xs text-[#64748B] mt-2 leading-relaxed">{desc}</p>
                    <div className="mt-3 pt-2 border-t border-[#E2E8F0] text-[11px] text-[#0F172A]">
                      <span className="font-semibold text-[#64748B]">Best for:</span> {bestFor}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.qualityTier && (
          <p role="alert" className="mt-1 text-xs text-red-600 font-medium">{errors.qualityTier.message}</p>
        )}
      </div>
    </div>
  );
}
