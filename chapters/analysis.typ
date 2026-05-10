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


== Představení organizace
#abbr("KZ", "Krajská zdravotní, a.s.") je akciová společnost vlastněná Ústeckým krajem a současně největší poskytovatel lůžkové i ambulantní zdravotní péče v regionu. Vznikla v roce 2007 sloučením pěti nemocnic do jediné právní entity. Smyslem tohoto kroku nebyla pouze organizační konsolidace, ale i sjednocení řízení, nákupu a sdílení odborných kapacit napříč regionem.

V roce 2021 se struktura #abbr("KZ", none) dále rozšířila. Do společnosti byla integrována *Nemocnice Litoměřice, o.z.*, a následně bylo převzato i zdravotnické zařízení v Rumburku, které dnes funguje jako *#abbr("KZ", none) - Masarykova nemocnice v Ústí nad Labem, o.z., detašované pracoviště Rumburk*. Tím se počet odštěpných závodů zvýšil na sedm.

S více než jedenácti tisíci zaměstnanci patří #abbr("KZ", none) mezi největší zaměstnavatele v Ústeckém kraji. Pro tuto práci je podstatné zejména to, že značnou část personálu tvoří zdravotničtí pracovníci s regulovanou odbornou způsobilostí. Nábor a adaptace zde proto nejsou jen administrativní agendou, ale procesem, který musí současně splnit provozní, legislativní i odborné požadavky.

=== Organizační struktura z~pohledu řízení lidských zdrojů
#abbr("KZ", none) je řízená centrálně, avšak jednotlivé nemocnice mají zároveň prostor samostatně řešit běžné provozní a personální záležitosti. Každý odštěpný závod má vlastní personální zázemí #abbr("HR", "Human Resources") pro operativní agendu, správu smluv, docházku i řízení adaptace, ale současně se řídí jednotnou metodikou a strategickými cíli společnosti.

Z pohledu digitalizace je důležité, že systém nesmí uvažovat organizaci jako jeden homogenní celek. Musí respektovat samostatnost jednotlivých závodů a zároveň umožnit centrální dohled, reporting a správu pravidel. V architektonické terminologii jde o požadavek na _multi-tenantní_ řešení, ve kterém každý odštěpný závod vystupuje jako samostatný tenant sdílející společnou infrastrukturu i metodické řízení.

=== Specifika řízení lidských zdrojů ve zdravotnických organizacích
Řízení lidských zdrojů v prostředí #abbr("KZ", none) se od běžného korporátního modelu liší především tím, že velká část pracovních rolí podléhá regulované odborné způsobilosti. Náborový systém proto nemůže řešit pouze evidenci kandidátů a komunikaci s nimi. Musí současně hlídat kvalifikace, zákonné podmínky výkonu povolání a návaznost těchto informací na adaptační proces.

