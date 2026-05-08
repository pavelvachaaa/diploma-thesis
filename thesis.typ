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
      Diplomová práce řeší digitalizaci náboru a adaptace pracovníků ve zdravotnické organizaci Krajská zdravotní, a.s., kde jsou personální procesy zatíženy průměrně 110 nástupy měsíčně, regulovanou odbornou způsobilostí a rozdílnými postupy jednotlivých odštěpných závodů. Cílem práce bylo analyzovat současný stav, určit hlavní úzká místa a navrhnout softwarové řešení, které sjednotí práci s pracovními pozicemi, uchazeči, vstupní agendou a adaptací nových zaměstnanců. Postup zpracování vycházel z procesního mapování, konzultací s uživateli, formulace funkčních a nefunkčních požadavků a rešerše dostupných systémů pro podporu náboru, adaptace a řízení lidských zdrojů. Analýza ukázala, že hlavními omezeními jsou roztříštěná data, předávání informací mimo jednotný systém, chybějící auditní stopa, slabý reporting a papírově vedená adaptace. Rešerše zároveň potvrdila, že dostupné produkty nenaplňují současně požadavky na procesní kontinuitu, provoz na vlastní infrastruktuře, multi-tenantní členění a specifika českého zdravotnického prostředí. Výsledkem práce je návrh a implementace platformy, která propojuje kariérní portál, interní náborovou agendu, vstupní agendu a adaptační proces do jednoho řízeného toku. Součástí řešení je také napojení na externí registry, evidence změn a podpůrné funkce pro práci se životopisy a generativní tvorbu pracovních nabídek. Pilotní ověření s uživateli ukázalo, že systém dokáže zrychlit vybrané kroky a zpřehlednit odpovědnosti mezi rolemi. Další rozvoj by se měl zaměřit hlavně na stabilizaci provozu, srozumitelnější zobrazení stavů a navazujících kroků v procesu, lepší měření procesu a postupné rozšiřování integračních a analytických funkcí.
    ],
    en: [
      This diploma thesis addresses the digitalization of recruitment and employee onboarding processes in the healthcare organization Krajská zdravotní, a.s., where HR processes are affected by an average of 110 new hires per month, regulated professional qualifications, and different procedures used by individual hospitals. The aim of the thesis was to analyze the current state, identify the main bottlenecks, and design a software solution that unifies the management of job positions, applicants, entry administration, and onboarding of new employees. The work was based on process mapping, user consultations, the specification of functional and non-functional requirements, and a comparison of available systems for hiring, onboarding, and human resources management. The analysis showed that the main limitations are fragmented data, information being passed outside a single system, missing auditability, weak reporting, and paper-based onboarding. The market comparison also confirmed that available products do not simultaneously meet the requirements for process continuity, on-premise operation, multi-tenant organization, and the specifics of the Czech healthcare environment. I therefore designed and implemented the foundation of a platform that connects the career portal, internal recruitment agenda, entry administration, and onboarding process into one managed workflow. The solution also includes integration with external registers, change tracking, and supporting functions for working with CVs and creating job postings. Pilot user testing showed that the system can speed up selected steps and make responsibilities between roles clearer. Further development should focus mainly on operational stabilization, clearer presentation of states and next steps in the interface, better process measurement, and the gradual extension of integration and analytical functions.
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

= Nasazení systému\ do cílového prostředí
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
          height: 100%,
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
  attach_content("Zadání scénářů pro pilotní uživatelské ověření", [
    #include "chapters/sections/user_testing_assignment.typ"
  ]),
  attach_content("Detailní anonymizovaný záznam pilotního uživatelského ověření", [
    #include "chapters/sections/user_testing_raw_data.typ"
  ]),
  attach_content("Využití umělé inteligence při zpracování práce", [
    Pro jazykové a formulační účely byly při zpracování vybraných částí diplomové práce využity nástroje umělé inteligence, konkrétně model _GPT-5_. Odpovědnost za obsah, odbornou správnost, interpretaci výsledků a finální podobu práce zůstává na autorovi.
  ]),
)
