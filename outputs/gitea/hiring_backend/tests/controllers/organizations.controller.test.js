const { body } = require('express-validator');

const { createMockReq, createMockRes } = require('../helpers');
const createController = require('../../src/adapters/in/http/organizations/controller');
const ApplicationError = require('../../src/core/shared/errors/ApplicationError');
const { ErrorCode } = require('../../src/core/shared/errors/ApplicationError');

const buildMocks = () => ({
    organizationsApplication: {
        getAll: jest.fn(),
        getById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        uploadContactPhoto: jest.fn(),
        deleteContactPhoto: jest.fn(),
        delete: jest.fn()
    }
});

describe('organizations.controller', () => {
    let mocks;
    let controller;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();
        mocks = buildMocks();
        controller = createController(mocks);
        res = createMockRes();
        res.redirect = jest.fn();
        next = jest.fn();
    });

    it('redirects legacy photo requests to the public contact_photo_url', async () => {
        const req = createMockReq({
            params: { id: 'org-1' },
            user: { id: 'user-1', role: 'hr' }
        });
        mocks.organizationsApplication.getById.mockResolvedValue({
            id: 'org-1',
            contact_photo_file_id: 'file-1',
            contact_photo_url: 'https://cdn.example.com/public-organization-photos/organization-contact-photos/org-1/photo.png'
        });

        await controller.getContactPhoto(req, res, next);

        expect(mocks.organizationsApplication.getById).toHaveBeenCalledWith('org-1', {
            actorUserId: 'user-1',
            minAccess: 'read'
        });
        expect(res.redirect).toHaveBeenCalledWith(
            'https://cdn.example.com/public-organization-photos/organization-contact-photos/org-1/photo.png'
        );
    });

    it('returns legacy validation errors for create', async () => {
        const req = createMockReq({
            body: {},
            user: {
                id: 'super-1',
                role: 'super_admin',
                roles: ['super_admin']
            }
        });

        await body('name').notEmpty().withMessage('Organization name is required').run(req);
        await controller.create(req, res, next);

        expect(mocks.organizationsApplication.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            errors: [
                expect.objectContaining({
                    msg: 'Organization name is required',
                    path: 'name'
                })
            ]
        });
    });

    it('rejects organization create when the application layer enforces the super-admin rule', async () => {
        const req = createMockReq({
            body: {
                name: 'New Organization'
            },
            user: {
                id: 'admin-1',
                role: 'admin',
                roles: ['admin']
            }
        });
        mocks.organizationsApplication.create.mockRejectedValue(
            new ApplicationError('Only super administrators can mutate organizations', { code: ErrorCode.FORBIDDEN })
        );

        await controller.create(req, res, next);

        expect(mocks.organizationsApplication.create).toHaveBeenCalledWith(
            { name: 'New Organization' },
            { actorRole: 'admin' }
        );
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
        expect(res.status).not.toHaveBeenCalled();
    });

    it('creates organizations for super administrators with the same response shape', async () => {
        const req = createMockReq({
            body: {
                name: 'New Organization'
            },
            user: {
                id: 'super-1',
                role: 'super_admin',
                roles: ['super_admin']
            }
        });
        const organization = { id: 'org-1', name: 'New Organization' };

        mocks.organizationsApplication.create.mockResolvedValue(organization);

        await controller.create(req, res, next);

        expect(mocks.organizationsApplication.create).toHaveBeenCalledWith(
            { name: 'New Organization' },
            { actorRole: 'super_admin' }
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(organization);
    });

    it('returns 404 when update targets a missing organization', async () => {
        const req = createMockReq({
            params: { id: 'org-404' },
            body: {
                name: 'Updated Organization'
            },
            user: {
                id: 'super-1',
                role: 'super_admin',
                roles: ['super_admin']
            }
        });

        mocks.organizationsApplication.update.mockResolvedValue(null);

        await controller.update(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Organization not found' });
    });

    it('deletes organizations with the existing success contract', async () => {
        const req = createMockReq({
            params: { id: 'org-1' },
            user: {
                id: 'super-1',
                role: 'super_admin',
                roles: ['super_admin']
            }
        });

        mocks.organizationsApplication.delete.mockResolvedValue({ id: 'org-1' });

        await controller.delete(req, res, next);

        expect(mocks.organizationsApplication.delete).toHaveBeenCalledWith('org-1', {
            actorRole: 'super_admin',
            actorUserId: 'super-1',
            minAccess: 'admin'
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Organization deleted successfully' });
    });

    it('returns 400 when uploadContactPhoto is called without a file', async () => {
        const req = createMockReq({
            params: { id: 'org-1' },
            user: {
                id: 'super-1',
                role: 'super_admin',
                roles: ['super_admin']
            }
        });

        await controller.uploadContactPhoto(req, res, next);

        expect(mocks.organizationsApplication.uploadContactPhoto).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'No file uploaded' });
    });

    it('uploads contact photos with the existing service contract', async () => {
        const req = createMockReq({
            params: { id: 'org-1' },
            file: {
                originalname: 'photo.png'
            },
            user: {
                id: 'super-1',
                role: 'super_admin',
                roles: ['super_admin']
            }
        });
        const organization = { id: 'org-1', contact_photo_file_id: 'file-1' };

        mocks.organizationsApplication.uploadContactPhoto.mockResolvedValue(organization);

        await controller.uploadContactPhoto(req, res, next);

        expect(mocks.organizationsApplication.uploadContactPhoto).toHaveBeenCalledWith(
            'org-1',
            req.file,
            'super-1',
            {
                actorRole: 'super_admin',
                actorUserId: 'super-1',
                minAccess: 'admin'
            }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(organization);
    });

    it('returns 503 when the contact photo is not publicly available', async () => {
        const req = createMockReq({
            params: { id: 'org-1' },
            user: { id: 'user-1', role: 'hr' }
        });
        mocks.organizationsApplication.getById.mockResolvedValue({
            id: 'org-1',
            contact_photo_file_id: 'file-1',
            contact_photo_url: null
        });

        await controller.getContactPhoto(req, res, next);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Organization contact photo is not publicly available'
        });
        expect(res.redirect).not.toHaveBeenCalled();
    });

    it('returns 404 when the organization has no contact photo', async () => {
        const req = createMockReq({
            params: { id: 'org-1' }
        });
        mocks.organizationsApplication.getById.mockResolvedValue({
            id: 'org-1',
            contact_photo_file_id: null,
            contact_photo_url: null
        });

        await controller.getContactPhoto(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Organization contact photo not found' });
        expect(res.redirect).not.toHaveBeenCalled();
    });
});
