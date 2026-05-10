-- Migration 035: Replace shared benefits catalog and backfill all existing job roles.
-- for eliska reasons

DELETE FROM job_role_section_items
WHERE section_type_name = 'benefits';

DELETE FROM section_items
WHERE section_type_name = 'benefits';

DELETE FROM job_role_section_items
WHERE section_type_name = 'duties';

DELETE FROM section_items
WHERE section_type_name = 'duties';
DELETE FROM job_role_section_items
WHERE section_type_name = 'requirements';

DELETE FROM section_items
WHERE section_type_name = 'requirements';

INSERT INTO section_items (id, section_type_name, item_text, is_active, order_index)
VALUES
    (gen_random_uuid(), 'benefits', 'odpovídající mzdové ohodnocení', true, 0),
    (gen_random_uuid(), 'benefits', '5 týdnů dovolené', true, 1),
    (gen_random_uuid(), 'benefits', 'příspěvek na dovolenou', true, 2),
    (gen_random_uuid(), 'benefits', 'dotované závodní stravování', true, 3),
    (gen_random_uuid(), 'benefits', 'Multisport karta', true, 4),
    (gen_random_uuid(), 'benefits', 'zvýhodněná roční jízdenka Dopravy Ústeckého kraje', true, 5),
    (gen_random_uuid(), 'benefits', 'příspěvek na penzijní spoření', true, 6),
    (gen_random_uuid(), 'benefits', 'slevy u vybraných partnerů (Alza, Datart, Raiffeisenbank, T-Mobile a další)', true, 7),
    (gen_random_uuid(), 'benefits', 'podpora vzdělávání', true, 8),
    (gen_random_uuid(), 'benefits', 'psychosociální podpora při náročných profesních a životních situacích', true, 9),
    (gen_random_uuid(), 'benefits', 'nadstandardní pokoj v případě hospitalizace', true, 10);


INSERT INTO section_items (id, section_type_name, item_text, is_active, order_index)
VALUES
    (gen_random_uuid(), 'duties', 'poskytování základní i odborné ošetřovatelské péče pacientům', true, 0),
    (gen_random_uuid(), 'duties', 'asistence při hygieně, oblékání, stravování a vyprazdňování s ohledem na míru soběstačnosti', true, 1),
    (gen_random_uuid(), 'duties', 'podpora mobility pacientů, nácvik soběstačnosti a doprovod na vyšetření', true, 2),
    (gen_random_uuid(), 'duties', 'polohování pacientů a prevence dekubitů', true, 3),
    (gen_random_uuid(), 'duties', 'realizace pokynů lékaře a všeobecné sestry, asistence při vyšetřeních a výkonech', true, 4),
    (gen_random_uuid(), 'duties', 'sledování zdravotního stavu pacientů a monitorace účinku léčby', true, 5),
    (gen_random_uuid(), 'duties', 'vedení a aktualizace zdravotnické dokumentace', true, 6),
    (gen_random_uuid(), 'duties', 'spolupráce v rámci zdravotnického týmu a předávání informací', true, 7),
    (gen_random_uuid(), 'duties', 'zajištění chodu oddělení, příprava materiálu a doplňování pomůcek', true, 8),
    (gen_random_uuid(), 'duties', 'udržování hygieny prostředí, manipulace s prádlem, odpadem a biologickým materiálem', true, 9);

INSERT INTO section_items (id, section_type_name, item_text, is_active, order_index)
VALUES
    (gen_random_uuid(), 'requirements', 'odborná způsobilost dle platné legislativy', true, 0),
    (gen_random_uuid(), 'requirements', 'minimálně základní vzdělání', true, 1),
    (gen_random_uuid(), 'requirements', 'absolvovaný akreditovaný kurz pro sanitáře', true, 2),
    (gen_random_uuid(), 'requirements', 'zdravotní způsobilost a trestní bezúhonnost', true, 3),
    (gen_random_uuid(), 'requirements', 'empatický, respektující a lidský přístup k pacientům všech věkových kategorií', true, 4),
    (gen_random_uuid(), 'requirements', 'schopnost týmové spolupráce i samostatnosti', true, 5),
    (gen_random_uuid(), 'requirements', 'spolehlivost a odpovědnost', true, 6),
    (gen_random_uuid(), 'requirements', 'ochota učit se a profesně růst', true, 7);


INSERT INTO job_role_section_items (
    id,
    job_role_id,
    section_type_name,
    section_item_id,
    custom_text,
    order_index
)
SELECT
    gen_random_uuid(),
    jr.id,
    'benefits',
    si.id,
    NULL,
    si.order_index
FROM job_roles jr
CROSS JOIN section_items si
WHERE si.section_type_name = 'benefits';
