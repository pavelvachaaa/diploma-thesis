const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

module.exports = ({ emailOutboxPort, logger }) => {
    return async (testEmail) => {
        if (!testEmail) {
            throw new ApplicationError('email address is required', { code: ErrorCode.VALIDATION_ERROR });
        }

        const html = `<div style="font-family:Arial,sans-serif;padding:20px;max-width:600px;">
  <h2 style="color:#2563eb;">Test Email - KZCR System</h2>
  <p>Toto je testovací email z KZCR systému.</p>
  <p>Pokud jste tento email obdrželi, email služba funguje správně.</p>
  <hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb;">
  <p style="font-size:12px;color:#6b7280;">Odesláno z KZCR hiring systému v ${new Date().toLocaleString('cs-CZ')}</p>
</div>`;

        const outboxEvent = await emailOutboxPort.enqueueRawEmail({
            to: testEmail,
            subject: 'Test Email - KZCR System',
            text: 'Toto je testovací email z KZCR systému. Pokud jste tento email obdrželi, email služba funguje správně.',
            html,
            audit: { action: 'email.test' }
        });

        logger?.info?.('Test email queued', { testEmail });

        return {
            success: true,
            queued: true,
            sent: false,
            outboxId: outboxEvent?.id || null,
            messageId: null,
            sentTo: testEmail
        };
    };
};
