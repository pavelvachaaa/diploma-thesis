const createService = require('../../src/domain/employees/service');
const { createMockLogger } = require('../helpers');

const buildMocks = () => {
    let outboxCall = 0;

    return {
        employeesRepository: {
            getEmployeeById: jest.fn().mockResolvedValue({
                id: 'emp-1',
                email: 'emp@example.com',
                name: 'Jan',
                surname: 'Novak',
                phone: null,
                is_active: true,
                organization_id: 'org-1',
                organization_name: 'KZ',
                role_name: 'user',
                created_at: '2026-03-01T12:00:00.000Z'
            }),
            getWorkflowById: jest.fn().mockResolvedValue({
                id: 'wf-1',
                organization_id: 'org-1'
            }),
            updateEmployeeRole: jest.fn().mockResolvedValue({}),
            deleteEmployeeFully: jest.fn(async (_employeeId, hooks = {}, _options = {}) => {
                const deletedEmployee = {
                    id: 'emp-1',
                    email: 'emp@example.com',
                    name: 'Jan',
                    surname: 'Novak',
                    organization_id: 'org-1',
                    role_name: 'user'
                };

                if (typeof hooks.onBeforeCommit === 'function') {
                    await hooks.onBeforeCommit({
                        client: {
                            query: jest.fn()
                        },
                        employee: deletedEmployee,
                        fileRefs: [
                            {
                                id: 'file-1',
                                bucket: 'documents',
                                object_key: 'user-documents/contract.pdf',
                                organization_id: 'org-1'
                            }
                        ]
                    });
                }

                return deletedEmployee;
            }),
            createEmployeeFromApplicant: jest.fn(async (_applicantId, _workflowId, _startDate, _notes, _passwordHash, hooks = {}) => {
                const newUser = {
                    id: 'emp-1',
                    email: 'emp@example.com',
                    name: 'Jan',
                    surname: 'Novak',
                    organization_id: 'org-1'
                };

                if (typeof hooks.onBeforeCommit === 'function') {
                    await hooks.onBeforeCommit({
                        client: {
                            query: jest.fn()
                        },
                        newUser,
                        applicant: { id: 'app-1' }
                    });
                }

                return newUser;
            }),
            updateDocumentStatus: jest.fn(async (employeeId, documentId, status, _notes, hooks = {}) => {
                if (typeof hooks.onBeforeCommit === 'function') {
                    await hooks.onBeforeCommit({
                        client: {
                            query: jest.fn()
                        },
                        employeeId,
                        documentId,
                        status
                    });
                }

                return {
                    id: 'user-document-1',
                    user_id: employeeId,
                    document_id: documentId,
                    status
                };
            })
        },
        audit: {
            writeAuditEvent: jest.fn().mockResolvedValue(undefined)
        },
        auditQueryPort: {
            getEmployeeEvents: jest.fn().mockResolvedValue({
                data: [{ id: 'audit-1' }],
                page: 0,
                limit: 10,
                total: 1
            })
        },
        applicantsQueryPort: {
            getApplicantById: jest.fn().mockResolvedValue({
                id: 'app-1',
                organization_id: 'org-1'
            }),
            getApplicantStatusHistory: jest.fn(),
            getAttachmentsByApplicantId: jest.fn(),
            getApplicantNotes: jest.fn(),
            getApplicantDossier: jest.fn()
        },
        membershipAccessPort: {
            ensureMembershipCreateAccess: jest.fn().mockResolvedValue({ granted: true })
        },
        employeeDocumentPort: {
            getEmployeeDocumentForDownload: jest.fn(),
            storeUserDocument: jest.fn()
        },
        employeeOnboardingQueryPort: {
            getDashboardDataForEmployee: jest.fn(),
            getOnboardingStepsForEmployee: jest.fn(),
            getProgressForEmployee: jest.fn()
        },
        employeeOnboardingStepPort: {
            getStepDetailsForEmployee: jest.fn()
        },
        emailSenderPort: {
            sendCustomEmail: jest.fn(),
            sendTestEmail: jest.fn(),
            sendWelcomeEmail: jest.fn(),
            getHealthStatus: jest.fn()
        },
        sideEffectOutboxService: {
            EVENT_TYPES: {
                WELCOME_EMAIL: 'email.welcome.v1',
                ROLE_NOTIFICATION: 'notification.role.v1',
                USER_NOTIFICATION: 'notification.user.v1'
            },
            enqueue: jest.fn().mockImplementation(async () => {
                outboxCall += 1;
                return { id: `outbox-${outboxCall}` };
            }),
            enqueueFileGcDelete: jest.fn().mockResolvedValue({ id: 'gc-1' }),
            buildWelcomePayload: jest.fn(() => ({ encryptedPassword: { algorithm: 'aes-256-gcm' } }))
        },
        logger: createMockLogger()
    };
};