Rozdílné nároky se projevují už v samotné kategorizaci pracovníků. Zaměstnanci #abbr("KZ", none) spadají do několika skupin, z nichž každá vyžaduje jiný rozsah dokladů, jiný způsob ověření způsobilosti a často i odlišný průběh adaptace. Pro další text zavádím zejména kategorie #abbr("LZ", "Lékaři a farmaceuti"), #abbr("NLZP", "Nelékařští zdravotničtí pracovníci") a #abbr("IT", "Informační technologie"), které se v procesech opakují.
#figure(
  table(
    columns: (1.5fr, 2fr, 2fr),
    inset: 7pt,
    align: horizon,
    fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
    stroke: 0.5pt + gray,

    [Kategorie], [Typické pozice v #abbr("KZ", none)], [Klíčová specifika pro #abbr("HR", none)],

    [#abbr("LZ", none)],
    [Atestovaní lékaři, lékaři v přípravě, farmaceuti],
    [Sledování specializačního vzdělávání (atestace) a evidence v #abbr("ČLK", "Česká lékařská komora").],

    [#abbr("NLZP", none)],
    [Všeobecné sestry, dětské sestry, porodní asistentky],
    [Odborná a specializovaná způsobilost, vzdělávání],

    [Jiní odborní pracovníci],
    [Radiologičtí asistenti, fyzioterapeuti, sanitáři, kliničtí psychologové],
    [Certifikované kurzy, akreditované stáže, specifické nároky na praxi.],

    [#abbr("THP", "Technicko-hospodářští pracovníci")],
    [Ekonomové, #abbr("IT", none) specialisté, údržba, stravovací provoz],
    [Zařazení dle Katalogu prací, standardní zákoník práce.],
  ),
  caption: "Klasifikace pozic v KZ",
)  <tab:zarazeni-zamestnancu>

Hlavním specifikem je právě práce v rámci *regulované odborné způsobilosti*. Základním pilířem HR procesů v #abbr("KZ", none) je soulad s legislativním rámcem pro výkon zdravotnických povolání. Nábor a následná správa zaměstnanců se zde opírají zejména o dvě normy:

- Zákon č. 95/2004 Sb. - upravuje získávání odborné a specializované způsobilosti u lékařů, zubních lékařů a farmaceutů. Systém musí sledovat průběh předatestační přípravy, platnost členství v #abbr("ČLK", none)/ČSK a zařazení do specializačních oborů.

- Zákon č. 96/2004 Sb. - definuje podmínky pro #abbr("NLZP", none). Zde je kritické sledování odborné způsobilosti a schopnosti vykonávat povolání bez odborného dohledu (v souladu s aktuální metodikou Ministerstva zdravotnictví a #abbr("ÚZIS", "Ústav zdravotnických informací a statistiky ČR")).

Informační systém proto musí umět validovat doklady o dosaženém vzdělání, zaznamenat výsledek jejich kontroly a následně pracovat i s informacemi o registracích v profesních komorách nebo o odborné způsobilosti pod dohledem. Bez této vrstvy by digitalizace sice urychlila administrativu, ale neřešila by to, co je v prostředí zdravotnické organizace skutečně kritické.

Dalším specifikem je *kontinuální nábor*. Na rozdíl od prostředí, kde se nábor spouští jen při výjimečné potřebě, musí zdravotnická organizace dlouhodobě reagovat na fluktuaci, demografický vývoj i celorepublikový nedostatek pracovníků, zejména mimo hlavní centra @mzd2025TiskovkaNedostatek. Systém proto musí být připraven na opakované a souběžné zpracování velkého množství pozic i uchazečů.

Podpisem pracovní smlouvy končí práce náboráře a personálního oddělení. Následuje *vícestupňový adaptační proces*, který zahrnuje nejen standardní nástupní agendu a školení #abbr("BOZP", "Bezpečnost a ochrana zdraví při práci"), ale i odborné zapracování, práci s interní dokumentací, seznámení s nemocničními systémy a ověření připravenosti na konkrétním pracovišti. Právě vazba mezi náborem, vstupní agendou a adaptací je proto v této práci klíčová.

== Současný stav procesů náboru pracovníků<kapitola-soucasny-stav>
Před zahájením digitalizace stála správa uchazečů v #abbr("KZ", none) převážně na sdílených tabulkách a e-mailové komunikaci, kterou doplňují lokální zvyklosti jednotlivých závodů. Takové řešení může fungovat efektivně v menší organizaci, ale v podmínkách #abbr("KZ",none) začíná postupně brzdit celý proces. Nábor zde pak nepůsobí jako jeden plynulý celek, ale jako řada navazujících administrativních kroků, mezi nimiž se informace ztrácejí nebo zbytečně přepisují.

Pro účely analýzy jsem proto mapoval skutečný průběh procesů pomocí strukturovaných rozhovorů (#link(<otazky-rozhovory>)[Příloha 4]) s vedoucím personálního oddělení a s náboráři jednotlivých odštěpných závodů. Vycházel jsem nejen z formálních metodických pokynů, ale i z popisu reálné praxe, tedy z toho, jak proces skutečně probíhá při běžném provozu, včetně neformálních dohod a obcházení chybějících nástrojů.

Pro zajištění terminologické konzistence jsou v této kapitole používány následující pojmy:

- *Uchazeč* o zaměstnání je fyzická osoba, která reaguje na konkrétní zveřejněnou pracovní pozici a doručí zaměstnavateli svou přihlášku (životopis, motivační dopis nebo jinou formu reakce).
- *Kandidát* je uchazeč, který prošel prvotním roztříděním a byl vybrán do další fáze výběrového řízení (např. k osobnímu pohovoru nebo odbornému posouzení).
- *Zájemce* o zaměstnání je osoba, která projeví zájem o zaměstnání v KZ bez vazby na konkrétní vyhlášenou pracovní pozici (tzv. talent pool).

=== Proces inzerce volných pozic
Inzerce volných pracovních pozic je v současném stavu rozložena mezi několik nezávislých kanálů:

- *Webové portály třetích stran* - jobs.cz, prace.cz (provozovatel LMC), portál Ministerstva práce a sociálních věcí
- *Nemocniční nástěnky* - fyzické nástěnky v areálech nemocnic
- *Webové stránky nemocnic* - statické stránky s omezenou aktualizací
- *Sociální sítě* - LinkedIn

Absence vlastního kariérního portálu znamená, že uchazeč nemá jednotný vstupní bod, ve kterém by našel aktuální nabídky všech závodů, základní informace o zaměstnavateli i možnost okamžitě reagovat na pozici. Už na této úrovni tedy vzniká roztříštěnost, kterou organizace dále přenáší i do interní práce s inzeráty.

Proces začíná tím, že vedoucí oddělení identifikuje potřebu obsadit pozici a předává ji personálnímu oddělení, pod které organizačně spadají náboráři. Vstupní informace však nejsou standardizované. Rozsah i kvalita zadání se liší podle konkrétního vedoucího, takže náborář často nejprve doplňuje chybějící údaje a až poté připravuje text inzerátu. Samotné schvalování proto probíhá v několika e-mailových iteracích a místo plynulého procesu vzniká komunikační smyčka.

Po schválení textu následuje ruční publikace na jednotlivých platformách. Každý portál má vlastní formulář, vlastní strukturu dat i vlastní způsob následné aktualizace. Změna termínu nebo úprava požadavků proto neznamená jednu opravu v centrálním systému, ale opakování stejné práce na více místech. Důsledkem je nízká transparentnost, vyšší časová náročnost a slabý přehled vedoucích pracovníků o tom, kde se jejich pozice právě nachází a jaké reakce na ni přišly. Navíc se ukázalo, že publikace na webových stránkách organizace je závislá pouze na jedné osobě, což představuje významné provozní riziko a může vést ke zpožděním nebo omezení dostupnosti informací.

Celý proces v notaci #abbr("BPMN", none) přehledně shrnuje #ref(<obr:proces-p01>, supplement: [obrázek]); identifikátory a metriky pro lepší orientaci uvádí #ref(<tab:proces-p01>, supplement: [tabulka]).
#figure(
  table(
    columns: 2,
    stroke: 0.5pt + black,
    fill: (col, row) => {
      if col == 0 { rgb("#cecece") } else { white }
    },
    align: (left, left),

    [Identifikátor procesu:], [P01],
    [Název procesu:], [Vytvoření inzerátu pro pracovní pozici],
    [Zákazník:], [Vedoucí daného oddělení v odštěpném závodě],
    [Vlastník procesu:], [Náborář, vedoucí daného oddělení v odštěpném závodě],
    [Účel:], [Vytvoření inzerátu na poptávanou pozici],
    [Produkt:], [Inzerát],
    [Technické prostředky:],
    [E-mail, webové stránky KZ, webové portály třetích stran, nemocniční nástěnky, sociální sítě],

    [Metrika:], [Rychlost od žádosti po vystavení inzerátu],
    [Nedostatky:],
    [Manuální publikace inzerátu, již neaktuální inzeráty na portálech, nejednotný přehled o vydaných financích, dlouhé administrativní kolečko mezi vedoucím a náborářem],
  ),
  caption: [Proces P01 - Vystavení inzerátu],
) <tab:proces-p01>

#figure(
  image(
    "../procesy/p01_inzerce.svg",
    width: 100%,
  ),
  caption: [Diagram BPMN znázorňující proces od žádosti po vystavení inzerátu],
) <obr:proces-p01>


=== Proces příjmu a výběru potenciálních kandidátů
Přihlášky dnes přicházejí z různých zdrojů a náborář je musí ručně sjednocovat do tabulek a lokálně uložených příloh. Samotné získání přehledu o kandidátech je tak oddělenou administrativní činností, nikoli přirozenou součástí náborového systému. Výsledkem je nekonzistence dat mezi pracovišti a nízká dohledatelnost dokumentů.

Prvotní třídění uchazečů probíhá převážně manuálně. U zdravotnických pozic to znamená vyhledávat v každém životopise údaje o vzdělání, odborné způsobilosti a další podmínky, které rozhodují o dalším postupu. Bez automatických filtrů a strukturovaných dat je tento krok pomalý a zároveň náchylný k přehlédnutí důležitých informací. Užší výběr se následně předává vedoucím oddělení znovu e-mailem, takže rozhodovací proces zůstává roztříštěný.

Kritickým nedostatkem je i absence systematické databáze uchazečů a zájemců. Informace o kandidátech, kteří nebyli přijati nebo reagovali bez vazby na konkrétní pozici, se dále nevyužívají. Organizace tím přichází o možnost vracet se k relevantním kontaktům při dalším náboru a zvyšuje si závislost na opakované inzerci, která s sebou nese finanční zátěž.

#figure(
  table(
    columns: 2,
    stroke: 0.5pt + black,
    fill: (col, row) => {
      if col == 0 { rgb("#cecece") } else { white }
    },
    align: (left, left),
    [Identifikátor procesu:], [P02],
    [Název procesu:], [Příjem přihlášek a výběr kandidátů k oslovení],
    [Zákazník:], [Vedoucí daného oddělení v odštěpném závodě],
    [Vlastník procesu:], [Náborář, vedoucí daného oddělení v odštěpném závodě],
    [Účel:], [Výběr kandidátů, jenž splňují požadavky obsazované pozice],
    [Produkt:], [Kandidát pozvaný na pohovor],
    [Technické prostředky:], [E-mail, telefon, tabulkový procesor, Webex],
    [Metrika:], [Rychlost od vystavení inzerátu po oslovení kandidáta],
    [Nedostatky:],
    [Chybějící centrální evidence uchazečů o pracovní pozice a potenciálních zájemců o zaměstnání v #abbr("KZ", none).],
  ),
  caption: [Proces P02 - Příjem a výběr kandidátů k oslovení],
) <tab:proces-p02>


#figure(
  image(
    "../procesy/p02_prijem_prihlasek.svg",
    width: 100%,
  ),
  caption: [Diagram BPMN znázorňující proces od přijetí přihlášky po pozvánku na pohovor],
) <obr:proces-p02>

=== Proces náboru kandidáta
Proces náboru pracovníka (P03) navazuje na okamžik, kdy je kandidát pozván na pohovor. V této fázi už nejde pouze o výběr vhodného člověka, ale o splnění všech podmínek nutných pro vznik pracovněprávního vztahu. Prakticky se zde propojuje rozhodnutí vedoucího oddělení s administrativními a zákonnými kroky personálního oddělení.

Po úspěšném pohovoru začíná sběr identifikačních údajů a povinných dokumentů. Kandidát dokládá výpis z rejstříku trestů, doklady o vzdělání, odborné kvalifikaci a další podklady podle charakteru pozice. Následují vstupní lékařská prohlídka a školení #abbr("BOZP", none). Každý z těchto kroků je nezbytný, ale v současném stavu probíhá převážně manuálně a bez jednotného přehledu o tom, co již bylo dodáno a co ještě chybí.

Proces tak sice formálně vede k uzavření pracovní smlouvy, ale z provozního hlediska v něm chybí centrální koordinace. Informace jsou rozloženy mezi e-maily, listinné podklady a jednotlivé pracovníky, což prodlužuje průchod celou fází a zvyšuje riziko administrativního zdržení.

#figure(
  table(
    columns: 2,
    stroke: 0.5pt + black,
    fill: (col, row) => {
      if col == 0 { rgb("#cecece") } else { white }
    },
    align: (left, left),

    [Identifikátor procesu:], [P03],
    [Název procesu:], [Pohovor a uzavření pracovního poměru],
    [Zákazník:], [Vedoucí oddělení, personální oddělení],
    [Vlastník procesu:], [Vedoucí oddělení, personální a mzdové oddělení],
    [Účel:], [Odborné posouzení kandidáta a splnění podmínek pro vznik pracovněprávního vztahu],
    [Produkt:], [Podepsaná pracovní smlouva],
    [Technické prostředky:], [Listinné dokumenty, e-mail, telefon],
    [Metrika:], [Doba od pohovoru po podpis pracovní smlouvy],
    [Nedostatky:], [Manuální sběr dokladů, vícestupňová administrativa, papírová komunikace],
  ),
  caption: [Proces P03 - Pohovor a uzavření pracovního poměru],
) <tab:proces-p03>


Celý proces je znázorněn na diagramu níže (viz #ref(<obr:proces-p03>, supplement: [obrázek])), který zachycuje jednotlivé kroky od pohovoru až po podpis pracovní smlouvy. Diagram ukazuje návaznost činností mezi kandidátem, vedoucím oddělení a personálním oddělením. Zároveň je z obrázku hned patrná roztříštěnost procesu, zejména v oblasti předávání dokumentů a koordinace jednotlivých kroků.

#figure(
  image(
    "../procesy/p03_prijmuti_a_pohovor.svg",
    width: 100%,
  ),
  caption: [Diagram BPMN znázorňující proces od pohovoru po uzavření pracovního poměru],
) <obr:proces-p03>

=== Proces zajištění vstupní agendy
V okamžiku nástupu zaměstnance začíná fáze, ve které je třeba připravit člověka na skutečný výkon práce. Patří sem vydání identifikační karty, nastavení docházky, přístupových oprávnění a v některých případech i prostředků pro elektronické podepisování. Z pohledu procesu je důležité, že tyto kroky nevykonává jediná role, ale více útvarů s rozdílnou odpovědností.

Vedle technických přístupů probíhá i útvarová orientace nového zaměstnance. Vedoucí pracovník jej seznamuje s pracovištěm, provozním řádem, dokumentací a očekáváním spojeným s výkonem práce. Problém současného stavu nespočívá v tom, že by tyto kroky neexistovaly, ale v tom, že nejsou vedeny v jednotném přehledu. Organizace proto obtížně zjišťuje, co bylo splněno, co se zdrželo a kde se nový zaměstnanec může zaseknout ještě před plným nástupem do své nové role.

#figure(
  table(
    columns: 2,
    stroke: 0.5pt + black,
    fill: (col, row) => {
      if col == 0 { rgb("#cecece") } else { white }
    },
    align: (left, left),

    [Identifikátor procesu:], [P04],
    [Název procesu:], [Nástup zaměstnance a zajištění přístupových prostředků],
    [Zákazník:], [Nový zaměstnanec],
    [Vlastník procesu:], [Personální oddělení, IT, vedoucí oddělení],
    [Účel:], [Zajištění připravenosti zaměstnance k výkonu práce],
    [Produkt:], [Zaměstnanec vybaven ID kartou, přístupy a případně tokenem],
    [Technické prostředky:], [ID karta, docházkový systém, autentizační token, interní IT systémy],
    [Metrika:], [Doba od podpisu smlouvy po plnou funkčnost zaměstnance],
    [Nedostatky:], [Oddělené nastavování oprávnění, ruční aktivace přístupů, absence jednotného postupu],
  ),
  caption: [Proces P04 - Nástup zaměstnance],
) <tab:proces-p04>


#figure(
  image(
    "../procesy/p04_vstupni_agenda.svg",
    width: 100%,
  ),
  caption: [Diagram BPMN znázorňující proces od nového pracovního poměru po přípravu zaměstnance k výkonu práce],
) <obr:proces-p04>



