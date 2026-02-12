#import "../template/abbreviations.typ": abbr

== Představení organizace
#abbr("KZ", "Krajská zdravotní, a.s.") je akciová společnost vlastněná Ústeckým krajem, která představuje největšího poskytovatele lůžkové i ambulantní zdravotní péče v Ústeckém kraji. Jednalo se o *Nemocnici Děčín, o.z.*, *Masarykovu nemocnici v Ústí nad Labem, o.z.*, *Nemocnici Teplice, o.z.*, *Nemocnici Most, o.z.* a *Nemocnici Chomutov, o.z.* Společnost byla založena v roce 2007 sloučením pěti nemocnic do jediné právní entity. Hlavním cílem této konsolidace bylo dosažení provozních a ekonomických optimalizací, a to především v oblastech centrálního řízení, společného nákupu léčiv a zdravotnického materiálu a efektivního sdílení odborných personálních i technologických kapacit napříč celým regionem. 

V průběhu roku 2021 došlo k dalšímu strategickému rozšíření portfolia spravovaných zařízení, čímž se počet odštěpných závodů v rámci struktury #abbr("KZ", none) zvýšil na sedm. V dubnu 2021 byla do společnosti integrována *Nemocnice Litoměřice, o.z.*, a následně v červenci téhož roku převzala #abbr("KZ", none) správu nad zdravotnickým zařízením v Šluknovském výběžku, které nyní působí jako *#abbr("KZ", none) - Masarykova nemocnice v Ústí nad Labem, o.z. detašované pracoviště Rumburk*

S celkovým počtem přesahujícím 11 tisíc zaměstnanců představuje #abbr("KZ", none) jednoho z největších poskytovatelů zdravotní péče v České Republice a jednoho z nejvýznamnějších zaměstnavatelů v Ústeckém kraji. Personální struktura je charakteristická vysokým podílem zdravotnických pracovníků (kategorie #abbr("LZ", "Lékaři a farmaceuti") a #abbr("NLZP", "Nelékařští zdravotničtí pracovníci")) s regulovanou odbornou způsobilostí, což klade specifické nároky na náborový a adaptační proces.

=== Organizační struktura z pohledu řízení lidských zdrojů
Organizační struktura #abbr("KZ", none) využívá hybridní model. Jednotlivé nemocnice fungují jako relativně autonomní organizační celky (odštěpné závody) se samostatnými personálními složkami, avšak pod jednotným strategickým vedením centrálního úseku holdingu. Každá nemocnice disponuje vlastním #abbr("HR", "Human Resources") zázemím pro operativní agendu, správu smluv, evidenci docházky a řízení adaptačního procesu. 

