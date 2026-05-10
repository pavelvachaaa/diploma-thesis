const { createMockReq, createMockRes } = require('../helpers');
const createController = require('../../src/adapters/in/http/notification/controller');
const ApplicationError = require('../../src/core/shared/errors/ApplicationError');
const { ErrorCode } = require('../../src/core/shared/errors/ApplicationError');

describe('notification HTTP controller', () => {
    const buildController = () => {
        const notificationService = {
            getUserNotifications: jest.fn().mockResolvedValue([]),
            getUnreadCount: jest.fn().mockResolvedValue(0),
            markAsRead: jest.fn().mockResolvedValue(true),
            markAllAsRead: jest.fn().mockResolvedValue(2),
            getPreferences: jest.fn().mockResolvedValue({ inAppEnabled: true, emailEnabled: false }),
            updatePreferences: jest.fn().mockResolvedValue({ inAppEnabled: true, emailEnabled: true }),
            getTypePreferences: jest.fn().mockResolvedValue({ inAppEnabled: null, emailEnabled: null }),
            updateTypePreferences: jest.fn().mockResolvedValue({ inAppEnabled: true, emailEnabled: null })
        };

        return {
            notificationService,
            controller: createController({ notificationService })
        };
    };

    it('passes raw preference body values to the application', async () => {
        const { controller, notificationService } = buildController();
        const req = createMockReq({
            body: {
                inAppEnabled: 'true',
                emailEnabled: false
            }
        });
        const res = createMockRes();
        const next = jest.fn();

        await controller.updatePreferences(req, res, next);

        expect(notificationService.updatePreferences).toHaveBeenCalledWith('user-uuid-1', {
            inAppEnabled: 'true',
            emailEnabled: false
        });
        expect(res.json).toHaveBeenCalledWith({ inAppEnabled: true, emailEnabled: true });
    });

    it('maps ApplicationError validation failures through handle()', async () => {
        const { controller, notificationService } = buildController();
        const error = new ApplicationError('limit must be between 1 and 100', {
            code: ErrorCode.VALIDATION_ERROR
        });
        notificationService.getUserNotifications.mockRejectedValue(error);
        const req = createMockReq({ query: { limit: '200' } });
        const res = createMockRes();
        const next = jest.fn();

        await controller.getNotifications(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(next.mock.calls[0][0]).toHaveProperty('status', 400);
        expect(res.json).not.toHaveBeenCalled();
    });

    it('preserves the mark-as-read 404 response for missing notifications', async () => {
        const { controller, notificationService } = buildController();
        notificationService.markAsRead.mockResolvedValue(false);
        const req = createMockReq({ params: { id: 'notif-1' } });
        const res = createMockRes();
        const next = jest.fn();

        await controller.markAsRead(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Notification not found or already read'
        });
    });
});