=== Proces adaptace nových zaměstnanců
Adaptační proces tvoří most mezi formálním nástupem a plnohodnotným výkonem práce. V prostředí #abbr("KZ", none) je tato fáze zvlášť důležitá u zdravotnických pozic, protože nestačí pouze administrativně dokončit nástup. Je třeba zajistit i odborné zapracování v podmínkách konkrétního pracoviště.

Obecná část adaptace se vztahuje na všechny zaměstnance a probíhá zejména ve zkušební době. Vedoucí zaměstnanec určuje školitele, nastavuje adaptační plán a průběžně hodnotí jeho plnění. Odborná část je pak výraznější u zdravotnických profesí, kde se sleduje nejen zvládnutí organizačních pravidel, ale i osvojení pracovních postupů, standardů a očekávané míry samostatnosti.

V současném stavu je však adaptace z velké části vedena papírově. To komplikuje průběžné sledování, znesnadňuje auditní dohled a prakticky znemožňuje centrálně vyhodnocovat, jak adaptace probíhá napříč odštěpnými závody. Organizace tak sice adaptaci vykonává, ale nemá k dispozici jednotný digitální obraz o jejím stavu a výsledcích.

#figure(
  table(
    columns: 2,
    stroke: 0.5pt + black,
    fill: (col, row) => {
      if col == 0 { rgb("#cecece") } else { white }
    },
    align: (left, left),

    [Identifikátor procesu:], [P05],
    [Název procesu:], [Adaptační proces zaměstnance],
    [Zákazník:], [Vedoucí oddělení, zaměstnanec],
    [Vlastník procesu:], [Vedoucí zaměstnanec, školitel],
    [Účel:], [Začlenění zaměstnance do pracovního a odborného prostředí],
    [Produkt:], [Plně adaptovaný zaměstnanec],
    [Technické prostředky:], [Adaptační formuláře, hodnotící pohovory],
    [Metrika:], [Míra setrvání po zkušební době, fluktuace],
    [Nedostatky:], [Papírová dokumentace, chybějící monitoring, slabý reporting],
  ),
  caption: [Proces P05 - Adaptace zaměstnance],
) <tab:proces-p05>