Tato struktura holdingu, tvořená odštěpnými závody, přináší z hlediska digitalizace specifickou výzvu. Informační systém musí respektovat provozní potřeby jednotlivých nemocnic, které vystupují jako samostatné organizační jednotky, a zároveň umožnit centrální řízení a reporting na úrovni úseků náměstků holdingu (zejména pro ekonomiku, lidské zdroje a #abbr("IT", "Informační technologie")). V terminologii softwarové architektury se jedná o požadavek na _multi-tenantní_ řešení, kde každý odštěpný závod představuje samostatného _tenanta_ sdílejícího společnou infrastrukturu a metodiku definovanou centrálním vedením.

=== Specifika řízení lidských zdrojů ve zdravotnických organizací 
Řízení lidských zdrojů v prostředí #abbr("KZ", none) vykazuje řadu specifik, která jej odlišují od standardního korporátního modelu. Tato specifika přímo determinují požadavky na návrh a funkcionalitu personálního informačního systému, zejména v oblasti hlídání kvalifikací a zákonných termínů.

*Kategorizace pracovníků.* Zaměstnanci #abbr("KZ", none) spadají do čtyř základních klasifikačních kategorií, z nichž každá má odlišné požadavky na kvalifikaci, dokumentaci a průběh adaptačního procesu:
#figure(
  table(
  columns: (1.5fr, 2fr, 2fr),
  inset: 7pt,
  align: horizon,
  fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
  stroke: 0.5pt + gray,

  [Kategorie (dle KS)], [Typické pozice v #abbr("KZ", none)], [Klíčová specifika pro #abbr("HR", none)],

  [#abbr("LZ", none)], [Atestovaní lékaři, lékaři v přípravě, farmaceuti], [Sledování specializačního vzdělávání (atestace), IPVZ, evidence v ČLK.],

  [#abbr("NLZP", none)], [Všeobecné sestry, dětské sestry, porodní asistentky], [Odborná a specializovaná způsobilost, vzdělávání pod NCONZO.],

  [Ostatní #abbr("NLZP", none) a JOP], [Radiologičtí asistenti, fyzioterapeuti, sanitáři, kliničtí psychologové], [Certifikované kurzy, akreditované stáže, specifické nároky na praxi.],

  [THP a Provoz], [Ekonomové, #abbr("IT", none) specialisté, údržba, stravovací provoz], [Zařazení dle Katalogu prací, standardní zákoník práce.],

  ),
caption:"Klasifikace pozic v KZ")  <tab:zarazeni-zamestnancu>

*Regulovaná odborná způsobilost.* Základním pilířem #abbr("HR", none) procesů v #abbr("KZ", none) je soulad s legislativním rámcem pro výkon zdravotnických povolání. Náborový proces a následná správa zaměstnanců se dělí podle dvou klíčových norem:

- Zákon č. 95/2004 Sb. - upravuje získávání odborné a specializované způsobilosti u lékařů, zubních lékařů a farmaceutů. Systém musí sledovat průběh předatestační přípravy, platnost členství v ČLK/ČSK a zařazení do specializačních oborů.

- Zákon č. 96/2004 Sb. - definuje podmínky pro #abbr("NLZP", none). Zde je kritické sledování odborné způsobilosti a schopnosti vykonávat povolání bez odborného dohledu (v souladu s aktuální metodikou Ministerstva zdravotnictví a #abbr("ÚZIS", "Ústav zdravotnických informací a statistiky ČR")).

Informační systém musí v rámci náborového a adaptačního modulu umožnit validaci dokladů o dosaženém vzdělání (diplomy, specializace) a následně sledovat platnost registrací v profesních komorách (ČLK, ČSK) či odbornou způsobilost pod dohledem.

*Kontinuální nábor.* Na rozdíl od korporátního prostředí, kde je nábor často projektový (obsazení konkrétní pozice), zdravotnické organizace čelí kontinuální potřebě náboru způsobené přirozenou fluktuací personálu, demografickým vývojem (stárnutí lékařské populace) a celorepublikovým nedostatkem zdravotnických pracovníků, zejména v regionech mimo Prahu. @mzd2025TiskovkaNedostatek

Informační systém by tedy měl být připraven tak, aby zajistil bezchybné, rychlé a legislativně bezpečné odbavení uchazečů.

*Vícestupňový adaptační proces.* Adaptace nového zdravotnického pracovníka zahrnuje kromě standardních organizačních záležitostí (přidělení přístupů, školení #abbr("BOZP", "Bezpečnost a ochrana zdraví při práci")) také specifické odborné komponenty, seznámení s nemocničním informačním systémem, hygienickými standardy, postupy při mimořádných událostech a specifiky konkrétního pracoviště. 

== Současný stav procesů náboru pracovníků<kapitola-soucasny-stav>
Před zahájením digitalizace v KZ se správa uchazečů opírá o zažité postupy a běžné kancelářské nástroje, které však s postupným růstem organizace začínají narážet na své limity. V praxi to znamená, že většina agendy stojí a padá na "svaté dvojici" sdílených tabulek v Excelu a intenzivní e-mailové komunikaci. Tato technologická kombinace v praxi způsobuje, že nábor není plynulým procesem, ale spíše sérií izolovaných administrativních úkonů. TODO: Nazvat to něco jako administrativní ping pong mezi všemi

Pro účely analýzy a následné digitalizace těchto procesů bylo provedeno jejich detailní mapování metodou strukturovaných rozhovorů s vedoucím personálního oddělení a s nábořáři pro jednotlivé odštěpné závody. Tito zaměstnanci poskytli jak formální dokumentaci (interní směrnice), tak slovní popis reálného průběhu procesů včetně neformálních postupů a praktických zkušeností.

Pro zajištění terminologické konzistence jsou v této kapitole používány následující pojmy:
- *Uchazeč* o zaměstnání je fyzická osoba, která reaguje na konkrétní zveřejněnou pracovní pozici a doručí zaměstnavateli svou přihlášku (životopis, motivační dopis nebo jinou formu reakce).
- *Kandidát* je uchazeč, který prošel prvotním screeningem a byl vybrán do další fáze výběrového řízení (např. k osobnímu pohovoru nebo odbornému posouzení).
- *Zájemce* o zaměstnání je osoba, která projeví zájem o zaměstnání v KZ bez vazby na konkrétní vyhlášenou pracovní pozici (tzv. talent pool).

=== Proces inzerce volných pozice
Aktuálně inzerce volných pracovních pozic je zajišťována prostřednictvím několika kanálů:

- *Webové portály třetích stran* - Jobs.cz, Práce.cz (provozovatel LMC), portál MPSV
- *Nemocniční nástěnky* - fyzické nástěnky v areálech nemocnic
- *Webové stránky nemocnic* - statické stránky s omezenou aktualizací
- *Sociální sítě* — Linkedin

Absence vlastního kariérního portálu znamená, že uchazeči o zaměstnání nemají jednotný přístupový bod, kde by nalezli aktuální nabídky ze všech sedmi závodů, informace o benefitech, stipendijních programech a pracovním prostředí.

Proces náboru nového zaměstnance začíná identifikací potřeby na úrovni jednotlivých oddělení zdravotnických zařízení. Vedoucí oddělení, identifikuje personální deficit způsobený odchodem zaměstnance do důchodu, dlouhodobou nemocí, přirozenou fluktuací, rodičovskou dovolenou nebo rozšířením kapacity oddělení.

V první fázi vedoucí oddělení vyhodnotí, zda se jedná o standardní pozici (např. všeobecná sestra, sanitář), která spadá do jeho kompetence, nebo o specifickou pozici vyžadující schválení vyššího vedení. 

Po rozhodnutí o zahájení náboru vedoucí oddělení kontaktuje centrální HR oddělení prostřednictvím e-mailu nebo telefonického hovoru. V této komunikaci specifikuje základní parametry pozice jako je název pracovní pozice, požadovaná kvalifikace, rozsah úvazku, předpokládaný nástup a případné specifické požadavky (např. praxe v oboru, znalost konkrétních postupů). Tato komunikace často probíhá neformálně a není standardizována, různí vedoucí poskytují různě detailní informace, což komplikuje následné vytvoření inzerátu.

HR oddělení na základě těchto informací připravuje text inzerátu. Vedoucí oddělení obdrží návrh k připomínkování, což iniciuje další kolo e-mailové komunikace s požadavky na úpravy a doplnění. Tento iterativní proces schvalování může trvat několik dní až týdnů, během nichž pozice zůstává neobsazená a oddělení pracuje s personálním deficitem.

Po schválení textu HR oddělení rozhoduje o výběru inzertních kanálů na základě typu pozice a dostupného rozpočtu. Vedoucí oddělení má nad tímto rozhodnutím minimální kontrolu a často se dozví, kde byla pozice inzerována, až zpětně. Nemá přehled o tom, kolik uchazečů se na pozici přihlásilo, jaká je jejich kvalifikace nebo v jaké fázi se výběrové řízení nachází, pokud o tyto informace aktivně nežádá.

Následuje časově náročná manuální publikace inzerátu na jednotlivých platformách, kdy pracovník HR oddělení musí samostatně přihlásit se do administračního rozhraní portálu Jobs.cz a ručně vyplnit formulář s parametry pozice, poté opakovat totožný proces na portálu Práce.cz s mírně odlišnou strukturou formuláře, následně vložit inzerát na portál MPSV, který využívá odlišný systém kategorizace pracovních pozic, dále aktualizovat statickou webovou stránku nemocnice přes redakční systém, připravit grafickou podobu inzerátu pro fyzické nástěnky v nemocničních areálech a nakonec publikovat nabídku na Linkedin s odpovídajícím formátováním pro sociální síť.

Každá z těchto platforem má vlastní strukturu dat a specifické požadavky na formát textu. Při aktualizaci inzerátu, například při prodloužení lhůty nebo úpravě požadavků, musí pracovník HR projít celým cyklem znovu na všech platformách. Absence centrálního systému pro správu inzerátů znamená, že neexistuje jednotný přehled o tom, kde všude je konkrétní pozice aktuálně inzerována, kdy vyprší platnost inzerátu a jaké jsou náklady na jednotlivé kanály.

Neoptimální proces předávání informací mezi jednotlivými závody a centrálním HR oddělením společně s nízkou flexibilitou náborových procesů vedl k nekontrolovanému vzniku ad-hoc řešení. Několik odštěpných závodů vytvořilo vlastní neoficiální webové portály pro inzerci pracovních pozic, které nebyly centrálně schváleny ani spravovány. Tento rozptýlený proces s minimální transparentností a omezenou kontrolou vedoucího oddělení nad jednotlivými fázemi způsobuje frustaci a prodlužuje dobu obsazení pozice, což má přímý dopad na kvalitu poskytované péče a pracovní zatížení stávajících zaměstnanců oddělení.

 TODO: Možná refaktor a do tabulky přidát field Logika a zredukovat tak text? Ale feeluju, že je poteřba zminit detailně jaký je to pain pro HR a vedoucí

 TODO2: Asi fakt zredukuji ten text
#figure(
  table(
    columns: 2,
    stroke: 0.5pt + black,
    fill: (col, row) => {
      if col == 0 { rgb("#cecece") }  
      else { white }
    },
    align: (left, left),
    
    [Idenitfikátor procesu:], [P01],
    [Název procesu:], [Vytvoření inzerátu pro pracovní pozici],
    [Zákazník:], [Vedoucí daného oddělení v odštěpném závodě],
    [Vlastník procesu:], [Náborář, vedoucí daného oddělení v odštěpném závodě],
    [Účel:], [Vytvoření inzerátu na poptávanou pozici],
    [Produkt:], [Inzerát],
    [Technické prostředky:], [E-mail, webové stránky KZ,webové portály třetích strán, nemocniční nástěnky, socíální sítě],
    [Metrika:], [Rychlost od žádosti po vystavení inzerátu],
    [Nedostatky:], [Manuální publikace inzerátu, již neaktuální inzeráty na portálech, nejednotý přehled o vydaných financích, dlouhé administrativní kolečko mezi vedoucím a náborářem],
  ),
  caption: [Proces P01 - Vystavení inzerátu]
) <tab:proces-p01>

#figure(
  image(
    "../procesy/p01_inzerce.svg",
     width: 100%,
     
  ),
  caption: [Diagram BPMN znázorňující proces od žádosti po vystavení inzerátu]
) <obr:proces-p01>


=== Proces přijmu a výběru potenciálních kandidátu
Fáze příjmu přihlášek je v současnosti poznamenána značnou škálou vstupních kanálů. Uchazeči reagují prostřednictvím pracovních portálů, e-mailů či osobních kontaktů na recepcích, což vyžaduje manuální konsolidaci dat náborářem do nestrukturovaných tabulek (MS Excel). Absence jednotné šablony a systematické konvence pro ukládání příloh v lokálních adresářích vede k nekonzistenci dat mezi jednotlivými pracovišti a komplikuje jejich následnou dohledatelnost.

Prvotní screening uchazečů probíhá formou *manuálního* ověřování formálních kvalifikačních předpokladů. U zdravotnických pozic musí náborář v každém životopise vyhledávat specifické údaje o dosaženém vzdělání a odborné způsobilosti, což při absenci automatizovaných filtrů představuje časově náročnou rutinu. Tento proces je navíc zatížen subjektivním faktorem a rizikem přehlédnutí klíčových informací. Následné předávání užšího výběru vedoucím oddělení probíhá e-mailovou cestou, což často vede k vícečetným komunikačním iteracím a prodlužuje celkovou dobu výběrového řízení.

Kritickým nedostatkem stávajícího stavu je absence systematické databáze uchazečů (talent poolu). Informace o neúspěšných nebo proaktivních kandidátech zůstávají izolovány v e-mailových schránkách a nejsou využívány pro budoucí obsazování pozic. Tento stav nejenže zvyšuje náklady na opakovanou inzerci, ale v kombinaci s absencí standardizované komunikace negativně ovlivňuje budování značky zaměstnavatele (employer branding) a efektivitu strategického řízení lidských zdrojů.

#figure(
  table(
    columns: 2,
    stroke: 0.5pt + black,
    fill: (col, row) => {
      if col == 0 { rgb("#cecece") }  
      else { white }
    },
    align: (left, left),
    [Idenitfikátor procesu:], [P02],
    [Název procesu:], [Příjem přihlášek a výber kandidátů k oslovení],
    [Zákazník:], [Vedoucí daného oddělení v odštěpném závodě],
    [Vlastník procesu:], [Náborář, vedoucí daného oddělení v odštěpném závodě],
    [Účel:], [Výběr kandidátů, jenž splňují požadavky obsazované pozice],
    [Produkt:], [Kandidát pozvaný na pohovor],
    [Technické prostředky:], [E-mail, telefon, tabulkový procesor, Webex],
    [Metrika:], [Rychlost od vystavení inzerátu po oslovení kandidáta],
    [Nedostatky:], [Neexistence centrální databáze uchazečů o pozici, neexistence databáze potencionálních zájemců o zaměstnání v KZ],
  ),
  caption: [Proces P02 - Příjem a výber kandidátů k oslovení]
) <tab:proces-p02>


TODO: Domyslet formátování ať to nejde zbytečně na další stránky
#figure(
  image(
    "../procesy/p02_prijem_prihlasek.svg",
     width: 100%, 
     
  ),
  caption: [Diagram BPMN znázorňující proces od příjmutí přihlášky po pozvánku na pohovor]
) <obr:proces-p02>

=== Proces náboru kandidáta

Proces náboru pracovníka (P03) navazuje na ukončení procesu P02, který končí odesláním pozvánky kandidátovi k osobnímu pohovoru. Samotný pohovor tedy představuje iniciační bod tohoto procesu. Cílem procesu P03 je odborné posouzení kandidáta a splnění všech zákonných a interních podmínek nezbytných pro vznik pracovněprávního vztahu.

Pokud je po úspěšném absolvování pohovoru kandidát vyhodnocen jako vhodný pro obsazení pozice, tak se zahajuje administrativní část procesu vůči personálnímu a mzdovému oddělení. V současném stavu probíhá tento krok formou podání žádosti, ke které kandidát dokládá identifikační a osobní údaje a povinné dokumenty. Mezi tyto dokumenty patří zejména výpis z rejstříku trestů, doklady o dosaženém vzdělání a odborné kvalifikaci a další podklady vyžadované dle charakteru pracovní pozice. Úplnost a správnost těchto dokumentů je nezbytnou podmínkou pro pokračování procesu.

Po předběžné kontrole dokumentace následuje zajištění vstupní lékařské prohlídky a absolvování vstupního školení v oblasti bezpečnosti a ochrany zdraví při práci. Tyto kroky jsou realizovány ještě před samotným vznikem pracovněprávního vztahu a představují nutné podmínky, jejichž splnění je předpokladem pro uzavření pracovní smlouvy.

Teprve po úspěšném absolvování vstupní prohlídky a školení BOZP je připravena pracovní smlouva k podpisu. Podpisem pracovní smlouvy dochází ke vzniku pracovněprávního vztahu a proces náboru pracovníka je formálně ukončen.

#figure(
  table(
    columns: 2,
    stroke: 0.5pt + black,
    fill: (col, row) => {
      if col == 0 { rgb("#cecece") }  
      else { white }
    },
    align: (left, left),

    [Identifikátor procesu:], [P03],
    [Název procesu:], [Pohovor a uzavření pracovního poměru],
    [Zákazník:], [Vedoucí oddělení, PAM],
    [Vlastník procesu:], [Vedoucí oddělení, personální a mzdové oddělení],
    [Účel:], [Odborné posouzení kandidáta a splnění podmínek pro vznik pracovněprávního vztahu],
    [Produkt:], [Podepsaná pracovní smlouva],
    [Technické prostředky:], [Listinné dokumenty, e-mail, telefon],
    [Metrika:], [Doba od pohovoru po podpis pracovní smlouvy],
    [Nedostatky:], [Manuální sběr dokladů, vícestupňová administrativa, papírová komunikace],
  ),
  caption: [Proces P03 - Pohovor a uzavření pracovního poměru]
) <tab:proces-p03>



// #figure(
// image(
// "../procesy/p03_pohovor_preonboarding.svg",
// width: 100%,
// ),
// caption: [Diagram BPMN znázorňující proces od pohovoru po seznámení s právy a povinnostmi]
// ) obr:proces-p03


=== Proces zajištení vstupní agendy
V okamžiku nástupu zaměstnance, tj. dokončení procesu P03, dochází k předání identifikační karty, která plní více rolí. Karta slouží jako identifikátor zaměstnance, současně je využívána pro fyzické vstupy do objektů a pro evidenci docházky. Zatímco samotná karta je vydávána při nástupu, konkrétní přístupová oprávnění (např. do vybraných prostor či systémů) jsou v části případů nastavována dodatečně podle potřeby pracoviště a rolí zaměstnance. Součástí vstupní agendy je dále zajištění prostředků pro elektronické podepisování. Organizace využívá autentizační token, přičemž u lékařů je jeho přidělení standardem, zatímco u ostatních kategorií zaměstnanců je poskytován na vyžádání. Z procesního hlediska jde o významný prvek, protože token přímo ovlivňuje schopnost zaměstnance podepisovat dokumentaci v digitálním prostředí.

Následující část vstupní agendy probíhá na úrovni útvarové orientace. Vedoucí zaměstnanec seznamuje zaměstnance s pracovištěm, s organizačním uspořádáním oddělení, s pracovním a provozním řádem a s řízenou dokumentací vztahující se k vykonávané činnosti. V této části je typicky prováděno také nastavení pracovních návyků a očekávání vůči výkonu práce a zaměstnanec je formálně začleněn do pracovního týmu.

#figure(
  table(
    columns: 2,
    stroke: 0.5pt + black,
    fill: (col, row) => {
      if col == 0 { rgb("#cecece") }  
      else { white }
    },
    align: (left, left),

    [Identifikátor procesu:], [P04],
    [Název procesu:], [Nástup zaměstnance a zajištění přístupových prostředků],
    [Zákazník:], [Nový zaměstnanec],
    [Vlastník procesu:], [PAM, IT, vedoucí oddělení],
    [Účel:], [Zajištění připravenosti zaměstnance k výkonu práce],
    [Produkt:], [Zaměstnanec vybaven ID kartou, přístupy a případně tokenem],
    [Technické prostředky:], [ID karta, docházkový systém, autentizační token, interní IT systémy],
    [Metrika:], [Doba od podpisu smlouvy po plnou funkčnost zaměstnance],
    [Nedostatky:], [Oddělené nastavování oprávnění, ruční aktivace přístupů, absence jednotného postupu],
  ),
  caption: [Proces P04 - Nástup zaměstnance]
) <tab:proces-p04>


