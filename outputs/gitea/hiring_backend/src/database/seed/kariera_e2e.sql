-- Deterministic public career-site data for Playwright E2E.
-- This file is intended for the isolated hrdb_e2e database only.

DELETE FROM command_idempotency;
DELETE FROM side_effect_outbox;
DELETE FROM contact_inquiries;
DELETE FROM job_seeker_attachments;
DELETE FROM job_seeker_locations;
DELETE FROM job_seekers;
DELETE FROM application_attachments;
DELETE FROM applicant_status_history;
DELETE FROM applicant_notes;
DELETE FROM applicants;
DELETE FROM job_posting_section_items;
DELETE FROM job_postings;

DELETE FROM files
WHERE source_module IN ('applicants', 'job_seekers');

DO $$
DECLARE
    org_ce UUID;
    org_ul UUID;
    org_dc UUID;
    org_cv UUID;
    org_mo UUID;
    org_tp UUID;
    role_ce_specialists UUID;
    role_ul_nurse UUID;
    role_ul_doctor UUID;
    role_cv_admin UUID;
    role_dc_other_medical UUID;
    role_tp_other_medical UUID;
    role_mo_nurse UUID;
    role_cv_other UUID;
    role_ce_other UUID;
    created_job_id UUID;
BEGIN
    SELECT id INTO org_ce FROM organizations WHERE seat_location = 'CE';
    SELECT id INTO org_ul FROM organizations WHERE seat_location = 'UL';
    SELECT id INTO org_dc FROM organizations WHERE seat_location = 'DC';
    SELECT id INTO org_cv FROM organizations WHERE seat_location = 'CV';
    SELECT id INTO org_mo FROM organizations WHERE seat_location = 'MO';
    SELECT id INTO org_tp FROM organizations WHERE seat_location = 'TP';

    SELECT id INTO role_ce_specialists FROM job_roles WHERE organization_id = org_ce AND name = 'Specialisté' LIMIT 1;
    SELECT id INTO role_ul_nurse FROM job_roles WHERE organization_id = org_ul AND classification_code = 'nurses_paramedics' LIMIT 1;
    SELECT id INTO role_ul_doctor FROM job_roles WHERE organization_id = org_ul AND classification_code = 'doctors' LIMIT 1;
    SELECT id INTO role_cv_admin FROM job_roles WHERE organization_id = org_cv AND classification_code = 'administrative_technical' LIMIT 1;
    SELECT id INTO role_dc_other_medical FROM job_roles WHERE organization_id = org_dc AND classification_code = 'other_medical' LIMIT 1;
    SELECT id INTO role_tp_other_medical FROM job_roles WHERE organization_id = org_tp AND classification_code = 'other_medical' LIMIT 1;
    SELECT id INTO role_mo_nurse FROM job_roles WHERE organization_id = org_mo AND classification_code = 'nurses_paramedics' LIMIT 1;
    SELECT id INTO role_cv_other FROM job_roles WHERE organization_id = org_cv AND name = 'Ostatní' LIMIT 1;
    SELECT id INTO role_ce_other FROM job_roles WHERE organization_id = org_ce AND name = 'Ostatní' LIMIT 1;

    IF org_ce IS NULL OR org_ul IS NULL OR org_dc IS NULL OR org_cv IS NULL OR org_mo IS NULL OR org_tp IS NULL THEN
        RAISE EXCEPTION 'E2E seed failed: required organizations are missing';
    END IF;

    IF role_ce_specialists IS NULL OR role_ul_nurse IS NULL OR role_ul_doctor IS NULL OR role_cv_admin IS NULL
       OR role_dc_other_medical IS NULL OR role_tp_other_medical IS NULL OR role_mo_nurse IS NULL
       OR role_cv_other IS NULL OR role_ce_other IS NULL THEN
        RAISE EXCEPTION 'E2E seed failed: required job roles are missing';
    END IF;

    INSERT INTO job_postings (
        id, title, description, short_description, job_role_id, organization_id, status,
        salary_min, salary_max, contract_type_code, department, is_department_accredited,
        publish_date, expire_date, contact_email, contact_phone, cv_required, created_at
    )
    VALUES
        (
            '11111111-1111-4111-8111-111111111111',
            'E2E Zdravotní sestra JIP',
            '<p>Stabilní práce na jednotce intenzivní péče s moderním vybavením.</p>',
            'Sestra pro jednotku intenzivní péče',
            role_ul_nurse,
            org_ul,
            'active',
            42000,
            56000,
            ARRAY['full_time'],
            'Jednotka intenzivní péče',
            true,
            CURRENT_DATE - INTERVAL '6 days',
            NULL,
            'hr.usti@kzcr.eu',
            '+420 705 777 934',
            true,
            NOW() - INTERVAL '6 days'
        ),
        (
            '22222222-2222-4222-8222-222222222222',
            'E2E Administrativní pracovník recepce',
            '<p>Pomozte pacientům při prvním kontaktu s nemocnicí.</p>',
            'Administrativa a příjem pacientů',
            role_cv_admin,
            org_cv,
            'active',
            31000,
            39000,
            ARRAY['part_time'],
            'Přijímací kancelář',
            false,
            CURRENT_DATE - INTERVAL '5 days',
            NULL,
            'hr.chomutov@kzcr.eu',
            '+420 723 191 530',
            false,
            NOW() - INTERVAL '5 days'
        ),
        (
            '33333333-3333-4333-8333-333333333333',
            'E2E Lékař interna',
            '<p>Hledáme lékaře pro interní oddělení s možností dalšího vzdělávání.</p>',
            'Lékař na interní oddělení',
            role_ul_doctor,
            org_ul,
            'active',
            70000,
            98000,
            ARRAY['full_time'],
            'Interní oddělení',
            true,
            CURRENT_DATE - INTERVAL '4 days',
            NULL,
            'hr.usti@kzcr.eu',
            '+420 705 777 934',
            true,
            NOW() - INTERVAL '4 days'
        ),
        (
            '44444444-4444-4444-8444-444444444444',
            'E2E Fyzioterapeut rehabilitace',
            '<p>Fyzioterapie v ambulantním i lůžkovém provozu.</p>',
            'Fyzioterapeut pro rehabilitační oddělení',
            role_dc_other_medical,
            org_dc,
            'active',
            38000,
            48000,
            ARRAY['full_time'],
            'Rehabilitační oddělení',
            false,
            CURRENT_DATE - INTERVAL '3 days',
            NULL,
            'hr.decin@kzcr.eu',
            '+420 775 227 745',
            true,
            NOW() - INTERVAL '3 days'
        ),
        (
            '55555555-5555-4555-8555-555555555555',
            'E2E Laborant biochemie',
            '<p>Laboratorní práce v akreditované nemocniční laboratoři.</p>',
            'Laborant na biochemii',
            role_tp_other_medical,
            org_tp,
            'active',
            36000,
            46000,
            ARRAY['full_time'],
            'Biochemická laboratoř',
            true,
            CURRENT_DATE - INTERVAL '2 days',
            NULL,
            'hr.teplice@kzcr.eu',
            '+420 734 120 477',
            true,
            NOW() - INTERVAL '2 days'
        ),
        (
            '66666666-6666-4666-8666-666666666666',
            'E2E Sanitář operační sály',
            '<p>Podpora operačního týmu a péče o prostředí operačních sálů.</p>',
            'Sanitář pro operační sály',
            role_cv_other,
            org_cv,
            'active',
            30000,
            36000,
            ARRAY['full_time'],
            'Operační sály',
            false,
            CURRENT_DATE - INTERVAL '1 day',
            NULL,
            'hr.chomutov@kzcr.eu',
            '+420 723 191 530',
            true,
            NOW() - INTERVAL '1 day'
        ),
        (
            '77777777-7777-4777-8777-777777777777',
            'E2E Referent HR',
            '<p>Administrativní a náborová podpora personálního týmu.</p>',
            'Referent pro personální oddělení',
            role_ce_specialists,
            org_ce,
            'active',
            34000,
            43000,
            ARRAY['full_time'],
            'Oddělení lidských zdrojů',
            false,
            CURRENT_DATE,
            NULL,
            'info@kzcr.eu',
            '+420 477 111 111',
            false,
            NOW()
        ),
        (
            '88888888-8888-4888-8888-888888888888',
            'E2E Porodní asistentka',
            '<p>Péče o maminky a novorozence v porodnici.</p>',
            'Porodní asistentka na porodnici',
            role_mo_nurse,
            org_mo,
            'active',
            40000,
            52000,
            ARRAY['part_time'],
            'Porodnice',
            true,
            CURRENT_DATE - INTERVAL '8 days',
            NULL,
            'hr.most@kzcr.eu',
            '+420 608 000 466',
            true,
            NOW() - INTERVAL '8 days'
        ),
        (
            '99999999-9999-4999-8999-999999999999',
            'E2E Technická podpora IT',
            '<p>Správa nemocničních informačních systémů a uživatelská podpora.</p>',
            'IT podpora pro nemocniční systémy',
            role_ce_other,
            org_ce,
            'active',
            43000,
            58000,
            ARRAY['full_time'],
            'IT oddělení',
            false,
            CURRENT_DATE - INTERVAL '7 days',
            NULL,
            'info@kzcr.eu',
            '+420 477 111 111',
            false,
            NOW() - INTERVAL '7 days'
        ),
        (
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            'E2E Skrytý archiv',
            '<p>Archivovaná pozice nesmí být vidět veřejně.</p>',
            'Archivovaná pozice',
            role_ul_nurse,
            org_ul,
            'archived',
            30000,
            32000,
            ARRAY['full_time'],
            'Archiv',
            false,
            CURRENT_DATE - INTERVAL '10 days',
            NULL,
            'hr.usti@kzcr.eu',
            '+420 705 777 934',
            true,
            NOW() - INTERVAL '10 days'
        ),
        (
            'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            'E2E Budoucí pozice',
            '<p>Budoucí pozice nesmí být vidět před publish_date.</p>',
            'Budoucí pozice',
            role_ul_doctor,
            org_ul,
            'active',
            70000,
            90000,
            ARRAY['full_time'],
            'Budoucí oddělení',
            false,
            CURRENT_DATE + INTERVAL '14 days',
            NULL,
            'hr.usti@kzcr.eu',
            '+420 705 777 934',
            true,
            NOW() + INTERVAL '14 days'
        );

    FOR created_job_id IN
        SELECT id
        FROM job_postings
        WHERE title LIKE 'E2E %'
    LOOP
        INSERT INTO job_posting_section_items (id, job_posting_id, section_type_name, item_text, order_index)
        VALUES
            (gen_random_uuid(), created_job_id, 'duties', 'Péče o pacienty a spolupráce v týmu', 0),
            (gen_random_uuid(), created_job_id, 'duties', 'Vedení potřebné dokumentace', 1),
            (gen_random_uuid(), created_job_id, 'requirements', 'Odpovídající vzdělání a praxe', 0),
            (gen_random_uuid(), created_job_id, 'requirements', 'Spolehlivost a komunikativnost', 1),
            (gen_random_uuid(), created_job_id, 'benefits', '5 týdnů dovolené', 0),
            (gen_random_uuid(), created_job_id, 'benefits', 'Příspěvek na stravování', 1);
    END LOOP;
END $$;

DO $$
DECLARE
    active_public_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO active_public_count
    FROM job_postings_with_status
    WHERE title LIKE 'E2E %'
      AND status = 'active'
      AND (publish_date IS NULL OR publish_date <= timezone('Europe/Prague', now())::date);

    IF active_public_count <> 9 THEN
        RAISE EXCEPTION 'E2E seed failed: expected 9 public active jobs, got %', active_public_count;
    END IF;
END $$;
