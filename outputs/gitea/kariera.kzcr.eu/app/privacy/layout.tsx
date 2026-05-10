import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Ochrana osobních údajů",
    description: "Informace o zpracování osobních údajů společností Krajská zdravotní, a.s. v souladu s GDPR.",
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
    return children;
}
