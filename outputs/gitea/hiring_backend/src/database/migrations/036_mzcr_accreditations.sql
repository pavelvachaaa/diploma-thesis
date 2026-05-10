-- Migration 036: Add relational KZ-only cache for MZCR accreditation open data.
--
-- Rollback instructions:
-- 1) DROP VIEW IF EXISTS mzcr_accreditations_view;
-- 2) DROP TABLE IF EXISTS mzcr_accreditation_theory_training_course_assignments;
-- 3) DROP TABLE IF EXISTS mzcr_accreditation_theory_basic_trunk_course_assignments;
-- 4) DROP TABLE IF EXISTS mzcr_accreditation_workplace_type_assignments;
-- 5) DROP TABLE IF EXISTS mzcr_accreditation_source_categories;
-- 6) DROP TABLE IF EXISTS mzcr_accreditations;
-- 7) DROP TABLE IF EXISTS mzcr_accreditation_extension_fields;
-- 8) DROP TABLE IF EXISTS mzcr_accreditation_certified_courses;
-- 9) DROP TABLE IF EXISTS mzcr_accreditation_dental_specializations;
-- 10) DROP TABLE IF EXISTS mzcr_accreditation_specialized_trainings;
-- 11) DROP TABLE IF EXISTS mzcr_accreditation_basic_fields;
-- 12) DROP TABLE IF EXISTS mzcr_accreditation_basic_trunks;
-- 13) DROP TABLE IF EXISTS mzcr_accreditation_workplace_types;
-- 14) DROP TABLE IF EXISTS mzcr_accreditation_sync_state;
-- 15) DROP TABLE IF EXISTS mzcr_accreditation_sync_runs;

CREATE TABLE mzcr_accreditation_sync_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'success', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    catalogs_count INTEGER NOT NULL DEFAULT 0,
    accreditations_count INTEGER NOT NULL DEFAULT 0,
    stale_accreditations_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mzcr_accreditation_sync_runs_status
    ON mzcr_accreditation_sync_runs (status, started_at DESC);

