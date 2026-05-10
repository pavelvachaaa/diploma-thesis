const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const KZ_TARGET_ICO = '25488627';

const CATALOGS = Object.freeze([
    'workplaceTypes',
    'basicTrunks',
    'basicFields',
    'specializedTrainings',
    'dentalSpecializations',
    'certifiedCourses',
    'extensionFields'
]);

const ACCREDITATION_CATEGORIES = Object.freeze([
    'basicTrunks',
    'basicFields',
    'specializedTrainings',
    'dentalSpecializations',
    'extensionFields',
    'certifiedCourses',
    'theoryBasicTrunks',
    'theorySpecializedTrainings',
    'midwives'
]);

const assertNonEmptyStringArray = (value, field) => {
    if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || item.length === 0)) {
        throw new ApplicationError('MZCR accreditation sync plan is invalid', {
            code: ErrorCode.INTERNAL_ERROR,
            details: { reasonCode: 'MZCR_ACCREDITATION_SYNC_PLAN_INVALID', field }
        });
    }
};

const create = () => {
    if (!/^\d{8}$/.test(KZ_TARGET_ICO)) {
        throw new ApplicationError('MZCR accreditation target ICO is invalid', {
            code: ErrorCode.INTERNAL_ERROR,
            details: { reasonCode: 'MZCR_ACCREDITATION_TARGET_ICO_INVALID' }
        });
    }

    assertNonEmptyStringArray(CATALOGS, 'catalogs');
    assertNonEmptyStringArray(ACCREDITATION_CATEGORIES, 'accreditationCategories');

    return Object.freeze({
        targetIco: KZ_TARGET_ICO,
        catalogs: Object.freeze([...CATALOGS]),
        accreditationCategories: Object.freeze([...ACCREDITATION_CATEGORIES])
    });
};

module.exports = {
    create
};
