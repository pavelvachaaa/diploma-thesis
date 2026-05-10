'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Clock } from "lucide-react";
import { Job } from "@/types/job";
import { getContractLabels, sanitizeRichHtml } from "@/lib/utils";

interface JobDetailProps {
  job: Job;
}

export function JobDetail({ job }: JobDetailProps) {
  const sectionItems = {
    benefits: job.sections?.benefits?.filter((item) => item.trim()) ?? [],
    duties: job.sections?.duties?.filter((item) => item.trim()) ?? [],
    requirements: job.sections?.requirements?.filter((item) => item.trim()) ?? [],
  };

  const shouldShowOrganization = () => {
    if (typeof window === 'undefined') return true;
    try {
      const savedState = sessionStorage.getItem('jobsPageState');
      if (savedState) {
        const { filters } = JSON.parse(savedState);
        return !filters?.org;
      }
    } catch {
      // ignore
    }
    return true;
  };

  const labels = getContractLabels(job);
  const cleanDescription = sanitizeRichHtml(job.description || '');

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">{job.title}</h1>
        {shouldShowOrganization() && (
          <p className="text-xl text-gray-700 mt-2">{job.organization_name}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="outline" className="flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            {job.department}
          </Badge>
          {labels.map((label) => (
            <Badge key={label} variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {label}
            </Badge>
          ))}
          
          {job.is_department_accredited && (
            <Badge variant="default" className="bg-green-600 text-white hover:bg-green-700">
              ✓ Akreditované oddělení
            </Badge>
          )}
        </div>
      </div>

      {cleanDescription && (
        <Card>
    
          <CardContent>
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: cleanDescription }}
            />
          </CardContent>
        </Card>
      )}

      {sectionItems.benefits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nabízíme</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {sectionItems.benefits.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {sectionItems.duties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Náplň práce</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {sectionItems.duties.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {sectionItems.requirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Požadavky</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {sectionItems.requirements.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}


    </div>
  );
}
