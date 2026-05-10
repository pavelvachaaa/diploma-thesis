const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.join(
    __dirname,
    '../../src/database/migrations/036_mzcr_accreditations.sql'
);

describe('MZCR accreditations migration', () => {
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    it('keeps sync scoped to KZ without provider or workplace cache tables', () => {
        expect(migrationSql).not.toContain('target_ico');
        expect(migrationSql).not.toContain('CREATE TABLE mzcr_accreditation_providers');
        expect(migrationSql).not.toContain('CREATE TABLE mzcr_accreditation_workplaces');
        expect(migrationSql).not.toContain('CREATE TABLE mzcr_accreditation_workplace_organization_mappings');
        expect(migrationSql).not.toContain('provider_id');
        expect(migrationSql).not.toContain('provider_ico');
        expect(migrationSql).not.toContain('workplace_id');
    });

    it('defines source hashes and raw JSON for synchronized source tables', () => {
        expect(migrationSql.match(/source_hash TEXT/g)).toHaveLength(8);
        expect(migrationSql.match(/raw JSONB/g)).toHaveLength(8);
    });

    it('provides a unified accreditation view with organization fields for portal filters', () => {
        expect(migrationSql).toContain('CREATE VIEW mzcr_accreditations_view AS');
        expect(migrationSql).toContain('organization_id');
        expect(migrationSql).toContain('organization_name');
        expect(migrationSql).toContain('organization_seat_location');
        expect(migrationSql).toContain('specialty_type');
        expect(migrationSql).toContain('specialty_type_label_cs');
        expect(migrationSql).toContain('specialty_name');
        expect(migrationSql).toContain('is_currently_valid');
        expect(migrationSql).toContain('source_category_codes');
        expect(migrationSql).toContain('workplace_type_names');
        expect(migrationSql).toContain('mzcr_accreditation_workplace_type_assignments');
        expect(migrationSql).toContain('theory_basic_trunk');
    });
});