#figure(
  image(
    "../procesy/p05_adaptace.svg",
    width: 100%,
  ),
  caption: [Diagram BPMN znázorňující proces od připraveného zaměstnance až po adaptovaného zaměstnance],
) <obr:proces-p05>


== Identifikace problémů a úzkých míst<kapitola-identifikcea-problemu>
Na základě analýzy současného stavu procesů náboru a adaptace v KZ, konzultací s HR pracovníky jednotlivých nemocnic a pozorování reálného průběhu procesů jsem identifikoval následující klíčové problémy. Problémy jsou kategorizovány podle oblastí dopadu a doplněny o kvalitativní hodnocení závažnosti.

Identifikované problémy mají kumulativní charakter a v provozní praxi se vzájemně zesilují. Situaci ovlivňuje také častá obměna zaměstnanců. Do organizace nastupuje v průměru 110 nových pracovníků měsíčně, přičemž v sezónních špičkách může jít až o 180 osob. Typická měsíční struktura nástupů přitom zahrnuje přibližně 10 pracovníků kategorie #abbr("LZ", none), 50 #abbr("NLZP", none) a 50 #abbr("THP", none)/dělnických profesí. V takovém objemu se manuální administrativa stává kritickým omezením propustnosti celého procesu.

Z analytického pohledu lze problémy rozdělit do tří tematických oblastí. První oblast představuje *datová fragmentace* (P1–P3), kdy jsou informace rozptýleny mezi e-mailovou komunikaci, lokální soubory a tabulkové přehledy jednotlivých závodů. Druhou oblast tvoří *procesní a řídicí nedostatky* (P4–P9), zejména chybějící auditní stopa, nízká standardizace rozhodování a slabá transparentnost stavu náboru i vstupní agendy. Třetí oblast je *digitálně nepodpořená adaptace* (P10), která omezuje možnost systematicky řídit zapracování nových zaměstnanců a vyhodnocovat jeho úspěšnost.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (auto, 1.6fr, auto, 2fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#cecece") } else { white },
      stroke: 0.5pt + gray,
      [ID], [Problém], [Závažnost], [Hlavní dopad],
      [P1], [Tabulková a papírová agenda], [Vysoká], [Riziko ztráty dat, neefektivní práce],
      [P2], [Chybějící evidence uchazečů], [Vysoká], [Ztráta kandidátů, nemožnost analytiky],
      [P3], [Neexistující evidence zájemců], [Střední], [Ztráta potenciálních kandidátů],
      [P4], [Absence auditní stopy], [Vysoká], [Právní rizika, #abbr("GDPR", "General Data Protection Regulation"), neschopnost auditu],
      [P5], [Omezený reporting], [Střední], [Rozhodování bez datové opory],
      [P6], [Komunikační smyčka], [Vysoká], [Prodloužení doby obsazení pozice],
      [P7], [Manuální publikace], [Střední], [Časová náročnost, nekonzistence],
      [P8], [Nestrukturované hodnocení], [Střední], [Subjektivní výběr],
      [P9], [Nepřehledný stav vstupní agendy], [Vysoká], [Problémy při nástupu zaměstnance],
      [P10], [Papírová adaptace], [Vysoká], [Nemožnost monitoringu a reportingu],
    )
  ],
  caption: [Kvalitativní hodnocení závažnosti identifikovaných problémů],
) <tab:zavaznost-problemu>

