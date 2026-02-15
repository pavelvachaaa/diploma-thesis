#import "template/template.typ": *

#show: tultemplate2.with(
  faculty: "fm",
  document: "presentation",
  lang: "cs",
  title: (
    cs: [Digitální transformace procesů náboru a adaptace pracovníků ve zdravotnické organizaci],
    
  ),
  supervisor: "Ing. Jana Vitvarová, Ph.D.",

  presentation: (
    append_thanks: true,
    wide: true,
    first_heading_is_fullpage: true,
  ),
  author: [Bc. Pavel Vácha],
  citations: "citations.bib"
)

== Zadání
1. Analyzujte procesy náboru a adaptace pracovníků ve zdravotnické organizaci a definujte požadavky na jejich digitalizaci.

2. Proveďte rešerši existujících softwarových řešení pokrývajících požadovanou funkcionalitu a specifikujte jejich omezení.

3. Na základě požadavků a rešerše navrhněte softwarovou architekturu a implementujte vlastní řešení.

4. Nasaďte výsledný produkt do testovacího prostředí.

5. Získejte zpětnou vazbu od uživatelů, analyzujte ji a navrhněte další směřování vývoje a odstranění nedostatků.

== Řešená problematika
- Současné procesy pro příjímání pracovníků připomínají papírový administrativní ping-pong.

- Excelové soubory v 11 tisícovém holdingu se 7 odštěpnými závody napříč ústeckým krajem.

- Dlouhá doba procesů (time-to-hire).

- *Legislativní rizika*. Manuální a chybové ověřování kvalifikací (atestace, komory, NRZP).

- Hovoříme o průměru *200 nástupů měsíčně*, což vyžaduje každodenní zpracování a posouzení zhruba *170 životopisů*.

- Potřeba digitálního řešení, které je multi-tenantní a bude efektivně řešit proces od inzerce až po adaptaci zaměstnance na oddělení.

== Vlastní obsah práce
- *Procesní analýza* a optimalizace (BPMN), identifikace a eliminace míst, co nejvíce zdržují proces.

- Návrh softwarové architektury a použitých technologií. 

- Implementace karierního portálu, ATS (správa uchazečů), (pre)a(on)boardingového portálu a modulu vzdělání (národní registry NRZP, ČLK, komunikace s ÚZIS).

- Důraz na izolovanost dat, auditní stopu a granulární řízení přístupu k datům. 

- Integrace *lokálního generativního systému* do tohoto projektu (AI pre-screening, tvorba nabídky práce, dotazovaní přirozeným jazykem pro manažery). 

- Nasazení do testovacího/produkčního prostředí.

