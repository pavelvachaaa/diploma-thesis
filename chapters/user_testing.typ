#import "../template/abbreviations.typ": abbr

Uživatelské ověření jsem zařadil do práce proto, že u personálního systému nestačí pouze technická správnost implementace. Pokud uživatel nerozumí stavu náboru, neví, kdo má provést další krok, nebo se v rozhraní ztrácí, procesní přínos systému se rychle vytrácí. Cílem této kapitoly proto není statisticky reprezentativní výzkum celé organizace, ale pilotní ověření toho, zda navržené řešení podporuje klíčové role v jejich každodenních scénářích a kde je ještě potřeba systém zpřesnit.

== Cíl a rámec pilotního ověření
Cílem pilotního uživatelského ověření bylo zodpovědět tři praktické otázky. První z nich se týkala průchodnosti hlavních scénářů bez nadměrné asistence. Druhá mířila na místa, kde se uživatelé zastavují, vracejí nebo si nejsou jisti významem dalšího kroku. Třetí sledovala, zda lze získanou zpětnou vazbu převést do konkrétních doporučení pro stabilizaci a další rozvoj řešení.

Na základě těchto cílů jsem formuloval následující výzkumné otázky:

1. Dokážou cílové role dokončit klíčové scénáře bez externí asistence?
2. Ve kterých krocích vzniká nejčastěji nejistota, zdržení nebo chybné rozhodnutí?
3. Které prvky rozhraní uživatelům pomáhají udržet kontext procesu a které jej naopak komplikují?
4. Jaká zjištění mají nejvyšší prioritu pro další iteraci systému?


== Metodický postup a výběr respondentů
Pilotní uživatelské ověření jsem vedl jako moderované scénářové ověření. Každý účastník procházel scénáře odpovídající jeho roli, pracoval s daty připomínajícími reálný provoz a průběžně komentoval, jak rozumí jednotlivým krokům a stavům systému. Tento postup mi umožnil nesledovat pouze to, zda uživatel úkol dokončil, ale také proč se v určitém bodě zastavil a jak interpretoval význam zobrazených informací.

Z metodického hlediska jsem kombinoval tři vzájemně se doplňující techniky. Základem bylo scénářové ověření s jednoznačně definovaným cílovým stavem. Druhou vrstvu tvořilo průběžné komentování postupu uživatelem, které pomohlo odlišit pouhou chybu od hlubší nejasnosti v terminologii nebo navigaci. Třetí vrstvou byl krátký rozhovor po dokončení scénáře, ve kterém jsem ověřoval, co bylo pro uživatele přínosné, co považoval za problematické a jaké změny by očekával před širším provozním rozšířením.

Respondenty jsem vybíral účelově podle rolí, které reprezentují tři rozdílné pohledy na tentýž proces. Nešlo tedy o snahu pokrýt všechny varianty uživatelů v organizaci, ale ověřit, zda je systém srozumitelný z perspektivy operativní personální práce, manažerského dohledu a nástupu nového zaměstnance.

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
      [Nový zaměstnanec], [Ověření srozumitelnosti rozhraní vstupní agendy], [Plnění kroků vstupní agendy, práce s dokumenty, notifikace a orientace v úkolech],
    )
  ],
  caption: [Zastoupení rolí v pilotním uživatelském ověření]
) <tab:user-test-sample>


== Testovací scénáře a hodnoticí kritéria
Testovací scénáře jsem navrhl tak, aby pokryly kritické průchody systémem od založení pracovní pozice až po vstupní agendu nového zaměstnance. Každý scénář měl jasně definovaný cílový stav, protože právě ten rozhoduje o tom, zda uživatel úlohu skutečně dokončil, nebo pouze rozhraním prošel bez jistoty, co provedl. 

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
      [S4], [Převod uchazeče na zaměstnance a spuštění vstupní agendy], [HR], [R4],
      [S5], [Vyplnění kroku vstupní agendy a nahrání požadovaných dokumentů], [Zaměstnanec], [R4],
      [S6], [Kontrola reportu náborové průchodnosti], [Vedoucí], [R6],
      [S7], [Ověření notifikace a reakce na přidělený úkol], [HR / Zaměstnanec], [R4, R6],
    )
  ],
  caption: [Sada testovacích scénářů]
) <tab:user-test-scenarios>

Scénáře v @tab:user-test-scenarios záměrně nesledují jen izolované klikací úlohy, ale uzly, ve kterých se rozhoduje o průchodnosti celého procesu. Pokud se uživatel ztratí při změně stavu uchazeče, při převodu na zaměstnance nebo při práci s úkolem vstupní agendy, nevzniká pouze lokální nepohodlí v rozhraní, ale přímé zpomalení navazujících kroků.

Protože šlo o pilotní uživatelské ověření kvalitativního charakteru, nesoustředil jsem se na jedinou agregovanou metriku. Vhodnější bylo sledovat kombinaci ukazatelů, které společně vystihují, zda je proces pro uživatele čitelný, dokončitelný a provozně použitelný. Zajímalo mě zejména to, zda uživatel dosáhl cílového stavu, zda potřeboval zásah moderátora, kolik chybných kroků udělal a jak svůj postup následně slovně hodnotil.

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
  caption: [Ukazatele použité v pilotním uživatelském ověření]
) <tab:user-test-metrics>


== Hlavní zjištění a implikace pro další rozvoj
Získaná pozorování ukázala, že největší hodnotu uživatelé vnímali v centralizaci informací, ve sjednocení stavu kandidátů a v lepší dohledatelnosti odpovědností napříč náborovým procesem a procesem vstupní agendy.

Jako problematická se naopak ukázala místa, kde systém předpokládá vyšší procesní znalost uživatele, než jakou lze očekávat při prvním použití. Typicky šlo o potřebu jasněji vysvětlit význam stavů, lépe zvýraznit další očekávaný krok a oddělit informace, které jsou pouze informativní, od těch, které vyžadují akci. U scénářů vstupní agendy byla důležitá také viditelná vazba mezi úkolem, termínem a odpovědnou rolí. Bez ní se uživatel sice v systému orientuje, ale hůře chápe prioritu jednotlivých kroků.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (auto, 1.35fr, 1.25fr, 1.15fr, 1fr, 1.15fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Scénář], [Dokončení scénáře], [Potřeba asistence], [Medián času], [Počet chyb], [Priorita zjištění],
      [S1], [doplnit], [doplnit], [doplnit], [doplnit], [doplnit],
      [S2], [doplnit], [doplnit], [doplnit], [doplnit], [doplnit],
      [S3], [doplnit], [doplnit], [doplnit], [doplnit], [doplnit],
      [S4], [doplnit], [doplnit], [doplnit], [doplnit], [doplnit],
      [S5], [doplnit], [doplnit], [doplnit], [doplnit], [doplnit],
      [S6], [doplnit], [doplnit], [doplnit], [doplnit], [doplnit],
      [S7], [doplnit], [doplnit], [doplnit], [doplnit], [doplnit],
    )
  ],
  caption: [Šablona souhrnných výsledků pilotního uživatelského ověření]
) <tab:user-test-results-template>

Z hlediska dalšího rozvoje z toho plyne poměrně jednoznačný závěr. Nejbližší iterace nemají směřovat především k rozšiřování funkcí, ale k úpravám, které zpřesní terminologii, zvýrazní odpovědnost za další krok a lépe propojí úkol, termín a roli. Právě v těchto bodech se rozhoduje, zda systém skutečně zrychlí nábor a adaptaci, nebo zda pouze digitalizuje stávající nejistotu. Získaná zjištění proto v další kapitole přímo převádím do doporučení pro další směřování vývoje.