Na základě dat uvedených v #ref(<tab:zavaznost-problemu>, supplement: [tabulce]) lze souhrnně konstatovat, že stávající procesní model již neodpovídá rozsahu organizace ani požadavkům na datově řízené rozhodování. Zjištění této kapitoly proto představují přímý vstup pro definici požadavků na cílové řešení.

== Požadavky na digitalizaci procesů
Na základě provedené analýzy procesů a identifikovaných problémů (@kapitola-identifikcea-problemu) lze formulovat klíčové požadavky na digitalizaci procesů náboru a adaptace. Každý požadavek je odůvodněn vazbou na identifikované problémy.

Požadavky R1–R6 představují minimální funkční rámec cílového systému. Každý požadavek je formulován tak, aby byl implementovatelný, ověřitelný při testování a současně jednoznačně navázaný na problémy identifikované v předchozí sekci.

@tab:pozadavky-digitalizace níže ukazuje, že jednotlivé požadavky nepokrývají izolované části procesu, ale řeší problémy napříč celým životním cyklem kandidáta. Současně je patrná snaha o propojení náboru a adaptace do jednoho integrovaného systému, který umožní lepší přehled, efektivnější koordinaci a kvalitnější rozhodování na úrovni jednotlivých závodů i centrály. 

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (auto, 2fr, 4fr, 1fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [ID], [Požadavek], [Vymezení a cíl], [Vazba],

      [R1],
      [Multi-tenantní architektura],
      [Respektovat strukturu KZ (samostatné závody) a umožnit centrální řízení a reporting.],
      [P1, P2, P5],

      [R2],
      [Veřejný kariérní portál],
      [Poskytnout jednotný vstupní bod s aktuálními nabídkami, online přihláškou a registrací zájemce (tzv. talent pool).],
      [P2, P3, P6, P7],

      [R3],
      [Interní administrační rozhraní],
      [Centralizovat správu inzerce, kandidátů, výběrových kroků, kontrolu kvalifikací i přípravu vstupní agendy.],
      [P1, P2, P4, P5, P6, P7, P8, P9],

      [R4],
      [Adaptační portál],
      [Digitalizovat adaptační plány, průběžné hodnocení, notifikace termínů a souhrnný přehled stavu adaptace.],
      [P1, P4, P5, P10],

      [R5],
      [Integrace s #abbr("NRZP", "Národní registr zdravotnických pracovníků")],
      [Automatizovat ověřování odborné způsobilosti zdravotnických pracovníků přes napojení na #abbr("NRZP", none).],
      [P1, P4],

      [R6],
      [Reporting a analytika],
      [Zajistit přehledy a export metrik náboru a adaptace pro závody i centrální úroveň.],
      [P5],
    )
  ],
  caption: [Požadavky na digitalizaci a jejich vazba na identifikované problémy],
) <tab:pozadavky-digitalizace>




