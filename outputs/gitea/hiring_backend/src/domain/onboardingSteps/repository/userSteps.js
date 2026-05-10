const ALLOWED_USER_STEP_FIELDS = new Set([
    'acknowledged',
    'completed_at',
    'form_response',
    'validation_status',
    'submitted_at',
    'quiz_score',
    'passed'
]);

module.exports = ({ getExecutor, parseForm, createEmptyForm }) => {
    const findUserStepById = async (userStepId, userId, options = {}) => {
        const executor = getExecutor(options);

        const result = await executor.query(`
            SELECT
                ous.id,
                ous.user_id,
                ous.onboarding_step_id,
                ous.status,
                ous.acknowledged,
                ous.form_response,
                ous.quiz_score,
                ous.passed,
                ous.completed_at,
                os.organization_id,
                os.title,
                os.description,
                os.step_type,
                os.acknowledgment_text,
                os.is_mandatory,
                os.order_index,
                os.days_from_start,
                os.duration_days,
                os.instructions,
                os.metadata
            FROM user_onboarding_steps ous
            JOIN onboarding_steps os ON os.id = ous.onboarding_step_id
            WHERE ous.id = $1 AND ous.user_id = $2
        `, [userStepId, userId]);

        return result.rows[0] || null;
    };

    const updateUserStepStatus = async (userStepId, status, additionalFields = {}, options = {}) => {
        const executor = getExecutor(options);

        let setClause = 'status = $2';
        const values = [userStepId, status];
        let paramIndex = 3;

        for (const [field, value] of Object.entries(additionalFields || {})) {
            if (!ALLOWED_USER_STEP_FIELDS.has(field)) {
                throw new Error(`Unsupported user step update field: ${field}`);
            }

            setClause += `, ${field} = $${paramIndex}`;
            values.push(field === 'form_response' ? JSON.stringify(value) : value);
            paramIndex += 1;
        }

        const result = await executor.query(`
            UPDATE user_onboarding_steps
            SET ${setClause}
            WHERE id = $1
            RETURNING *
        `, values);

        return result.rows[0] || null;
    };

    const updateUserStepAcknowledgment = async (userStepId, acknowledged, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(`
            UPDATE user_onboarding_steps
            SET acknowledged = $2
            WHERE id = $1
            RETURNING id, status, acknowledged, completed_at
        `, [userStepId, acknowledged]);

        return result.rows[0] || null;
    };

    const updateUserStepFormResponse = async (userStepId, formResponse, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(`
            UPDATE user_onboarding_steps
            SET form_response = $2
            WHERE id = $1
            RETURNING id, form_response
        `, [userStepId, JSON.stringify(formResponse || {})]);

        return result.rows[0] || null;
    };

    const getUserStepFormResponse = async (userStepId, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(`
            SELECT form_response
            FROM user_onboarding_steps
            WHERE id = $1
        `, [userStepId]);

        return result.rows[0]?.form_response || {};
    };

    const completeUserStep = async (userStepId, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(`
            UPDATE user_onboarding_steps
            SET status = 'completed', completed_at = NOW()
            WHERE id = $1
            RETURNING id, status, completed_at
        `, [userStepId]);

        return result.rows[0] || null;
    };

    const skipUserStep = async (userStepId, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(`
            UPDATE user_onboarding_steps
            SET status = 'skipped'
            WHERE id = $1
            RETURNING id, status
        `, [userStepId]);

        return result.rows[0] || null;
    };

    const submitFormResponse = async (userStepId, answers, validationStatus = 'valid', options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(`
            UPDATE user_onboarding_steps
            SET
                form_response = $2,
                validation_status = $3,
                submitted_at = NOW()
            WHERE id = $1
            RETURNING id, form_response, validation_status, submitted_at
        `, [userStepId, JSON.stringify(answers || {}), validationStatus]);

        return result.rows[0] || null;
    };

    const getStepDetailsWithForm = async (userStepId, userId, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(`
            SELECT
                ous.id,
                ous.user_id,
                ous.onboarding_step_id,
                ous.status,
                ous.acknowledged,
                ous.form_response,
                ous.validation_status,
                ous.submitted_at,
                ous.quiz_score,
                ous.passed,
                ous.completed_at,
                os.organization_id,
                os.title,
                os.description,
                os.step_type,
                os.acknowledgment_text,
                os.is_mandatory,
                os.order_index,
                os.days_from_start,
                os.duration_days,
                os.instructions,
                os.metadata,
                os.form,
                os.form_status
            FROM user_onboarding_steps ous
            JOIN onboarding_steps os ON os.id = ous.onboarding_step_id
            WHERE ous.id = $1 AND ous.user_id = $2
        `, [userStepId, userId]);

        if (result.rows.length === 0) {
            return null;
        }

        const stepData = result.rows[0];
        if (stepData.form) {
            stepData.form = parseForm(stepData.form, stepData.onboarding_step_id) || createEmptyForm(stepData.onboarding_step_id);
        }

        return stepData;
    };

    const getStepDetailsWithFormForEmployee = async (userStepId, employeeId, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(`
            SELECT
                ous.id,
                ous.user_id,
                ous.onboarding_step_id,
                ous.status,
                ous.acknowledged,
                ous.form_response,
                ous.validation_status,
                ous.submitted_at,
                ous.quiz_score,
                ous.passed,
                ous.completed_at,
                os.organization_id,
                os.title,
                os.description,
                os.step_type,
                os.acknowledgment_text,
                os.is_mandatory,
                os.order_index,
                os.days_from_start,
                os.duration_days,
                os.instructions,
                os.metadata,
                os.form,
                os.form_status
            FROM user_onboarding_steps ous
            JOIN onboarding_steps os ON os.id = ous.onboarding_step_id
            WHERE ous.id = $1 AND ous.user_id = $2
        `, [userStepId, employeeId]);

        if (result.rows.length === 0) {
            return null;
        }

        const stepData = result.rows[0];
        if (stepData.form) {
            stepData.form = parseForm(stepData.form, stepData.onboarding_step_id) || createEmptyForm(stepData.onboarding_step_id);
        }

        return stepData;
    };

    const getPendingMandatorySteps = async (userId, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(`
            SELECT uos.id
            FROM user_onboarding_steps uos
            JOIN onboarding_steps os ON os.id = uos.onboarding_step_id
            WHERE uos.user_id = $1
              AND uos.status != 'completed'
              AND os.is_mandatory = true
        `, [userId]);

        return result.rows;
    };

    const getUserOrganization = async (userId, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(`
            SELECT
                u.organization_id,
                o.name as organization_name
            FROM users u
            LEFT JOIN organizations o ON u.organization_id = o.id
            WHERE u.id = $1
        `, [userId]);

        return result.rows[0] || null;
    };

    return {
        findUserStepById,
        updateUserStepStatus,
        updateUserStepAcknowledgment,
        updateUserStepFormResponse,
        getUserStepFormResponse,
        completeUserStep,
        skipUserStep,
        submitFormResponse,
        getStepDetailsWithForm,
        getStepDetailsWithFormForEmployee,
        getPendingMandatorySteps,
        getUserOrganization
    };
};
