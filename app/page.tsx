'use client';

// app/page.tsx — OUTSYD Landing Page (Institutional Engineering & Finance Edition)
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import {
  ArrowRight, CheckCircle2, Gauge, BarChart3, FileText,
  Layers, Shield, Building2, Clock, Check, Info
} from 'lucide-react';

function useCountUp(target: number, duration = 1400, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

function StatCounter({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const count = useCountUp(value, 1400, started);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="text-center p-3">
      <div className="text-3xl sm:text-4xl font-bold text-[#1E3A5F] tabular-nums tracking-tight">
        {count}{suffix}
      </div>
      <div className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">{label}</div>
    </div>
  );
}

// 18 Categories organized into 4 logical phases for instant scannability (< 5 sec)
const CATEGORY_GROUPS = [
  {
    phase: '1. Substructure & Frame',
    items: [
      { id: '01', name: 'Substructure & Excavation', desc: 'PCC, Footings, Raft/Pile, Anti-termite' },
      { id: '02', name: 'RCC Superstructure', desc: 'Cement OPC/PPC, Fe500D TMT, Shuttering' },
      { id: '03', name: 'Masonry & Plaster', desc: 'AAC Blocks, Red Bricks, Internal Skim' },
      { id: '04', name: 'Waterproofing', desc: 'Crystalline, PU Membrane, Tanking' },
      { id: '05', name: 'Roofing & Ceilings', desc: 'Screed, Water-proofing, Gypsum POP' },
    ],
  },
  {
    phase: '2. MEP & Building Services',
    items: [
      { id: '07', name: 'Electrical & Low-Voltage', desc: 'FRLS Copper, DB Panels, Automation' },
      { id: '08', name: 'Plumbing & STP', desc: 'CPVC, SWR Lines, Booster Pumps, STP' },
      { id: '13', name: 'Staircases & Elevators', desc: 'SS304 Railing, 4–13 Passenger Lifts' },
      { id: '14', name: 'HVAC & Fire Protection', desc: 'VRF/AHU, Hydrant, Sprinklers, Pumps' },
      { id: '17', name: 'Solar & Green Energy', desc: 'Rooftop PV, Rainwater Harvesting' },
    ],
  },
  {
    phase: '3. Architectural & Finishes',
    items: [
      { id: '06', name: 'Doors & Windows', desc: 'UPVC, Thermal Aluminum, DGU Glass' },
      { id: '09', name: 'Flooring & Tiling', desc: 'Vitrified, Italian Marble, Granite' },
      { id: '10', name: 'Wall Finishes & Paint', desc: 'Putty, Primer, Acrylic Emulsions' },
      { id: '11', name: 'Joinery & Woodwork', desc: 'Modular Kitchens, Wardrobes, Doors' },
      { id: '12', name: 'Exterior Cladding', desc: 'Weathercoat, ACP, Structural Glazing' },
    ],
  },
  {
    phase: '4. Site Infrastructure',
    items: [
      { id: '15', name: 'Parking & Basement', desc: 'Retaining Walls, Sump, EV Points' },
      { id: '16', name: 'Pool & Recreation', desc: 'RCC Shell, Filtration, Tiling' },
      { id: '18', name: 'Preliminaries & Site', desc: 'Site Establishment, Testing, Safety' },
    ],
  },
];

const METHOD_STEPS = [
  { n: '01', title: 'Input Dimensions & Use', desc: 'Define your building footprint, floors, typology, city, and quality tier in under 60 seconds.' },
  { n: '02', title: 'Algorithmic Quantification', desc: 'Pure functions calculate material quantities across all 18 categories using CPWD DSR 2024 and 160+ regional rate indexes.' },
  { n: '03', title: 'Institutional BOQ Export', desc: 'Export complete itemized Bill of Quantities as a formal PDF report or multi-sheet Excel (.xlsx) workbook.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      <Navbar />

      {/* ── Compact Hero Section (~30% height reduction for 1440x900 viewports) ── */}
      <section className="border-b border-[#E2E8F0] bg-white py-10 sm:py-14">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            {/* Top Indicator */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F7F8FA] border border-[#E2E8F0] rounded-md text-xs font-semibold text-[#1E3A5F] mb-4">
              <span>CPWD DSR 2024 Calibrated</span>
              <span className="text-[#CBD5E1]">·</span>
              <span>160+ Indian Cities</span>
              <span className="text-[#CBD5E1]">·</span>
              <span>18 Categories</span>
            </div>

            {/* H1 Headline (48px/1.1 per typography scale) */}
            <h1 className="text-3xl sm:text-4xl md:text-[44px] font-bold text-[#1E3A5F] leading-[1.15] tracking-tight mb-4">
              Precision Construction Cost & BOQ Estimator for India
            </h1>

            {/* Subtitle */}
            <p className="text-base text-[#64748B] leading-normal mb-6 max-w-2xl mx-auto font-normal">
              Statistically calibrated material quantities, turnkey costs, and contractor-ready schedules across 18 building categories.
            </p>

            {/* Single Primary CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Link
                href="/estimate"
                className="btn-primary w-full sm:w-auto px-6 py-3 text-sm"
              >
                <span>Calculate Estimate</span>
                <ArrowRight size={16} />
              </Link>
              <a
                href="#categories"
                className="btn-secondary w-full sm:w-auto px-5 py-2.5 text-sm"
              >
                Explore 18 Categories
              </a>
            </div>

            {/* ── Sample Estimate Preview Card (Explicitly labeled) ── */}
            <div className="card-standard p-4 sm:p-5 text-left max-w-2xl mx-auto bg-white border border-[#E2E8F0]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2E8F0]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider bg-[#EFF4FA] text-[#1E3A5F] px-2 py-0.5 rounded">
                      Sample Estimate Output
                    </span>
                    <span className="text-xs text-[#64748B]">Residential Apartment (G+5) — Bengaluru</span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">8,400 sqft BUA · Standard Fe500D RCC · 18 Categories</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A]">
                  ±5–10% Advanced Band
                </span>
              </div>

              {/* 4 Summary Figures */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                <div className="p-2.5 rounded bg-[#F7F8FA] border border-[#E2E8F0]">
                  <p className="text-[11px] font-medium text-[#64748B]">Material Cost</p>
                  <p className="text-base font-semibold text-[#0F172A] tabular-nums mt-0.5">₹1.48 Cr</p>
                </div>
                <div className="p-2.5 rounded bg-[#F7F8FA] border border-[#E2E8F0]">
                  <p className="text-[11px] font-medium text-[#64748B]">With Labour (+30%)</p>
                  <p className="text-base font-semibold text-[#1E3A5F] tabular-nums mt-0.5">₹1.92 Cr</p>
                </div>
                <div className="p-2.5 rounded bg-[#F7F8FA] border border-[#E2E8F0]">
                  <p className="text-[11px] font-medium text-[#64748B]">Material / sqft</p>
                  <p className="text-base font-semibold text-[#0F172A] tabular-nums mt-0.5">₹1,762</p>
                </div>
                <div className="p-2.5 rounded bg-[#F7F8FA] border border-[#E2E8F0]">
                  <p className="text-[11px] font-medium text-[#64748B]">Turnkey / sqft</p>
                  <p className="text-base font-semibold text-[#0F172A] tabular-nums mt-0.5">₹2,291</p>
                </div>
              </div>

              {/* Top 3 Category Drivers */}
              <div className="space-y-1.5 text-xs">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                  Primary Cost Drivers
                </p>
                {[
                  { name: 'RCC Superstructure (Fe500D & Cement)', pct: 28, cost: '₹41.4L', color: '#4E79A7' },
                  { name: 'Substructure & Footings', pct: 21, cost: '₹31.1L', color: '#1E3A5F' },
                  { name: 'Joinery, Kitchen & Finishes', pct: 16, cost: '₹23.7L', color: '#499894' },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                    <span className="text-[#0F172A] font-medium flex-1 truncate">{item.name}</span>
                    <span className="text-[#64748B] tabular-nums">{item.pct}%</span>
                    <span className="font-semibold text-[#0F172A] tabular-nums w-16 text-right">{item.cost}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────────── */}
      <section className="bg-[#F7F8FA] border-b border-[#E2E8F0] py-6">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCounter value={18} label="Material Categories" />
          <StatCounter value={200} suffix="+" label="Line Items Tracked" />
          <StatCounter value={160} suffix="+" label="CPWD City Rate Indexes" />
          <StatCounter value={60} suffix="s" label="Average Computation Time" />
        </div>
      </section>

      {/* ── 18 Categories Grouped Dense View (< 5 sec scan) ──────── */}
      <section id="categories" className="py-16 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="mb-10 text-center">
            <span className="section-label block mb-1">Scope of Works</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F]">
              All 18 Construction Categories
            </h2>
            <p className="text-sm text-[#64748B] mt-1.5 max-w-xl mx-auto">
              Structured according to standard CPWD specification phases for complete BOQ coverage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORY_GROUPS.map((grp) => (
              <div key={grp.phase} className="card-standard p-4 bg-[#F7F8FA]">
                <h3 className="text-xs font-bold text-[#1E3A5F] uppercase tracking-wider pb-2 mb-3 border-b border-[#E2E8F0]">
                  {grp.phase}
                </h3>
                <div className="space-y-2.5">
                  {grp.items.map((cat) => (
                    <div key={cat.id} className="p-2.5 rounded bg-white border border-[#E2E8F0]">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-[#1E3A5F] bg-[#EFF4FA] px-1.5 py-0.5 rounded">
                          CAT_{cat.id}
                        </span>
                        <p className="text-xs font-bold text-[#0F172A] leading-tight truncate">{cat.name}</p>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-1 leading-snug">{cat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Methodology (3 Steps) ─────────────────────────────────── */}
      <section id="how-it-works" className="py-16 bg-[#F7F8FA] border-y border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="mb-10 text-center">
            <span className="section-label block mb-1">Methodology</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F]">
              From Footprint to Bill of Quantities
            </h2>
            <p className="text-sm text-[#64748B] mt-1 max-w-lg mx-auto">
              Three deterministic steps based on IS codes and national building norms.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {METHOD_STEPS.map((s) => (
              <div key={s.n} className="card-standard p-6 bg-white">
                <div className="w-8 h-8 rounded-md bg-[#EFF4FA] text-[#1E3A5F] font-bold text-sm flex items-center justify-center mb-4">
                  {s.n}
                </div>
                <h3 className="text-base font-bold text-[#0F172A] mb-2">{s.title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Accuracy & Standards ──────────────────────────────────── */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="mb-10 text-center">
            <span className="section-label block mb-1">Confidence Bands</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F]">
              Adaptive Accuracy Determination
            </h2>
            <p className="text-sm text-[#64748B] mt-1 max-w-xl mx-auto">
              Confidence intervals adapt automatically based on the engineering detail of your input.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-12">
            <div className="card-standard p-5 bg-[#FEF3C7] border-[#FDE68A]">
              <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider block mb-1">
                Tier 1 Basics
              </span>
              <p className="text-lg font-bold text-[#B45309] mb-1.5">±15–20% Preliminary</p>
              <p className="text-xs text-[#B45309] leading-relaxed">
                Calculated using gross dimensions, typology, location, and quality tier. Designed for feasibility checks.
              </p>
            </div>

            <div className="card-standard p-5 bg-[#EFF4FA] border-[#CBD5E1]">
              <span className="text-xs font-bold text-[#1E3A5F] uppercase tracking-wider block mb-1">
                Tier 2 Structural
              </span>
              <p className="text-lg font-bold text-[#1E3A5F] mb-1.5">±10–15% Standard</p>
              <p className="text-xs text-[#1E3A5F] leading-relaxed">
                Incorporates framing system, foundation type, lift counts, and IS 1893 seismic zoning. Ready for budget approvals.
              </p>
            </div>

            <div className="card-standard p-5 bg-[#F0FDF4] border-[#BBF7D0]">
              <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider block mb-1">
                Tier 3 Detailed
              </span>
              <p className="text-lg font-bold text-[#16A34A] mb-1.5">±5–10% Advanced</p>
              <p className="text-xs text-[#16A34A] leading-relaxed">
                Includes facade specifications, central HVAC/fire requirements, and structural drawing links.
              </p>
            </div>
          </div>

          {/* Export Formats */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F7F8FA] flex items-center gap-3">
              <div className="p-2.5 rounded bg-white border border-[#E2E8F0] text-[#1E3A5F]">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F172A]">Formal PDF BOQ Report</p>
                <p className="text-xs text-[#64748B]">Formatted according to CPWD engineering and tender norms.</p>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F7F8FA] flex items-center gap-3">
              <div className="p-2.5 rounded bg-white border border-[#E2E8F0] text-[#1E3A5F]">
                <BarChart3 size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F172A]">3-Sheet Excel (.xlsx) Workbook</p>
                <p className="text-xs text-[#64748B]">Executive summary, formulaic line-item BOQ, and timeline.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final Action Callout ──────────────────────────────────── */}
      <section className="py-14 bg-[#F7F8FA] border-t border-[#E2E8F0] text-center">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] mb-2">
            Calculate Your Construction BOQ Now
          </h2>
          <p className="text-sm text-[#64748B] mb-6 max-w-md mx-auto">
            Get instant itemized quantities across 18 categories for any Indian city.
          </p>
          <Link
            href="/estimate"
            className="btn-primary px-8 py-3 text-sm"
          >
            <span>Start Free Estimate</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-[#E2E8F0] bg-white py-8 text-xs text-[#64748B]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/outsyd-logo.png" alt="OUTSYD" width={90} height={22} className="h-5 w-auto" />
            <span>— Smart Yield-based Design Estimation for India</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/disclaimer" className="hover:text-[#1E3A5F]">Disclaimer</Link>
            <Link href="/privacy" className="hover:text-[#1E3A5F]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#1E3A5F]">Terms</Link>
            <span>Ideated & created by <strong>Ankit Kumar Tiwari</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
