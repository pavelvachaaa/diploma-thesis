#import "template/template.typ": *

#profile("debug")

#show: tultemplate2.with(
  faculty: "fm",
  document: "dp",
  lang: "cs",
  title: (
    cs: [Digitální transformace procesů náboru a adaptace pracovníků ve zdravotnické organizaci],
    en: [Digital transformation of recruitment and onboarding processes in a healthcare organization],
  ),
  keywords: (
    cs: [Digitalizace, Optimalizace procesů, Softwarová architektura, Adaptační proces, Řízení lidských zdrojů],
    en: [Digitalization, Process Optimization, Software Architecture, Onboarding Process, Human Resource Management],
  ),
  acknowledgement: (
    cs: [
      Děkuji vedoucí své práce Ing. Jana Vitvarová Ph. D. za poskytnutou podporu a trpělivost. Mé díky také patří všem testerům za jejich zpětnou vazbu.
    ],
  ),
  abstract: (
    cs: [
      Moc pěkný abstrakt
    ],
    en: [
      This is an abstract
    ],
  ),
  title_pages: "title-pages.pdf",
  author: "Bc. Pavel Vácha",
  supervisor: "Ing. Jana Vitvarová, Ph.D.",
  consultant: "Jiří Suchý",
  citations: "citations.bib",
)

= Úvod

#include "chapters/introduction.typ"

= Analýza současného stavu
Efektivní digitalizace podnikových procesů vyžaduje důkladné porozumění stávajícímu stavu organizace, jejím procesům a specifickým potřebám. V souladu s metodikou procesního řízení dle Řepy @repa2007podnikove je prvním krokem identifikace a dokumentace klíčových procesů, jejich aktérů, vstupů, výstupů a rozhodovacích bodů. Teprve na základě této analýzy je možné formulovat požadavky na informační systém, který tyto procesy podpoří nebo nahradí.

Tato kapitola se zabývá analýzou současného stavu procesů náboru a adaptace pracovníků v Krajské Zdravotní a.s. Nejprve je představena organizace a její specifika v kontextu řízení lidských zdrojů ve zdravotnictví. Následně jsou podrobně popsány klíčové procesy pomocí notace BPMN (Business Process Model and Notation), identifikována úzká místa a formulovány požadavky na digitalizaci ve formě funkcionálních a nefunkcionálních požadavků.

#include "chapters/analysis.typ"

= Existující softwarová řešení
Před návrhem vlastního řešení je nezbytné provést systematickou rešerši existujících softwarových produktů a posoudit jejich vhodnost pro pokrytí definovaných požadavků. Cílem této kapitoly je analyzovat dostupné produkty z kategorie ATS (Applicant Tracking Systems), onboardingových platforem a integrovaných HR systémů, identifikovat jejich silné a slabé stránky v kontextu požadavků KZ a zdůvodnit rozhodnutí o vývoji vlastního řešení.

Při hodnocení existujících řešení byla zohledněna kritéria pokrytí požadavků na digitalizaci procesů (DOPLNIT odkaz), české jazykové prostředí a lokalizace, cenová dostupnost, přizpůsobitelnost procesům zdravotnické organizace a možnost provozování na vlastní infrastruktuře (on-premise).

#include "chapters/research.typ"

= Návrh softwarové architektury
#include "chapters/architecture.typ"

= Implementace systému
#include "chapters/implementation.typ"

= Nasazení do NĚJAKÉHO prostředí
#include "chapters/deployment.typ"

= Uživatelské testování a zpětná vazba
#include "chapters/user_testing.typ"

= Návrh dalšího směřování vývoje
#include "chapters/recommendations.typ"


= Závěr

#include "chapters/conclusion.typ"
