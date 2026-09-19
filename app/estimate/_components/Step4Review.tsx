'use client';

// app/estimate/_components/Step4Review.tsx — Step 3: Review & Calculate
import { useFormContext } from 'react-hook-form';
import type { FullInput } from '@/lib/validation/input-schema';
import { CheckCircle2, AlertTriangle, Info, Edit2 } from 'lucide-react';

import { resolveAccuracyBandForInput } from '@/lib/engine/cost-calculator';
import { ACCURACY_BANDS } from '@/lib/constants';

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

  // U-4: Single source of truth accuracy band predicate from engine
  const accuracyBand = resolveAccuracyBandForInput(v);

  const acc = ACCURACY_BANDS[accuracyBand];
  const Icon = accuracyBand === 'Advanced_5_10' ? CheckCircle2 : accuracyBand === 'Standard_10_15' ? Info : AlertTriangle;

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
        ['Soil Bearing Capacity', v.soilBearingCapacity ? `${v.soilBearingCapacity} kN/m²` : 'Firm soil (150 kN/m² standard)'],
        ['Seismic Zone', (v.seismicZone ?? 'Auto-detect from city').replace(/_/g, ' ')],
        ['Wind Zone', (v.windLoadZone ?? 'Moderate (39 m/s)').replace(/_/g, ' ')],
        ['Staircases / Elevators', `${v.numStaircases ?? 1} Stairs / ${v.numLifts ?? 0} Lifts`],
        ['Basement Parking', `${v.parkingLevels ?? 0} Levels`],
        ['Podium & Service Floors', `${v.podiumLevels ?? 0} Podium / ${v.serviceFloors ?? 0} Service`],
        ['Units per Floor', v.unitsPerFloor ? `${v.unitsPerFloor} units` : 'Not specified (Standard)'],
      ],
    },
    {
      heading: '4. Envelope, Services & Sustainability',
      stepIndex: 1,
      rows: [
        ['Facade Cladding', (v.facadeType ?? 'Conventional Paint').replace(/_/g, ' ')],
        ['HVAC & Fire Scope', (v.fireHvacScope ?? 'Basic Hydrant & Split AC').replace(/_/g, ' ')],
        ['Green Certification', v.greenCertTarget && v.greenCertTarget !== 'None' ? `${v.greenCertTarget} Certified` : 'None (Standard NBC)'],
        ['Target Schedule', v.targetTimelineMonths ? `${v.targetTimelineMonths} Months (Fast-track)` : 'Standard baseline'],
        ['Structural Drawing Link', v.structuralDrawingUrl ? 'Uploaded / Verified' : 'None provided'],
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--accent-navy)]">Review Input Summary</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Verify all specifications before running the quantification algorithm. Click any section to edit.
        </p>
      </div>

      {/* Accuracy Band Callout */}
      <div className={`p-4 rounded-lg border ${acc.cls} flex items-start gap-3`}>
        <Icon size={20} className={`mt-0.5 shrink-0 ${acc.iconCls}`} />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">{acc.label}</span>
            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-[var(--bg-card)]/70">
              {acc.band}
            </span>
          </div>
          <p className="text-xs mt-1 leading-relaxed opacity-90">{acc.note}</p>
        </div>
      </div>

      {/* Plot Coverage Warning if Invalid */}
      {(isFootprintOver || isCoverageOver) && (
        <div className="p-3.5 rounded-lg bg-[var(--error-bg)] border border-[var(--error-border)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[var(--error-text)]">
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
              className="text-xs font-bold text-[var(--error-text)] underline cursor-pointer hover:opacity-80 shrink-0 ml-3"
            >
              Fix in Step 1
            </button>
          )}
        </div>
      )}

      {/* Review Sections with Inline Click-to-Edit */}
      <div className="space-y-4">
        {sections.map(({ heading, stepIndex, rows }) => (
          <div key={heading} className="card-standard overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div className="px-4 py-2.5 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-between">
              <h3 className="text-xs font-bold text-[var(--accent-navy)] uppercase tracking-wider">{heading}</h3>
              {onNavigateToStep && (
                <button
                  type="button"
                  onClick={() => onNavigateToStep(stepIndex)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-navy)] hover:underline cursor-pointer"
                >
                  <Edit2 size={11} />
                  <span>Edit Step {stepIndex + 1}</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-[var(--border-color)]">
              {rows.map(([label, val]) => (
                <div
                  key={label}
                  onClick={() => onNavigateToStep && onNavigateToStep(stepIndex)}
                  className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer group"
                >
                  <span className="text-[var(--text-muted)]">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--text-primary)] tabular-nums text-right">
                      {val || '—'}
                    </span>
                    <Edit2 size={10} className="text-[var(--text-subtle)] opacity-0 group-hover:opacity-100 transition-opacity" />
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