=== Proces adaptace nových zaměstnanců
Adaptační proces představuje systematické začlenění zaměstnance do pracovního a sociálního prostředí organizace a tvoří most mezi formálním nástupem a plnohodnotným výkonem práce. V prostředí #abbr("KZ", none) je adaptace klíčová zejména u zdravotnických pozic, kde je třeba v krátkém čase zajistit nejen organizační orientaci, ale také odborné zapracování v kontextu konkrétního pracoviště, jeho standardů a interních postupů.

Obecná část adaptace probíhá v období zkušební doby a vztahuje se na všechny zaměstnance. Vedoucí zaměstnanec organizuje adaptaci, určuje školitele a zajišťuje vytvoření adaptačního plánu. Školitel následně provádí odborné vedení a mentorování zaměstnance, poskytuje průběžnou zpětnou vazbu a podílí se na hodnocení plnění adaptačního programu. Průběžná kontrola plnění adaptačního plánu a pravidelné hodnotící rozhovory umožňují včas identifikovat nedostatky, potřeby doškolení nebo nevhodné nastavení pracovního zařazení. Po ukončení adaptačního období je provedeno závěrečné vyhodnocení, jehož výstup je předán personálnímu oddělení k archivaci v osobním spisu zaměstnance.

Odborně specifická část adaptace se týká zdravotnických pracovníků a reflektuje požadavky na výkon regulovaných povolání. U lékařů, zubních lékařů a farmaceutů má adaptační proces odborný charakter a může být navázán na systém vzdělávání (poskytuje společnost Vema). Školitel v této části plní roli konzultanta, který vede účastníka adaptace, průběžně hodnotí jeho dovednosti a podílí se na závěrečném pohovoru. U NLZP je adaptace zaměřena na ověření praktických dovedností, osvojení standardů pracoviště a postupné dosahování samostatnosti v rámci vykonávané profese. Délka odborné adaptace se liší podle typu pracoviště a předchozí praxe zaměstnance a může být individuálně upravena podle průběžných výsledků.

