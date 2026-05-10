const {
    RESOURCE_TYPES,
    ACCESS_LEVELS,
    addPermissionExists
} = require('@shared/authz/rebacSql');

module.exports = ({ getExecutor, parseForm, createEmptyForm }) => {
    const addOrganizationAcl = ({
        params,
        actorUserId,
        resourceAlias = 'os',
        minAccess = ACCESS_LEVELS.READ
    }) => addPermissionExists({
        params,
        actorUserId,
        resourceType: RESOURCE_TYPES.ORGANIZATION,
        resourceAlias,
        resourceIdColumn: 'organization_id',
        minAccess
    });

    const getStepForm = async (onboardingStepId, options = {}) => {
        const executor = getExecutor(options);
        const params = [onboardingStepId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = ` AND ${addOrganizationAcl({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.READ
            })}`;
        }

        const result = await executor.query(`
            SELECT form, form_status
            FROM onboarding_steps
            WHERE id = $1
            ${aclClause}
        `, params);

        if (result.rows.length === 0) {
            return null;
        }

        const stepData = result.rows[0];
        const form = parseForm(stepData.form, onboardingStepId) || createEmptyForm(onboardingStepId);

        return {
            ...form,
            form_status: stepData.form_status
        };
    };

    const getStepFormFields = async (onboardingStepId, options = {}) => {
        const form = await getStepForm(onboardingStepId, options);
        return form?.fields || [];
    };

    const getRequiredFormFields = async (onboardingStepId, options = {}) => {
        const form = await getStepForm(onboardingStepId, options);
        return form?.fields?.filter((field) => field.required) || [];
    };

    const updateStepForm = async (onboardingStepId, formDefinition, formStatus = 'published', options = {}) => {
        const executor = getExecutor(options);
        const params = [onboardingStepId, JSON.stringify(formDefinition || {}), formStatus];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = ` AND ${addOrganizationAcl({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.WRITE
            })}`;
        }

        const result = await executor.query(`
            UPDATE onboarding_steps
            SET
                form = $2,
                form_status = $3
            WHERE id = $1
            ${aclClause}
            RETURNING id, form, form_status
        `, params);

        return result.rows[0] || null;
    };

    const getAllStepForms = async (organizationId, options = {}) => {
        const executor = getExecutor(options);
        const params = [organizationId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = ` AND ${addOrganizationAcl({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.READ
            })}`;
        }

        const result = await executor.query(`
            SELECT
                id,
                title,
                description,
                step_type,
                form,
                form_status,
                is_mandatory,
                order_index
            FROM onboarding_steps
            WHERE organization_id = $1
            ${aclClause}
            ORDER BY order_index ASC
        `, params);

        return result.rows.map((step) => ({
            ...step,
            form: parseForm(step.form, step.id)
        }));
    };

    return {
        getStepForm,
        getStepFormFields,
        getRequiredFormFields,
        updateStepForm,
        getAllStepForms
    };
};
