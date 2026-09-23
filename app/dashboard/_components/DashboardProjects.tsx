'use client';
// Animated project cards grid for the dashboard — client wrapper only
import Link from 'next/link';
import { BarChart3, Clock, PlusCircle, Building2 } from 'lucide-react';
import { StaggerContainer, StaggerItem, FadeUp } from '@/components/animations/FadeUp';
import { motion } from 'motion/react';
import { startTopProgress } from '@/components/TopProgressBar';

interface Project {
  id: string;
  name: string;
  createdAt: Date;
}

interface DashboardProjectsProps {
  projects: Project[];
  emptyState?: boolean;
}

export function DashboardProjects({ projects, emptyState }: DashboardProjectsProps) {
  if (emptyState || projects.length === 0) {
    return (
      <FadeUp>
        <div className="card-standard p-12 text-center bg-[var(--bg-card)] border border-[var(--border-color)]">
          <motion.div
            className="w-12 h-12 rounded-lg bg-[var(--accent-navy-subtle)] text-[var(--accent-navy)] flex items-center justify-center mx-auto mb-3"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 }}
          >
            <Building2 size={24} />
          </motion.div>
          <h2 className="text-base font-bold text-[var(--accent-navy)] mb-1">No estimates saved yet</h2>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mb-5 leading-relaxed">
            Calculate an estimate for any building and click &quot;Save&quot; on the results page to access it anytime.
          </p>
          <motion.div className="inline-block" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href="/estimate" className="btn-primary">
              <PlusCircle size={15} />
              <span>Start Free Estimate</span>
            </Link>
          </motion.div>
        </div>
      </FadeUp>
    );
  }

  return (
    <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" staggerDelay={0.06}>
      {projects.map((p) => (
        <StaggerItem key={p.id}>
          <motion.div
            whileHover={{ y: -4, boxShadow: '0 8px 28px rgba(30,45,78,0.11)' }}
            transition={{ duration: 0.22 }}
          >
            <Link
              href={`/dashboard/projects/${p.id}`}
              onClick={() => startTopProgress()}
              className="card-standard p-5 bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-navy)] transition-colors group block active:scale-[0.99]"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 rounded-md bg-[var(--accent-navy-subtle)] text-[var(--accent-navy)] flex items-center justify-center">
                  <BarChart3 size={16} />
                </div>
                <span className="text-[11px] font-bold text-[var(--accent-navy)] group-hover:underline">
                  View BOQ →
                </span>
              </div>
              <h2 className="font-bold text-sm text-[var(--text-primary)] leading-snug group-hover:text-[var(--accent-navy)] transition-colors">
                {p.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-[var(--text-muted)]">
                <Clock size={11} />
                <span>
                  Saved {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </Link>
          </motion.div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
