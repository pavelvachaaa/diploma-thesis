#import "../template/abbreviations.typ": abbr

== Představení organizace
#abbr("KZ", "Krajská zdravotní, a.s.") je akciová společnost vlastněná Ústeckým krajem, která představuje největšího poskytovatele lůžkové i ambulantní zdravotní péče v Ústeckém kraji. Jednalo se o *Nemocnici Děčín, o.z.*, *Masarykovu nemocnici v Ústí nad Labem, o.z.*, *Nemocnici Teplice, o.z.*, *Nemocnici Most, o.z.* a *Nemocnici Chomutov, o.z.* Společnost byla založena v roce 2007 sloučením pěti nemocnic do jediné právní entity. Hlavním cílem této konsolidace bylo dosažení provozních a ekonomických optimalizací, a to především v oblastech centrálního řízení, společného nákupu léčiv a zdravotnického materiálu a efektivního sdílení odborných personálních i technologických kapacit napříč celým regionem. V průběhu roku 2021 došlo k dalšímu strategickému rozšíření portfolia spravovaných zařízení, čímž se počet odštěpných závodů v rámci struktury #abbr("KZ", none) zvýšil na sedm. V dubnu 2021 byla do společnosti integrována *Nemocnice Litoměřice, o.z.*, a následně v červenci téhož roku převzala #abbr("KZ", none) správu nad zdravotnickým zařízením v Šluknovském výběžku, které nyní působí jako *#abbr("KZ", none) - Masarykova nemocnice v Ústí nad Labem, o.z. detašované pracoviště Rumburk*

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

=== Inzerce volných pozice
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
#figure(
  table(
    columns: 2,
    stroke: 0.5pt + black,
    fill: (col, row) => {
      if col == 0 { rgb("#e8e8e8") }  
      else { white }
    },
    align: (left, left),
    
    [Idenitfikátor procesu:], [P01],
    [Název procesu:], [Vytvoření inzerátu pro pracovní pozici],
    [Zákazník:], [Vedoucí daného oddělení v odštěpném závodě],
    [Vlastník procesu:], [Náborář, vedoucí oddělení],
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



=== Příjem a evidence přihlášek

=== Proces náboru pracovníka — model procesu

=== Proces adaptace a onboardingu nových zaměstnanců
== Identifikace problémů a úzkých míst<kapitola-identifikcea-problemu>
Na základě analýzy současného stavu procesů náboru a adaptace v KZ, konzultací s HR pracovníky jednotlivých nemocnic a pozorování reálného průběhu procesů byly identifikovány následující klíčové problémy. Problémy jsou kategorizovány podle oblastí dopadu a doplněny o kvalitativní hodnocení závažnosti.

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
== Specifikace funkcionálních a nefunkcionálních požadavků