V současném stavu je adaptační proces ve značné míře realizován prostřednictvím papírových plánů a záznamů. To omezuje možnost průběžného monitoringu, vytváření auditní stopy a centrálního reportingu o stavu adaptací napříč jednotlivými odštěpnými závody.

#figure(
  table(
    columns: 2,
    stroke: 0.5pt + black,
    fill: (col, row) => {
      if col == 0 { rgb("#cecece") }  
      else { white }
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
  caption: [Proces P05 - Adaptace zaměstnance]
) <tab:proces-p05>


== Identifikace problémů a úzkých míst<kapitola-identifikcea-problemu>
Na základě analýzy současného stavu procesů náboru a adaptace v KZ, konzultací s HR pracovníky jednotlivých nemocnic a pozorování reálného průběhu procesů byly identifikovány následující klíčové problémy. Problémy jsou kategorizovány podle oblastí dopadu a doplněny o kvalitativní hodnocení závažnosti.

#figure(
  table(
    columns: (auto, 1.5fr, auto, 2fr),
    inset: 7pt,
    align: horizon,
    fill: (x, y) => if y == 0 { rgb("#cecece") } else { white },
    stroke: 0.5pt + gray,
    [ID], [Problém], [Závažnost], [Hlavní dopad],
    [P1], [Tabulková a papírová agenda], [Vysoká], [Riziko ztráty dat, neefektivní práce],
    [P2], [Chybějící evidence uchazečů], [Vysoká], [Ztráta kandidátů, nemožnost analytiky],
    [P3], [Neexistující evidence zájemců], [Střední], [Ztráta potenciálních kandidátů],
    [P4], [Absence auditní stopy], [Vysoká], [Právní rizika, GDPR, neschopnost auditu],
    [P5], [Omezený reporting], [Střední], [Rozhodování bez datové opory],
    [P6], [Komunikační smyčka], [Vysoká], [Prodloužení doby obsazení pozice],
    [P7], [Manuální publikace], [Střední], [Časová náročnost, nekonzistence],
    [P8], [Nestrukturované hodnocení], [Střední], [Subjektivní výběr],
    [P9], [Nepřehledný stav vstupní agendy], [Vysoká], [Problémy při nástupu zaměstnance],
    [P10], [Papírová adaptace], [Vysoká], [Nemožnost monitoringu a reportingu],
  ),
  caption: [Kvalitativní hodnocení závažnosti identifikovaných problémů]
) <tab:zavaznost-problemu>


