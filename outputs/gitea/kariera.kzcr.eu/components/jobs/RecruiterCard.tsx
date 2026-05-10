'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Job } from '@/types/job';

interface RecruiterCardProps {
  job: Job;
}

const buildInitials = (value: string) => {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return initials || 'HR';
};

export function RecruiterCard({ job }: RecruiterCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [job.contact_photo_url, job.contact_photo_file_id, job.organization_id]);

  if (!job.contact_name) {
    return null;
  }

  const photoUrl = !job.contact_photo_url || imageFailed
    ? null
    : job.contact_photo_url;

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardContent>
        <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          Bude se vám věnovat
        </p>

        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-purple)] text-lg font-bold text-white shadow-sm">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={job.contact_name}
                className="h-full w-full object-cover"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <span>{buildInitials(job.contact_name)}</span>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-lg font-bold text-slate-900">{job.contact_name}</p>
            <p className="text-sm font-bold text-[var(--color-primary)]">
              HR Specialista
            </p>
          </div>
        </div>

        {job.contact_linkedin_url && (
          <Button asChild className="mt-4 w-full  font-semibold">
            <a href={job.contact_linkedin_url} target="_blank" rel="noopener noreferrer">
              LinkedIn Profil
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
