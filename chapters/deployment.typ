#import "../template/abbreviations.typ": abbr

Navržený systém má skutečnou hodnotu pouze tehdy, pokud je dlouhodobě provozně udržitelný v reálném prostředí, ve kterém bude nasazen. Klíčovou roli přitom hraje schopnost systém nejen jednorázově nasadit, ale opakovaně a spolehlivě reprodukovat jeho nasazení v různých prostředích. Stejně důležité je zavedení řízení změn, které umožňuje bezpečně provádět úpravy bez narušení stability provozu.

Neméně podstatná je schopnost systému včas signalizovat provozní odchylky, tedy situace, kdy se jeho chování odchyluje od očekávaného stavu. V praxi se může jednat například o prodlouženou dobu odezvy, zvýšenou chybovost, nedostupnost služby, neobvyklé zatížení infrastruktury nebo narušení komunikace mezi jednotlivými komponentami. Včasná identifikace těchto stavů je předpokladem pro jejich rychlou diagnostiku a minimalizaci dopadů na uživatele i navazující procesy.

Cílem této kapitoly je proto shrnout způsob, jakým bylo navržené řešení připraveno pro nasazení do cílového prostředí. Pozornost je věnována zejména kontejnerizaci jednotlivých částí systému, distribuci verzovaných obrazů, správě konfigurace, oddělení provozních zón a mechanismům umožňujícím dohled nad během systému.

== Kontejnerizační model a síťová segmentace
Jednotlivé části systému distribuuji jako samostatné obrazy a jsou provozovány pomocí `Docker Compose`. Tento přístup odpovídá pilotnímu a on-premise charakteru řešení. Umožňuje zachovat oddělené běhové jednotky bez toho, aby bylo nutné zavést rozsáhlejší orchestraci už v první fázi projektu.

Provozní přínos kontejnerizace spočívá v tom, že stejný obraz může projít testem i cílovým nasazením bez dodatečného přestavování hostitelského prostředí. Tím se snižuje riziko rozdílů mezi prostředími a zjednodušuje se návrat ke starší verzi. Omezením naopak zůstává správa většího počtu obrazů, jejich průběžné bezpečnostní aktualizace a absence některých schopností, které poskytují robustnější orchestrátory.

Přehled  služeb v @tab:deployment-services zachycuje provozní členění nasazení podle jejich role, stavového charakteru a míry expozice vůči okolnímu prostředí. Tabulka slouží jako orientační pohled na to, které komponenty tvoří cílové nasazení a jakou provozní odpovědnost v něm zastávají.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (2.3fr, 2.2fr, 1.35fr, 1.2fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,

      [Název služby], [Role], [Stav], [Expozice],

      [`kariera.kzcr.eu`], [Kariérní portál pro publikaci inzerátů a podání přihlášek], [Bezstavová], [Veřejná],

      [`onboarding.kzcr.eu`], [Portál vstupní agendy pro HR a zaměstnance], [Bezstavová], [Veřejná],

      [`hr-backend`], [Transakční API a integrační logika], [Bezstavová], [Interní],

      [`migration`], [Migrace databázového schématu], [Bezstavová], [Bez expozice],

      [`qualification-adapter`], [Vyhledání kvalifikací z NRZP], [Bezstavová], [Interní],

      [`user-search-adapter`], [Vyhledání interních uživatelů], [Bezstavová], [Interní],

      [`audit_writer_ processor`], [Zápis auditních událostí], [Bezstavová], [Interní],

      [`cv_processor`], [Inteligentní zpracování životopisů], [Bezstavová], [Interní],

      [`job_processor`], [Generování popisků pozic], [Bezstavová], [Interní],

      [`PostgreSQL (pgvector)`], [Transakční a auditní data], [Stavová], [Interní],

      [`SeaweedFS`], [Úložiště dokumentů], [Stavová], [Interní],

      [`RabbitMQ`], [Fronta zpráv pro asynchronní zpracování], [Stavová], [Interní],

      [`Umami`], [Webová analytika], [Stavová (PostgreSQL)], [Interní],
    )
  ],
  caption: [Hlavní služby v nasazení],
) <tab:deployment-services>