TODO: Tohle sem pak nějak zařadit Koza možná dodá i excel k tomu
Další nároky na náborový a adaptační proces klade vysoká personální dynamika s průměrem 110 nástupů měsíčně (v sezónních špičkách až 180), zahrnující typicky 10 LZ, 50 NLZP a 50 THP/D pracovníků. Související masivní administrativa spojená se sběrem osobních dotazníků, kontrolou odborných kvalifikací a organizací povinných školení je aktuálně distribuována mezi odštěpné závody formou Excelových reportů a následně centrálně evidována v systému Vema.

TODO strukturovat možná do dvou kapitol potom? (Problémy v oblasti evidence a problemy v oblasti procesů?)
P1: Neefektivní papírová a tabulková agenda.
P2: Chybějící centrální evidence uchazečů.
P3: Neexistující evidence zájemců (ti co nenašli pozici, ale chtěli by)
P4: Absence auditní stopy
P5: Omezená možnost reportingu a analytiky.
== Požadavky na digitalizaci procesů
Na základě provedené analýzy procesů a identifikovaných problémů (@kapitola-identifikcea-problemu) lze formulovat klíčové požadavky na digitalizaci procesů náboru a adaptace. Každý požadavek je odůvodněn vazbou na identifikované problémy.


Asi tabulka ve formátu požadavek, krátky popis, Cíl, souvislost s problémem ID
TBA:
R1: Multi-tenantní architektura
R2: Veřejný kariérní portál
R3: Interní administrační rozhraní 
R4:Adaptační portál 

