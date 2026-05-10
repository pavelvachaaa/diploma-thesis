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

Tato diplomová práce vycházela z praktického problému, který se v prostředí Krajské zdravotní, a.s. dlouhodobě projevoval jako roztříštěná správa náboru a adaptace pracovníků. Analytická část se zaměřila na proces od vzniku personální potřeby přes tvorbu a publikaci inzerce, příjem přihlášek, práci s uchazečem a pohovory až po převod vybraného kandidáta do vstupní agendy a jeho následnou adaptaci. Ukázala, že hlavním omezením není jediný nefunkční krok, ale TODO NE SOUBEH TODO NE ROZPTÝLENZCH rozptýlených dat, ruční komunikace mezi rolemi, nízké transparentnosti stavu náboru, chybějící auditní stopy a papírově vedené adaptace. V organizaci s více odštěpnými závody a vysokou frekvencí nástupů se tyto slabiny navzájem zesilují a snižují propustnost celého procesu.

Na základě zjištěného stavu jsem formuloval požadavky na cílové řešení a porovnal je s dostupnými komerčními produkty. Rešerše ukázala, že na trhu existují kvalitní dílčí nástroje pro správu náboru nebo onboarding, ale žádné z hodnocených řešení současně nenaplňuje požadavek na procesní kontinuitu, provoz na vlastní infrastruktuře, multi-tenantní členění organizace a vazbu na specifika českého zdravotnického prostředí. Tato zjištění vedla k návrhu vlastního řešení, které tyto požadavky spojuje v jednotném datovém a procesním modelu.

V návrhové části byla představena hybridní architektura kombinující modulární monolit pro transakční jádro a oddělenou vrstvu pro inteligentní zpracování dat. Tento přístup umožňuje zachovat provozní jednoduchost systému a zároveň podporuje jeho rozšiřitelnost, auditovatelnost a integrační schopnosti. Návrh byl ověřen implementací backendu, kariérního portálu, onboardingového rozhraní, integračních adaptérů a nasazením v on-premise prostředí.

Uživatelské testování potvrdilo, že hlavním přínosem řešení je sjednocení informací, zvýšení transparentnosti procesu a omezení ruční komunikace mezi rolemi. Zároveň se ukázalo, že pro úspěch systému je klíčová nejen technická kvalita, ale i srozumitelnost procesů, jasné rozdělení odpovědností a průběžná práce se zpětnou vazbou uživatelů.

Hlavním přínosem práce je propojení analytického, architektonického a implementačního pohledu na konkrétní problém organizace. Výsledkem není pouze návrh, ale pilotně nasazená platforma respektující specifika zdravotnického prostředí, jejíž další rozšiřování závisí na provozních zkušenostech a dostupných kapacitách. Práce tím ukazuje, že vlastní softwarové řešení může být v daném kontextu efektivnější alternativou k rigidním komerčním systémům i obecnějším rámcem pro postupnou digitalizaci náboru a adaptace ve zdravotnických organizacích.
