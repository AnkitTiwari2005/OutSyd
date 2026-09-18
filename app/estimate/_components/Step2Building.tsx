'use client';

// app/estimate/_components/Step2Building.tsx — Step 2: Structural & Building Specifications
import { useFormContext, Controller } from 'react-hook-form';
import type { FullInput } from '@/lib/validation/input-schema';
import { FormField } from './FormField';
import { NumberStepperInput } from '@/components/NumberStepperInput';
import { InfoTooltip } from '@/components/InfoTooltip';
import { Link2 } from 'lucide-react';

export function Step2Building() {
  const { register, control, formState: { errors } } = useFormContext<FullInput>();

  return (
    <div className="space-y-8">
      {/* ── Group 1: Structural Framing & Substructure ──────────────── */}
      <div>
        <div className="flex items-center gap-2 pb-2 mb-4 border-b border-[#E2E8F0]">
          <h3 className="section-label">1. Structural System & Substructure</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Structural Frame System"
            error={errors.structuralSystem?.message}
            hint="Determines concrete grade and reinforcement ratio"
          >
            <div className="flex items-center gap-1.5">
              <select {...register('structuralSystem')} className="form-input cursor-pointer">
                <option value="Not_sure">Not sure (conservative default)</option>
                <option value="RCC_Frame">RCC Frame (Columns & Beams — standard)</option>
                <option value="Load_bearing">Load-Bearing Masonry (G+1 / G+2 only)</option>
                <option value="Shear_Wall">Shear Wall System (Towers)</option>
                <option value="Steel">Structural Steel Framing</option>
              </select>
              <InfoTooltip content="Conservative default assumes an RCC framed system with M25 concrete, Fe 500D TMT reinforcement at 3.2 kg/sqft, and standard column grid spacing." />
            </div>
          </FormField>

          <FormField
            label="Foundation Type"
            error={errors.foundationType?.message}
            hint="Determines excavation depth and concrete volume"
          >
            <div className="flex items-center gap-1.5">
              <select {...register('foundationType')} className="form-input cursor-pointer">
                <option value="Not_sure">Not sure (conservative default)</option>
                <option value="Isolated">Isolated Pad Footings</option>
                <option value="Raft">Raft / Mat Foundation</option>
                <option value="Pile">Bored Cast-in-situ Piles</option>
              </select>
              <InfoTooltip content="Conservative default assumes isolated pad footings excavated to 1.8m depth on firm soil (150 kN/m²). For soft/waterlogged soil, the engine automatically upgrades to raft/piles." />
            </div>
          </FormField>
        </div>
      </div>

      {/* ── Group 2: Seismic Zone Compliance ────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 pb-2 mb-4 border-b border-[#E2E8F0]">
          <h3 className="section-label">2. Seismic Zone Compliance (IS 1893:2016)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="IS 1893 Seismic Zone"
            error={errors.seismicZone?.message}
            hint="Ductile detailing multiplier (1.00× to 1.15× steel)"
          >
            <div className="flex items-center gap-1.5">
              <select {...register('seismicZone')} className="form-input cursor-pointer">
                <option value="Not_sure">Not sure — auto-detect from location</option>
                <option value="Zone_II">Zone II — Low seismic risk (Bengaluru, Hyderabad, Chennai)</option>
                <option value="Zone_III">Zone III — Moderate risk (Mumbai, Kolkata, Pune, Bhopal)</option>
                <option value="Zone_IV">Zone IV — High risk (Delhi NCR, Patna, Chandigarh, Dehradun)</option>
                <option value="Zone_V">Zone V — Very high risk (Guwahati, Srinagar, Port Blair, Leh)</option>
              </select>
              <InfoTooltip content="When set to 'Not sure', the engine automatically queries the IS 1893 seismic lookup database for your chosen city. Zone IV/V applies ductile detailing with a +15% reinforcement multiplier." />
            </div>
          </FormField>

          <FormField
            label="Wind Load Zone (IS 875 Part 3)"
            error={errors.windLoadZone?.message}
            hint="Lateral load design standard"
          >
            <div className="flex items-center gap-1.5">
              <select {...register('windLoadZone')} className="form-input cursor-pointer">
                <option value="Not_sure">Not sure (conservative default)</option>
                <option value="Low">Low wind zone (&le; 33 m/s)</option>
                <option value="Moderate">Moderate wind zone (39–44 m/s)</option>
                <option value="High">High wind zone (47–50 m/s)</option>
                <option value="Cyclone_prone">Cyclone-prone coast (&gt; 50 m/s)</option>
              </select>
              <InfoTooltip content="Conservative default assumes Moderate wind speed (39 m/s). Coastal or high zones increase structural steel bracing and glass thickness." />
            </div>
          </FormField>
        </div>
      </div>

      {/* ── Group 3: Building Configuration ─────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 pb-2 mb-4 border-b border-[#E2E8F0]">
          <h3 className="section-label">3. Circulation & Vertical Transport</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <FormField label="Staircases" error={errors.numStaircases?.message} hint="NBC requires 2 for G+3+">
            <Controller
              control={control}
              name="numStaircases"
              render={({ field }) => (
                <NumberStepperInput
                  min={1}
                  max={20}
                  step={1}
                  value={field.value ?? 1}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  onValueChange={(val) => field.onChange(val)}
                />
              )}
            />
          </FormField>

          <FormField label="Elevators / Lifts" error={errors.numLifts?.message} hint="Auto-sized if 0">
            <Controller
              control={control}
              name="numLifts"
              render={({ field }) => (
                <NumberStepperInput
                  min={0}
                  max={20}
                  step={1}
                  value={field.value ?? 0}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  onValueChange={(val) => field.onChange(val)}
                />
              )}
            />
          </FormField>

          <FormField label="Basement Parking Levels" error={errors.parkingLevels?.message} hint="Basement floors">
            <Controller
              control={control}
              name="parkingLevels"
              render={({ field }) => (
                <NumberStepperInput
                  min={0}
                  max={6}
                  step={1}
                  value={field.value ?? 0}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  onValueChange={(val) => field.onChange(val)}
                />
              )}
            />
          </FormField>

          <FormField label="Units per Floor" error={errors.unitsPerFloor?.message} hint="Flats or offices">
            <Controller
              control={control}
              name="unitsPerFloor"
              render={({ field }) => (
                <NumberStepperInput
                  min={1}
                  max={100}
                  step={1}
                  placeholder="e.g. 4"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  onValueChange={(val) => field.onChange(val)}
                />
              )}
            />
          </FormField>
        </div>
      </div>

      {/* ── Group 4: Exterior & Engineering Services ────────────────── */}
      <div>
        <div className="flex items-center gap-2 pb-2 mb-4 border-b border-[#E2E8F0]">
          <h3 className="section-label">4. Exterior Facade, MEP & Engineering Drawings</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <FormField label="Facade Cladding System" error={errors.facadeType?.message}>
            <select {...register('facadeType')} className="form-input cursor-pointer">
              <option value="Not_sure">Not sure (Conventional Plaster & Paint)</option>
              <option value="Conventional">Conventional Exterior Weathercoat Paint</option>
              <option value="ACP_Cladding">ACP (Aluminum Composite Panel) Cladding</option>
              <option value="Curtain_Wall">Curtain Wall / Structural Glazing</option>
            </select>
          </FormField>

          <FormField label="HVAC & Fire Protection Scope" error={errors.fireHvacScope?.message}>
            <select {...register('fireHvacScope')} className="form-input cursor-pointer">
              <option value="Not_sure">Not sure (Auto-detect from typology & height)</option>
              <option value="Basic">Basic Split AC + Wet Riser Hydrants</option>
              <option value="Full_Central">Full Central VRF / AHU + Automatic Sprinklers</option>
            </select>
          </FormField>
        </div>

        {/* Structural Drawing URL */}
        <div className="p-3.5 rounded-lg bg-[#F7F8FA] border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#1E3A5F]">
              Structural Drawing Link (Optional — Unlocks ±5–10% Advanced Band)
            </span>
            <span className="text-[11px] font-semibold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#BBF7D0]">
              Advanced Band Trigger
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] mb-2 leading-relaxed">
            Provide a Google Drive, Dropbox, or OneDrive share link to approved structural architectural drawings or layout PDFs.
          </p>
          <div className="relative">
            <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              {...register('structuralDrawingUrl')}
              type="url"
              placeholder="https://drive.google.com/file/d/..."
              className="form-input pl-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
