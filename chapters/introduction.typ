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

Digitalizace personálních procesů ve zdravotnictví nespočívá pouze v převodu formulářů do elektronické podoby. V prostředí velké zdravotnické organizace se v jednom procesu střetává vysoký objem náboru, legislativní požadavky na odbornou způsobilost, rozdílné potřeby jednotlivých pracovišť i tlak na rychlé obsazování pozic. Pokud je tato situace dlouhodobě řešena převážně e-mailem, sdílenými tabulkami a lokálními zvyklostmi, nevzniká jen administrativní zátěž. Vzniká také nepřehlednost, která zpomaluje nábor, komplikuje nástup nových zaměstnanců a oslabuje schopnost řídit proces na úrovni celé organizace.

Téma této práce proto vychází z praktické potřeby Krajské zdravotní, a.s. sjednotit a zpřehlednit nábor a adaptaci pracovníků napříč odštěpnými závody. Nejde přitom jen o zefektivnění jednotlivých dílčích kroků, ale o vytvoření takového řešení, které propojí inzerci, práci s uchazeči, vstupní agendu i adaptaci nového zaměstnance do jednoho srozumitelného a provozně udržitelného celku.

Cílem práce je analyzovat současný stav těchto procesů, identifikovat jejich hlavní nedostatky a navrhnout řešení jejich digitalizace formou návrhu odpovídající softwarové architektury. Součástí práce je i porovnání existujících produktů a zdůvodnění, proč v podmínkách Krajské zdravotní, a.s. dává smysl vlastní vývoj. Na analytickou a rešeršní část navazuje návrh architektury, popis implementace, nasazení do cílového prostředí a pilotní uživatelské ověření řešení. Práce se soustředí na proces od vzniku personální potřeby až po adaptaci nového zaměstnance.
