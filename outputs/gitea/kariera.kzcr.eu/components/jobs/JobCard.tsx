import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";
import { Job } from "@/types/job";
import { stripHtml, getContractLabels } from "@/lib/utils";

interface JobCardProps {
    job: Job;
    onSave?: (jobId: string) => void;
    saved?: boolean;
    showOrganization?: boolean;
}

export function JobCard({ job, onSave, saved, showOrganization = true }: JobCardProps) {
    const handleSave = () => {
        onSave?.(job.id);
    };

    const labels = getContractLabels(job);
    const excerpt = job.description ? stripHtml(job.description).slice(0, 180) + (stripHtml(job.description).length > 180 ? '…' : '') : '';

    return (
        <Card className="p-6 hover:shadow-md transition-shadow" data-testid="job-card">
            <div className="flex justify-between">
                <div className="flex-1">
                    <Link
                        href={`/jobs/${job.id}`}
                        className="text-xl font-bold hover:text-[var(--primary)] transition-colors"
                    >
                        {job.title}
                    </Link>
                    {showOrganization && (
                        <p className="text-gray-700">{job.organization_name}</p>
                    )}
                    <p className="text-sm text-gray-600">{job.department}</p>

                    <div className="flex flex-wrap gap-2 my-2">
                        {labels.map((label) => (
                            <Badge key={label} variant="outline" className="bg-[var(--color-info-bg)] text-[var(--primary)] hover:bg-[var(--color-info-bg)]">
                                {label}
                            </Badge>
                        ))}
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                            {job.department}
                        </Badge>
                        {job.is_department_accredited && (
                            <Badge variant="default" className="bg-green-600 text-white hover:bg-green-700">
                                Akreditováno
                            </Badge>
                        )}
                    </div>

                    <p className="mt-3 text-gray-600 line-clamp-2">{excerpt}</p>


                </div>

                <div className="ml-4 flex flex-col gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleSave}
                        className={`h-10 w-10 rounded-full ${saved ? 'bg-red-50 text-red-600' : ''}`}
                    >
                        <Briefcase className="h-5 w-5" />
                        <span className="sr-only">{saved ? 'Odebrat z uložených' : 'Uložit pozici'}</span>
                    </Button>
                </div>
            </div>
        </Card>
    );
}
