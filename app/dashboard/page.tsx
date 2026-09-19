// app/dashboard/page.tsx — Engineering & Finance Dashboard
import Image from 'next/image';
import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import Link from 'next/link';
import { PlusCircle, BarChart3, Clock, LogOut, User, Building2, ChevronLeft, ChevronRight } from 'lucide-react';

export const metadata = { title: 'Projects Dashboard — OUTSYD' };

interface PageProps {
  searchParams?: Promise<{ page?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = (session.user.id ?? '') as string;

  const resolvedParams = searchParams ? await searchParams : {};
  const currentPage = Math.max(1, parseInt(resolvedParams.page || '1', 10) || 1);
  const pageSize = 20;
  const offset = (currentPage - 1) * pageSize;

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(eq(projects.userId, userId));
  const totalCount = Number(countRow?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const userProjects = await db
    .select().from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt))
    .limit(pageSize)
    .offset(offset);

  return (
    <main className="min-h-screen bg-[#F7F8FA] text-[#0F172A]">
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-[#E2E8F0] sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <Link href="/">
            <Image
              src="/outsyd-logo.png"
              alt="OUTSYD"
              width={105}
              height={26}
              className="h-6 w-auto"
              priority
            />
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[#1E3A5F] px-2.5 py-1 rounded bg-[#EFF4FA]">
              <User size={13} />
              <span>{session.user.name ?? session.user.email}</span>
            </div>

            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-1 text-xs font-semibold text-[#64748B] hover:text-[#B91C1C] transition-colors cursor-pointer"
              >
                <LogOut size={13} />
                <span>Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1E3A5F]">Saved BOQ Projects</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              {totalCount} saved building estimate{totalCount !== 1 ? 's' : ''}
              {totalPages > 1 ? ` · Page ${currentPage} of ${totalPages}` : ''}
            </p>
          </div>

          <Link href="/estimate" className="btn-primary">
            <PlusCircle size={15} />
            <span>New Estimate</span>
          </Link>
        </div>

        {userProjects.length === 0 ? (
          <div className="card-standard p-12 text-center bg-white border border-[#E2E8F0]">
            <div className="w-12 h-12 rounded-lg bg-[#EFF4FA] text-[#1E3A5F] flex items-center justify-center mx-auto mb-3">
              <Building2 size={24} />
            </div>
            <h2 className="text-base font-bold text-[#1E3A5F] mb-1">No estimates saved yet</h2>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto mb-5 leading-relaxed">
              Calculate an estimate for any building and click &quot;Save&quot; on the results page to access it anytime.
            </p>
            <Link href="/estimate" className="btn-primary">
              <PlusCircle size={15} />
              <span>Start Free Estimate</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userProjects.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/projects/${p.id}`}
                  className="card-standard p-5 bg-white border border-[#E2E8F0] hover:border-[#1E3A5F] transition-all group block"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-md bg-[#EFF4FA] text-[#1E3A5F] flex items-center justify-center">
                      <BarChart3 size={16} />
                    </div>
                    <span className="text-[11px] font-bold text-[#1E3A5F] group-hover:underline">
                      View BOQ →
                    </span>
                  </div>
                  <h2 className="font-bold text-sm text-[#0F172A] leading-snug group-hover:text-[#1E3A5F] transition-colors">
                    {p.name}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-[#64748B]">
                    <Clock size={11} />
                    <span>
                      Saved {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E2E8F0] pt-4 mt-6">
                <p className="text-xs text-[#64748B]">
                  Showing <span className="font-semibold text-[#0F172A]">{offset + 1}</span> to{' '}
                  <span className="font-semibold text-[#0F172A]">{Math.min(offset + pageSize, totalCount)}</span> of{' '}
                  <span className="font-semibold text-[#0F172A]">{totalCount}</span> estimates
                </p>

                <div className="flex items-center gap-2">
                  {currentPage > 1 ? (
                    <Link
                      href={`/dashboard?page=${currentPage - 1}`}
                      className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
                    >
                      <ChevronLeft size={13} /> Previous
                    </Link>
                  ) : (
                    <span className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 opacity-50 cursor-not-allowed">
                      <ChevronLeft size={13} /> Previous
                    </span>
                  )}

                  <span className="text-xs text-[#64748B] px-2 font-mono">
                    {currentPage} / {totalPages}
                  </span>

                  {currentPage < totalPages ? (
                    <Link
                      href={`/dashboard?page=${currentPage + 1}`}
                      className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
                    >
                      Next <ChevronRight size={13} />
                    </Link>
                  ) : (
                    <span className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 opacity-50 cursor-not-allowed">
                      Next <ChevronRight size={13} />
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
