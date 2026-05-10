const { createMockReq, createMockRes } = require('../helpers');

const createController = require('../../src/domain/employees/controller/adminEmployees.controller');

const buildMocks = () => ({
    employeesService: {
        getAllEmployees: jest.fn().mockResolvedValue({ data: [], pagination: {} }),
        getEmployeeAuditEvents: jest.fn().mockResolvedValue({ data: [], page: 0, limit: 10, total: 0 }),
        sendEmailToEmployee: jest.fn().mockResolvedValue({ success: true }),
        deleteEmployeeFully: jest.fn().mockResolvedValue({ id: 'employee-1' })
    }
});

describe('employees.controller', () => {
    let mocks;
    let controller;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();
        mocks = buildMocks();
        controller = createController(mocks);
        res = createMockRes();
        next = jest.fn();
    });

    describe('getAllEmployeesAdmin', () => {
        it('forwards excludeRole filters to the service layer', async () => {
            const req = createMockReq({
                query: {
                    page: '1',
                    limit: '10',
                    search: 'john',
                    role: '',
                    excludeRole: 'user',
                    organization: 'KZ'
                },
                user: {
                    id: 'admin-1'
                }
            });

            await controller.getAllEmployeesAdmin(req, res, next);

            expect(mocks.employeesService.getAllEmployees).toHaveBeenCalledWith({
                page: 1,
                limit: 10,
                organizationId: null,
                search: 'john',
                role: '',
                excludeRole: 'user',
                organizationName: 'KZ',
                actorUserId: 'admin-1'
            });
            expect(res.json).toHaveBeenCalledWith({ data: [], pagination: {} });
        });
    });

    describe('sendEmailToEmployeeAdmin', () => {
        it('forwards uploaded files as storage-backed email attachments', async () => {
            const req = createMockReq({
                params: { id: 'employee-1' },
                body: {
                    subject: 'Subject',
                    message: 'Body',
                },
                files: [
                    {
                        originalname: 'doc.pdf',
                        mimetype: 'application/pdf',
                        key: 'user-documents/doc.pdf',
                        bucket: 'documents',
                    },
                ],
                user: {
                    id: 'admin-1',
                    name: 'Admin',
                    surname: 'User',
                },
            });

            await controller.sendEmailToEmployeeAdmin(req, res, next);

            expect(mocks.employeesService.sendEmailToEmployee).toHaveBeenCalledWith(
                'employee-1',
                expect.objectContaining({
                    subject: 'Subject',
                    message: 'Body',
                    requestUser: req.user,
                    files: [
                        expect.objectContaining({
                            originalname: 'doc.pdf',
                            mimetype: 'application/pdf',
                            key: 'user-documents/doc.pdf',
                            bucket: 'documents'
                        }),
                    ],
                }),
                { actorUserId: 'admin-1' }
            );
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Email byl úspěšně odeslán'
            });
        });

        it('forwards service failures to error middleware', async () => {
            const req = createMockReq({
                params: { id: 'employee-1' },
                body: {
                    subject: 'Subject',
                    message: 'Body',
                },
            });

            const error = new Error('Employee not found');
            error.status = 404;
            mocks.employeesService.sendEmailToEmployee.mockRejectedValue(error);

            await controller.sendEmailToEmployeeAdmin(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getEmployeeAuditEventsAdmin', () => {
        it('returns super-admin scoped audit events for the selected employee', async () => {
            const req = createMockReq({
                params: { id: 'employee-1' },
                query: {
                    page: '1',
                    limit: '25',
                    status: 'failure'
                },
                user: {
                    id: 'super-1',
                    roles: ['super_admin']
                }
            });

            await controller.getEmployeeAuditEventsAdmin(req, res, next);

            expect(mocks.employeesService.getEmployeeAuditEvents).toHaveBeenCalledWith(
                'employee-1',
                {
                    page: 1,
                    limit: 25,
                    category: null,
                    action: null,
                    status: 'failure',
                    resourceType: null,
                    resourceId: null,
                    dateFrom: null,
                    dateTo: null
                },
                req.user
            );
            expect(res.json).toHaveBeenCalledWith({ data: [], page: 0, limit: 10, total: 0 });
        });
    });

    describe('deleteEmployeeAdmin', () => {
        it('delegates full employee deletion to the service layer', async () => {
            const req = createMockReq({
                params: { id: 'employee-1' },
                user: {
                    id: 'super-1',
                    roles: ['super_admin']
                }
            });

            await controller.deleteEmployeeAdmin(req, res, next);

            expect(mocks.employeesService.deleteEmployeeFully).toHaveBeenCalledWith('employee-1', req.user);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Employee deleted successfully',
                employee: { id: 'employee-1' }
            });
        });
    });
});
