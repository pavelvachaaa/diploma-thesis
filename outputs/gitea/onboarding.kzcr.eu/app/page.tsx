import Header from "@/components/kzcr/header";
import Footer from "@/components/kzcr/footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Award, CheckCircle, Clock, FileCheck, ShieldCheck, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getAssetPath } from "@/lib/basePath";
import RedirectAuthenticatedUser from "@/components/RedirectAuthenticatedUser";

export default function Home() {
  return (

    <main className="flex-1">
      <RedirectAuthenticatedUser />
      <section className="bg-gradient-to-b from-blue-50 via-white to-blue-50 py-16 md:py-24 mx-auto">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-800">
                Moderní onboarding
              </div>
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Vítejte v digitálním světě <span className="text-blue-600">onboardingu</span>
              </h1>
              <p className="text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Odevzdejte své dokumenty elektronicky a zjednodušte proces nástupu do zaměstnání. Bez zbytečných
                návštěv personálního oddělení.
              </p>
              <div className="flex flex-col gap-3 min-[400px]:flex-row">
                <Link href="/login">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Mám pozvánku <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline" size="lg">
                    Více informací
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md">
              <div className="relative z-10 overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 opacity-50"></div>
                <img
                  src={getAssetPath("/hero.webp")}
                  alt="Elektronický onboarding ilustrace"
                  className="relative z-20 mx-auto p-4"
                  width={400}
                  height={500}
                />
              </div>
              <div className="absolute -bottom-6 -right-6 z-0 h-24 w-24 rounded-full bg-blue-200"></div>
              <div className="absolute -top-6 -left-6 z-0 h-24 w-24 rounded-full bg-blue-200"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Jak to funguje</h2>
            <p className="text-gray-500 mt-4 text-lg">Tři jednoduché kroky k dokončení procesu onboardingu</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 rounded-full bg-blue-100 p-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold">1. Získejte přístup</h3>
              <p className="text-gray-500 mt-3">
                HR vám zašle přihlašovací údaje pro přístup do zabezpečeného onboardingového portálu.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 rounded-full bg-blue-100 p-4">
                <FileCheck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold">2. Nahrajte dokumenty</h3>
              <p className="text-gray-500 mt-3">
                Nahrajte všechny požadované dokumenty podle vaší pracovní kategorie.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 rounded-full bg-blue-100 p-4">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold">3. Ověření</h3>
              <p className="text-gray-500 mt-3">
                HR oddělení ověří vaše dokumenty a informuje vás, když bude vše kompletní.
              </p>
            </div>
          </div>
        </div>
      </section>


      <section className="bg-blue-50 py-16 md:py-24">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white p-6 shadow-md">
                  <CheckCircle className="h-8 w-8 text-green-500 mb-3" />
                  <h3 className="text-lg font-bold">Úspora času</h3>
                  <p className="text-gray-500 mt-2">Odevzdejte dokumenty před nástupem do práce</p>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-md">
                  <Clock className="h-8 w-8 text-blue-500 mb-3" />
                  <h3 className="text-lg font-bold">Flexibilita</h3>
                  <p className="text-gray-500 mt-2">Přístup odkudkoliv a kdykoliv</p>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-md">
                  <ShieldCheck className="h-8 w-8 text-purple-500 mb-3" />
                  <h3 className="text-lg font-bold">Bezpečnost</h3>
                  <p className="text-gray-500 mt-2">Zabezpečené uložení vašich osobních údajů</p>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-md">
                  <Award className="h-8 w-8 text-amber-500 mb-3" />
                  <h3 className="text-lg font-bold">Kvalita</h3>
                  <p className="text-gray-500 mt-2">Profesionální přístup k onboardingu</p>
                </div>
              </div>
            </div>
            <div className="space-y-6 order-1 lg:order-2">
              <h2 className="text-3xl font-bold tracking-tight">Výhody elektronického onboardingu</h2>
              <p className="text-gray-600 text-lg">
                Náš systém přináší řadu výhod jak pro vás, tak pro personální oddělení. Digitalizace celého procesu
                šetří čas, snižuje administrativní zátěž a minimalizuje chyby.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <span>Ušetřete čas odevzdáním dokumentů před nástupem do práce</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <span>Snižte množství papírování a přispějte k ochraně životního prostředí</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <span>Bezpečné uložení vašich osobních údajů</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <span>Rychlejší zpracování vašich zaměstnaneckých dokumentů</span>
                </li>
              </ul>
              <div className="pt-4">
                <Link href="/login">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Mám pozvánku <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>


        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">Co říkají naši zaměstnanci</h2>
              <p className="text-gray-500 mt-4 text-lg">Zkušenosti s naším onboardingovým systémem</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-xl bg-white p-6 shadow-md">
                <div className="flex items-center gap-4 mb-4">
                  <Image src={getAssetPath("/first_face.webp")} alt="Avatar" className="rounded-full" width={32} height={32} />
                  <div>
                    <h4 className="font-bold">MUDr. Jana Nováková</h4>
                    <p className="text-sm text-gray-500">Kardiologie</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  &quot;Onboarding byl velmi jednoduchý a intuitivní. Mohla jsem nahrát všechny dokumenty z pohodlí domova
                  ještě před nástupem do práce.&quot;
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-md">
                <div className="flex items-center gap-4 mb-4">
                  <img src={getAssetPath("/first_face.webp")} alt="Avatar" className="h-12 w-12 rounded-full" />
                  <div>
                    <h4 className="font-bold">Bc. Tomáš Svoboda</h4>
                    <p className="text-sm text-gray-500">Zdravotní bratr</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  &quot;Oceňuji, jak přehledný je celý systém. Vždy jsem věděl, které dokumenty ještě potřebuji dodat a v
                  jakém stavu je můj onboarding.&quot;
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-md">
                <div className="flex items-center gap-4 mb-4">
                  <img src={getAssetPath("/first_face.webp")} alt="Avatar" className="h-12 w-12 rounded-full" />
                  <div>
                    <h4 className="font-bold">Ing. Martin Dvořák</h4>
                    <p className="text-sm text-gray-500">IT oddělení</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  &quot;Jako IT profesionál musím říct, že systém je velmi dobře navržený. Bezpečnost dat je na vysoké úrovni
                  a uživatelské rozhraní je intuitivní.&quot;
                </p>
              </div>
            </div>
          </div>
        </section>



    </main>



  );
}
