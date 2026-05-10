module.exports = ({ sideEffectOutboxService }) => {
    const ensureOutbox = () => {
        if (!sideEffectOutboxService || typeof sideEffectOutboxService.enqueue !== 'function') {
            throw new Error('sideEffectOutboxService is required for employee lifecycle side effects');
        }
    };

    const queueWelcomeEmail = async ({ client, employee, plainPassword, idempotencyKey = null }) => {
        ensureOutbox();

        return sideEffectOutboxService.enqueue({
            eventType: sideEffectOutboxService.EVENT_TYPES.WELCOME_EMAIL,
            aggregateType: 'employee',
            aggregateId: employee.id,
            organizationId: employee.organization_id || null,
            payload: sideEffectOutboxService.buildWelcomePayload({
                employee,
                plainPassword
            })
        }, {
            client,
            idempotencyKey: idempotencyKey || `email.welcome.employee.${employee.id}`
        });
    };

    const buildEmployeeCreatedRoleNotificationPayload = ({ employee, applicantId, startDate, emailOutboxId = null }) => {
        return {
            type: 'user.created_from_applicant',
            organizationId: employee.organization_id,
            title: 'Nový zaměstnanec byl vytvořen',
            body: `Zaměstnanec ${employee.name} ${employee.surname || ''} byl vytvořen z uchazeče`,
            data: {
                applicantId,
                userId: employee.id,
                userName: `${employee.name} ${employee.surname || ''}`.trim(),
                userEmail: employee.email,
                startDate: startDate || null,
                emailSent: false,
                emailQueued: true,
                emailOutboxId
            },
            actionUrl: `/admin/employees/${employee.id}`,
            roleName: 'HR'
        };
    };

    const queueEmployeeCreatedRoleNotification = async ({
        client,
        employee,
        applicantId,
        startDate = null,
        emailOutboxId = null,
        idempotencyKey = null
    }) => {
        ensureOutbox();

        if (!employee?.organization_id) {
            return null;
        }

        return sideEffectOutboxService.enqueue({
            eventType: sideEffectOutboxService.EVENT_TYPES.ROLE_NOTIFICATION,
            aggregateType: 'employee',
            aggregateId: employee.id,
            organizationId: employee.organization_id,
            payload: buildEmployeeCreatedRoleNotificationPayload({
                employee,
                applicantId,
                startDate,
                emailOutboxId
            })
        }, {
            client,
            idempotencyKey: idempotencyKey || `notification.role.employee.created.${employee.id}`
        });
    };

    const buildDocumentStatusNotificationPayload = ({ employeeId, documentId, status }) => {
        if (status !== 'approved' && status !== 'rejected') {
            return null;
        }

        return {
            userId: employeeId,
            type: status === 'approved' ? 'document.approved' : 'document.rejected',
            title: status === 'approved' ? 'Dokument schválen' : 'Dokument zamítnut',
            body: status === 'approved' ? 'Váš dokument byl schválen' : 'Váš dokument byl zamítnut',
            data: {
                documentId,
                employeeId
            },
            actionUrl: '/employee/onboarding/dashboard',
            skipPreferences: false
        };
    };

    const queueDocumentStatusNotification = async ({
        client,
        employeeId,
        documentId,
        status,
        idempotencyKey = null
    }) => {
        ensureOutbox();

        const payload = buildDocumentStatusNotificationPayload({
            employeeId,
            documentId,
            status
        });

        if (!payload) {
            return null;
        }

        return sideEffectOutboxService.enqueue({
            eventType: sideEffectOutboxService.EVENT_TYPES.USER_NOTIFICATION,
            aggregateType: 'employee-document',
            aggregateId: documentId,
            organizationId: null,
            payload
        }, {
            client,
            idempotencyKey: idempotencyKey || null
        });
    };

    return {
        queueWelcomeEmail,
        buildEmployeeCreatedRoleNotificationPayload,
        queueEmployeeCreatedRoleNotification,
        buildDocumentStatusNotificationPayload,
        queueDocumentStatusNotification
    };
};
