module.exports = () => {
    const WORKFLOW_EVENT_TYPES = Object.freeze({
        ASSIGNED_TO_JOB_ROLE: 'workflow.assigned_to_job_role',
        REMOVED_FROM_JOB_ROLE: 'workflow.removed_from_job_role'
    });

    const buildWorkflowAssignmentIdempotencyKey = (jobRoleId, workflowId) =>
        `workflow.assignment.${jobRoleId}.${workflowId}`;

    return {
        WORKFLOW_EVENT_TYPES,
        buildWorkflowAssignmentIdempotencyKey
    };
};
