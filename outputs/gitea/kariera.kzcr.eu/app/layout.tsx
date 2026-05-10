import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/kzcr/header";
import Footer from "@/components/kzcr/footer";
import ScrollToTop from "@/components/kzcr/scroll-to-top";
import { UmamiScript } from "@/components/analytics/UmamiScript";
import { getAssetPath } from "@/lib/paths";

const poppins = localFont({
  src: [
    { path: "./fonts/Poppins-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Poppins-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

const barlow = localFont({
  src: [
    { path: "./fonts/Barlow-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Barlow-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Barlow-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Barlow-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kariéra v KZ a.s.",
    template: "%s | Kariéra v KZ a.s.",
  },
  description: "Kariérní portál Krajské zdravotní, a.s. – největšího poskytovatele zdravotní péče v Ústeckém kraji. Volné pozice, benefity a stipendia.",
  icons: {
    icon: getAssetPath("/favicon.ico")
  },
  openGraph: {
    title: "Kariéra v KZ a.s.",
    description: "Kariérní portál Krajské zdravotní, a.s. – největšího poskytovatele zdravotní péče v Ústeckém kraji.",
    locale: "cs_CZ",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className={`${poppins.variable} ${barlow.variable}  antialiased`}>
        <UmamiScript />
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <ScrollToTop />
        </div>
      </body>
    </html>
  );
}
