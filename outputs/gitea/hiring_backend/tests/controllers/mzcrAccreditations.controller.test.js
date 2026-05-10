const { createMockReq, createMockRes } = require('../helpers');
const createMzcrAccreditationsController = require('../../src/adapters/in/http/mzcrAccreditations/controller');

describe('MZCR accreditations controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns readonly accreditation list with raw query forwarded to application', async () => {
        const mzcrAccreditationsApplication = {
            listMzcrAccreditations: jest.fn().mockResolvedValue({
                data: [{ id_akreditace: 100 }],
                pagination: { page: 0, limit: 25, total: 1 }
            })
        };
        const controller = createMzcrAccreditationsController({ mzcrAccreditationsApplication });
        const req = createMockReq({
            query: {
                page: '0',
                validity: 'valid',
                specialtyType: 'basic_trunk',
                q: 'interní'
            },
            user: {
                id: 'user-1'
            }
        });
        const res = createMockRes();
        const next = jest.fn();

        await controller.getAll(req, res, next);

        expect(mzcrAccreditationsApplication.listMzcrAccreditations).toHaveBeenCalledWith({
            page: '0',
            limit: undefined,
            organizationId: undefined,
            validity: 'valid',
            specialtyType: 'basic_trunk',
            q: 'interní',
            actorUserId: 'user-1'
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: [{ id_akreditace: 100 }]
        }));
        expect(next).not.toHaveBeenCalled();
    });

    it('returns readonly accreditation metadata', async () => {
        const mzcrAccreditationsApplication = {
            getMzcrAccreditationMeta: jest.fn().mockResolvedValue({
                specialtyTypes: [{ value: 'basic_trunk', label: 'Základní kmen' }]
            })
        };
        const controller = createMzcrAccreditationsController({ mzcrAccreditationsApplication });
        const req = createMockReq({
            user: {
                id: 'user-1'
            }
        });
        const res = createMockRes();
        const next = jest.fn();

        await controller.getMeta(req, res, next);

        expect(mzcrAccreditationsApplication.getMzcrAccreditationMeta).toHaveBeenCalledWith({
            actorUserId: 'user-1'
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            specialtyTypes: [{ value: 'basic_trunk', label: 'Základní kmen' }]
        });
        expect(next).not.toHaveBeenCalled();
    });
});
