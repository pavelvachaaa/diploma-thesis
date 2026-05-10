import Link from "next/link"
import { ArrowLeft, Home } from "lucide-react"

export default function NotFound() {
  return (
    <section className="relative flex items-center justify-center min-h-[80vh] overflow-hidden bg-gradient-to-br from-white via-blue-50/40 to-white">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[var(--primary)]/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[var(--color-purple)]/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6 py-20">
        {/* Big 404 */}
        <div className="relative mb-6">
          <span className="text-[10rem] sm:text-[14rem] font-extrabold leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-[var(--primary)] to-[var(--color-purple)] select-none">
            404
          </span>
          <div className="absolute inset-0 text-[10rem] sm:text-[14rem] font-extrabold leading-none tracking-tighter text-[var(--primary)]/5 blur-2xl select-none" aria-hidden>
            404
          </div>
        </div>

        {/* Heartbeat line */}
        <div className="w-64 h-12 mb-8">
          <svg viewBox="0 0 256 48" fill="none" className="w-full h-full">
            <path
              d="M0 24 H80 L96 8 L112 40 L128 8 L144 40 L160 24 H256"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-[dash_2s_ease-in-out_infinite]"
              strokeDasharray="400"
              strokeDashoffset="400"
              style={{
                animation: "dash 2.5s ease-in-out infinite",
              }}
            />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-3">
          Stránka nenalezena
        </h1>
        <p className="text-base sm:text-lg max-w-md mb-10 font-medium">
          Omlouváme se, ale stránka, kterou hledáte, neexistuje nebo byla přesunuta.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors rounded-sm"
          >
            <Home className="h-4 w-4" />
            Zpět na úvodní stránku
          </Link>
          <Link
            href="/jobs"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors rounded-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Volné pozice
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes dash {
          0% { stroke-dashoffset: 400; }
          50% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -400; }
        }
      `}</style>
    </section>
  )
}