== Specifikace požadavků
Na základě formulovaných požadavků na digitalizaci (R1–R6) jsem v této sekci provedl jejich dekompozici na konkrétní funkční a nefunkční požadavky, které slouží jako vstup pro návrh softwarové architektury a implementaci systému.

=== Funkční požadavky
Funkční požadavky definují konkrétní chování systému, tedy co systém musí umožňovat svým uživatelům nebo jakých výstupů musí být schopen. Požadavky jsou kategorizovány podle oblastí systému a prioritizovány metodou MoSCoW (Must have, Should have, Could have, Won't have). @miranda2022moscow

@tab:fp-portal shrnuje funkční požadavky na veřejnou část systému, tedy kariérní portál určený pro uchazeče. Požadavky se zaměřují na vytvoření jednoho a plně digitálního vstupního bodu pro uchazeče. Cílem je eliminace ostatních komunikačních kanálů, zejména e-mailu, telefonické a papírové komunikace, které v současném stavu vedou k roztříštěnosti dat a zvýšené administrativní zátěži.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (auto, 2.8fr, auto, auto),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#cecece") } else { white },
      stroke: 0.5pt + gray,
      [ID], [Požadavek], [Priorita], [Vazba],

      [F01],
      [Systém zobrazí veřejný seznam aktuálních pracovních nabídek ze všech odštěpných závodů KZ s možností filtrování podle závodu, kategorie pozice, typu úvazku a lokality],
      [Must],
      [R2],

      [F02],
      [Uchazeč se může přihlásit na vybranou pozici prostřednictvím online formuláře s přiložením životopisu a dalších dokumentů],
      [Must],
      [R2],

      [F03],
      [Systém umožní registraci zájemce o zaměstnání v KZ i bez vazby na konkrétní pozici (talent pool)],
      [Must],
      [R2, R3],

      [F04],
      [Kariérní portál prezentuje informace o zaměstnavatelských benefitech, stipendijních programech a pracovním prostředí v KZ],
      [Should],
      [R2],

      [F05],
      [Detail pracovní nabídky obsahuje strukturovaný popis pozice, požadavky na kvalifikaci, nabízené podmínky a kontaktní informace],
      [Must],
      [R2],

      [F06],
      [Systém umožní uchazeči kontaktovat organizaci prostřednictvím kontaktního formuláře],
      [Should],
      [R2],

    )
  ],
  caption: [Funkční požadavky — Kariérní portál],
) <tab:fp-portal>


