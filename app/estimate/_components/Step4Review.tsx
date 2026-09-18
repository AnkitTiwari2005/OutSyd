'use client';

// app/estimate/_components/Step4Review.tsx — Step 3: Review & Calculate
import { useFormContext } from 'react-hook-form';
import type { FullInput } from '@/lib/validation/input-schema';
import { CheckCircle2, AlertTriangle, Info, Edit2 } from 'lucide-react';

interface Props {
  onNavigateToStep?: (stepIndex: number) => void;
}

export function Step4Review({ onNavigateToStep }: Props) {
  const { watch } = useFormContext<FullInput>();
  const v = watch();
  const bua = (v.lengthFt ?? 0) * (v.breadthFt ?? 0) * (v.numFloors ?? 1);

  const footprint = (v.lengthFt ?? 0) * (v.breadthFt ?? 0);
  const plotArea = v.plotAreaSqft ?? 0;
  const coverageRatio = footprint > 0 && plotArea > 0 ? footprint / plotArea : 0;
  const isCoverageOver = coverageRatio > 0.85;
  const isFootprintOver = footprint > 0 && plotArea > 0 && footprint > plotArea;

  // Compute expected accuracy tier
  const hasStructuralDetails = v.structuralSystem && v.structuralSystem !== 'Not_sure';
  const hasAdvancedDetails = Boolean(v.structuralDrawingUrl || (v.facadeType && v.facadeType !== 'Not_sure'));
  const tier = hasAdvancedDetails ? 3 : hasStructuralDetails ? 2 : 1;

  const ACCURACY = {
    1: {
      band: '±15–20%',
      label: 'Preliminary Estimate',
      icon: AlertTriangle,
      cls: 'bg-[#FEF3C7] border-[#FDE68A] text-[#B45309]',
      iconCls: 'text-[#B45309]',
      note: 'Based on macro dimensions and regional baseline rates. Suitable for high-level feasibility.',
    },
    2: {
      band: '±10–15%',
      label: 'Standard Estimate',
      icon: Info,
      cls: 'bg-[#EFF4FA] border-[#CBD5E1] text-[#1E3A5F]',
      iconCls: 'text-[#1E3A5F]',
      note: 'Incorporates framing system, foundation type, and IS 1893 seismic zoning.',
    },
    3: {
      band: '±5–10%',
      label: 'Advanced Estimate',
      icon: CheckCircle2,
      cls: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]',
      iconCls: 'text-[#16A34A]',
      note: 'Calibrated with full structural framing, envelope facade specifications, and MEP scope.',
    },
  } as const;

  const acc = ACCURACY[tier as 1 | 2 | 3];
  const Icon = acc.icon;

  const sections: Array<{
    heading: string;
    stepIndex: number;
    rows: [string, string | undefined][];
  }> = [
    {
      heading: '1. Project Dimensions',
      stepIndex: 0,
      rows: [
        ['Length × Breadth', `${v.lengthFt ?? '—'} ft × ${v.breadthFt ?? '—'} ft`],
        ['Total Height', `${v.heightFt ?? '—'} ft`],
        ['Floors', `${v.numFloors ?? '—'} Floors`],
        ['Built-up Area (BUA)', bua > 0 ? `${bua.toLocaleString('en-IN')} sqft` : '—'],
        ['Plot Area', v.plotAreaSqft ? `${v.plotAreaSqft.toLocaleString('en-IN')} sqft (${(coverageRatio * 100).toFixed(0)}% coverage)` : '—'],
      ],
    },
    {
      heading: '2. Building Identity & Site',
      stepIndex: 0,
      rows: [
        ['Typology', `${v.typology ?? '—'} (${v.buildingUse ?? 'Standard'})`],
        ['Soil Condition', v.soilType ?? '—'],
        ['Location / City', v.locationRegion ?? '—'],
        ['Quality Specification', v.qualityTier ?? '—'],
      ],
    },
    {
      heading: '3. Structural & Seismic System',
      stepIndex: 1,
      rows: [
        ['Structural Framing', (v.structuralSystem ?? 'Not sure (RCC Frame)').replace(/_/g, ' ')],
        ['Foundation Type', (v.foundationType ?? 'Not sure (Isolated Footing)').replace(/_/g, ' ')],
        ['Seismic Zone', (v.seismicZone ?? 'Auto-detect from city').replace(/_/g, ' ')],
        ['Wind Zone', (v.windLoadZone ?? 'Moderate (39 m/s)').replace(/_/g, ' ')],
        ['Staircases / Elevators', `${v.numStaircases ?? 1} Stairs / ${v.numLifts ?? 0} Lifts`],
        ['Basement Parking', `${v.parkingLevels ?? 0} Levels`],
        ['Units per Floor', v.unitsPerFloor ? `${v.unitsPerFloor} units` : 'Not specified (Standard)'],
      ],
    },
    {
      heading: '4. Envelope & MEP Services',
      stepIndex: 1,
      rows: [
        ['Facade Cladding', (v.facadeType ?? 'Conventional Paint').replace(/_/g, ' ')],
        ['HVAC & Fire Scope', (v.fireHvacScope ?? 'Basic Hydrant & Split AC').replace(/_/g, ' ')],
        ['Structural Drawing Link', v.structuralDrawingUrl ? 'Uploaded / Verified' : 'None provided'],
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1E3A5F]">Review Input Summary</h2>
        <p className="text-xs text-[#64748B] mt-0.5">
          Verify all specifications before running the quantification algorithm. Click any section to edit.
        </p>
      </div>

      {/* Accuracy Band Callout */}
      <div className={`p-4 rounded-lg border ${acc.cls} flex items-start gap-3`}>
        <Icon size={20} className={`mt-0.5 shrink-0 ${acc.iconCls}`} />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">{acc.label}</span>
            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-white/70">
              {acc.band}
            </span>
          </div>
          <p className="text-xs mt-1 leading-relaxed opacity-90">{acc.note}</p>
        </div>
      </div>

      {/* Plot Coverage Warning if Invalid */}
      {(isFootprintOver || isCoverageOver) && (
        <div className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#B91C1C]">
            <AlertTriangle size={16} className="shrink-0" />
            <span>
              {isFootprintOver
                ? `Building footprint (${footprint.toLocaleString('en-IN')} sqft) exceeds plot area (${plotArea.toLocaleString('en-IN')} sqft).`
                : `Ground coverage ratio (${(coverageRatio * 100).toFixed(0)}%) exceeds standard 85% norm (NBC 2016). Minimum plot area is ${Math.ceil(footprint / 0.85).toLocaleString('en-IN')} sqft.`}
            </span>
          </div>
          {onNavigateToStep && (
            <button
              type="button"
              onClick={() => onNavigateToStep(0)}
              className="text-xs font-bold text-[#B91C1C] underline cursor-pointer hover:opacity-80 shrink-0 ml-3"
            >
              Fix in Step 1
            </button>
          )}
        </div>
      )}

      {/* Review Sections with Inline Click-to-Edit */}
      <div className="space-y-4">
        {sections.map(({ heading, stepIndex, rows }) => (
          <div key={heading} className="card-standard overflow-hidden bg-white border border-[#E2E8F0]">
            <div className="px-4 py-2.5 bg-[#F7F8FA] border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#1E3A5F] uppercase tracking-wider">{heading}</h3>
              {onNavigateToStep && (
                <button
                  type="button"
                  onClick={() => onNavigateToStep(stepIndex)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E3A5F] hover:underline cursor-pointer"
                >
                  <Edit2 size={11} />
                  <span>Edit Step {stepIndex + 1}</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-[#E2E8F0]">
              {rows.map(([label, val]) => (
                <div
                  key={label}
                  onClick={() => onNavigateToStep && onNavigateToStep(stepIndex)}
                  className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-[#F7F8FA] transition-colors cursor-pointer group"
                >
                  <span className="text-[#64748B]">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#0F172A] tabular-nums text-right">
                      {val || '—'}
                    </span>
                    <Edit2 size={10} className="text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
