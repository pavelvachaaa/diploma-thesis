#set text(size: 8pt)
#show heading: set heading(numbering: none)

Tato příloha zachycuje zadání, které bylo použito při pilotním uživatelském ověření, přesněji při školení náborářů. Zadání bylo formulováno tak, aby účastník znal cíl scénáře, ale nebyl veden po jednotlivých kliknutích. Smyslem bylo ověřit, zda je uživatel schopen v systému samostatně najít správný postup a porozumět cílovému stavu procesu.

== Společné instrukce pro účastníky <scenariopage>

1. Pracujte v testovacím prostředí s připravenými anonymizovanými daty.
2. Postupujte tak, jak byste postupovali při běžné práci ve své roli.
3. Pokud si nejste jistí významem stavu, tlačítka nebo dalšího kroku, řekněte to nahlas.
4. Moderátor (autor práce) zasáhne pouze v případě, že se zastavíte, nerozumíte zadání nebo by další postup vedl k nevratné změně testovacích dat.
5. Po dokončení scénáře stručně popište, co bylo srozumitelné, co bylo nejasné a co by podle vás mělo být v systému zvýrazněno jinak.

== Vstupní podmínky testu

#table(
  columns: (1.4fr, 3.6fr),
  inset: 5pt,
  stroke: 0.35pt + gray,
  [Oblast], [Připravený stav],
  [Prostředí], [Testovací instance systému s anonymizovanými daty.],
  [Role], [Náborář, personalistka, interní zaměstnanec v roli uchazeče a vedoucí zaměstnanec.],
  [Uživatelé], [Každý účastník pracoval pod testovacím účtem odpovídajícím jeho roli a oprávnění.],
  [Data], [Připravené pracovní pozice, uchazeči, testovací dokumenty, šablony vstupní agendy, notifikace a reportovací data.],
  [Záznam], [U každého průchodu byl zaznamenán výsledek scénáře, čas dokončení, potřeba asistence, počet chybných kroků a slovní poznámka.],
)

== Zadání scénářů

#table(
  columns: (0.55cm, 1.25fr, 2.45fr, 2.1fr),
  inset: 4pt,
  stroke: 0.35pt + gray,
  table.header([ID], [Role], [Zadání pro testera], [Cílový stav]),
  [S1], [Náborář], [Založte novou pracovní pozici pro vybrané pracoviště, doplňte povinné údaje a publikujte ji tak, aby byla dostupná pro uchazeče.], [Pracovní pozice je uložena, publikována a má stav odpovídající zveřejněné nabídce.],
  [S2], [Náborář], [Otevřete připravenou přihlášku uchazeče, zkontrolujte základní údaje a posuňte uchazeče do dalšího stavu náborového procesu.], [Uchazeč má změněný stav, změna je viditelná v historii a je dohledatelná v přehledu kandidátů.],
  [S3], [Náborář], [Naplánujte pohovor s vybraným uchazečem, zvolte termín, interní účastníky a odešlete pozvánky.], [Pohovor je vytvořen, má nastavený termín a systém eviduje odeslání pozvánek.],
  [S4], [Náborář / personalistka], [U přijatého uchazeče proveďte převod do navazující zaměstnanecké agendy a spusťte vstupní agendu podle připravené šablony.], [Uchazeč je převeden do navazující agendy a má založené úkoly vstupní agendy.],
  [S5], [Interní zaměstnanec v roli uchazeče], [Otevřete přidělený úkol vstupní agendy, doplňte požadované údaje a nahrajte připravený testovací dokument.], [Úkol je označen jako splněný nebo odeslaný ke kontrole a dokument je uložen u daného úkolu.],
  [S6], [Vedoucí zaměstnanec], [Otevřete nástěnku a zjistěte stav otevřených pozic a kandidátů ve svém organizačním rozsahu.], [Souhrn je zobrazen a uživatel je schopen určit aktuální stav sledovaných pozic nebo kandidátů.],
  [S7], [Náborář / personalistka / uchazeč], [Najděte novou notifikaci, otevřete navázaný úkol nebo záznam a proveďte očekávanou reakci.], [Notifikace je rozpoznána, navázaný úkol nebo záznam otevřen a požadovaná akce provedena.],
)

== Hodnoticí záznam

U každého scénáře moderátor zapisoval, zda byl scénář dokončen, zda byla nutná asistence, jak dlouho průchod trval, kolik chybných kroků nebo návratů účastník provedl a jaký komentář k průchodu doplnil. Asistence byla započtena pouze tehdy, pokud moderátor musel vysvětlit význam kroku, stavu nebo navigace. Běžné potvrzení zadání nebo technické upřesnění bez vlivu na postup nebylo jako asistence hodnoceno.

Čas dokončení byl zaznamenáván orientačně moderátorem během praktického školení, nikoli automatizovaným měřicím nástrojem. Z tohoto důvodu byly časy zaokrouhlovány na krátké intervaly po 5 až 10 sekundách podle okamžiku dokončení scénáře a provedení poznámky. Údaje proto neslouží jako přesné výkonnostní měření na úroveň sekund, ale jako srovnávací ukazatel průchodnosti jednotlivých scénářů a rozdílů mezi uživateli.
