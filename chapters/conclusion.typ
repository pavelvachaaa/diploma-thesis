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

Tato diplomová práce vycházela z praktického problému, který se v prostředí Krajské zdravotní, a.s. dlouhodobě projevoval jako roztříštěná správa náboru a adaptace pracovníků. Analytická část ukázala, že hlavním omezením není jediný nefunkční krok, ale souběh několika faktorů, mezi které patří rozptýlená data, ruční komunikace mezi rolemi, nízká transparentnost stavu náboru, chybějící auditní stopa a papírově vedená adaptace nových zaměstnanců. V organizaci s více odštěpnými závody a vysokou frekvencí nástupů se tyto slabiny navzájem zesilují a snižují propustnost celého procesu.

Na základě zjištěného stavu jsem formuloval požadavky na cílové řešení a porovnal je s dostupnými komerčními produkty. Rešerše ukázala, že na trhu existují kvalitní dílčí nástroje pro správu náboru nebo onboarding, ale žádné z hodnocených řešení současně nenaplňuje požadavek na procesní kontinuitu, provoz na vlastní infrastruktuře, multi-tenantní členění organizace a vazbu na specifika českého zdravotnického prostředí. Tato zjištění vedla k návrhu vlastního řešení, které tyto požadavky spojuje v jednotném datovém a procesním modelu.

V návrhové části byla představena hybridní architektura kombinující modulární monolit pro transakční jádro a oddělenou vrstvu pro inteligentní zpracování dat. Tento přístup umožňuje zachovat provozní jednoduchost systému a zároveň podporuje jeho rozšiřitelnost, auditovatelnost a integrační schopnosti. Součástí práce je také implementace backendu, kariérního portálu, onboardingového rozhraní, integračních adaptérů a nasazení v on-premise prostředí.

Uživatelské testování potvrdilo, že hlavním přínosem řešení je sjednocení informací, zvýšení transparentnosti procesu a omezení ruční komunikace mezi rolemi. Zároveň se ukázalo, že pro úspěch systému je klíčová nejen technická kvalita, ale i srozumitelnost procesů, jasné rozdělení odpovědností a průběžná práce se zpětnou vazbou uživatelů.

Hlavním přínosem práce je propojení analytického, architektonického a implementačního pohledu na konkrétní problém organizace. Výsledkem není pouze návrh, ale funkční základ platformy respektující specifika zdravotnického prostředí. Limitem práce zůstává nutnost dalšího rozvoje systému v návaznosti na provozní zkušenosti a dostupné kapacity.

Práce zároveň ukazuje, že vlastní softwarové řešení představuje v daném kontextu efektivnější alternativu k rigidním komerčním systémům. Navržený přístup tak nepředstavuje pouze řešení jednoho problému, ale i obecnější rámec pro postupnou digitalizaci náboru a adaptace v prostředí zdravotnických organizací.