"use client"
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { JobDetail } from '@/components/jobs/JobDetail';
import { RecruiterCard } from '@/components/jobs/RecruiterCard';
import { useJob } from '@/hooks/useJobs';
import { Job } from '@/types/job';
import { use, useEffect, useRef } from 'react';
import { trackUmamiEvent } from '@/lib/analytics/umami';

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
  initialJob?: Job;
}

export default function JobDetailPage({ params, initialJob }: JobDetailPageProps) {
  const { id: jobId } = use(params);
  const { job, loading, error } = useJob(jobId);
  const currentJob = job || initialJob;
  const trackedJobIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentJob || trackedJobIdRef.current === currentJob.id) {
      return;
    }

    trackUmamiEvent('job_detail_view', {
      job_id: currentJob.id,
      job_title: currentJob.title,
      organization_name: currentJob.organization_name,
      department: currentJob.department || undefined,
    });
    trackedJobIdRef.current = currentJob.id;
  }, [currentJob]);

  if (loading && !initialJob) {
    return (
      <div className="container py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
        </div>
      </div>
    );
  }

  if (error || !currentJob) {
    return (
      <main className="flex-1">
        <div className="py-8 px-4 md:px-6 mx-auto w-full max-w-7xl">
          <div className="mb-8">
            <Link
              href="/jobs"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Zpět na seznam pozic
            </Link>
          </div>
          
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6.294a7.943 7.943 0 01-2-.294M16 6H8m0 0V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0a2 2 0 00-2 2v6.294c.946.319 1.959.545 3 .657V10a2 2 0 012-2h4a2 2 0 012 2v4.951c1.041-.112 2.054-.338 3-.657V8a2 2 0 00-2-2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Pozice nebyla nalezena
            </h1>
            <p className="text-gray-600 mb-8 max-w-md">
              Omlouváme se, ale pozice kterou hledáte neexistuje nebo již není dostupná.
            </p>
            <Link href="/jobs">
              <Button className="btn-cta">
                Zpět na seznam pozic
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="py-8 px-4 md:px-6 mx-auto w-full max-w-7xl">
        <div className="mb-8">
          <Link
            href="/jobs"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Zpět na seznam pozic
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
          <div className="lg:col-span-2">
            <JobDetail job={currentJob} />
          </div>

          <div className="space-y-6">

            <RecruiterCard job={currentJob} />

            <Card>
              <CardHeader>
                <CardTitle>Shrnutí pozice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pozice:</span>
                  <span className="font-medium">{currentJob.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pracoviště:</span>
                  <span className="font-medium">{currentJob.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Typ úvazku:</span>
                  <span className="font-medium">{(currentJob.contract_type_labels?.length ? currentJob.contract_type_labels : currentJob.contract_type_label ? [currentJob.contract_type_label] : []).join(', ')}</span>
                </div>
               
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Link href={`/jobs/${currentJob.id}/apply`} className="w-full">
                  <Button
                    className="w-full btn-cta font-bold"
                    onClick={() => trackUmamiEvent('job_apply_click', {
                      job_id: currentJob.id,
                      job_title: currentJob.title,
                      organization_name: currentJob.organization_name,
                      department: currentJob.department || undefined
                    })}
                  >
                    Odpovědět
                  </Button>
                </Link>
              </CardFooter>
            </Card>

          </div>
        </div>
      </div>
    </main>
  );
}