@tab:fp-admin shrnuje funkční požadavky na interní část systému určenou pro náboráře, personální a mzdové oddělení a vedoucí oddělení. Požadavky pokrývají celý průběh náboru od založení požadavku na obsazení pozice až po výběr kandidáta. 

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (auto, 2.8fr, auto, auto),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#cecece") } else { white },
      stroke: 0.5pt + gray,
      [ID], [Požadavek], [Priorita], [Vazba],

      [F07],
      [Systém umožní založení a správu požadavku na obsazení pozice včetně schvalovacího procesu mezi vedoucím oddělení a HR],
      [Must],
      [R3],

      [F08],
      [Systém bude vést centrální evidenci kandidátů s historií změn stavů napříč celým náborovým procesem],
      [Must],
      [R3],

      [F09],
      [Systém umožní plánování pohovorů, přiřazení odpovědných osob a evidenci výsledků jednotlivých kol],
      [Must],
      [R3],

      [F10],
      [Systém poskytne standardizované komunikační šablony (pozvánka, zamítnutí, žádost o doplnění podkladů) a jejich evidenci],
      [Should],
      [R3],

      [F11], [Systém umožní strukturované hodnocení kandidátů dle předem definovaných kritérií (v práci dále označeno jako inteligentní vrstva)], [Should], [R3, R6],

      [F12],
      [Vedoucí oddělení bude mít online přehled o stavu svých náborových požadavků bez nutnosti ad-hoc e-mailových dotazů],
      [Must],
      [R3, R6],
    )
  ],
  caption: [Funkční požadavky — Interní řízení náboru],
) <tab:fp-admin>

@tab:fp-integrace shrnuje funkční požadavky na integraci systému s interními službami a systémy třetích stran. Součástí je také auditní stopa v souladu s principy řízené správy dat.
#figure(
  [
    #set par(justify: false)
    #table(
      columns: (auto, 2.8fr, auto, auto),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#cecece") } else { white },
      stroke: 0.5pt + gray,
      [ID], [Požadavek], [Priorita], [Vazba],

      [F13],
      [Systém umožní automatizované ověření odborné způsobilosti pracovníků napojením na národní registr zdravotnických pracovníků],
      [Should],
      [R5],

      [F14],
      [Systém upozorní náboráře, pokud uchazeč nemá platný záznam v #abbr("NRZP", none) nebo má omezenou způsobilost],
      [Should],
      [R5],

      [F15],
      [Systém eviduje výsledky ověření kvalifikace včetně časového razítka a zdroje],
      [Must],
      [R3, R5],
    )
  ],
  caption: [funkční požadavky — Integrace a ověřování kvalifikací],
) <tab:fp-integrace>


