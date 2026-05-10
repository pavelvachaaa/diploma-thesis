import { Wrench, ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Připravujeme",
}

export default function UnderConstruction() {
  return (
    <section className="relative flex items-center justify-center min-h-[80vh] overflow-hidden bg-gradient-to-br from-white via-blue-50/40 to-white">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-[var(--primary)]/5 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full bg-[var(--color-purple)]/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6 py-20">
        {/* Animated icon */}
        <div className="relative mb-10">
          <div className="w-28 h-28 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-[var(--primary)]/15 flex items-center justify-center">
              <Wrench className="h-10 w-10 text-[var(--primary)] animate-[wiggle_2s_ease-in-out_infinite]" />
            </div>
          </div>
          {/* Pulsing ring */}
          <div className="absolute inset-0 w-28 h-28 rounded-full border-2 border-[var(--primary)]/20 animate-ping" />
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1.5 bg-gray-200 rounded-full mb-10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--color-purple)]"
            style={{
              animation: "progress 3s ease-in-out infinite",
            }}
          />
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold mb-3">
          Připravujeme pro vás
        </h1>
        <p className="text-base sm:text-lg max-w-lg mb-4 font-medium">
          Na této stránce pilně pracujeme. Brzy zde najdete nový obsah.
        </p>
        <p className="text-sm max-w-md mb-10">
          Mezitím se můžete podívat na naše volné pozice nebo se vrátit na úvodní stránku.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors rounded-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Zpět na úvodní stránku
          </Link>
          <Link
            href="/kontaktuj-nas"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors rounded-sm"
          >
            <Mail className="h-4 w-4" />
            Kontaktujte nás
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-12deg); }
          75% { transform: rotate(12deg); }
        }
        @keyframes progress {
          0% { width: 5%; }
          50% { width: 75%; }
          100% { width: 5%; }
        }
      `}</style>
    </section>
  )
}
