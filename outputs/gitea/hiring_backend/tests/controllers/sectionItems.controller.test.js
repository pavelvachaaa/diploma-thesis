const { createMockReq, createMockRes } = require('../helpers');
const createController = require('../../src/adapters/in/http/sectionItems/controller');
const ApplicationError = require('../../src/core/shared/errors/ApplicationError');
const { ErrorCode } = require('../../src/core/shared/errors/ApplicationError');

const buildMocks = () => ({
    sectionItemsApplication: {
        getAllSectionTypes: jest.fn(),
        getAll: jest.fn(),
        getBySectionType: jest.fn(),
        getById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        updateOrderIndices: jest.fn(),
        getByJobRole: jest.fn(),
        addToJobRole: jest.fn(),
        updateJobRoleItem: jest.fn(),
        removeFromJobRole: jest.fn(),
        replaceJobRoleSectionItems: jest.fn()
    }
});

describe('sectionItems.controller', () => {
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

    it('returns 404 with the legacy payload for missing catalog item', async () => {
        const req = createMockReq({
            params: { id: 'item-missing' }
        });
        mocks.sectionItemsApplication.getById.mockResolvedValue(null);

        await controller.getById(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Section item not found' });
        expect(next).not.toHaveBeenCalled();
    });

    it('passes malformed reorder input to the application boundary for validation', async () => {
        const req = createMockReq({
            body: { items: null }
        });
        const error = new ApplicationError('Items must be an array', {
            code: ErrorCode.VALIDATION_ERROR
        });
        mocks.sectionItemsApplication.updateOrderIndices.mockRejectedValue(error);

        await controller.updateOrderIndices(req, res, next);

        expect(mocks.sectionItemsApplication.updateOrderIndices).toHaveBeenCalledWith(null);
        expect(next).toHaveBeenCalledWith(error);
        expect(next.mock.calls[0][0]).toHaveProperty('status', 400);
        expect(res.json).not.toHaveBeenCalled();
    });

    it('updates order indices with the legacy success payload', async () => {
        const req = createMockReq({
            body: {
                items: [{ id: 'item-1', order_index: 1 }]
            }
        });

        await controller.updateOrderIndices(req, res, next);

        expect(mocks.sectionItemsApplication.updateOrderIndices).toHaveBeenCalledWith([
            { id: 'item-1', order_index: 1 }
        ]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Order indices updated successfully' });
    });

    it('adds job role section item with actor write options and legacy 201 payload', async () => {
        const req = createMockReq({
            params: { jobRoleId: 'job-role-1' },
            body: {
                section_type_name: 'duties',
                section_item_id: 'section-item-1'
            },
            user: { id: 'admin-1' }
        });
        mocks.sectionItemsApplication.addToJobRole.mockResolvedValue({ id: 'jrsi-1' });

        await controller.addToJobRole(req, res, next);

        expect(mocks.sectionItemsApplication.addToJobRole).toHaveBeenCalledWith(
            'job-role-1',
            {
                section_type_name: 'duties',
                section_item_id: 'section-item-1'
            },
            {
                actorUserId: 'admin-1',
                minAccess: 'write'
            }
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ id: 'jrsi-1' });
    });

    it('removes job role section item with the legacy success payload', async () => {
        const req = createMockReq({
            params: { id: 'jrsi-1' },
            user: { id: 'admin-1' }
        });
        mocks.sectionItemsApplication.removeFromJobRole.mockResolvedValue({ id: 'jrsi-1' });

        await controller.removeFromJobRole(req, res, next);

        expect(mocks.sectionItemsApplication.removeFromJobRole).toHaveBeenCalledWith(
            'jrsi-1',
            {
                actorUserId: 'admin-1',
                minAccess: 'write'
            }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Job role section item removed successfully'
        });
    });

    it('replaces job role section items with the legacy success payload', async () => {
        const req = createMockReq({
            params: {
                jobRoleId: 'job-role-1',
                sectionType: 'duties'
            },
            body: {
                items: [{ section_item_id: 'item-1' }]
            },
            user: { id: 'admin-1' }
        });

        await controller.replaceJobRoleSectionItems(req, res, next);

        expect(mocks.sectionItemsApplication.replaceJobRoleSectionItems).toHaveBeenCalledWith(
            'job-role-1',
            'duties',
            [{ section_item_id: 'item-1' }],
            {
                actorUserId: 'admin-1',
                minAccess: 'write'
            }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Job role section items replaced successfully'
        });
    });

    it('maps application validation errors through shared handle()', async () => {
        const req = createMockReq({
            params: { jobRoleId: 'job-role-1' },
            body: { section_type_name: 'duties' }
        });
        const error = new ApplicationError('Either section_item_id or custom_text must be provided', {
            code: ErrorCode.VALIDATION_ERROR
        });
        mocks.sectionItemsApplication.addToJobRole.mockRejectedValue(error);

        await controller.addToJobRole(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(next.mock.calls[0][0]).toHaveProperty('status', 400);
        expect(res.json).not.toHaveBeenCalled();
    });

    it('maps q, limit, and activeOnly query params into section type lookup options', async () => {
        const req = createMockReq({
            params: { sectionType: 'duties' },
            query: {
                q: 'Péče',
                limit: '7',
                activeOnly: 'false'
            }
        });
        mocks.sectionItemsApplication.getBySectionType.mockResolvedValue([{ id: 'item-1' }]);

        await controller.getBySectionType(req, res, next);

        expect(mocks.sectionItemsApplication.getBySectionType).toHaveBeenCalledWith('duties', {
            activeOnly: false,
            search: 'Péče',
            limit: 7
        });
        expect(res.json).toHaveBeenCalledWith([{ id: 'item-1' }]);
        expect(next).not.toHaveBeenCalled();
    });

    it('defaults activeOnly to true and omits invalid limit values', async () => {
        const req = createMockReq({
            params: { sectionType: 'requirements' },
            query: {
                q: '',
                limit: 'not-a-number'
            }
        });
        mocks.sectionItemsApplication.getBySectionType.mockResolvedValue([]);

        await controller.getBySectionType(req, res, next);

        expect(mocks.sectionItemsApplication.getBySectionType).toHaveBeenCalledWith('requirements', {
            activeOnly: true,
            search: '',
            limit: undefined
        });
    });

    it('maps failed replacement ACL checks through shared handle()', async () => {
        const req = createMockReq({
            params: {
                jobRoleId: 'job-role-1',
                sectionType: 'duties'
            },
            body: {
                items: [{ section_item_id: 'item-1' }]
            },
            user: { id: 'admin-1' }
        });
        const error = new ApplicationError('Job role not found', {
            code: ErrorCode.NOT_FOUND
        });
        mocks.sectionItemsApplication.replaceJobRoleSectionItems.mockRejectedValue(error);

        await controller.replaceJobRoleSectionItems(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(next.mock.calls[0][0]).toHaveProperty('status', 404);
        expect(res.json).not.toHaveBeenCalled();
    });
});