CREATE TABLE mzcr_accreditation_sync_state (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    last_started_sync_run_id UUID REFERENCES mzcr_accreditation_sync_runs(id) ON DELETE SET NULL,
    last_successful_sync_run_id UUID REFERENCES mzcr_accreditation_sync_runs(id) ON DELETE SET NULL,
    last_attempted_sync_at TIMESTAMP WITH TIME ZONE,
    last_successful_sync_at TIMESTAMP WITH TIME ZONE,
    last_status VARCHAR(20) CHECK (last_status IN ('running', 'success', 'failed')),
    last_error_message TEXT,
    catalogs_count INTEGER NOT NULL DEFAULT 0,
    accreditations_count INTEGER NOT NULL DEFAULT 0,
    stale_accreditations_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE mzcr_accreditation_workplace_types (
    id_pracoviste_typ INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mzcr_created_at TIMESTAMP WITH TIME ZONE,
    mzcr_last_modified_at TIMESTAMP WITH TIME ZONE,
    source_hash TEXT,
    raw JSONB,
    last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen_sync_run_id UUID REFERENCES mzcr_accreditation_sync_runs(id) ON DELETE SET NULL,
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    stale_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE mzcr_accreditation_basic_trunks (
    id_zakladni_kmen INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    profession VARCHAR(255),
    mzcr_created_at TIMESTAMP WITH TIME ZONE,
    mzcr_last_modified_at TIMESTAMP WITH TIME ZONE,
    source_hash TEXT,
    raw JSONB,
    last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen_sync_run_id UUID REFERENCES mzcr_accreditation_sync_runs(id) ON DELETE SET NULL,
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    stale_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE mzcr_accreditation_basic_fields (
    id_zakladni_obor INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    profession VARCHAR(255),
    mzcr_created_at TIMESTAMP WITH TIME ZONE,
    mzcr_last_modified_at TIMESTAMP WITH TIME ZONE,
    source_hash TEXT,
    raw JSONB,
    last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen_sync_run_id UUID REFERENCES mzcr_accreditation_sync_runs(id) ON DELETE SET NULL,
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    stale_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE mzcr_accreditation_specialized_trainings (
    id_vycvik INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    profession VARCHAR(255),
    mzcr_created_at TIMESTAMP WITH TIME ZONE,
    mzcr_last_modified_at TIMESTAMP WITH TIME ZONE,
    source_hash TEXT,
    raw JSONB,
    last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen_sync_run_id UUID REFERENCES mzcr_accreditation_sync_runs(id) ON DELETE SET NULL,
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    stale_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE mzcr_accreditation_dental_specializations (
    id_spec_obor_zubni_lekari INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mzcr_created_at TIMESTAMP WITH TIME ZONE,
    mzcr_last_modified_at TIMESTAMP WITH TIME ZONE,
    source_hash TEXT,
    raw JSONB,
    last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen_sync_run_id UUID REFERENCES mzcr_accreditation_sync_runs(id) ON DELETE SET NULL,
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    stale_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE mzcr_accreditation_certified_courses (
    id_certifikovany_kurz INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    profession VARCHAR(255),
    mzcr_created_at TIMESTAMP WITH TIME ZONE,
    mzcr_last_modified_at TIMESTAMP WITH TIME ZONE,
    source_hash TEXT,
    raw JSONB,
    last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen_sync_run_id UUID REFERENCES mzcr_accreditation_sync_runs(id) ON DELETE SET NULL,
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    stale_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE mzcr_accreditation_extension_fields (
    id_nastavbovy_obor INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    profession VARCHAR(255),
    mzcr_created_at TIMESTAMP WITH TIME ZONE,
    mzcr_last_modified_at TIMESTAMP WITH TIME ZONE,
    source_hash TEXT,
    raw JSONB,
    last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen_sync_run_id UUID REFERENCES mzcr_accreditation_sync_runs(id) ON DELETE SET NULL,
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    stale_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE mzcr_accreditations (
    id_akreditace INTEGER PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    basic_trunk_id INTEGER REFERENCES mzcr_accreditation_basic_trunks(id_zakladni_kmen),
    specialized_training_id INTEGER REFERENCES mzcr_accreditation_specialized_trainings(id_vycvik),
    extension_field_id INTEGER REFERENCES mzcr_accreditation_extension_fields(id_nastavbovy_obor),
    basic_field_id INTEGER REFERENCES mzcr_accreditation_basic_fields(id_zakladni_obor),
    certified_course_id INTEGER REFERENCES mzcr_accreditation_certified_courses(id_certifikovany_kurz),
    dental_specialization_id INTEGER REFERENCES mzcr_accreditation_dental_specializations(id_spec_obor_zubni_lekari),
    extension_of_accreditation_id INTEGER,
    is_full BOOLEAN,
    valid_from DATE,
    valid_to DATE,
    revoked_at DATE,
    expired_at DATE,
    program_version DATE,
    note TEXT,
    midwives BOOLEAN,
    places_count INTEGER,
    version_issue INTEGER,
    theory_basic_trunk_id INTEGER REFERENCES mzcr_accreditation_basic_trunks(id_zakladni_kmen),
    theory_specialized_training_id INTEGER REFERENCES mzcr_accreditation_specialized_trainings(id_vycvik),
    mzcr_created_at TIMESTAMP WITH TIME ZONE,
    mzcr_last_modified_at TIMESTAMP WITH TIME ZONE,
    source_hash TEXT,
    raw JSONB,
    last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen_sync_run_id UUID REFERENCES mzcr_accreditation_sync_runs(id) ON DELETE SET NULL,
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    stale_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_mzcr_accreditations_organization
    ON mzcr_accreditations (organization_id);
CREATE INDEX idx_mzcr_accreditations_validity
    ON mzcr_accreditations (valid_from, valid_to);
CREATE INDEX idx_mzcr_accreditations_stale
    ON mzcr_accreditations (is_stale);

CREATE TABLE mzcr_accreditation_source_categories (
    accreditation_id INTEGER NOT NULL REFERENCES mzcr_accreditations(id_akreditace) ON DELETE CASCADE,
    category_code VARCHAR(64) NOT NULL,
    last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen_sync_run_id UUID REFERENCES mzcr_accreditation_sync_runs(id) ON DELETE SET NULL,
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    stale_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (accreditation_id, category_code)
);

CREATE TABLE mzcr_accreditation_workplace_type_assignments (
    accreditation_id INTEGER NOT NULL REFERENCES mzcr_accreditations(id_akreditace) ON DELETE CASCADE,
    workplace_type_id INTEGER NOT NULL REFERENCES mzcr_accreditation_workplace_types(id_pracoviste_typ),
    last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen_sync_run_id UUID REFERENCES mzcr_accreditation_sync_runs(id) ON DELETE SET NULL,
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    stale_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (accreditation_id, workplace_type_id)
);

CREATE TABLE mzcr_accreditation_theory_basic_trunk_course_assignments (
    accreditation_id INTEGER NOT NULL REFERENCES mzcr_accreditations(id_akreditace) ON DELETE CASCADE,
    course_key VARCHAR(255) NOT NULL,
    course_id INTEGER,
    name VARCHAR(255),
    profession VARCHAR(255),
    mzcr_created_at TIMESTAMP WITH TIME ZONE,
    mzcr_last_modified_at TIMESTAMP WITH TIME ZONE,
    last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen_sync_run_id UUID REFERENCES mzcr_accreditation_sync_runs(id) ON DELETE SET NULL,
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    stale_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (accreditation_id, course_key)
);

CREATE TABLE mzcr_accreditation_theory_training_course_assignments (
    accreditation_id INTEGER NOT NULL REFERENCES mzcr_accreditations(id_akreditace) ON DELETE CASCADE,
    course_key VARCHAR(255) NOT NULL,
    course_id INTEGER,
    name VARCHAR(255),
    profession VARCHAR(255),
    mzcr_created_at TIMESTAMP WITH TIME ZONE,
    mzcr_last_modified_at TIMESTAMP WITH TIME ZONE,
    last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen_sync_run_id UUID REFERENCES mzcr_accreditation_sync_runs(id) ON DELETE SET NULL,
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    stale_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (accreditation_id, course_key)
);

CREATE INDEX idx_mzcr_accreditation_sync_state_success
    ON mzcr_accreditation_sync_state (last_successful_sync_at);

CREATE VIEW mzcr_accreditations_view AS
WITH accreditation_categories AS (
    SELECT
        accreditation_id,
        ARRAY_AGG(category_code ORDER BY category_code) AS source_category_codes
    FROM mzcr_accreditation_source_categories
    WHERE is_stale = FALSE
    GROUP BY accreditation_id
),
accreditation_workplace_types AS (
    SELECT
        assignment.accreditation_id,
        ARRAY_AGG(workplace_type.id_pracoviste_typ ORDER BY workplace_type.name) AS workplace_type_ids,
        ARRAY_AGG(workplace_type.name ORDER BY workplace_type.name) AS workplace_type_names
    FROM mzcr_accreditation_workplace_type_assignments assignment
    INNER JOIN mzcr_accreditation_workplace_types workplace_type
        ON workplace_type.id_pracoviste_typ = assignment.workplace_type_id
    WHERE assignment.is_stale = FALSE
        AND workplace_type.is_stale = FALSE
    GROUP BY assignment.accreditation_id
)
SELECT
    a.id_akreditace,
    a.organization_id,
    o.name AS organization_name,
    o.seat_location AS organization_seat_location,
    CASE
        WHEN a.basic_trunk_id IS NOT NULL THEN 'basic_trunk'
        WHEN a.basic_field_id IS NOT NULL THEN 'basic_field'
        WHEN a.specialized_training_id IS NOT NULL THEN 'specialized_training'
        WHEN a.extension_field_id IS NOT NULL THEN 'extension_field'
        WHEN a.certified_course_id IS NOT NULL THEN 'certified_course'
        WHEN a.dental_specialization_id IS NOT NULL THEN 'dental_specialization'
        WHEN a.theory_basic_trunk_id IS NOT NULL THEN 'theory_basic_trunk'
        WHEN a.theory_specialized_training_id IS NOT NULL THEN 'theory_specialized_training'
    END AS specialty_type,
    CASE
        WHEN a.basic_trunk_id IS NOT NULL THEN 'Základní kmen'
        WHEN a.basic_field_id IS NOT NULL THEN 'Základní obor'
        WHEN a.specialized_training_id IS NOT NULL THEN 'Specializační výcvik'
        WHEN a.extension_field_id IS NOT NULL THEN 'Nástavbový obor'
        WHEN a.certified_course_id IS NOT NULL THEN 'Certifikovaný kurz'
        WHEN a.dental_specialization_id IS NOT NULL THEN 'Specializační obor zubních lékařů'
        WHEN a.theory_basic_trunk_id IS NOT NULL THEN 'Teorie základního kmene'
        WHEN a.theory_specialized_training_id IS NOT NULL THEN 'Teorie specializačního výcviku'
    END AS specialty_type_label_cs,
    COALESCE(
        a.basic_trunk_id::TEXT,
        a.basic_field_id::TEXT,
        a.specialized_training_id::TEXT,
        a.extension_field_id::TEXT,
        a.certified_course_id::TEXT,
        a.dental_specialization_id::TEXT,
        a.theory_basic_trunk_id::TEXT,
        a.theory_specialized_training_id::TEXT
    ) AS specialty_id,
    COALESCE(
        bt.name,
        bf.name,
        st.name,
        ef.name,
        cc.name,
        ds.name,
        tbt.name,
        tst.name
    ) AS specialty_name,
    COALESCE(categories.source_category_codes, ARRAY[]::VARCHAR[]) AS source_category_codes,
    COALESCE(workplace_types.workplace_type_ids, ARRAY[]::INTEGER[]) AS workplace_type_ids,
    COALESCE(workplace_types.workplace_type_names, ARRAY[]::VARCHAR[]) AS workplace_type_names,
    a.valid_from,
    a.valid_to,
    a.revoked_at,
    a.expired_at,
    a.places_count,
    a.is_full,
    a.is_stale,
    (
        a.is_stale = FALSE
        AND a.revoked_at IS NULL
        AND (a.expired_at IS NULL OR a.expired_at > CURRENT_DATE)
        AND (a.valid_from IS NULL OR a.valid_from <= CURRENT_DATE)
        AND (a.valid_to IS NULL OR a.valid_to >= CURRENT_DATE)
    ) AS is_currently_valid,
    a.last_synced_at
FROM mzcr_accreditations a
LEFT JOIN organizations o
    ON o.id = a.organization_id
LEFT JOIN mzcr_accreditation_basic_trunks bt
    ON bt.id_zakladni_kmen = a.basic_trunk_id
LEFT JOIN mzcr_accreditation_basic_fields bf
    ON bf.id_zakladni_obor = a.basic_field_id
LEFT JOIN mzcr_accreditation_specialized_trainings st
    ON st.id_vycvik = a.specialized_training_id
LEFT JOIN mzcr_accreditation_extension_fields ef
    ON ef.id_nastavbovy_obor = a.extension_field_id
LEFT JOIN mzcr_accreditation_certified_courses cc
    ON cc.id_certifikovany_kurz = a.certified_course_id
LEFT JOIN mzcr_accreditation_dental_specializations ds
    ON ds.id_spec_obor_zubni_lekari = a.dental_specialization_id
LEFT JOIN mzcr_accreditation_basic_trunks tbt
    ON tbt.id_zakladni_kmen = a.theory_basic_trunk_id
LEFT JOIN mzcr_accreditation_specialized_trainings tst
    ON tst.id_vycvik = a.theory_specialized_training_id
LEFT JOIN accreditation_categories categories
    ON categories.accreditation_id = a.id_akreditace
LEFT JOIN accreditation_workplace_types workplace_types
    ON workplace_types.accreditation_id = a.id_akreditace;
