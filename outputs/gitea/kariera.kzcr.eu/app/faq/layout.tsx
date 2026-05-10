import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Často kladené dotazy",
    description: "Odpovědi na nejčastější otázky o kariéře v Krajské zdravotní, a.s.",
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
    return children;
}
