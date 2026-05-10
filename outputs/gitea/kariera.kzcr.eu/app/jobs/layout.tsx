import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Volné pozice",
    description: "Prohlédněte si aktuální volné pozice v nemocnicích Krajské zdravotní, a.s. v Ústeckém kraji.",
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
