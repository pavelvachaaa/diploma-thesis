const createShared = require('./shared');
const createWorkflowRepository = require('./workflows');
const createStepsRepository = require('./steps');
const createAssignmentsRepository = require('./assignments');

module.exports = ({ db }) => {
    const shared = createShared();
    const workflowRepository = createWorkflowRepository({
        db,
        ...shared
    });
    const stepsRepository = createStepsRepository({
        db,
        ...shared,
        getWorkflowById: workflowRepository.getWorkflowById
    });
    const assignmentsRepository = createAssignmentsRepository({
        db,
        ...shared
    });

    return {
        ...workflowRepository,
        ...stepsRepository,
        ...assignmentsRepository
    };
};