describe('employees service application', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('createEmployeeFromApplicant enqueues welcome email and HR role notification', async () => {
        const mocks = buildMocks();
        const service = createService(mocks);

        const result = await service.createEmployeeFromApplicant('app-1', 'wf-1', null, null);

        expect(mocks.sideEffectOutboxService.enqueue).toHaveBeenCalledTimes(2);
        expect(mocks.sideEffectOutboxService.enqueue).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                eventType: 'email.welcome.v1',
                aggregateType: 'employee',
                aggregateId: 'emp-1'
            }),
            expect.objectContaining({
                idempotencyKey: 'email.welcome.employee.emp-1'
            })
        );
        expect(mocks.sideEffectOutboxService.enqueue).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                eventType: 'notification.role.v1',
                aggregateType: 'employee',
                aggregateId: 'emp-1'
            }),
            expect.objectContaining({
                idempotencyKey: 'notification.role.employee.created.emp-1'
            })
        );
        expect(result.emailQueued).toBe(true);
        expect(result.emailSent).toBe(false);
        expect(result.emailOutboxId).toBe('outbox-1');
    });

    it('createEmployeeFromApplicant bubbles enqueue failures to keep transaction atomic', async () => {
        const mocks = buildMocks();
        mocks.sideEffectOutboxService.enqueue.mockRejectedValueOnce(new Error('outbox enqueue failed'));
        const service = createService(mocks);

        await expect(
            service.createEmployeeFromApplicant('app-1', 'wf-1', null, null)
        ).rejects.toThrow('outbox enqueue failed');
    });

    it('createEmployeeFromApplicant checks membership access through the contract port', async () => {
        const mocks = buildMocks();
        const service = createService(mocks);

        await service.createEmployeeFromApplicant('app-1', 'wf-1', null, null, 'actor-1');

        expect(mocks.membershipAccessPort.ensureMembershipCreateAccess).toHaveBeenCalledWith({
            actorUserId: 'actor-1',
            organizationId: 'org-1',
            allowedRoles: ['hr', 'admin']
        });
    });

    it('updateDocumentStatus enqueues user notification for approved status', async () => {
        const mocks = buildMocks();
        const service = createService(mocks);

        const result = await service.updateDocumentStatus('emp-1', 'doc-1', 'approved');

        expect(mocks.sideEffectOutboxService.enqueue).toHaveBeenCalledTimes(1);
        expect(mocks.sideEffectOutboxService.enqueue).toHaveBeenCalledWith(
            expect.objectContaining({
                eventType: 'notification.user.v1',
                aggregateType: 'employee-document',
                aggregateId: 'doc-1',
                payload: expect.objectContaining({
                    userId: 'emp-1',
                    type: 'document.approved'
                })
            }),
            expect.objectContaining({
                client: expect.any(Object)
            })
        );
        expect(result.status).toBe('approved');
    });

    it('updateDocumentStatus does not enqueue notification for pending status', async () => {
        const mocks = buildMocks();
        const service = createService(mocks);

        await service.updateDocumentStatus('emp-1', 'doc-1', 'pending');

        expect(mocks.sideEffectOutboxService.enqueue).not.toHaveBeenCalled();
    });

    it('getEmployeeAuditEvents delegates to audit service with actor filter', async () => {
        const mocks = buildMocks();
        const service = createService(mocks);

        const result = await service.getEmployeeAuditEvents('emp-1', {
            page: 2,
            limit: 5,
            status: 'failure'
        }, {
            id: 'super-1',
            roles: ['super_admin']
        });

        expect(mocks.auditQueryPort.getEmployeeEvents).toHaveBeenCalledWith('emp-1', {
            page: 2,
            limit: 5,
            status: 'failure'
        }, {
            id: 'super-1',
            roles: ['super_admin']
        });
        expect(result).toEqual({
            data: [{ id: 'audit-1' }],
            page: 0,
            limit: 10,
            total: 1
        });
    });

    it('updateDocumentStatus bubbles enqueue failures to keep transaction atomic', async () => {
        const mocks = buildMocks();
        mocks.sideEffectOutboxService.enqueue.mockRejectedValueOnce(new Error('notification enqueue failed'));
        const service = createService(mocks);

        await expect(
            service.updateDocumentStatus('emp-1', 'doc-1', 'approved')
        ).rejects.toThrow('notification enqueue failed');
    });

    it('deleteEmployeeFully is allowed only for super admin and enqueues file cleanup', async () => {
        const mocks = buildMocks();
        const service = createService(mocks);

        const result = await service.deleteEmployeeFully('emp-1', {
            id: 'super-1',
            roles: ['super_admin']
        });

        expect(mocks.employeesRepository.deleteEmployeeFully).toHaveBeenCalledWith(
            'emp-1',
            expect.objectContaining({
                onBeforeCommit: expect.any(Function)
            }),
            expect.objectContaining({
                deletedByUserId: 'super-1'
            })
        );
        expect(mocks.sideEffectOutboxService.enqueueFileGcDelete).toHaveBeenCalledWith(
            expect.objectContaining({
                fileId: 'file-1',
                bucket: 'documents',
                objectKey: 'user-documents/contract.pdf',
                reason: 'employee_full_delete',
                sourceModule: 'employees.deleteEmployeeFully'
            }),
            expect.objectContaining({
                client: expect.any(Object)
            })
        );
        expect(mocks.audit.writeAuditEvent).toHaveBeenCalledWith({
            category: 'employee',
            action: 'employee.delete',
            status: 'success',
            resourceType: 'employee',
            resourceId: 'emp-1',
            organizationId: 'org-1',
            target: 'Jan Novak <emp@example.com>',
            beforeState: {
                id: 'emp-1',
                email: 'emp@example.com',
                name: 'Jan',
                surname: 'Novak',
                phone: null,
                is_active: true,
                organization_id: 'org-1',
                organization_name: 'KZ',
                role_name: 'user',
                created_at: '2026-03-01T12:00:00.000Z'
            },
            afterState: null,
            metadata: {
                deletedBy: 'super-1',
                deletedRole: 'user'
            }
        });
        expect(result).toEqual(expect.objectContaining({
            id: 'emp-1'
        }));
    });

    it('deleteEmployeeFully rejects non-super-admin users', async () => {
        const mocks = buildMocks();
        const service = createService(mocks);

        await expect(
            service.deleteEmployeeFully('emp-1', {
                id: 'admin-1',
                roles: ['admin']
            })
        ).rejects.toThrow('Only super admins can fully delete employees');
        expect(mocks.audit.writeAuditEvent).not.toHaveBeenCalled();
    });

    it('deleteEmployeeFully prevents self-deletion', async () => {
        const mocks = buildMocks();
        const service = createService(mocks);

        await expect(
            service.deleteEmployeeFully('super-1', {
                id: 'super-1',
                roles: ['super_admin']
            })
        ).rejects.toThrow('You cannot fully delete your own account');
        expect(mocks.audit.writeAuditEvent).not.toHaveBeenCalled();
    });
});
