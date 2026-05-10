const { createContractPort } = require('@shared/contracts/runtime');
const {
    entityId,
    objectShape,
    arrayOf,
    tuple
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    cloneDtoArray,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');

const dashboardDto = objectShape({}, { allowExtra: true });
const onboardingStepListDto = objectShape({}, { allowExtra: true });
const progressDto = objectShape({}, { allowExtra: true });
const onboardingSnapshotDto = objectShape({
    dashboard: dashboardDto,
    steps: arrayOf(onboardingStepListDto),
    progress: progressDto
}, { allowExtra: true });

module.exports = ({ employeeOnboardingService }) => {
    const {
        getDashboardDataForEmployee,
        getOnboardingStepsForEmployee,
        getProgressForEmployee
    } = requireServiceMethods(
        employeeOnboardingService,
        'employeeOnboardingService',
        'EmployeeOnboardingQueryPort',
        ['getDashboardDataForEmployee', 'getOnboardingStepsForEmployee', 'getProgressForEmployee']
    );

    return createContractPort({
        portName: 'EmployeeOnboardingQueryPort',
        methods: {
            getDashboardDataForEmployee: {
                input: tuple(entityId),
                output: dashboardDto,
                impl: async (employeeId) => cloneDto(await getDashboardDataForEmployee(employeeId))
            },
            getOnboardingStepsForEmployee: {
                input: tuple(entityId),
                output: arrayOf(onboardingStepListDto),
                impl: async (employeeId) => cloneDtoArray(await getOnboardingStepsForEmployee(employeeId))
            },
            getProgressForEmployee: {
                input: tuple(entityId),
                output: progressDto,
                impl: async (employeeId) => cloneDto(await getProgressForEmployee(employeeId))
            },
            getEmployeeOnboardingSnapshot: {
                input: tuple(entityId),
                output: onboardingSnapshotDto,
                impl: async (employeeId) => {
                    const [dashboard, steps, progress] = await Promise.all([
                        getDashboardDataForEmployee(employeeId),
                        getOnboardingStepsForEmployee(employeeId),
                        getProgressForEmployee(employeeId)
                    ]);

                    return {
                        dashboard: cloneDto(dashboard),
                        steps: cloneDtoArray(steps),
                        progress: cloneDto(progress)
                    };
                }
            }
        }
    });
};