#figure(
  table(
    columns: (1fr, 2fr, 3fr, 3fr, 1fr),
    inset: 7pt,
    align: horizon,
    fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
    stroke: 0.5pt + gray,
    [ID], [Požadavek], [Stručný popis], [Cíl], [Řeší],

    [R1], [Multi-tenantní architektura], [Systém musí respektovat organizační strukturu KZ — odštěpné závody jako samostatní tenanti se sdílenou infrastrukturou a centrálním řízením], [Umožnit lokální operativu i centrální reporting], [P1, P2, P5],

    [R2], [Veřejný kariérní portál], [Jednotný webový portál prezentující aktuální pracovní nabídky ze všech závodů KZ s možností online přihlášení a registrace zájemců], [Jednotný přístupový bod pro uchazeče, zlepšení employer brandingu], [P2, P3, P6, P7],

    [R3], [Interní administrační rozhraní], [Webová aplikace pro správu inzerátů, evidenci uchazečů, řízení výběrového procesu, ověření kvalifikací a přípravu vstupní agendy], [Nahrazení tabulkové a e-mailové agendy centrálním systémem], [P1, P2, P4, P5, P6, P7, P8, P9],

    [R4], [Adaptační portál], [Modul pro digitální správu adaptačních plánů s průběžným monitoringem, automatickými upomínkami a centrálním reportingem], [Nahrazení papírových adaptačních formulářů, umožnění průběžného monitoringu], [P1, P4, P5, P10],

    [R5], [Integrace s NRZP], [Automatizované ověření odborné způsobilosti zdravotnických pracovníků prostřednictvím napojení na Národní registr zdravotnických pracovníků], [Eliminace manuálního ověřování kvalifikací, snížení rizika chyby], [P1, P4],

    [R6], [Reporting a analytika], [Modul pro generování reportů a dashboardů o klíčových metrikách náborového procesu na úrovni závodů i celé organizace], [Datově podložené rozhodování managementu], [P5],
  ),
  caption: [Požadavky na digitalizaci a jejich vazba na identifikované problémy]
) <tab:pozadavky-digitalizace>