Z hlediska provozního návrhu je významné zejména rozlišení mezi veřejně dostupnými službami, interními aplikačními komponentami a stavovými infrastrukturními službami. Veřejně dostupná část systému plní roli vstupního bodu pro externí uživatele, zatímco interní služby zajišťují zpracování aplikační logiky, integraci s okolními systémy a práci s daty. Stavové služby, jako jsou databáze, objektové úložiště nebo fronta zpráv, představují kritickou infrastrukturu, která nemá být přímo vystavena mimo vymezený provozní prostor.

Síťová segmentace proto vychází z principu omezení přímé dosažitelnosti komponent pouze na nezbytné komunikační vztahy. V praxi to znamená, že veřejná vrstva komunikuje s interní aplikační vrstvou, zatímco přístup ke stavovým službám je omezen na komponenty, které je ke své činnosti skutečně potřebují. Tento přístup podporuje princip nejmenších oprávnění a obranu v hloubce, tedy návrh, ve kterém bezpečnost systému není založena na jediném ochranném mechanismu, ale na kombinaci více vzájemně se doplňujících vrstev. Pokud by došlo k narušení jedné části systému, ostatní vrstvy stále omezují rozsah možného dopadu.

V kontextu této práce je síťová segmentace chápána především jako logický model oddělení provozních zón. Její konkrétní prosazení na úrovni firewallových pravidel, reverzní proxy, VLAN, směrování nebo dalších prvků síťové infrastruktury přesahuje rozsah aplikačního návrhu a spadá do kompetence oddělení odpovědného za provoz infrastruktury organizace #abbr("KZ", none). Podstatné však je, že navržený model nasazení s tímto oddělením počítá a nevystavuje všechny komponenty systému stejnému bezpečnostnímu perimetru.

== Vydání a nasazení
Nasazení celého ekosystému služeb stavím na jednotném toku vydání založeném na obrazech. Nová verze vzniká v návaznosti na vydaný tag, prochází sestavením a ověřením a teprve poté je publikována do interního registru. Na cílový host se tak nepřenáší zdrojový kód k novému sestavení, ale již vytvořený obraz určený k provozu.

Z hlediska řízení změn je tento postup podstatný tím, že omezuje rozdíly mezi prostředím sestavení a prostředím nasazení. V organizaci s konzervativnějším změnovým režimem je výhodnější pracovat s již ověřeným obrazem než s variantou vzniklou až na cílovém serveru. Stejný princip zároveň zlepšuje dohledatelnost toho, která verze byla kdy nasazena, a usnadňuje návrat k dříve ověřenému stavu.

Praktickou realizaci tohoto toku zajišťuje automatizace v `Gitea Actions`, která po vydání nové verze provede sestavení obrazu, jeho publikaci do registru a podle typu služby také předání minimálního nasazovacího balíčku na cílový host. Pro text práce je však podstatnější samotný princip reprodukovatelného vydání než konkrétní syntaxe použité pipeline.

Obrázek @obr:deployment-flow schematicky zachycuje tento tok vydání od vzniku nové verze přes její ověření a uložení do registru až po distribuci na cílový host.

#figure(
  image(
    "../procesy/deployment/deployment-flow.svg",
    width: 100%,
  ),
  caption: [Obecný tok vydání založený na obrazech s distribucí do registru a nasazením na cílový host],
) <obr:deployment-flow>

