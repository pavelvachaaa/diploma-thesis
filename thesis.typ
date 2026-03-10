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
      V této diplomové práci analyzuji procesy náboru a adaptace pracovníků ve zdravotnické organizaci Krajská zdravotní, a.s., identifikuji jejich klíčová omezení a navrhuji digitální řešení pro jejich sjednocení a zefektivnění. Na základě analytických zjištění, rešerše existujících produktů a návrhu cílové architektury popisuji realizační i provozní aspekty systému včetně distribuované AI podpory. Výsledkem je prakticky použitelný návrh, který respektuje multi-tenantní organizační model, požadavky na bezpečnost a auditovatelnost a on-premise provozní podmínky. Součástí práce je také vyhodnocení dalšího směřování vývoje s důrazem na stabilizaci provozu, měřitelnost a postupnou evoluci platformy.
    ],
    en: [
      In this diploma thesis, I analyze recruitment and employee onboarding processes in the Czech healthcare organization Krajská zdravotní, a.s., identify their key limitations, and propose a digital solution to unify and optimize them. Based on process analysis, market research of existing products, and target architecture design, I describe implementation and deployment aspects of the system, including distributed AI support. The result is a practically applicable concept that respects a multi-tenant organizational model, security and auditability requirements, and on-premise operational constraints. The thesis also provides a roadmap for further development focused on operational stabilization, observability, and gradual platform evolution.
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

Při hodnocení existujících řešení byla zohledněna kritéria pokrytí požadavků na digitalizaci procesů uvedených v @tab:pozadavky-digitalizace, české jazykové prostředí a lokalizace, cenová dostupnost, přizpůsobitelnost procesům zdravotnické organizace a možnost provozování na vlastní infrastruktuře (on-premise).

#include "chapters/research.typ"

= Návrh softwarové architektury
#include "chapters/architecture.typ"

= Implementace systému
#include "chapters/implementation.typ"

= Nasazení systému do cílového prostředí
#include "chapters/deployment.typ"

= Uživatelské testování a zpětná vazba
#include "chapters/user_testing.typ"

= Návrh dalšího směřování vývoje
#include "chapters/recommendations.typ"


= Závěr

#include "chapters/conclusion.typ"
