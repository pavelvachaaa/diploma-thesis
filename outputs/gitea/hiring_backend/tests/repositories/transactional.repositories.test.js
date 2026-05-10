const { createMockLogger } = require('../helpers');

const createSectionItemsApplication = require('../../src/core/sectionItems/application');
const createSectionItemsUnitOfWorkAdapter = require('../../src/adapters/out/integration/sectionItems/unitOfWork');
const createAuthRepository = require('../../src/adapters/out/persistence/auth');
const createEmployeeOnboardingRepository = require('../../src/domain/employeeOnboarding/repository');
const createRoleAssignmentsUnitOfWorkAdapter = require('../../src/adapters/out/integration/roleAssignments/unitOfWork');
const createJobsRepository = require('../../src/adapters/out/persistence/jobs');
const createInterviewsLifecycleRepository = require('../../src/domain/interviews/repository/lifecycle');
const createEmployeesRepository = require('../../src/domain/employees/repository');

describe('transactional repositories centralization', () => {
    it('sectionItems application uses unit-of-work for updateOrderIndices and replaceJobRoleSectionItems', async () => {
        const txClient = {
            query: jest.fn()
        };
        const transactionManager = {
            runInTransaction: jest.fn(async (callback, options) => callback(txClient, options))
        };
        const sectionItemsCatalogStorePort = {
            updateOrderIndex: jest.fn().mockResolvedValue(undefined)
        };
        const jobRoleSectionItemsStorePort = {
            replaceJobRoleSectionItems: jest.fn().mockResolvedValue(undefined)
        };
        const application = createSectionItemsApplication({
            sectionItemsCatalogStorePort,
            jobRoleSectionItemsStorePort,
            sectionItemsUnitOfWorkPort: createSectionItemsUnitOfWorkAdapter({
                transactionManager
            })
        });

        await application.updateOrderIndices([
            { id: 'item-1', order_index: 1 },
            { id: 'item-2', order_index: 2 }
        ]);
        await application.replaceJobRoleSectionItems('role-1', 'requirements', [
            { section_item_id: 's1', custom_text: null }
        ]);

        expect(sectionItemsCatalogStorePort.updateOrderIndex).toHaveBeenNthCalledWith(
            1,
            'item-1',
            1,
            { client: txClient }
        );
        expect(jobRoleSectionItemsStorePort.replaceJobRoleSectionItems).toHaveBeenCalledWith(
            'role-1',
            'requirements',
            [{ section_item_id: 's1', custom_text: null }],
            { client: txClient }
        );
        expect(transactionManager.runInTransaction).toHaveBeenNthCalledWith(1, expect.any(Function), expect.objectContaining({
            label: 'sectionItems.updateOrderIndices'
        }));
        expect(transactionManager.runInTransaction).toHaveBeenNthCalledWith(2, expect.any(Function), expect.objectContaining({
            label: 'sectionItems.replaceJobRoleSectionItems'
        }));
    });

    it('sectionItems updateOrderIndices propagates transactional errors', async () => {
        const txClient = {
            query: jest.fn()
        };
        const transactionManager = {
            runInTransaction: jest.fn(async (callback) => callback(txClient))
        };
        const sectionItemsCatalogStorePort = {
            updateOrderIndex: jest.fn().mockRejectedValue(new Error('update failed'))
        };
        const application = createSectionItemsApplication({
            sectionItemsCatalogStorePort,
            jobRoleSectionItemsStorePort: {},
            sectionItemsUnitOfWorkPort: createSectionItemsUnitOfWorkAdapter({
                transactionManager
            })
        });

        await expect(application.updateOrderIndices([{ id: 'item-1', order_index: 1 }])).rejects.toThrow('update failed');
    });

    it('sectionItems unit-of-work adapter supplies a default label', async () => {
        const txClient = {
            query: jest.fn()
        };
        const transactionManager = {
            runInTransaction: jest.fn(async (callback) => callback(txClient))
        };
        const unitOfWork = createSectionItemsUnitOfWorkAdapter({
            transactionManager
        });

        const result = await unitOfWork.runInTransaction(async (client) => ({ client }));

        expect(result).toEqual({ client: txClient });
        expect(transactionManager.runInTransaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({
            label: 'sectionItems.application'
        }));
    });

    it('auth repository createOAuthUser runs inside transactionManager', async () => {
        const txClient = {
            query: jest.fn(async (sql, params = []) => {
                if (sql.includes('SELECT id') && sql.includes('FROM user_roles')) {
                    return { rows: [{ id: 'role-hr' }] };
                }
                if (sql.includes('INSERT INTO users')) {
                    return { rows: [{ id: 'user-1', email: params[0] }] };
                }
                return { rows: [] };
            })
        };
        const transactionManager = {
            runInTransaction: jest.fn(async (callback) => callback(txClient))
        };
        const repository = createAuthRepository({
            db: { query: jest.fn(), getClient: jest.fn() },
            transactionManager
        });

        const result = await repository.createOAuthUser({
            email: 'OAuth@Example.COM',
            name: 'OAuth',
            surname: 'User',
            organization_id: 'org-1',
            defaultRole: 'hr'
        });

        expect(result.user).toEqual(expect.objectContaining({
            id: 'user-1',
            email: 'oauth@example.com'
        }));
        expect(transactionManager.runInTransaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({
            label: 'auth.createOAuthUser'
        }));
    });

    it('auth repository createOAuthUser propagates transactional failures', async () => {
        const txClient = {
            query: jest.fn().mockRejectedValue(new Error('insert failed'))
        };
        const transactionManager = {
            runInTransaction: jest.fn(async (callback) => callback(txClient))
        };
        const repository = createAuthRepository({
            db: { query: jest.fn(), getClient: jest.fn() },
            transactionManager
        });

        await expect(repository.createOAuthUser({
            email: 'OAuth@Example.COM'
        })).rejects.toThrow('insert failed');
    });

    it('employeeOnboarding repository transactional methods use transactionManager', async () => {
        const txClient = {
            query: jest.fn(async (sql) => {
                if (sql.includes('SELECT DISTINCT')) {
                    return { rows: [{ id: 'step-1', title: 'Step' }] };
                }
                return { rows: [] };
            })
        };
        const transactionManager = {
            runInTransaction: jest.fn(async (callback) => callback(txClient))
        };
        const repository = createEmployeeOnboardingRepository({
            db: { query: jest.fn() },
            transactionManager
        });

        const steps = await repository.getOnboardingSteps('user-1');
        await repository.startStep('user-1', 'step-1');
        await repository.completeStep('user-1', 'step-1');

        expect(steps).toEqual([{ id: 'step-1', title: 'Step' }]);
        expect(transactionManager.runInTransaction).toHaveBeenNthCalledWith(1, expect.any(Function), expect.objectContaining({
            label: 'employeeOnboarding.getOnboardingSteps'
        }));
        expect(transactionManager.runInTransaction).toHaveBeenNthCalledWith(2, expect.any(Function), expect.objectContaining({
            label: 'employeeOnboarding.startStep'
        }));
        expect(transactionManager.runInTransaction).toHaveBeenNthCalledWith(3, expect.any(Function), expect.objectContaining({
            label: 'employeeOnboarding.completeStep'
        }));
    });

    it('roleAssignments unit-of-work adapter delegates write boundaries to transactionManager', async () => {
        const txClient = {
            query: jest.fn()
        };
        const transactionManager = {
            runInTransaction: jest.fn(async (callback) => callback(txClient))
        };
        const unitOfWork = createRoleAssignmentsUnitOfWorkAdapter({
            transactionManager
        });

        const result = await unitOfWork.runInTransaction(
            async (client) => ({ client }),
            { label: 'roleAssignments.createOrganizationMembership' }
        );

        expect(result).toEqual({ client: txClient });
        expect(transactionManager.runInTransaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({
            label: 'roleAssignments.createOrganizationMembership'
        }));
    });

    it('jobs repository saveJob and deleteJob run inside transactionManager', async () => {
        const txClient = {
            query: jest.fn(async (sql) => {
                if (sql.startsWith('INSERT INTO job_postings')) {
                    return { rows: [{ id: 'job-1', title: 'Nurse' }] };
                }
                if (sql.includes('DELETE FROM job_postings')) {
                    return { rows: [{ id: 'job-1' }] };
                }
                return { rows: [] };
            })
        };
        const transactionManager = {
            runInTransaction: jest.fn(async (callback) => callback(txClient))
        };
        const db = {
            query: jest.fn().mockResolvedValue({ rows: [] }),
            getClient: jest.fn()
        };
        const repository = createJobsRepository({
            db,
            logger: createMockLogger(),
            transactionManager
        });

        const saved = await repository.saveJob(null, {
            title: 'Nurse',
            sections: {}
        });
        const deleted = await repository.deleteJob('job-1');

        expect(saved).toEqual(expect.objectContaining({
            id: 'job-1',
            sections: {}
        }));
        expect(deleted).toEqual({ id: 'job-1' });
        expect(transactionManager.runInTransaction).toHaveBeenNthCalledWith(1, expect.any(Function), expect.objectContaining({
            label: 'jobs.saveJob'
        }));
        expect(transactionManager.runInTransaction).toHaveBeenNthCalledWith(2, expect.any(Function), expect.objectContaining({
            label: 'jobs.deleteJob'
        }));
    });

    it('jobs repository deleteJob propagates transactional failures', async () => {
        const txClient = {
            query: jest.fn().mockRejectedValue(new Error('delete failed'))
        };
        const transactionManager = {
            runInTransaction: jest.fn(async (callback) => callback(txClient))
        };
        const repository = createJobsRepository({
            db: { query: jest.fn(), getClient: jest.fn() },
            logger: createMockLogger(),
            transactionManager
        });

        await expect(repository.deleteJob('job-1')).rejects.toThrow('delete failed');
    });

    it('employees repository deleteEmployeeFully runs inside transactionManager', async () => {
        const txClient = {
            query: jest.fn(async (sql, params = []) => {
                if (sql.includes('FROM users u') && sql.includes('LEFT JOIN user_roles ur')) {
                    return { rows: [{ id: 'user-1', email: 'user@example.com', organization_id: 'org-1' }] };
                }
                if (sql.includes('FROM user_documents ud') && sql.includes('JOIN files f')) {
                    return { rows: [{ id: 'file-1', bucket: 'documents', object_key: 'user-documents/doc.pdf', organization_id: 'org-1' }] };
                }
                if (sql.includes('FROM direct_messages dm') && sql.includes('JOIN direct_message_attachments dma')) {
                    return { rows: [] };
                }
                if (sql.startsWith('DELETE FROM users')) {
                    return { rows: [{ id: params[0], email: 'user@example.com' }] };
                }
                return { rows: [] };
            })
        };
        const transactionManager = {
            runInTransaction: jest.fn(async (callback) => callback(txClient))
        };
        const repository = createEmployeesRepository({
            db: { query: jest.fn(), getClient: jest.fn() },
            transactionManager
        });

        const deleted = await repository.deleteEmployeeFully('user-1');

        expect(deleted).toEqual(expect.objectContaining({
            id: 'user-1'
        }));
        expect(transactionManager.runInTransaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({
            label: 'employees.deleteFully'
        }));
        expect(txClient.query).toHaveBeenCalledWith(
            expect.stringContaining('DELETE FROM users'),
            ['user-1']
        );
    });

    it('interviews lifecycle repository create and updateStatus run inside transactionManager', async () => {
        const txClient = {
            query: jest.fn(async (sql) => {
                if (sql.includes('INSERT INTO interview_events')) {
                    return { rows: [{ id: 'int-1' }] };
                }
                if (sql.includes('SELECT ie.status') || sql.includes('SELECT status FROM interview_events')) {
                    return { rows: [{ status: 'scheduled' }] };
                }
                if (sql.includes('UPDATE interview_events')) {
                    return { rows: [{ id: 'int-1', status: 'cancelled' }] };
                }
                return { rows: [] };
            })
        };
        const transactionManager = {
            runInTransaction: jest.fn(async (callback) => callback(txClient))
        };
        const logger = createMockLogger();
        const repository = createInterviewsLifecycleRepository({
            db: { query: jest.fn(), getClient: jest.fn() },
            logger,
            transactionManager
        });

        const created = await repository.create({
            applicant_id: 'app-1',
            job_posting_id: 'job-1',
            organization_id: 'org-1',
            created_by: 'user-1',
            title: 'Interview',
            scheduled_at: '2026-03-10T10:00:00Z',
            location_type: 'offline'
        }, []);
        const updated = await repository.updateStatus('int-1', 'cancelled', 'user-1', 'reason');

        expect(created).toEqual({ id: 'int-1' });
        expect(updated).toEqual({ id: 'int-1', status: 'cancelled' });
        expect(transactionManager.runInTransaction).toHaveBeenNthCalledWith(1, expect.any(Function), expect.objectContaining({
            label: 'interviews.create'
        }));
        expect(transactionManager.runInTransaction).toHaveBeenNthCalledWith(2, expect.any(Function), expect.objectContaining({
            label: 'interviews.updateStatus'
        }));
        expect(logger.info).toHaveBeenCalled();
    });
});
