const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const buildApplicantEmailHtml = ({ applicantName, message, senderName }) => {
    const currentYear = new Date().getFullYear();
    const formattedMessage = message.replace(/\n/g, '<br>');
    return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Zpráva ohledně vaší žádosti o zaměstnání</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;line-height:1.6;color:#333;background-color:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background-color:#fff;border-radius:8px;overflow:hidden;">
    <div style="background-color:#2563eb;color:white;padding:20px;text-align:center;">
      <h1 style="margin:0;font-size:24px;font-weight:600;">Krajská Zdravotní a.s.</h1>
      <p style="margin:10px 0 0 0;font-size:16px;opacity:.9;">Zpráva ohledně vaší žádosti o zaměstnání</p>
    </div>
    <div style="padding:30px 20px;">
      ${applicantName ? `<p style="font-size:16px;margin-bottom:20px;">Vážený/á ${applicantName},</p>` : ''}
      <div style="font-size:16px;margin-bottom:30px;">${formattedMessage}</div>
      <div style="border-top:1px solid #e5e7eb;padding-top:20px;margin-top:30px;">
        <p style="font-size:14px;color:#6b7280;margin:0;">S pozdravem,<br><strong>Personální oddělení</strong><br>Krajská Zdravotní a.s.</p>
      </div>
    </div>
    <div style="background-color:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:14px;color:#6b7280;">Krajská Zdravotní a.s.</p>
      <p style="margin:5px 0 0 0;font-size:12px;color:#9ca3af;">© ${currentYear} KZCR. Všechna práva vyhrazena.</p>
    </div>
  </div>
</body>
</html>`;
};

module.exports = ({ emailOutboxPort, logger }) => {
    return async ({ applicantEmail, applicantName, message, senderName = 'KZCR Administration', attachments = [] }) => {
        if (!applicantEmail || !message) {
            throw new ApplicationError('applicantEmail and message are required', { code: ErrorCode.VALIDATION_ERROR });
        }

        const subject = 'Zpráva ohledně vaší žádosti o zaměstnání - KZCR';
        const html = buildApplicantEmailHtml({ applicantName, message, senderName });

        const outboxEvent = await emailOutboxPort.enqueueRawEmail({
            to: applicantEmail,
            subject,
            text: `${applicantName ? `Vážený/á ${applicantName},\n\n` : ''}${message}\n\n---\nS pozdravem,\n${senderName}`,
            html,
            attachments,
            audit: { action: 'email.custom.applicant' }
        }, { aggregateType: 'applicant' });

        logger?.info?.('Applicant email queued', { applicantEmail, applicantName });

        return {
            success: true,
            queued: true,
            sent: false,
            outboxId: outboxEvent?.id || null,
            messageId: null,
            sentTo: applicantEmail
        };
    };
};
