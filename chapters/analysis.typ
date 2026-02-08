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

#table(
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
)

*Regulovaná odborná způsobilost.* Základním pilířem #abbr("HR", none) procesů v #abbr("KZ", none) je soulad s legislativním rámcem pro výkon zdravotnických povolání. Náborový proces a následná správa zaměstnanců se dělí podle dvou klíčových norem:

- Zákon č. 95/2004 Sb. - upravuje získávání odborné a specializované způsobilosti u lékařů, zubních lékařů a farmaceutů. Systém musí sledovat průběh předatestační přípravy, platnost členství v ČLK/ČSK a zařazení do specializačních oborů.

- Zákon č. 96/2004 Sb. - definuje podmínky pro #abbr("NLZP", none). Zde je kritické sledování odborné způsobilosti a schopnosti vykonávat povolání bez odborného dohledu (v souladu s aktuální metodikou Ministerstva zdravotnictví a #abbr("ÚZIS", "Ústav zdravotnických informací a statistiky ČR")).

Informační systém musí v rámci náborového a adaptačního modulu umožnit validaci dokladů o dosaženém vzdělání (diplomy, specializace) a následně sledovat platnost registrací v profesních komorách (ČLK, ČSK) či odbornou způsobilost pod dohledem.

*Kontinuální nábor.* Na rozdíl od korporátního prostředí, kde je nábor často projektový (obsazení konkrétní pozice), zdravotnické organizace čelí kontinuální potřebě náboru způsobené přirozenou fluktuací personálu, demografickým vývojem (stárnutí lékařské populace) a celorepublikovým nedostatkem zdravotnických pracovníků, zejména v regionech mimo Prahu. @mzd2025TiskovkaNedostatek

Informační systém by tedy měl být připraven tak, aby zajistil bezchybné, rychlé a legislativně bezpečné odbavení uchazečů.

*Vícestupňový adaptační proces.* Adaptace nového zdravotnického pracovníka zahrnuje kromě standardních organizačních záležitostí (přidělení přístupů, školení #abbr("BOZP", "Bezpečnost a ochrana zdraví při práci")) také specifické odborné komponenty, seznámení s nemocničním informačním systémem, hygienickými standardy, postupy při mimořádných událostech a specifiky konkrétního pracoviště. 

== Současný stav procesů náboru pracovníků
Před zahájením digitalizace v KZ se správa uchazečů opírá o zažité postupy a běžné kancelářské nástroje, které však s postupným růstem organizace začínají narážet na své limity. V praxi to znamená, že většina agendy stojí a padá na "svaté dvojici" sdílených tabulek v Excelu a intenzivní e-mailové komunikaci. Tato technologická kombinace v praxi způsobuje, že nábor není plynulým procesem, ale spíše sérií izolovaných administrativních úkonů. TODO: Nazvat to něco jako administrativní ping pong mezi všemi

=== Inzerce volných pozic

=== Příjem a evidence přihlášek

=== Proces náboru pracovníka — model procesu

=== Proces adaptace a onboardingu nových zaměstnanců
== Identifikace problémů a úzkých míst
== Požadavky na digitalizaci procesů
== Specifikace funkcionálních a nefunkcionálních požadavků