== Specifikace funkcionálních a nefunkcionálních požadavků
Na základě formulovaných požadavků na digitalizaci (R1 až Rx) je v této sekci provedena jejich dekompozice na konkrétní funkcionální a nefunkcionální požadavky, které slouží jako vstup pro návrh softwarové architektury a implementaci systému.

=== Funkcionální požadavky
Funkcionální požadavky definují konkrétní chování systému, tedy co systém musí umožňovat svým uživatelům nebo jakých výstupů musí být schopen. Požadavky jsou kategorizovány podle oblastí systému a prioritizovány metodou MoSCoW (Must have, Should have, Could have, Won't have).

#figure(
  table(
    columns: (auto, 2.5fr, auto, auto),
    inset: 7pt,
    align: left,
    fill: (x, y) => if y == 0 { rgb("#cecece") } else { white },
    stroke: 0.5pt + gray,
    [ID], [Požadavek], [Priorita], [Vazba],

    [F01], [Systém zobrazí veřejný seznam aktuálních pracovních nabídek ze všech odštěpných závodů KZ s možností filtrování podle závodu, kategorie pozice, typu úvazku a lokality], [Must], [R2],

    [F02], [Uchazeč se může přihlásit na vybranou pozici prostřednictvím online formuláře s přiložením životopisu a dalších dokumentů], [Must], [R2],

    [F03], [Systém umožní registraci zájemce o zaměstnání v KZ i bez vazby na konkrétní pozici (talent pool)], [Must], [R2, R3],

    [F04], [Kariérní portál prezentuje informace o zaměstnavatelských benefitech, stipendijních programech a pracovním prostředí v KZ], [Should], [R2],

    [F05], [Detail pracovní nabídky obsahuje strukturovaný popis pozice, požadavky na kvalifikaci, nabízené podmínky a kontaktní informace], [Must], [R2],
  ),
  caption: [Funkcionální požadavky — Kariérní portál]
) <tab:fp-portal>


