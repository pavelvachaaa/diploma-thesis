#import "../template/abbreviations.typ": abbr

Uživatelské ověření jsem zařadil do práce proto, že u personálního systému nestačí pouze technická správnost implementace. Pokud uživatel nerozumí stavu náboru, neví, kdo má provést další krok, nebo se v rozhraní ztrácí, procesní přínos systému se rychle vytrácí. Cílem této kapitoly proto není statisticky reprezentativní výzkum celé organizace, ale pilotní ověření toho, zda navržené řešení podporuje klíčové role v jejich každodenních scénářích a kde je ještě potřeba systém zpřesnit.

== Cíle testování a výzkumné otázky
Testování jsem směřoval na tři cíle. Prvním bylo ověřit, zda cílové role dokážou dokončit hlavní scénáře bez nadměrné asistence. Druhým bylo zachytit místa, ve kterých se uživatelé zastavují, vracejí nebo si nejsou jisti významem dalšího kroku. Třetím cílem bylo převést získanou zpětnou vazbu do konkrétních doporučení pro stabilizaci a další rozvoj systému.

Na základě těchto cílů jsem formuloval následující výzkumné otázky:

1. Dokážou cílové role dokončit klíčové scénáře bez externí asistence?
2. Ve kterých krocích vzniká nejčastěji nejistota, zdržení nebo chybné rozhodnutí?
3. Které prvky rozhraní uživatelům pomáhají udržet kontext procesu a které jej naopak komplikují?
4. Jaká zjištění mají nejvyšší prioritu pro další iteraci systému?

== Metodika
Každý účastník procházel scénáře odpovídající jeho roli, pracoval s daty připomínajícími reálný provoz a průběžně komentoval, jak rozumí jednotlivým krokům a stavům systému.

Metodicky jsem kombinoval tři techniky. První technikou bylo scénářové testování s jednoznačně definovaným cílovým stavem. Druhou technikou bylo průběžné komentování postupu uživatelem, které pomohlo odhalit nejen chybu, ale i důvod jejího vzniku. Třetí technikou byl krátký rozhovor po dokončení scénáře, ve kterém jsem ověřoval, co bylo pro uživatele přínosné, co považoval za nejasné a jaké změny by očekával před širším nasazením.

== Výběr respondentů
Respondenty jsem vybíral účelově podle rolí, které v systému pracují s odlišnou částí procesu. Cílem nebylo pokrýt všechny varianty uživatelů, ale ověřit průchodnost tří hlavních perspektiv a to z operativní personální práce, manažerského dohledu a nástupu nového zaměstnance.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.6fr, 1.6fr, 2.2fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Role], [Účel zapojení], [Hlavní testovaná agenda],
      [HR specialista], [Operativní ověření náborového workflow], [Správa uchazečů, změny stavů, plánování pohovorů, komunikace s kandidáty],
      [Vedoucí pracovník], [Ověření rozhodovacích a dohledových kroků], [Hodnocení kandidátů, přehled stavu náboru, vstupní agenda nového zaměstnance],
      [Nový zaměstnanec], [Ověření srozumitelnosti onboardingového rozhraní], [Plnění onboardingových kroků, práce s dokumenty, notifikace a orientace v úkolech],
    )
  ],
  caption: [Zastoupení rolí v pilotním uživatelském ověření]
) <tab:user-test-sample>

== Testovací scénáře
Scénáře jsem navrhl tak, aby pokryly kritické průchody systémem od založení pozice až po onboarding. Každý scénář měl jasně stanovený cílový stav, protože právě ten rozhodoval o tom, zda uživatel úlohu skutečně dokončil, nebo pouze rozhraním prošel bez jistoty, co udělal.

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
      [S5], [Vyplnění onboardingového kroku a nahrání požadovaných dokumentů], [Zaměstnanec], [R4],
      [S6], [Kontrola reportu náborové průchodnosti], [Vedoucí], [R6],
      [S7], [Ověření notifikace a reakce na přidělený úkol], [HR / Zaměstnanec], [R4, R6],
    )
  ],
  caption: [Sada testovacích scénářů]
) <tab:user-test-scenarios>

== Metriky a hodnoticí kritéria
Protože šlo o pilotní kvalitativní ověření, nesoustředil jsem se na jedinou agregovanou metriku, ale na kombinaci ukazatelů, které společně vystihují použitelnost procesu. Zajímalo mě, zda uživatel úkol dokončil, zda potřeboval zásah moderátora, kde chyboval a jak svůj postup následně slovně hodnotil.

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
      [Dokončení scénáře], [Kvantitativní], [Zda uživatel dosáhl cílového stavu bez zásahu do dat nebo návratu na začátek],
      [Potřeba asistence], [Kvantitativní], [Počet situací, kdy bylo nutné vysvětlit význam stavu, kroku nebo navigace],
      [Doba dokončení], [Kvantitativní], [Orientační čas potřebný k dosažení cílového stavu u jednotlivých scénářů],
      [Chybové kroky a návraty], [Kvantitativní], [Počet chybných voleb, zbytečných návratů nebo slepých míst v rozhraní],
      [Komentáře uživatelů], [Kvalitativní], [Slovní popis přínosů, nejistot a navrhovaných úprav],
      [Závažnost zjištění], [Expertní], [Priorita opravy podle dopadu na průchod procesem a četnosti opakování],
    )
  ],
  caption: [Ukazatele použité při uživatelském ověření]
) <tab:user-test-metrics>

== Výstup uživatelského testování
Získaná pozorování ukázala, že největší hodnotu uživatelé vnímali v centralizaci informací, ve sjednocení stavu kandidátů a v lepší dohledatelnosti odpovědností napříč náborovým a onboardingovým procesem.

Jako problematická se naopak ukázala místa, kde systém předpokládá vyšší procesní znalost uživatele, než jakou lze očekávat při prvním použití. Typicky šlo o potřebu jasněji vysvětlit význam stavů, lépe zvýraznit další očekávaný krok a oddělit informace, které jsou pouze informativní, od těch, které vyžadují akci. U onboardingových scénářů byla důležitá také viditelná vazba mezi úkolem, termínem a odpovědnou rolí. Bez ní se uživatel sice v systému orientuje, ale hůře chápe prioritu jednotlivých kroků.

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


Získaná zpětná vazba ukázala konkrétní místa, kde je třeba upravit terminologii, navigaci a práci s odpovědnostmi ještě před širším provozním rozšířením. Právě tato zjištění navazuji v další kapitole do doporučení pro další směřování vývoje.