U různých částí řešení se tento obecný princip uplatňuje s odlišnou mírou provozní vazby. Backend je svázán s migracemi schématu a s konzistencí sdílených dat. V provozním modelu proto běží kontejner `migration` jako povinná závislost před startem služby `hr-backend` a při neúspěšném dokončení migrace se backend nespustí. Jiné služby se liší spíše typem konfigurace nebo hardwarovými požadavky. Společným jmenovatelem však zůstává, že nasazení vychází z již vytvořeného obrazu, *nikoli z ručních zásahů* na cílovém serveru.

Významnou provozní vlastností je i možnost návratu ke starší verzi výběrem dříve publikovaného obrazu. Omezením zůstává závislost na interním registru a na disciplíně při verzování a uchování vydaných obrazů.

== Správa konfigurace a bezpečnost provozu

Konfigurace systému je v navrženém řešení pojata jednotně jako vrstva oddělená od aplikačního kódu a od samotného obrazu. Základním principem je rozlišení mezi nasazovaným obrazem, běžnou provozní konfigurací a citlivými údaji. Tento přístup umožňuje použít shodný obraz ve více prostředích a jeho konkrétní chování přizpůsobit až při nasazení, aniž by bylo nutné zasahovat do zdrojového kódu nebo vytvářet odlišné varianty aplikace pro každé prostředí zvlášť.

V praktické rovině se tento princip projevuje prostřednictvím konfiguračních souborů a proměnných prostředí předávaných mimo verzovaný repozitář. U části řešení jsou vybrané netajné proměnné vloženy už ve fázi sestavení, kdy je automatizace v `Gitea Actions` předá procesu tvorby obrazu a jejich hodnoty se promítnou do výsledného obrazu. Typicky jde o parametry, které musí být známy již při sestavení klientské aplikace. Naproti tomu provozní a citlivé údaje nejsou do obrazu zapisovány, ale jsou připojeny až při nasazení, a to buď prostřednictvím hostitelské konfigurace, nebo pomocí minimálního nasazovacího balíčku obsahujícího soubor `compose.yaml` a odpovídající konfigurační proměnné pro konkrétní verzi.

U služeb typu `hiring_backend`, `cv_processor` i portálu vstupní agendy tak zůstávají citlivé hodnoty, jako jsou přístupové údaje k databázi, integrační klíče nebo certifikáty, odděleny od obrazu aplikace. Přínosem tohoto modelu je omezení rizika nechtěného zveřejnění citlivých údajů při distribuci systému. Nevýhodou naopak zůstává závislost na disciplinovaném provozním postupu a na správném předání konfigurace do cílového prostředí.

Z hlediska dalšího rozvoje by bylo vhodné tento princip posílit zavedením centralizované samostatně provozované správy citlivých údajů, která by odpovídala požadavkům on-premise prostředí #abbr("KZ", none). Takové řešení by omezilo závislost na lokálních souborech a dílčích předávacích mechanismech, zlepšilo dohledatelnost přístupů k tajným hodnotám a podpořilo jednotnější správu konfigurace v rámci celého ekosystému služeb.


== Dohledová vrstva
Dohledová vrstva slouží k průběžnému sledování stavu nasazeného systému. V on-premise prostředí nelze spoléhat na dohled poskytovaný cloudovou platformou, a proto musí být součástí řešení vlastní mechanismy pro sběr, ukládání a vyhodnocování provozních dat. Ta pomáhají včas rozpoznat výpadek služby, zhoršení odezvy, chybnou konfiguraci nebo zaseknuté asynchronní zpracování.

Použité nástroje shrnuje @tab:deployment-observability. Pro tuto práci je však důležitější jejich společná funkce než jednotlivé produktové detaily. Centralizace logů, metrik a upozornění zkracuje dobu mezi vznikem incidentu a jeho pochopením, což je zvlášť důležité tam, kde se provozní problém může projevit až zprostředkovaně v personálním procesu.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.2fr, 2fr, 1.8fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Komponenta], [Primární funkce], [Provozní přínos],
      [`Promtail`],
      [Sběr a předzpracování logů z kontejnerů],
      [Centralizovaná diagnostika bez zásahu do business logiky],

      [`Loki`], [Uložení a dotazování log streamů], [Rychlá analýza incidentů podle času a štítků],
      [`Prometheus`], [Sběr metrik a trendové vyhodnocení], [Podpora řízení dostupnosti a výkonu],
      [`Grafana`], [Vizualizace a upozornění], [Jednotné operátorské rozhraní pro logy i metriky],
    )
  ],
  caption: [Role komponent dohledové vrstvy],
) <tab:deployment-observability>

