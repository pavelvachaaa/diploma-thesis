#import "../template/abbreviations.typ": abbr

#import "@preview/vlna:0.1.1": *
#show: apply-vlna

#set text(
  lang: "cs",
  hyphenate: true,
  costs: (
    widow: 100%,
    orphan: 100%,
    runt: 100%,
  ),
)


Uživatelské ověření jsem zařadil do práce proto, že u personálního systému nestačí pouze technická správnost implementace. Pokud uživatel nerozumí stavu náboru, neví, kdo má provést další krok, nebo se v rozhraní ztrácí, procesní přínos systému se rychle vytrácí. Cílem této kapitoly proto není statisticky reprezentativní výzkum celé organizace, ale pilotní ověření toho, zda navržené řešení podporuje klíčové role v jejich každodenních scénářích a kde je ještě potřeba systém zpřesnit.

== Cíl a rámec pilotního ověření
Cílem pilotního uživatelského ověření bylo zodpovědět čtyři praktické otázky. První z nich se týkala průchodnosti hlavních scénářů bez nadměrné asistence. Druhá mířila na místa, kde se uživatelé zastavují, vracejí nebo si nejsou jisti významem dalšího kroku. Třetí sledovala, které prvky rozhraní pomáhají udržet procesní kontext a které jej naopak komplikují. Čtvrtá otázka převáděla získanou zpětnou vazbu do priorit pro stabilizaci a další rozvoj řešení.

Na základě těchto cílů jsem formuloval následující výzkumné otázky:

1. Dokážou cílové role dokončit klíčové scénáře bez externí asistence?
2. Ve kterých krocích vzniká nejčastěji nejistota, zdržení nebo chybné rozhodnutí?
3. Které prvky rozhraní uživatelům pomáhají udržet kontext procesu a které jej naopak komplikují?
4. Jaká zjištění mají nejvyšší prioritu pro další iteraci systému?


== Metodický postup a výběr respondentů
Pilotní uživatelské ověření jsem vedl jako moderované scénářové ověření v průběhu školení zaměstnanců s vyvinutým systémem. Každý účastník procházel scénáře odpovídající jeho roli, pracoval s připravenými úlohami vycházejícími z reálného provozu a průběžně komentoval, jak rozumí jednotlivým krokům a stavům systému. Tento postup mi umožnil nesledovat pouze to, zda uživatel úkol dokončil, ale také proč se v určitém bodě zastavil a jak interpretoval význam zobrazených informací.

Z metodického hlediska jsem kombinoval tři vzájemně se doplňující techniky. Základem bylo scénářové ověření s jednoznačně definovaným cílovým stavem a měřením doby dokončení. Druhou vrstvu tvořilo průběžné komentování postupu uživatelem, které pomohlo odlišit pouhou chybu od hlubší nejasnosti v terminologii nebo navigaci. Třetí vrstvou byl krátký rozhovor po dokončení scénáře, ve kterém jsem ověřoval, co bylo pro uživatele přínosné, co považoval za problematické a jaké změny by očekával před širším provozním rozšířením.

Z důvodu ochrany soukromí účastníků jsou data v této kapitole i v příloze anonymizována. Jednotliví účastníci nejsou uváděni jménem, ale pod interními identifikátory N01–N07 pro náboráře, P01–P02 pro personalistky, U01–U02 pro interní zaměstnance v roli uchazeče a V01 pro vedoucího zaměstnance.

