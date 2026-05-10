import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getAssetPath } from "@/lib/paths"
import {
  ArrowRight,
  MapPin,
  Stethoscope,
  Users,
  Building,

} from "lucide-react"
import InteractiveMap from "@/components/interactive-map"
import ScholarshipSection from "@/components/scholarship-section"

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-[var(--color-info-bg)] via-white to-[var(--color-info-bg)] border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="flex flex-col justify-center space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full border border-[var(--primary)]/30 bg-[var(--color-info-bg)] px-3 py-1 text-sm font-bold text-[var(--color-dark-navy)]">
                  <span className="flex h-2 w-2 rounded-full bg-[var(--primary)] mr-2" />
                  Přijímáme nové kolegy
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                  Budujte kariéru
                  <span className="mt-2 block text-[var(--primary)] text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                    v&nbsp;Krajské zdravotní
                  </span>
                </h1>
                <p className="text-lg md:text-xl max-w-2xl">
                  Jsme největší poskytovatel zdravotní péče v&nbsp;Ústeckém kraji. Přidejte se k&nbsp;týmu špičkových odborníků v&nbsp;jedné z&nbsp;našich&nbsp;7&nbsp;nemocnic.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/jobs">
                  <Button
                    size="lg"
                    className="cursor-pointer w-full sm:w-auto px-8 py-6 text-lg font-semibold bg-[var(--color-purple)] hover:bg-[var(--color-purple-hover)] shadow-lg hover:shadow-xl transition-all"
                  >
                    Volné pozice
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#benefits">
                  <Button size="lg" variant="outline" className="cursor-pointer w-full font-semibold sm:w-auto px-8 py-6 text-lg border-[var(--primary)] hover:bg-slate-50 hover:text-[var(--primary-hover)]">
                    Benefity
                  </Button>
                </a>
              </div>
              <div className="flex items-center gap-8 text-sm pt-4">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-[var(--primary)]" />
                  <span>7&nbsp;nemocnic</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[var(--primary)]" />
                  <span>11&nbsp;000+ zaměstnanců</span>
                </div>
              </div>
            </div>
            <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
              <div className="absolute -inset-4 bg-gradient-to-r from-[var(--primary)] to-[var(--color-teal)] opacity-10 blur-3xl" />
              <Image
                src={getAssetPath("/hero2.webp")}
                width={800}
                height={800}
                alt="Lékařský tým Krajské zdravotní"
                className="relative w-full h-auto shadow-[0_8px_30px_rgba(59,130,246,0.15)] object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mapa nemocnic */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white" id="hospitals-map">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-12">
            <h2 className="text-3xl font-bold sm:text-5xl">Kde všude nás najdete</h2>
            <p className="max-w-[800px] mt-4 md:text-lg">
              Krajská zdravotní poskytuje péči napříč celým Ústeckým krajem.
            </p>
          </div>
          <InteractiveMap />
        </div>
      </section>

      {/* Koho hledáme? */}
      <section className="w-full py-20 md:py-32 bg-[var(--color-section-bg)]" id="job-openings">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-20">
            <h2 className="text-3xl sm:text-5xl font-bold">Nabídka volných pozic</h2>
            <p className="max-w-[800px] mt-4 md:text-lg">
              Vyberte si svou profesní dráhu. Nabízíme uplatnění pro sestry, lékaře, ostatní zdravotnický personál i&nbsp;technicko-hospodářské pracovníky.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                href: "/jobs?classification=doctors",
                img: getAssetPath("/banner-lide-1.webp"),
                title: "Lékaři",
                desc: "Staňte se součástí týmu odborníků. Špičková medicína, moderní technologie a příležitost profesního růstu.  ",
                icon: <Image src={getAssetPath("/stethoscope.svg")} alt="" width={52} height={52} />,
                imgClass: "ml-40 md:ml-16 lg:ml-16 ",
              },
              {
                href: "/jobs?classification=nurses_paramedics",
                img: getAssetPath("/banner-lide-2.webp"),
                title: "Sestry a záchranáři",
                desc: "Uplatněte své znalosti v moderním ošetřovatelství. Podpoříme vás při cestě adaptačním procesem i v průběhu celé vaší kariérní cesty, včetně vzdělávání.",
                icon: <Image src={getAssetPath("/nurse.svg")} alt="" width={52} height={52} />, imgClass: "ml-40 md:ml-16 lg:ml-16 ",
              },
              {
                href: "/jobs?classification=other_medical",
                img: getAssetPath("/banner-lide-3.webp"),
                title: <>Ostatní<br />zdravotnický<br /> personál</>,
                alt: "Ostatní zdravotnický personál",
                desc: "Laboranti, fyzioterapeuti, radiologičtí asistenti a další.",
                icon: <Image src={getAssetPath("/doctor.svg")} alt="" width={52} height={52} />, imgClass: "ml-40 md:ml-16 lg:ml-16 ",
              },
              {
                href: "/jobs?classification=administrative_technical",
                img: getAssetPath("/banner-lide-4.webp"),
                title: <>Nezdravotnické<br />profese</>,
                alt: "Nezdravotnické profese",
                desc: "IT, administrativa, technické zázemí a provoz.",
                icon: <Image src={getAssetPath("/briefcase.svg")} alt="" width={52} height={52} />, imgClass: " ",
              },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group relative flex flex-col bg-[#ebebeb] shadow-md hover:shadow-xl transition-shadow overflow-hidden"
              >
                <div className="absolute top-0 right-0 h-3 w-32 bg-[var(--primary)]" />

                <div className="relative mt-8 h-40 sm:h-52 lg:h-64 overflow-hidden">

                  <Image
                    src={card.img}
                    alt={card.alt ?? card.title as string}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 60vw, 25vw"
                    className="object-cover object-top"
                  />
                  <div className="absolute bottom-0 right-0 w-1/2 h-8 bg-gradient-to-b from-transparent to-[#eee]" />

                  <div className="absolute bottom-0 left-4 h-14 w-14 flex items-center justify-center">
                    {card.icon}
                  </div>
                </div>
                <div className="flex flex-col flex-1 px-3 sm:px-6 pt-6 pb-8 text-left">
                  <h3 className="text-base sm:text-xl font-bold mb-2 leading-tight">{card.title}</h3>
                  <p className="text-xs sm:text-sm leading-snug flex-1 font-medium">{card.desc}</p>
                  <span className="mt-auto pt-6 text-xs font-light tracking-widest text-[var(--primary)] uppercase group-hover:text-[var(--primary-hover)] transition-colors">
                    Prohlédnout si nabídku &#9658;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Benefity */}
      <section className="w-full py-20 md:py-32 bg-white" id="benefits">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Zaměstnanecké benefity</h2>
            <p className="max-w-[640px] mt-4 md:text-lg text-muted-foreground">
              Pečujeme o&nbsp;ty, kteří pečují o&nbsp;druhé. Nabízíme širokou škálu výhod
              pro váš profesní i&nbsp;osobní život.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Image src={getAssetPath("/Benef01.svg")} alt="" width={64} height={64} />,
                title: "Finanční benefity",
                items: [
                  "náborové příspěvky",
                  "zvýhodněná dopravní karta Ústeckého kraje",
                  "příspěvek na penzijní připojištění",
                  "zvýhodněné bankovní produkty",
                  "slevy u vybraných partnerů",
                ],
              },
              {
                icon: <Image src={getAssetPath("/Benef02.svg")} alt="" width={64} height={64} />,
                title: "Volný čas a\u00a0dovolená",
                items: [
                  "5\u00a0týdnů dovolené",
                  "příspěvek 3\u00a0500\u00a0Kč na rekreaci",
                  "karta MultiSport",
                  "zvýhodněné vstupné na vybrané kulturní akce",
                  "slevy na pobytové a lázeňské služby",
                ],
              },
              {
                icon: <Image src={getAssetPath("/Benef03.svg")} alt="" width={64} height={64} />,
                title: "Péče a\u00a0zázemí",
                items: [
                  "závodní stravování",
                  "možnost zprostředkování ubytování",
                  "pomoc při zajištění školky a školy pro děti zaměstnanců",
                  "vzdělávací kurzy a školení",
                  "psychosociální podpora krizových interventů",
                ],
              },
            ].map((card) => (
              <div key={card.title} className="flex flex-col bg-white shadow-md hover:shadow-xl transition-shadow overflow-hidden">
                <div className="flex justify-end">
                  <div className="w-40 h-2.5 bg-[var(--primary)]" />
                </div>
                <div className="px-8 pt-8 pb-10 flex flex-col gap-6">
                  <div className="w-14 h-14 flex items-center justify-center">
                    {card.icon}
                  </div>
                  <h3 className="text-2xl font-bold">{card.title}</h3>
                  <ul className="space-y-2 text-sm font-medium">
                    {card.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="text-[var(--primary)] text-xs">&#9658;</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Stipendia */}
      <section className="w-full py-20 md:py-32 bg-[var(--color-section-bg)]" id="scholarships">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScholarshipSection />
        </div>
      </section>

      {/* Kontakt CTA */}
      <section className="w-full py-20 md:py-32 bg-[var(--color-purple)] text-white" id="contact">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-6">Máte dotazy?</h2>
              <p className="text-xl mb-8 max-w-lg font-medium">
                Nenašli jste, co jste hledali? Neváhejte se na nás obrátit. Náš tým  je tu pro vás.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/kontaktuj-nas">
                  <Button size="lg" className="bg-[var(--primary)] cursor-pointer font-bold hover:bg-[var(--primary-hover)] text-white border-none px-8 py-6 text-lg">
                    Napsat zprávu
                  </Button>
                </Link>

              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div />
              <div className="p-6 rounded-2xl bg-[var(--color-dark-navy)]">
                <MapPin className="h-8 w-8 text-[var(--primary)] mb-4" />
                <h3 className="text-lg font-semibold mb-2">Vedení společnosti</h3>
                <p className="text-sm leading-relaxed">
                  Krajská zdravotní, a.s.<br />
                  Sociální péče 3316/12A<br />
                  400 11 Ústí nad Labem
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
