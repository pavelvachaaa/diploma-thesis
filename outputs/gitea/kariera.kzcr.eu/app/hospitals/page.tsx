import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Phone, Mail, ExternalLink } from "lucide-react"
import InteractiveMap from "@/components/interactive-map"
import { hospitals } from "@/lib/hospitalData"
import { getSeatLocationByHospitalSlug } from "@/lib/hospitalLocations"

export const metadata: Metadata = {
    title: "Naše nemocnice",
    description: "Přehled 7 nemocnic Krajské zdravotní, a.s. v Ústeckém kraji – kontakty, adresy a volné pozice.",
}

export default function HospitalsPage() {
    return (
        <div className="w-full">

            <main className="flex-1">
                <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-[var(--color-info-bg)] to-blue-50">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center justify-center space-y-6 text-center">
                            <div className="space-y-4">
                                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">Kde všude nás najdete</h1>
                                <p className="max-w-4xl text-lg text-muted-foreground md:text-xl lg:text-2xl leading-relaxed">
                                    Krajská zdravotní provozuje 7 nemocnic v Ústeckém kraji, které poskytují komplexní zdravotní
                                    péči pro více než 830 000 obyvatel.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="w-full py-12 md:py-24 lg:py-32">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-12">Interaktivní mapa nemocnic</h2>
                        <InteractiveMap />
                    </div>
                </section>

                <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-12">Přehled nemocnic</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {hospitals.map((hospital) => (
                                <Card
                                    key={hospital.slug}
                                    className="overflow-hidden"
                                    style={{ borderTop: `4px solid ${hospital.color}` }}
                                >
                                    <div className="aspect-video relative">
                                        <Image
                                            src={hospital.image || "/placeholder.svg"}
                                            alt={hospital.name}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    </div>
                                    <CardHeader>
                                        <CardTitle>{hospital.name}</CardTitle>
                                        <CardDescription>{hospital.region}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex items-start">
                                                <MapPin className="h-5 w-5 mr-2 text-[var(--primary)] mt-0.5" />
                                                <span>{hospital.address}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <Phone className="h-5 w-5 mr-2 text-[var(--primary)]" />
                                                <span>{hospital.hrPhone}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <Mail className="h-5 w-5 mr-2 text-[var(--primary)]" />
                                                <span>{hospital.hrEmail}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex flex-wrap gap-2 justify-between">
                                        <Link href={hospital.website} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline">
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Webové stránky
                                            </Button>
                                        </Link>
                                        <div className="flex gap-2">
                                            <Link href={`/hospitals/${hospital.slug}`}>
                                                <Button variant="outline">Detail</Button>
                                            </Link>
                                            <Link href={`/jobs?location=${getSeatLocationByHospitalSlug(hospital.slug) || hospital.slug}`}>
                                                <Button className="btn-cta">Volné pozice</Button>
                                            </Link>
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            </main>


        </div>
    )
}
