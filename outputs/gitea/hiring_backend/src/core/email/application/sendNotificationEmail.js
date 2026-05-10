const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const buildNotificationHtml = ({ title, body, data }) => {
    const currentYear = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;line-height:1.6;color:#333;background-color:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background-color:#fff;border-radius:8px;overflow:hidden;">
    <div style="background-color:#2563eb;color:white;padding:20px;text-align:center;">
      <h1 style="margin:0;font-size:24px;font-weight:600;">${title}</h1>
    </div>
    <div style="padding:30px 20px;">
      ${body ? `<p style="font-size:16px;margin-bottom:20px;">${body}</p>` : ''}
      ${data?.actionUrl ? `<div style="text-align:center;margin:20px 0;"><a href="${data.actionUrl}" style="display:inline-block;background-color:#2563eb;color:white;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;">Zobrazit detail</a></div>` : ''}
    </div>
    <div style="background-color:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:14px;color:#6b7280;">Krajská Zdravotní a.s.</p>
      <p style="margin:5px 0 0 0;font-size:12px;color:#9ca3af;">© ${currentYear} KZCR. Všechna práva vyhrazena.</p>
    </div>
  </div>
</body>
</html>`;
};

module.exports = ({ emailOutboxPort, emailPreferencesLookupPort, logger }) => {
    return async ({ userId, email, type, title, body, data = {} }) => {
        if (!userId || !email || !type || !title) {
            throw new ApplicationError('userId, email, type, and title are required', { code: ErrorCode.VALIDATION_ERROR });
        }

        const globalPrefs = await emailPreferencesLookupPort.getPreferences(userId);
        if (!globalPrefs.emailEnabled) {
            logger?.info?.('Notification email skipped — email disabled globally', { userId, type });
            return { success: true, skipped: true, reason: 'User email preferences disabled', sentTo: email };
        }

        const typePrefs = await emailPreferencesLookupPort.getTypePreferences(userId, type);
        const emailEnabled = typePrefs.emailEnabled !== null ? typePrefs.emailEnabled : globalPrefs.emailEnabled;
        if (!emailEnabled) {
            logger?.info?.('Notification email skipped — type disabled', { userId, type });
            return { success: true, skipped: true, reason: 'User email preferences disabled', sentTo: email };
        }

        const html = buildNotificationHtml({ title, body, data });

        const outboxEvent = await emailOutboxPort.enqueueRawEmail({
            to: email,
            subject: `KZCR - ${title}`,
            text: `${title}\n\n${body || ''}`,
            html,
            audit: {
                action: 'email.notification',
                resourceType: 'notification',
                resourceId: data?.notificationId || null,
                metadata: { notificationType: type, userId }
            }
        }, {
            aggregateType: 'notification',
            aggregateId: data?.notificationId || null
        });

        logger?.info?.('Notification email queued', { userId, email, type });

        return {
            success: true,
            queued: true,
            sent: false,
            outboxId: outboxEvent?.id || null,
            messageId: null,
            sentTo: email
        };
    };
};
