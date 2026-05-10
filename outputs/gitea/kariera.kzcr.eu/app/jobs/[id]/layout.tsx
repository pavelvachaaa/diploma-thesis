import type { Metadata } from "next"
import { api } from "@/lib/api"
import { Job } from "@/types/job"
import { stripHtml } from "@/lib/utils"

interface Props {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    try {
        const job = await api<Job>(`/jobs/${id}`);
        const description = job.description
            ? stripHtml(job.description).slice(0, 160)
            : `Volná pozice ${job.title} v ${job.organization_name}`;
        return {
            title: `${job.title} – ${job.organization_name}`,
            description,
            openGraph: {
                title: `${job.title} – ${job.organization_name}`,
                description,
            },
        };
    } catch {
        return {
            title: "Detail pozice",
        };
    }
}

export default function JobDetailLayout({ children }: { children: React.ReactNode }) {
    return children;
}
