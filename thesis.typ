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
#include "chapters/analysis.typ"

= Existující softwarová řešení
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
