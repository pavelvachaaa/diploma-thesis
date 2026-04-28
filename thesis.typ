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
      V této diplomové práci analyzuji procesy náboru a adaptace pracovníků ve zdravotnické organizaci Krajská zdravotní, a.s., identifikuji jejich klíčová omezení a navrhuji digitální řešení pro jejich sjednocení a zefektivnění. Na základě analytických zjištění, rešerše existujících produktů a návrhu cílové architektury popisuji realizační i provozní aspekty systému včetně distribuované vrstvy inteligentního zpracování dat. Výsledkem je prakticky použitelný návrh, který respektuje multi-tenantní organizační model, požadavky na bezpečnost a auditovatelnost a on-premise provozní podmínky. Součástí práce je také vyhodnocení dalšího směřování vývoje s důrazem na stabilizaci provozu, měřitelnost a postupnou evoluci platformy.
    ],
    en: [
      In this diploma thesis, I analyze recruitment and employee onboarding processes in the Czech healthcare organization Krajská zdravotní, a.s., identify their key limitations, and propose a digital solution to unify and optimize them. Based on process analysis, market research of existing products, and target architecture design, I describe implementation and deployment aspects of the system, including a distributed intelligent data processing layer. The result is a practically applicable concept that respects a multi-tenant organizational model, security and auditability requirements, and on-premise operational constraints. The thesis also provides a roadmap for further development focused on operational stabilization, observability, and gradual platform evolution.
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
Efektivní digitalizaci nelze stavět na domněnkách o tom, jak organizace funguje, ale na přesném porozumění skutečnému průběhu procesů, jejich aktérům a slabým místům. V souladu s metodikou procesního řízení dle Řepy @repa2007podnikove proto analytická část nejprve mapuje výchozí stav a teprve na tomto základě formuluje požadavky na budoucí informační systém.

Analýza současného stavu procesů náboru a adaptace pracovníků v Krajské zdravotní, a.s. proto nejprve ukotvuje organizační a doménová specifika zdravotnického prostředí. Následně zachycuje klíčové procesy pomocí notace BPMN (Business Process Model and Notation), identifikuje jejich úzká místa a převádí zjištěné nedostatky do podoby funkčních a nefunkčních požadavků.

#include "chapters/analysis.typ"

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


#attachments(
  attach_content("Realizační tok Outbox-RabbitMQ a vrstvy inteligentního zpracování dat v implementaci", [
    #rotate(-90deg, reflow: true)[
      #figure(
        image(
          "procesy/architecture/seq-outbox-rabbitmq-ai.svg",
          width: 90%,
          height: 100%
        ),
        caption: [Realizační tok Outbox-RabbitMQ a vrstvy inteligentního zpracování dat v implementaci],
      ) <obr:impl-outbox-ai>

    ]
  ]),
)
