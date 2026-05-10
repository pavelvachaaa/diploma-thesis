const { createMockReq, createMockRes } = require('../helpers');
const createController = require('../../src/adapters/in/http/roleAssignments/controller');
const ApplicationError = require('../../src/core/shared/errors/ApplicationError');
const { ErrorCode } = require('../../src/core/shared/errors/ApplicationError');

const buildMocks = () => ({
    roleAssignmentsApplication: {
        getUserRole: jest.fn(),
        updateUserRole: jest.fn(),
        getUserOrganizationMemberships: jest.fn(),
        createOrganizationMembership: jest.fn(),
        updateOrganizationMembershipExpiration: jest.fn(),
        deleteOrganizationMembership: jest.fn()
    }
});

describe('roleAssignments.controller', () => {
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

    it('updates user role with the legacy response shape', async () => {
        const req = createMockReq({
            params: { userId: 'user-2' },
            body: { role: 'hr' },
            user: { id: 'admin-1', roles: ['admin'] }
        });
        mocks.roleAssignmentsApplication.updateUserRole.mockResolvedValue({
            user_id: 'user-2',
            role_name: 'hr'
        });

        await controller.updateUserRole(req, res, next);

        expect(mocks.roleAssignmentsApplication.updateUserRole).toHaveBeenCalledWith({
            userId: 'user-2',
            role: 'hr'
        }, req.user);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'User role updated successfully',
            role: {
                user_id: 'user-2',
                role_name: 'hr'
            }
        });
    });

    it('creates organization membership with the legacy 201 response shape', async () => {
        const req = createMockReq({
            params: { userId: 'user-2' },
            body: {
                organizationId: 'org-1',
                expiresAt: null,
                notes: 'manual'
            },
            user: { id: 'admin-1', roles: ['admin'] }
        });
        mocks.roleAssignmentsApplication.createOrganizationMembership.mockResolvedValue({ id: 'membership-1' });

        await controller.createOrganizationMembership(req, res, next);

        expect(mocks.roleAssignmentsApplication.createOrganizationMembership).toHaveBeenCalledWith({
            userId: 'user-2',
            organizationId: 'org-1',
            expiresAt: null,
            notes: 'manual'
        }, req.user);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Organization membership created successfully',
            membership: { id: 'membership-1' }
        });
    });

    it('updates organization membership expiration with the legacy response shape', async () => {
        const req = createMockReq({
            params: { membershipId: 'membership-1' },
            body: { expiresAt: '2030-01-01T00:00:00.000Z' },
            user: { id: 'admin-1', roles: ['admin'] }
        });
        mocks.roleAssignmentsApplication.updateOrganizationMembershipExpiration.mockResolvedValue({
            id: 'membership-1'
        });

        await controller.updateOrganizationMembershipExpiration(req, res, next);

        expect(mocks.roleAssignmentsApplication.updateOrganizationMembershipExpiration).toHaveBeenCalledWith(
            'membership-1',
            '2030-01-01T00:00:00.000Z',
            req.user
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Organization membership expiration updated successfully',
            membership: { id: 'membership-1' }
        });
    });

    it('deletes organization membership with the legacy response shape', async () => {
        const req = createMockReq({
            params: { membershipId: 'membership-1' },
            user: { id: 'admin-1', roles: ['admin'] }
        });
        mocks.roleAssignmentsApplication.deleteOrganizationMembership.mockResolvedValue({ id: 'membership-1' });

        await controller.deleteOrganizationMembership(req, res, next);

        expect(mocks.roleAssignmentsApplication.deleteOrganizationMembership).toHaveBeenCalledWith(
            'membership-1',
            req.user
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Organization membership deleted successfully'
        });
    });

    it('maps ApplicationError FORBIDDEN to 403 via handle()', async () => {
        const req = createMockReq({
            params: { userId: 'user-2' },
            body: { role: 'hr' }
        });
        const error = new ApplicationError('Nedostatečná oprávnění', { code: ErrorCode.FORBIDDEN });
        mocks.roleAssignmentsApplication.updateUserRole.mockRejectedValue(error);

        await controller.updateUserRole(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(next.mock.calls[0][0]).toHaveProperty('status', 403);
        expect(res.json).not.toHaveBeenCalled();
    });
});
