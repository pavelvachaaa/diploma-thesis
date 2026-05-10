"use client"
import { use, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { JobApplication } from '@/components/jobs/JobApplication';
import { useJob } from '@/hooks/useJobs';
import { Job, JobApplication as JobApplicationType } from '@/types/job';
import { Button } from '@/components/ui/button';
import { trackUmamiEvent } from '@/lib/analytics/umami';

interface JobApplyPageProps {
  params: Promise<{ id: string }>;
  initialJob?: Job;
}

export default function JobApplyPage({ params, initialJob }: JobApplyPageProps) {
  const { id: jobId } = use(params);
  const { job, loading } = useJob(jobId);
  const currentJob = job || initialJob;
  const trackedJobIdRef = useRef<string | null>(null);

  const handleApplicationSubmit = (application: JobApplicationType) => {
    // Handle successful submission - could redirect or show success message
  };

  useEffect(() => {
    if (!currentJob || trackedJobIdRef.current === currentJob.id) {
      return;
    }

    trackUmamiEvent('job_application_form_open', {
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

  if (!currentJob) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <p className="text-red-600">Pozice nebyla nalezena</p>
          <Link href="/jobs">
            <Button className="mt-4">Zpět na seznam pozic</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1">
      <div className="py-8 px-4 md:px-6 mx-auto w-full max-w-7xl">
        <div className="mb-8">
          <Link
            href={`/jobs/${currentJob.id}`}
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Zpět na detail pozice
          </Link>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Přihláška na pozici</h1>
          <p className="mt-2 text-xl font-medium">
            {currentJob.title} - {currentJob.organization_name}
          </p>
          <p className="text-muted-foreground">{currentJob.department}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
          <div className="lg:col-span-2">
            <JobApplication
              jobId={jobId}
              job={currentJob}
              onSubmit={handleApplicationSubmit}
            />
          </div>

        </div>
      </div>
    </main>
  );
}
