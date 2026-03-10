#import "../template/abbreviations.typ": abbr

V této kapitole popisuji návrh a realizaci uživatelského testování systému. Cílem je ověřit, zda implementované řešení naplňuje funkční cíle náborového a adaptačního procesu v prostředí #abbr("KZ", none), a současně identifikovat problémy použitelnosti, které by mohly omezit reálnou adopci systému.

== Cíle testování a výzkumné otázky
Uživatelské testování směřuji na tři cíle. Ověřit použitelnost klíčových procesů, ověřit procesní přínos pro cílové role a identifikovat prioritní oblasti zlepšení před produkční stabilizací. Na základě těchto cílů formuluji výzkumné otázky:

1. Dokážou cílové role dokončit klíčové scénáře bez externí asistence?

2. Ve kterých krocích vznikají nejčastější chyby, zdržení nebo nejistota uživatele?

3. Jak uživatelé hodnotí srozumitelnost systému a celkovou použitelnost?

4. Které připomínky mají nejvyšší dopad na procesní efektivitu náboru a adaptace?

== Metodika

todo: nemám uplně metodiku zatím
== Výběr respondentů
Respondenty vybírám účelově podle rolí, které v systému reálně pracují s odlišnými workflow.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.6fr, 1.2fr, 2.2fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Role], [Počet], [Hlavní testovaná agenda],
      [HR specialista], [TODO], [Správa uchazečů, změny stavů, pohovory, komunikace],
      [Vedoucí pracovník], [TODO], [Hodnocení kandidátů, přehled stavu náboru, vstupní agenda],
      [Nový zaměstnanec], [TODO], [Onboarding kroky, dokumenty, notifikace, chat],
    )
  ],
  caption: [Plánovaný vzorek respondentů podle cílových rolí]
) <tab:user-test-sample>

== Testovací scénáře
Scénáře pokrývají kritické procesní body systému. Každý scénář má jednoznačný cílový stav, aby bylo možné vyhodnotit úspěšnost bez interpretační nejednoznačnosti.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (auto, 2.2fr, 1.2fr, 1.6fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [ID], [Scénář], [Primární role], [Vazba na požadavky],
      [S1], [Založení a publikace nové pracovní pozice], [HR], [R2, R3],
      [S2], [Zpracování přihlášky a změna stavu uchazeče], [HR], [R3, R6],
      [S3], [Naplánování pohovoru a odeslání pozvánek], [HR], [R3],
      [S4], [Převod uchazeče na zaměstnance a spuštění onboardingu], [HR], [R4],
      [S5], [Vyplnění onboarding kroku a nahrání dokumentů (pokud to poběží v produkci a nebo trial člověk)], [Zaměstnanec], [R4],
      [S6], [Kontrola reportu náborové průchodnosti], [Vedoucí], [R6],
      [S7], [Ověření notifikace a reakce na zadaný úkol], [HR/Zaměstnanec], [R4, R6]
    )
  ],
  caption: [Sada testovacích scénářů]
) <tab:user-test-scenarios>

== Metriky a hodnoticí kritéria
Pro každý scénář sbírám metriky efektivity, efektivnosti a subjektivní použitelnosti.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.7fr, 1.4fr, 2fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Metrika], [Typ], [Interpretace],
      [Počet dokončení], [Kvantitativní], [Podíl úloh dokončených bez pomoci moderátora],
      [Doba dokončení], [Kvantitativní], [Čas potřebný k dosažení cílového stavu scénáře],
      [Chybovost], [Kvantitativní], [Počet chybových kroků nebo návratů v rámci scénáře],
      [SUS skóre], [Kvantitativní], [Celkové hodnocení použitelnosti na škále 0-100],
      [Komentáře uživatelů], [Kvalitativní], [Tematické kódování problémů, bariér a návrhů],
      [Závažn zjištění], [Kvalitativní/expertní], [Priorita opravy podle dopadu a četnosti],
    )
  ],
  caption: [Metriky uživatelského testování]
) <tab:user-test-metrics>

== Výstup uživatelského testování

zmínit komentáře, a tak dále

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (auto, 1.4fr, 1.3fr, 1.2fr, 1fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Scénář], [Počet dokončení], [Medián času], [Počet chyb], [SUS],
      [S1], [doplnit], [doplnit], [doplnit], [doplnit],
      [S2], [doplnit], [doplnit], [doplnit], [doplnit],
      [S3], [doplnit], [doplnit], [doplnit], [doplnit],
      [S4], [doplnit], [doplnit], [doplnit], [doplnit],
      [S5], [doplnit], [doplnit], [doplnit], [doplnit],
      [S6], [doplnit], [doplnit], [doplnit], [doplnit],
      [S7], [doplnit], [doplnit], [doplnit], [doplnit],
      [S8], [doplnit], [doplnit], [doplnit], [doplnit],
    )
  ],
  caption: [Šablona souhrnných výsledků uživatelského testování]
) <tab:user-test-results-template>