Dohledová vrstva v této pilotní fázi projektu pokrývá především upozornění nad metrikami, které mají přímý vztah k dostupnosti systému a k průchodnosti hlavních procesů. Sleduje se zejména dostupnost endpointu `hr-backend/ready` a kontrolních endpointů dalších interních služeb z @tab:deployment-services, HTTP metriky veřejných i interních rozhraní, především odezva a podíl odpovědí s kódy `5xx`, stáří nejstarší čekající a právě zpracovávané položky v outboxu, počet položek přecházejících do chybového stavu, připravenost konzumentů fronty zpráv a základní kapacitní ukazatele stavových služeb, zejména databáze a objektového úložiště. Do stejné skupiny patří i upozornění na degradaci nebo zpomalování služeb a na neobvyklý nárůst interních chyb, pokud se opakovaně váží ke konkrétní integrační vazbě nebo provozní komponentě.

Z provozního hlediska je tento výběr důležitý tím, že nezachycuje pouze úplný výpadek služby, ale i stav postupné degradace. Ta se v personálním procesu často projeví nepřímo, například opožděným rozesíláním notifikací, zastavením asynchronního zpracování, selháním integrační vazby nebo prodlužováním odezvy při práci s dokumenty. Rozsah dohledové vrstvy je proto pro pilotní nasazení zvolen tak, aby pokrýval jak technickou dostupnost jednotlivých komponent, tak i provozní kontinuitu klíčových procesů, na nichž je navržené řešení závislé.

== Provozní omezení a mitigace
Navržený model nasazení není univerzálně nejlepší variantou, ale pragmatickým kompromisem mezi provozní jednoduchostí, reprodukovatelností a oddělením složitějších částí systému. Oproti jediné nasazovací jednotce přináší více obrazů, více závislostí a vyšší nároky na koordinaci změn. Oproti distribuovanému prostředí řízenému plnohodnotným orchestrátorem však zachovává nižší infrastrukturní náročnost.

Nejvýraznější omezení plyne ze zvolené orchestrace pomocí `Docker Compose`, která je vhodná pro pilotní a menší produkční rozsah, ale nenabízí vlastnosti běžné u robustnějších orchestrátorů, například automatické rozložení zátěže mezi více uzly nebo samoozdravné mechanismy napříč hosty. Provoz je současně závislý na interním registru obrazů, správném vedení provozní konfigurace a na lokálních administrativních postupech organizace.

Tato omezení jsou v současné fázi částečně kompenzována využitím reprodukovatelného toku vydání, oddělením konfigurace, síťovou segmentací a zavedením dohledové vrstvy. Navržený přístup je proto plně dostačující pro pilotní podmínky #abbr("KZ", none) a představuje stabilní mezikrok.

Vzhledem k plné kontejnerizaci aplikací je však systém architektonicky připraven na budoucí rozvoj. Logickým krokem pro překonání limitů nástroje Docker Compose je migrace na plnohodnotnou orchestraci pomocí Kubernetes. Tento přechod nativně řeší výpadky během aktualizací zavedením plynulého nasazování (rolling updates) a umožňuje dosažení vysoké dostupnosti (HA) včetně dynamického škálování bezstavových komponent napříč více uzly. Zavedení Kubernetes by zároveň poskytlo standardizované prostředí pro nasazení plnohodnotné API Gateway a integraci nástroje pro centralizovanou správu citlivých údajů (např. HashiCorp Vault).