@tab:fp-adaptace shrnuje funkční požadavky na digitalizaci vstupní agendy a adaptačního procesu. Požadavky reagují na manuální řízení těchto činností zavedením strukturovaných seznamů, evidence plnění a upozornění.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (auto, 2.8fr, auto, auto),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#cecece") } else { white },
      stroke: 0.5pt + gray,
      [ID], [Požadavek], [Priorita], [Vazba],

      [F16], [Systém vytvoří vstupní checklist nástupu podle typu pozice a organizační jednotky], [Must], [R3, R4],

      [F17],
      [Systém umožní evidovat plnění přednástupních povinností (BOZP, vstupní prohlídka, smluvní dokumentace, identifikační karta, přístupová oprávnění)],
      [Must],
      [R3, R4],

      [F18],
      [Systém bude automaticky upozorňovat odpovědné role na blížící se termíny nebo prodlení u vstupní agendy],
      [Should],
      [R4],

      [F19],
      [Vedoucí nebo školitel bude moci založit adaptační plán obsahující úkoly, termíny a hodnoticí milníky],
      [Must],
      [R4],

      [F20],
      [Systém umožní průběžné hodnocení plnění adaptačního plánu a evidenci hodnoticích rozhovorů],
      [Must],
      [R4, R6],

      [F21], [Systém poskytne přehled stavu adaptací podle závodu, oddělení a typu pracovní pozice], [Should], [R4, R6],
    )
  ],
  caption: [Funkční požadavky — Vstupní agenda a adaptace],
) <tab:fp-adaptace>


@tab:fp-reporting shrnuje požadavky na oddělení dat a centrální pohled na nábor.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (auto, 2.8fr, auto, auto),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#cecece") } else { white },
      stroke: 0.5pt + gray,
      [ID], [Požadavek], [Priorita], [Vazba],

      [F22],
      [Systém podporuje multi-tenantní model, kde každý odštěpný závod je samostatným tenantem s vlastními daty, uživateli a konfigurací],
      [Must],
      [R1],

      [F23],
      [Uživatelé s rolí centrálního administrátora mají přístup k datům a reportům napříč všemi tenanty],
      [Must],
      [R1, R6],

      [F24],
      [Systém poskytuje přehled s klíčovými metrikami (počet otevřených pozic, průměrná doba obsazení, poměr přihlášek/přijetí, stav adaptací) na úrovni závodu i celé organizace],
      [Should],
      [R6],

      [F25], [Systém umožní export reportů do formátu PDF a CSV], [Could], [R6],
    )
  ],
  caption: [Funkční požadavky — Reporting a multi-tenantní správa],
) <tab:fp-reporting>



=== Nefunkční požadavky

Nefunkční požadavky definují kvalitativní vlastnosti systému, které nejsou přímo pozorovatelné jako konkrétní funkce, ale podstatně ovlivňují použitelnost, spolehlivost a udržitelnost systému. Požadavky vychazí z veřejných zakázek #abbr("KZ",none).

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (auto, auto, 2.8fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#cecece") } else { white },
      stroke: 0.5pt + gray,
      [ID], [Oblast], [Požadavek],

      [NF01],
      [Bezpečnost],
      [Systém musí zajistit ochranu osobních údajů uchazečů a zaměstnanců v souladu s #abbr("GDPR", none) (nařízení 2016/679) a zákonem č. 110/2019 Sb. o zpracování osobních údajů],

      [NF02],
      [Bezpečnost],
      [Autentizace uživatelů musí být zajištěna prostřednictvím #abbr("OIDC", "OpenID Connect") nad #abbr("OAuth", "Open Authorization") 2.0 s integrací do existujícího #abbr("SSO", "Single Sign-On")],

      [NF03],
      [Bezpečnost],
      [Systém musí podporovat řízení přístupů podle rolí alespoň ve stupních: administrátor, HR pracovník a vedoucí oddělení],

      [NF04], [Dostupnost], [Systém musí dosahovat dostupnosti alespoň 99,5 % v pracovních dnech v čase 6:00–22:00],

      [NF05],
      [Výkon],
      [Odezva běžných operací nesmí v 95. percentilu překročit 2 sekundy.],

      [NF06],
      [Přístupnost],
      [Kariérní portál musí být responzivní a navržený v souladu se zásadami #abbr("WCAG", "Web Content Accessibility Guidelines") 2.1 na úrovni AA],

      [NF07],
      [Nasaditelnost],
      [Systém musí být nasaditelný na infrastruktuře organizace (on-premise) prostřednictvím kontejnerizace (Docker)],

      [NF08],
      [Udržitelnost],
      [Zdrojový kód musí být verzován v systému pro správu verzí (Git) a dokumentován v rozsahu umožňujícím předání jinému vývojovému týmu],

      [NF09],
      [Lokalizace],
      [Celé uživatelské rozhraní musí být v češtině ],

      [NF10],
      [Kompatibilita],
      [Kariérní portál musí být kompatibilní s aktuálními verzemi prohlížečů Chrome, Firefox, Safari a Edge],

      [NF11],
      [Auditovatelnost],
      [Systém musí uchovávat auditní záznamy o změnách klíčových entit (pozice, kandidát, adaptace) minimálně po dobu 5 let],

    )
  ],
  caption: [Nefunkční požadavky na systém],
) <tab:nfp>