Praktického školení se účastnilo sedm náborářů (jeden náborář na závod) a dvě personalistky. Tato skupina ověřovala zejména náborové a personální scénáře. Samostatně byli do ověření zapojeni dva interní zaměstnanci v roli uchazečů, aby bylo možné ověřit srozumitelnost části procesu z pohledu osoby, která reaguje na nabídku nebo plní navazující vstupní úkoly. Manažerský pohled reprezentoval jeden vedoucí zaměstnanec. 

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.45fr, 0.7fr, 1.6fr, 2.15fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Role], [Počet], [Účel zapojení], [Hlavní testovaná agenda],
      [Náborář], [7], [Ověření náborového procesu při školení], [Správa nabídek, zpracování uchazečů, změny stavů, plánování pohovorů, komunikace s kandidáty],
      [Personalistka], [2], [Ověření personální návaznosti procesu při školení], [Převod uchazeče do navazující agendy, kontrola údajů, koordinace vstupních kroků],
      [Interní zaměstnanec v roli uchazeče], [2], [Ověření srozumitelnosti kandidátského pohledu], [Reakce na nabídku, orientace v přidělených úkolech, práce s dokumenty a notifikacemi],
      [Vedoucí zaměstnanec], [1], [Ověření rozhodovacích a dohledových kroků], [Přehled stavu náboru, vyhodnocení průchodnosti procesu],
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
      [S1], [Založení a publikace nové pracovní pozice], [Náborář], [R2, R3],
      [S2], [Zpracování přihlášky a změna stavu uchazeče], [Náborář], [R3, R6],
      [S3], [Naplánování pohovoru a odeslání pozvánek], [Náborář], [R3],
      [S4], [Převod uchazeče na zaměstnance a spuštění vstupní agendy], [Náborář / personalistka], [R4],
      [S5], [Vyplnění kroku vstupní agendy a nahrání požadovaných dokumentů], [Interní zaměstnanec v roli uchazeče], [R4],
      [S6], [Kontrola reportu náborové průchodnosti], [Vedoucí], [R6],
      [S7], [Ověření notifikace a reakce na přidělený úkol], [Náborář / personalistka / uchazeč], [R4, R6],
    )
  ],
  caption: [Sada testovacích scénářů]
) <tab:user-test-scenarios> 

Scénáře v @tab:user-test-scenarios záměrně nesledují jen izolované klikací úlohy, ale uzly, ve kterých se rozhoduje o průchodnosti celého procesu. Pokud se uživatel ztratí při změně stavu uchazeče, při převodu na zaměstnance nebo při práci s úkolem vstupní agendy, nevzniká pouze lokální nepohodlí v rozhraní, ale přímé zpomalení navazujících kroků.

Přesné znění zadání, které účastníci při pilotním ověření obdrželi, je z důvodu přehlednosti uvedeno v #link(<scenariopage>)[příloze „Zadání scénářů pro pilotní uživatelské ověření“].

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
      columns: (auto, 1.15fr, 1fr, 0.95fr, 1fr, 0.8fr, 0.95fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Scénář], [Dokončení scénáře], [Potřeba asistence], [Medián času [HH:MM]], [Rozsah času], [Počet chyb], [Priorita zjištění],
      [S1], [7/7], [0], [03:05], [02:45 - 03:40], [2], [nízká],
      [S2], [7/7], [1], [02:30], [02:10 - 03:00], [1], [nízká],
      [S3], [7/7], [1], [02:45], [02:15 - 03:25], [1], [střední],
      [S4], [7/9], [2], [02:30], [02:00 - 03:25], [3], [vysoká],
      [S5], [2/2], [0], [05:15], [05:00 - 05:30], [1], [střední],
      [S6], [1/1], [0], [02:50], [02:50 - 02:50], [0], [nízká],
      [S7], [11/11], [0], [01:40], [01:15 - 02:20], [1], [nízká],
    )
  ],
  caption: [Souhrn výsledků pilotního uživatelského ověření]
) <tab:user-test-results>

Souhrn v @tab:user-test-results vychází z reálného měření průchodů pilotními scénáři během praktického školení a navazujícího ověření vybraných rolí. U každého scénáře jsem sledoval dosažení cílového stavu, potřebu asistence, orientační dobu dokončení, počet chybných kroků a následný komentář účastníka. Čas dokončení je proto uváděn jako medián naměřených průchodů scénářem a doplněn o rozsah nejkratšího a nejdelšího dokončeného průchodu. U scénáře S6 je rozsah tvořen jediným měřením, protože manažerský pohled reprezentoval jeden vedoucí zaměstnanec. Detailní anonymizovaný záznam jednotlivých průchodů je uveden v @tab:user-test-raw-data.

