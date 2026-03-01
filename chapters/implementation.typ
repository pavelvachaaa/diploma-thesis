#import "../template/abbreviations.typ": abbr

Tato kapitola navazuje na architektonický návrh uvedený v předchozí kapitole a převádí přijatá rozhodnutí do konkrétních technických artefaktů. Zatímco kapitola návrhu odpovídá na otázku, proč a jak je systém navržen, tato kapitola odpovídá na otázku, jak byl návrh reálně proveden v implementaci.

Do implementační části proto patří zejména popis skutečné struktury kódu, konkrétních modulů a rozhraní, databázových migrací, integračních konfigurací, testovacích scénářů a důkazů provozního chování. Tím je zachována jasná hranice mezi rozhodovací a realizační rovinou práce.

== Metodika převodu návrhu do realizace
Implementace je organizována tak, aby každé klíčové architektonické rozhodnutí mělo jednoznačný realizační otisk. Pro každou oblast (aplikační vrstva, datová vrstva, integrační vrstva, bezpečnost a observability) je uvedeno, jak byl naplněn příslušný architektonický kontrakt a jak je jeho funkčnost ověřena.

V textu jsou používány přímé vazby na rozhodnutí z kapitoly návrhu a na požadavky R1-R6 a NF01-NF12. Cílem je prokázat, že implementace není ad hoc, ale konzistentní realizací předem definované architektury.
