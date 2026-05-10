import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Kontakt",
    description: "Kontaktujte personální oddělení Krajské zdravotní, a.s. – zanechte nám svůj životopis a údaje.",
}

export default function ContactsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