Výsledky zároveň ukazují, že digitalizace procesů již v pilotním provozu zrychlila průchod náborem. Operace, které byly v původním stavu závislé na kombinaci e-mailové komunikace, lokálních souborů a ručního předávání informací mezi rolemi, bylo možné ve sledovaných scénářích dokončit v řádu jednotek minut. Zvlášť patrné to bylo u založení a úpravy pracovní nabídky, změny stavu uchazeče, naplánování pohovoru a automatického vyvolání navazujících notifikací. Přínos tedy nespočívá pouze v nahrazení papírových nebo e-mailových kroků digitálním formulářem, ale především ve zkrácení prodlev mezi navazujícími činnostmi a ve vzniku jednoznačně dohledatelné historie procesu.

Nejvyšší prioritu získal scénář S4, protože převod uchazeče do navazující vstupní agendy vyžadoval nejvíce vysvětlení a obsahoval nejvíce chybných nebo nejistých kroků. Uživatelé zde potřebovali lépe rozlišit, zda pouze mění stav uchazeče, nebo již spouštějí navazující proces pro budoucího zaměstnance. Naopak scénáře S1, S2, S6 a S7 proběhly bez výraznějších problémů, protože jejich cílový stav byl v rozhraní jednoznačně čitelný.

=== Zodpovězení výzkumných otázek
Výsledky pilotního ověření umožňují zodpovědět výzkumné otázky formulované v úvodu kapitoly. U první otázky, zda cílové role dokážou dokončit klíčové scénáře bez externí asistence, lze odpovědět převážně kladně. Šest ze sedmi scénářů bylo dokončeno všemi účastníky, pro které byl daný scénář určen, přičemž asistence byla nízká nebo střední. Výjimku představoval scénář S4, kde dokončení dosáhlo sedm z devíti zapojených náborářů a personalistek a bylo nutné dvakrát zasáhnout vysvětlením dalšího kroku.

Nejčastější nejistota se vztahovala k přechodovým bodům procesu. Uživatelé se nezastavovali primárně na běžných formulářových akcích, jako je vytvoření nabídky nebo změna stavu uchazeče, ale v okamžicích, kdy jedna agenda přechází do druhé. Nejvýrazněji se to projevilo u převodu uchazeče na zaměstnance a spuštění vstupní agendy. Menší míra nejistoty se objevila také při práci s úkoly vstupní agendy, kde uživatelé potřebovali jasněji vidět vazbu mezi úkolem, termínem a odpovědnou rolí.

Za prvky, které uživatelům pomáhaly udržet kontext procesu, lze označit jednotný stav uchazeče, přehled navazujících událostí, historii změn a automatické notifikace. Tyto prvky snižovaly potřebu dohledávat informace v e-mailu nebo v lokálních souborech a umožňovaly rychleji určit, co se s uchazečem nebo úkolem naposledy stalo. Naopak komplikujícími prvky byly nejednoznačné názvy některých stavů, nedostatečné zvýraznění další očekávané akce a slabší vysvětlení rozdílu mezi ukončením náborového kroku a spuštěním navazující vstupní agendy.

Nejvyšší prioritu pro další iteraci proto mají úpravy, které nevyžadují zásadní rozšíření funkčního rozsahu, ale zpřesňují procesní srozumitelnost. Konkrétně jde o jasnější pojmenování stavů, zvýraznění další odpovědné role, lepší vysvětlení přechodu mezi uchazečem a zaměstnancem a přehlednější zobrazení úkolů vstupní agendy. Pilotní ověření tím potvrzuje, že navržené řešení je v hlavních scénářích průchodné a již nyní přináší měřitelný procesní přínos, zatímco další vývoj má cílit hlavně na odstranění konkrétních míst nejistoty zjištěných při práci uživatelů.
