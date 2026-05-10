const createTxRunner = require('@shared/transaction/createTxRunner');

module.exports = ({ db, transactionManager }) => {
    const { runInTransaction } = createTxRunner({
        db,
        transactionManager,
        defaultLabel: 'employeeOnboarding.repository'
    });

    const getDashboardData = async (userId) => {
        // Get user info with organization and workflow details
        const userQuery = `
            SELECT
                u.id,
                u.name,
                u.surname,
                u.email,
                o.name as organization_name,
                w.name as workflow_name,
                u.created_at::date as start_date
            FROM users u
            LEFT JOIN organizations o ON u.organization_id = o.id
            LEFT JOIN onboarding_workflows w ON u.onboarding_workflow_id = w.id
            WHERE u.id = $1
        `;
        const userResult = await db.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            throw new Error('User not found');
        }

        const user = userResult.rows[0];

        // Get onboarding steps with user progress
        const steps = await getOnboardingSteps(userId);

        // Get required documents with user progress
        const documents = await getRequiredDocuments(userId);

        // Calculate progress
        const progress = await getProgress(userId);

        return {
            user,
            steps,
            documents,
            progress
        };
    };

    const getOnboardingSteps = async (userId) => {
        return runInTransaction(async (client) => {
            // First, ensure all user_onboarding_steps records exist
            // Use ON CONFLICT to prevent duplicates from race conditions
            await client.query(`
                INSERT INTO user_onboarding_steps (id, user_id, onboarding_step_id, status)
                SELECT
                    gen_random_uuid(),
                    $1,
                    ws.onboarding_step_id,
                    'not_started'
                FROM users u
                JOIN workflow_steps ws ON u.onboarding_workflow_id = ws.workflow_id
                WHERE u.id = $1
                ON CONFLICT (user_id, onboarding_step_id) DO NOTHING
            `, [userId]);

            // Now get all steps with user step IDs - ensuring proper filtering by user
            const query = `
                SELECT DISTINCT
                    uos.id as user_step_id,
                    os.id,
                    os.title,
                    os.description,
                    os.step_type,
                    os.days_from_start,
                    os.duration_days,
                    os.is_mandatory,
                    os.instructions,
                    uos.status,
                    uos.completed_at,
                    ws.order_index
                FROM user_onboarding_steps uos
                JOIN onboarding_steps os ON os.id = uos.onboarding_step_id
                JOIN users u ON u.id = uos.user_id
                JOIN workflow_steps ws ON (ws.onboarding_step_id = os.id AND ws.workflow_id = u.onboarding_workflow_id)
                WHERE uos.user_id = $1
                ORDER BY ws.order_index ASC
            `;

            const result = await client.query(query, [userId]);
            return result.rows;
        }, { label: 'employeeOnboarding.getOnboardingSteps' });
    };

    const startStep = async (userId, stepId) => {
        await runInTransaction(async (client) => {
            // Use UPSERT to handle race conditions - only update status if currently 'not_started'
            // This prevents overwriting 'completed' or 'in_progress' states
            await client.query(
                `INSERT INTO user_onboarding_steps (id, user_id, onboarding_step_id, status)
                 VALUES (gen_random_uuid(), $1, $2, 'in_progress')
                 ON CONFLICT (user_id, onboarding_step_id)
                 DO UPDATE SET
                     status = CASE
                         WHEN user_onboarding_steps.status = 'not_started' THEN 'in_progress'
                         ELSE user_onboarding_steps.status
                     END`,
                [userId, stepId]
            );
        }, { label: 'employeeOnboarding.startStep' });
    };

    const completeStep = async (userId, stepId) => {
        await runInTransaction(async (client) => {
            // Use UPSERT to handle race conditions - always set to completed unless already completed
            await client.query(
                `INSERT INTO user_onboarding_steps (id, user_id, onboarding_step_id, completed_at, status)
                 VALUES (gen_random_uuid(), $1, $2, NOW(), 'completed')
                 ON CONFLICT (user_id, onboarding_step_id)
                 DO UPDATE SET
                     completed_at = COALESCE(user_onboarding_steps.completed_at, NOW()),
                     status = CASE
                         WHEN user_onboarding_steps.status = 'completed' THEN 'completed'
                         ELSE 'completed'
                     END`,
                [userId, stepId]
            );
        }, { label: 'employeeOnboarding.completeStep' });
    };

    const getRequiredDocuments = async (userId) => {
        const userQuery = `
            SELECT id, applicant_id, onboarding_workflow_id
            FROM users
            WHERE id = $1
        `;
        const userResult = await db.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            throw new Error('User not found');
        }

        const user = userResult.rows[0];

        // If user has no applicant_id, return empty array
        if (!user.applicant_id) {
            return [];
        }

        const query = `
            SELECT
                od.id,
                od.name,
                od.description,
                dt.name as document_type,
                jrrd.is_mandatory,
                CASE
                    WHEN uf.object_key IS NOT NULL AND uod.status = 'approved' THEN 'approved'
                    WHEN uf.object_key IS NOT NULL AND uod.status = 'rejected' THEN 'rejected'
                    WHEN uf.object_key IS NOT NULL THEN 'uploaded'
                    ELSE 'pending'
                END as status,
                uod.uploaded_at,
                uf.object_key as file_path,
                uf.bucket as file_bucket,
                uod.id as user_document_id,
                -- Template information from onboarding_documents table
                tf.original_filename as template_file,
                CASE
                    WHEN tf.object_key IS NOT NULL AND tf.original_filename IS NOT NULL THEN true
                    ELSE false
                END as has_template
            FROM applicants a
            INNER JOIN job_postings_with_status jp ON jp.id = a.job_posting_id
            INNER JOIN job_role_required_documents jrrd ON jrrd.job_role_id = jp.job_role_id
            INNER JOIN onboarding_documents od ON od.id = jrrd.document_id
            LEFT JOIN document_types dt ON od.type_id = dt.id
            LEFT JOIN user_documents uod ON (od.id = uod.document_id AND uod.user_id = $1)
            LEFT JOIN files uf ON uf.id = uod.file_id
            LEFT JOIN files tf ON tf.id = od.template_file_id
            WHERE a.id = $2
            ORDER BY jrrd.is_mandatory DESC, od.name ASC
        `;

        const result = await db.query(query, [userId, user.applicant_id]);
        return result.rows;
    };

    // uploadDocument is now handled by onboardingDocumentsService.storeUserDocument()

    // getDocumentForDownload is now handled by onboardingDocumentsService.getUserDocumentForDownload()

    const getProgress = async (userId) => {
        // Get steps progress
        const stepsQuery = `
            SELECT
                COUNT(*) as total,
                COUNT(uos.completed_at) as completed
            FROM onboarding_steps os
            JOIN workflow_steps ws ON os.id = ws.onboarding_step_id
            JOIN users u ON u.onboarding_workflow_id = ws.workflow_id
            LEFT JOIN user_onboarding_steps uos ON (os.id = uos.onboarding_step_id AND u.id = uos.user_id)
            WHERE u.id = $1
        `;

        const stepsResult = await db.query(stepsQuery, [userId]);
        const stepsData = stepsResult.rows[0];

        // Get documents progress - get actual required documents for this user
        const docsQuery = `
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN ud.file_id IS NOT NULL THEN 1 END) as uploaded
            FROM applicants a
            INNER JOIN job_postings_with_status jp ON jp.id = a.job_posting_id
            INNER JOIN job_role_required_documents jrrd ON jrrd.job_role_id = jp.job_role_id
            INNER JOIN onboarding_documents od ON od.id = jrrd.document_id
            LEFT JOIN user_documents ud ON (od.id = ud.document_id AND ud.user_id = $1)
            WHERE a.id = (SELECT applicant_id FROM users WHERE id = $1)
        `;

        const docsResult = await db.query(docsQuery, [userId]);
        const docsData = docsResult.rows[0];

        const stepsProgress = stepsData.total > 0 ? Math.round((stepsData.completed / stepsData.total) * 100) : 0;
        const documentsProgress = docsData.total > 0 ? Math.round((docsData.uploaded / docsData.total) * 100) : 0;
        const overallProgress = Math.round((stepsProgress + documentsProgress) / 2);

        return {
            overall_progress: overallProgress,
            steps: {
                completed: parseInt(stepsData.completed),
                total: parseInt(stepsData.total)
            },
            documents: {
                uploaded: parseInt(docsData.uploaded),
                total: parseInt(docsData.total)
            },
            document_progress: documentsProgress
        };
    };

    return {
        getDashboardData, getOnboardingSteps, startStep, completeStep,
        getRequiredDocuments, getProgress
    };
};
