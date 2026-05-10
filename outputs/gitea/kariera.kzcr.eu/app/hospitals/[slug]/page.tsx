import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Phone, Mail, ExternalLink } from "lucide-react"
import { hospitals, getHospitalBySlug } from "@/lib/hospitalData"

export function generateStaticParams() {
  return hospitals.map((h) => ({ slug: h.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const hospital = getHospitalBySlug(slug)
  if (!hospital) return {}
  return { title: hospital.name }
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 155
}

export default async function HospitalDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const hospital = getHospitalBySlug(slug)

  if (!hospital) {
    notFound()
  }

  const light = isLightColor(hospital.color)
  const textOnColor = light ? "#1a1a1a" : "#ffffff"

  return (
    <div className="w-full">
      {/* Hero */}
      <section
        className="w-full bg-white py-12"
        style={{ borderTop: `6px solid ${hospital.color}` }}
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-4">
            {hospital.name}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Vybíráte si místo, kde chcete pracovat? Nahlédněte pod pokličku naší nemocnice.
          </p>
        </div>
      </section>

      {/* Main content */}
      <main className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left column – image */}
            <div>
              <div className="aspect-video relative shadow-xl rounded-lg overflow-hidden">
                <Image
                  src={hospital.image}
                  alt={hospital.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Right column – contacts + links */}
            <div className="flex flex-col gap-6">
              {/* HR kontakt */}
              <div>
                <h2 className="text-2xl font-bold mb-4">HR kontakt</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 mt-0.5 shrink-0 text-[var(--primary)]" />
                    <span>{hospital.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 shrink-0 text-[var(--primary)]" />
                    <a
                      href={`tel:${hospital.hrPhone.replace(/\s/g, "")}`}
                      className="hover:underline"
                    >
                      {hospital.hrPhone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 shrink-0 text-[var(--primary)]" />
                    <a href={`mailto:${hospital.hrEmail}`} className="hover:underline">
                      {hospital.hrEmail}
                    </a>
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex flex-wrap gap-2">
                <Link href={`/jobs?location=${hospital.code}`}>
                  <span
                    className="inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: hospital.color, color: textOnColor }}
                  >
                    Volné pozice
                  </span>
                </Link>

                <a
                  href={hospital.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-md text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  O nás
                </a>

                <a
                  href={hospital.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold border border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  {hospital.region}
                </a>

                <a
                  href={`${hospital.website}akreditovana-pracoviste/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-md text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Akreditovaná pracoviště
                </a>

                <a
                  href={`${hospital.website}aktuality/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-md text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Blog
                </a>
              </div>

              {/* Facebook button */}
              {hospital.facebookUrl && (
                <a
                  href={hospital.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-md text-sm font-semibold transition-opacity hover:opacity-90 self-start"
                  style={{ backgroundColor: hospital.color, color: textOnColor }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Sledujte nás na Facebooku
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