#figure(
  table(
    columns: (auto, 2.5fr, auto, auto),
    inset: 7pt,
    align: horizon,
    fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
    stroke: 0.5pt + gray,
    [ID], [Požadavek], [Priorita], [Vazba],

    [TODO: máš to v poznámkách pod blaščáková]
  ),
  caption: [Funkcionální požadavky — Vstupní agenda a adaptace]
) <tab:fp-adaptace>



#figure(
  table(
    columns: (auto, 2.5fr, auto, auto),
    inset: 7pt,
    align: horizon,
    fill: (x, y) => if y == 0 { rgb("#cecece") } else { white },
    stroke: 0.5pt + gray,
    [ID], [Požadavek], [Priorita], [Vazba],

    [F20], [Systém umožní automatizované ověření odborné způsobilosti zdravotnických pracovníků prostřednictvím API napojení na NRZP], [Should], [R5],

    [F21], [Systém upozorní náboráře v případě, že uchazeč nemá platný záznam v NRZP nebo jeho způsobilost je omezena], [Should], [R5],

    [F22], [Systém eviduje výsledky ověření kvalifikací jako součást auditní stopy s časovým razítkem a identifikací zdroje ověření], [Must], [R3, R5],
  ),
  caption: [Funkcionální požadavky — Integrace a ověřování kvalifikací]
) <tab:fp-integrace>


#figure(
  table(
    columns: (auto, 2.5fr, auto, auto),
    inset: 7pt,
    align: horizon,
    fill: (x, y) => if y == 0 { rgb("#cecece") } else { white },
    stroke: 0.5pt + gray,
    [ID], [Požadavek], [Priorita], [Vazba],

    [F23], [Systém podporuje multi-tenantní model, kde každý odštěpný závod je samostatným tenantem s vlastními daty, uživateli a konfigurací], [Must], [R1],

    [F24], [Uživatelé s rolí centrálního administrátora mají přístup k datům a reportům napříč všemi tenanty], [Must], [R1, R6],

    [F25], [Systém poskytuje dashboardy s klíčovými metrikami (počet otevřených pozic, průměrná doba obsazení, poměr přihlášek/přijetí, stav adaptací) na úrovni závodu i celé organizace], [Should], [R6],

    [F26], [Systém umožní export reportů do formátu PDF a CSV], [Could], [R6],
  ),
  caption: [Funkcionální požadavky — Reporting a multi-tenantní správa]
) <tab:fp-reporting>



=== Nefunkcionální požadavky

Nefunkcionální požadavky definují kvalitativní vlastnosti systému, které nejsou přímo pozorovatelné jako konkrétní funkce, ale podstatně ovlivňují použitelnost, spolehlivost a udržitelnost systému.

#figure(
  table(
    columns: (auto, auto, 2.5fr),
    inset: 7pt,
    align: horizon,
    fill: (x, y) => if y == 0 { rgb("#cecece") } else { white },
    stroke: 0.5pt + gray,
    [ID], [Oblast], [Požadavek],

    [NF01], [Bezpečnost], [Systém musí zajistit ochranu osobních údajů uchazečů a zaměstnanců v souladu s GDPR (nařízení 2016/679) a zákonem č. 110/2019 Sb. o zpracování osobních údajů],

    [NF02], [Bezpečnost], [Autentizace uživatelů musí být zajištěna prostřednictvím protokolu OAuth 2.0 s integrací do existujícího SSO poskytovatele organizace],

    [NF03], [Bezpečnost], [Systém musí implementovat přístup řízený rolemi (RBAC) s minimálně třemi úrovněmi — centrální administrátor, HR pracovník závodu, vedoucí oddělení],

    [NF04], [Dostupnost], [Systém musí být dostupný minimálně DODEFINUJ VOLE času v pracovních dnech (DODEFINUJ VOLE)],

    [NF05], [Výkon], [Odezva uživatelského rozhraní nesmí překročit 2 sekundy pro standardní operace (zobrazení seznamu, detail záznamu) při běžné zátěži],

    [NF06], [Přístupnost], [Kariérní portál musí být responzivní a přístupný na mobilních zařízeních],

    [NF07], [Nasaditelnost], [Systém musí být nasaditelný na infrastruktuře organizace (on-premise) prostřednictvím kontejnerizace (Docker)],

    [NF08], [Udržitelnost], [Zdrojový kód musí být verzován v systému pro správu verzí (Git) a dokumentován v rozsahu umožňujícím předání jinému vývojovému týmu],

    [NF09], [Lokalizace], [Veškerá uživatelská rozhraní musí být v českém jazyce; systém musí správně pracovat s českou diakritikou ve všech vrstvách (databáze, API, UI)],

    [NF10], [Kompatibilita], [Kariérní portál musí být kompatibilní s aktuálními verzemi prohlížečů Chrome, Firefox, Safari a Edge],
  ),
  caption: [Nefunkcionální požadavky na systém]
) <tab:nfp>
