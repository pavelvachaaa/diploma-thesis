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
      Diplomová práce řeší digitalizaci náboru a adaptace pracovníků ve zdravotnické organizaci Krajská zdravotní, a.s., kde jsou personální procesy zatíženy průměrně 110 nástupy měsíčně, regulovanou odbornou způsobilostí a rozdílnými postupy jednotlivých odštěpných závodů. Cílem práce bylo analyzovat současný stav, určit hlavní úzká místa a navrhnout softwarové řešení, které sjednotí práci s pracovními pozicemi, uchazeči, vstupní agendou a adaptací nových zaměstnanců. Postup zpracování vycházel z procesního mapování, konzultací s uživateli, formulace funkčních a nefunkcionálních požadavků a rešerše dostupných ATS, onboardingových a HCM řešení. Analýza ukázala, že hlavními omezeními jsou roztříštěná data, ruční komunikace, chybějící auditní stopa, slabý reporting a papírově vedená adaptace. Rešerše zároveň potvrdila, že dostupné produkty nenaplňují současně požadavky na procesní kontinuitu, on-premise provoz, multi-tenantní členění a specifika českého zdravotnického prostředí. Výsledkem práce je návrh a implementace základu platformy s modulárním backendem, webovými portály, integračními adaptéry, asynchronní komunikací, auditní vrstvou a samostatnou vrstvou pro automatické vyhodnocování dat ze životopisů a generativní podporu tvorby pracovních nabídek. Závěr doporučuje další rozvoj zaměřit nejprve na provozní stabilizaci, zpřesnění uživatelských stavů, měřitelnost procesu a postupné rozšiřování integračních a analytických funkcí.
    ],
    en: [
      This diploma thesis addresses the digitalization of recruitment and employee onboarding processes in the healthcare organization Krajská zdravotní, a.s., where HR processes are affected by an average of 110 new hires per month, regulated professional qualifications, and different procedures used by individual hospitals. The aim of the thesis was to analyze the current state, identify the main bottlenecks, and design a software solution that unifies the management of job positions, applicants, entry administration, and onboarding of new employees. The work was based on process mapping, user consultations, the specification of functional and non-functional requirements, and a comparison of available ATS, onboarding, and HCM solutions. The analysis showed that the main limitations are fragmented data, manual communication, missing auditability, weak reporting, and paper-based onboarding. The market comparison also confirmed that available products do not simultaneously meet the requirements for process continuity, on-premise operation, multi-tenant organization, and the specifics of the Czech healthcare environment. The result of the thesis is the design and implementation of a platform foundation with a modular backend, web portals, integration adapters, asynchronous communication, an audit layer, and a separate layer for automatic evaluation of CV data and generative support for creating job postings. The conclusion recommends that further development should first focus on operational stabilization, clearer user-facing process states, process measurability, and the gradual extension of integration and analytical capabilities.
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

Analýza současného stavu procesů náboru a adaptace pracovníků v Krajské zdravotní, a.s. proto nejprve ukotvuje organizační a doménová specifika zdravotnického prostředí. Následně zachycuje klíčové procesy pomocí notace #abbr("BPMN", "Business Process Model and Notation"), identifikuje jejich úzká místa a převádí zjištěné nedostatky do podoby funkčních a nefunkčních požadavků.

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
  attach_content("Detailní návrh hranic backendu v hexagonálním uspořádání", [
    #rotate(-90deg, reflow: true)[
      #figure(
        image(
          "procesy/architecture/backend-structure.svg",
          width: 94%,
        ),
        caption: [Detailní návrh hranic backendu v hexagonálním uspořádání],
      ) <obr:arch-backend-detail>

    ]
  ]),
  attach_content("Tok vydání založený na verzovaných obrazech", [
    #rotate(-90deg, reflow: true)[
      #figure(
        image(
          "procesy/deployment/deployment-flow.svg",
          width: 94%,
        ),
        caption: [Obecný tok vydání založený na obrazech s distribucí do registru a nasazením na cílový host],
      ) <obr:deployment-flow>

    ]
  ]),
)
