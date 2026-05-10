const { createMockReq, createMockRes } = require('../helpers');
const createQualificationController = require('../../src/adapters/in/http/qualification/controller');
const ApplicationError = require('../../src/core/shared/errors/ApplicationError');
const { ErrorCode } = require('../../src/core/shared/errors/ApplicationError');

describe('qualification controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns lookup result on success', async () => {
        const qualificationApplication = {
            lookupQualification: jest.fn().mockResolvedValue({
                searchType: 'nrzp',
                worker: { nrzpCislo: 122036563 }
            })
        };
        const controller = createQualificationController({ qualificationApplication });

        const req = createMockReq({
            body: {
                searchType: '  nrzp ',
                query: ' 122036563 ',
                applicantId: 'app-1'
            },
            user: {
                id: 'user-1',
                email: 'user@example.com',
                roles: ['hr'],
                organization_id: 'org-1'
            }
        });
        const res = createMockRes();
        const next = jest.fn();

        await controller.lookup(req, res, next);

        expect(qualificationApplication.lookupQualification).toHaveBeenCalledWith(expect.objectContaining({
            searchType: '  nrzp ',
            query: ' 122036563 ',
            applicantId: 'app-1',
            actor: expect.objectContaining({
                id: 'user-1'
            })
        }));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            searchType: 'nrzp'
        }));
        expect(next).not.toHaveBeenCalled();
    });

    it('maps ApplicationError VALIDATION_ERROR to 400 via handle()', async () => {
        const error = new ApplicationError('Rodné číslo má neplatný formát', {
            code: ErrorCode.VALIDATION_ERROR,
            details: {
                reasonCode: 'QUALIFICATION_INVALID_BIRTH_NUMBER'
            }
        });

        const qualificationApplication = {
            lookupQualification: jest.fn().mockRejectedValue(error)
        };
        const controller = createQualificationController({ qualificationApplication });

        const req = createMockReq({
            body: {
                searchType: 'rodne_cislo',
                query: 'abc'
            }
        });
        const res = createMockRes();
        const next = jest.fn();

        await controller.lookup(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(next.mock.calls[0][0]).toHaveProperty('status', 400);
        expect(res.json).not.toHaveBeenCalled();
    });

    it('forwards controlled provider failures to next unchanged', async () => {
        const error = new Error('Qualification provider is unavailable');
        error.status = 503;
        error.code = 'QUALIFICATION_PROVIDER_UNAVAILABLE';

        const qualificationApplication = {
            lookupQualification: jest.fn().mockRejectedValue(error)
        };
        const controller = createQualificationController({ qualificationApplication });

        const req = createMockReq({
            body: {
                searchType: 'nrzp',
                query: '122036563'
            }
        });
        const res = createMockRes();
        const next = jest.fn();

        await controller.lookup(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(res.json).not.toHaveBeenCalled();
    });
});
