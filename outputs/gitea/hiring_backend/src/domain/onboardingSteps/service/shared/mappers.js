const toStep = (stepDetails) => ({
    id: stepDetails.onboarding_step_id,
    title: stepDetails.title,
    description: stepDetails.description,
    step_type: stepDetails.step_type,
    acknowledgment_text: stepDetails.acknowledgment_text,
    is_mandatory: stepDetails.is_mandatory,
    order_index: stepDetails.order_index,
    days_from_start: stepDetails.days_from_start,
    duration_days: stepDetails.duration_days,
    instructions: stepDetails.instructions,
    metadata: stepDetails.metadata
});

const toUserStep = (stepDetails) => ({
    id: stepDetails.id,
    status: stepDetails.status,
    acknowledged: stepDetails.acknowledged || false,
    form_response: stepDetails.form_response || {},
    validation_status: stepDetails.validation_status || 'unvalidated',
    submitted_at: stepDetails.submitted_at,
    quiz_score: stepDetails.quiz_score,
    passed: stepDetails.passed,
    completed_at: stepDetails.completed_at
});

const toStepDetailsResponse = (stepDetails, documents) => ({
    step: toStep(stepDetails),
    form: stepDetails.form,
    documents,
    userStep: toUserStep(stepDetails)
});

const toStepDetailsForEmployeeResponse = (stepDetails, documents, employeeId) => ({
    step: toStep(stepDetails),
    form: stepDetails.form,
    documents,
    userStepProgress: toUserStep(stepDetails),
    employee_id: employeeId
});

module.exports = {
    toStep,
    toUserStep,
    toStepDetailsResponse,
    toStepDetailsForEmployeeResponse
};
