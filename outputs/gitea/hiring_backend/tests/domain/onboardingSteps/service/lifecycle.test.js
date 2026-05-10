const createOnboardingStepsService = require('../../../../src/domain/onboardingSteps/service');

const createBaseRepository = () => ({
    findUserStepById: jest.fn(),
    withTransaction: jest.fn(),
    updateUserStepStatus: jest.fn(),
    getUserOrganization: jest.fn(),
    getPendingMandatorySteps: jest.fn(),
    completeUserStep: jest.fn(),
    getMandatoryDocuments: jest.fn(),
    getRequiredFormFields: jest.fn()
});

describe('domain/onboardingSteps service lifecycle', () => {
    it('acknowledgeStep enqueues step-completed and onboarding-completed outbox intents transactionally', async () => {
        const repository = createBaseRepository();
        repository.findUserStepById.mockResolvedValue({
            id: 'user-step-1',
            onboarding_step_id: 'step-1',
            title: 'Ack step',
            step_type: 'ack',
            acknowledgment_text: 'Please acknowledge'
        });
        repository.withTransaction.mockImplementation(async (callback) => callback({ id: 'tx-client' }));
        repository.updateUserStepStatus.mockResolvedValue({
            id: 'user-step-1',
            status: 'completed',
            acknowledged: true
        });
        repository.getUserOrganization.mockResolvedValue({ organization_id: 'org-1' });
        repository.getPendingMandatorySteps.mockResolvedValue([]);

        const sideEffectOutboxService = {
            enqueueRoleNotification: jest.fn()
                .mockResolvedValueOnce({ id: 'outbox-step' })
                .mockResolvedValueOnce({ id: 'outbox-onboarding' })
        };

        const service = createOnboardingStepsService({
            onboardingStepsRepository: repository,
            sideEffectOutboxService
        });

        const result = await service.acknowledgeStep('user-step-1', 'user-1', true);

        expect(result).toEqual({
            userStep: expect.objectContaining({
                id: 'user-step-1',
                status: 'completed'
            })
        });

        expect(sideEffectOutboxService.enqueueRoleNotification).toHaveBeenCalledTimes(2);
        expect(sideEffectOutboxService.enqueueRoleNotification).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                type: 'onboarding.step.completed',
                organizationId: 'org-1'
            }),
            expect.objectContaining({
                idempotencyKey: 'onboarding.step.completed.user-1.user-step-1'
            })
        );
        expect(sideEffectOutboxService.enqueueRoleNotification).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                type: 'onboarding.completed',
                organizationId: 'org-1'
            }),
            expect.objectContaining({
                idempotencyKey: 'onboarding.completed.user-1'
            })
        );
    });

    it('completeStep fails when outbox enqueue fails and does not continue to onboarding-completed check', async () => {
        const repository = createBaseRepository();
        repository.findUserStepById.mockResolvedValue({
            id: 'user-step-1',
            onboarding_step_id: 'step-1',
            title: 'Final step',
            step_type: 'ack',
            acknowledged: true,
            form_response: {}
        });
        repository.getMandatoryDocuments.mockResolvedValue([]);
        repository.withTransaction.mockImplementation(async (callback) => callback({ id: 'tx-client' }));
        repository.completeUserStep.mockResolvedValue({
            id: 'user-step-1',
            status: 'completed'
        });
        repository.getUserOrganization.mockResolvedValue({ organization_id: 'org-1' });

        const sideEffectOutboxService = {
            enqueueRoleNotification: jest.fn().mockRejectedValue(new Error('outbox failure'))
        };

        const service = createOnboardingStepsService({
            onboardingStepsRepository: repository,
            sideEffectOutboxService
        });

        await expect(service.completeStep('user-step-1', 'user-1')).rejects.toThrow('outbox failure');

        expect(repository.completeUserStep).toHaveBeenCalledWith('user-step-1', { client: { id: 'tx-client' } });
        expect(repository.getPendingMandatorySteps).not.toHaveBeenCalled();
    });
});
