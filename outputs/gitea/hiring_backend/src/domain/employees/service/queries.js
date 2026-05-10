module.exports = ({
    employeesRepository,
    auditQueryPort,
    applicantsQueryPort
}) => {
    const getAllEmployees = async (options = {}) => employeesRepository.getAllEmployees(options);

    const getEmployeeById = async (id, options = {}) => employeesRepository.getEmployeeById(id, options);

    const getEmployeeAuditEvents = async (employeeId, filters = {}, user = {}) => {
        return auditQueryPort.getEmployeeEvents(employeeId, filters, user);
    };

    const getAllRoles = async () => {
        return employeesRepository.getAllRoles();
    };

    const getEmployeeApplicantData = async (employeeId, options = {}) => {
        const employee = await employeesRepository.getEmployeeById(employeeId, options);

        if (!employee || !employee.applicant_id) {
            return null;
        }

        const applicantOptions = {
            actorUserId: options.actorUserId || null,
            minAccess: options.minAccess || 'read'
        };

        const [applicant, history, attachments, notes] = await Promise.all([
            applicantsQueryPort.getApplicantById(employee.applicant_id, applicantOptions),
            applicantsQueryPort.getApplicantStatusHistory(employee.applicant_id, applicantOptions),
            applicantsQueryPort.getAttachmentsByApplicantId(employee.applicant_id, applicantOptions),
            applicantsQueryPort.getApplicantNotes(employee.applicant_id, applicantOptions)
        ]);

        return {
            employee,
            applicant,
            history,
            attachments,
            notes
        };
    };

    return {
        getAllEmployees,
        getEmployeeById,
        getEmployeeAuditEvents,
        getAllRoles,
        getEmployeeApplicantData
    };
};
