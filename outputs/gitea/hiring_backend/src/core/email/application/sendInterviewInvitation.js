const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

module.exports = ({ emailOutboxPort, logger }) => {
    return async ({
        applicantEmail,
        applicantName,
        dateTime,
        location,
        locationType = 'office',
        participants,
        notes = '',
        jobTitle = '',
        organizationName = 'Krajská Zdravotní a.s.'
    }) => {
        if (!applicantEmail || !dateTime || !location) {
            throw new ApplicationError('applicantEmail, dateTime, and location are required', { code: ErrorCode.VALIDATION_ERROR });
        }

        const interviewDate = new Date(dateTime);
        const formattedDate = interviewDate.toLocaleDateString('cs-CZ', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Prague'
        });
        const formattedTime = interviewDate.toLocaleTimeString('cs-CZ', {
            hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Prague'
        });

        const locationIcon = locationType === 'online' ? '💻' : '📍';
        const formattedNotes = notes ? notes.replace(/\n/g, '<br>') : '';
        const currentYear = new Date().getFullYear();

        const html = `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Pozvánka na pohovor</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;line-height:1.6;color:#333;background-color:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background-color:#fff;border-radius:8px;overflow:hidden;">
    <div style="background-color:#2563eb;color:white;padding:20px;text-align:center;">
      <h1 style="margin:0;font-size:24px;font-weight:600;">Pozvánka na pohovor</h1>
      ${jobTitle ? `<p style="margin:10px 0 0 0;font-size:16px;opacity:.9;">${jobTitle}</p>` : ''}
    </div>
    <div style="padding:30px 20px;">
      ${applicantName ? `<p style="font-size:16px;margin-bottom:20px;">Vážený/á ${applicantName},</p>` : '<p style="font-size:16px;margin-bottom:20px;">Vážený/á uchazeči/uchazečko,</p>'}
      <p style="font-size:16px;margin-bottom:20px;">Děkujeme za Váš zájem o práci v naší organizaci. Rádi bychom Vás pozvali na osobní pohovor.</p>
      <div style="background-color:#f9fafb;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #2563eb;">
        <h2 style="margin:0 0 15px 0;font-size:18px;color:#1e40af;">📅 Detaily pohovoru</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;font-weight:600;color:#6b7280;width:100px;">Datum:</td><td style="padding:8px 0;">${formattedDate}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600;color:#6b7280;">Čas:</td><td style="padding:8px 0;font-weight:600;color:#2563eb;">${formattedTime}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600;color:#6b7280;">Místo:</td><td style="padding:8px 0;">${locationIcon} ${location}</td></tr>
          ${participants ? `<tr><td style="padding:8px 0;font-weight:600;color:#6b7280;">Účastníci:</td><td style="padding:8px 0;">👥 ${participants}</td></tr>` : ''}
        </table>
      </div>
      ${formattedNotes ? `<div style="background-color:#fef3c7;border-radius:8px;padding:15px;margin:20px 0;"><p style="margin:0 0 5px 0;font-weight:600;color:#92400e;">📝 Poznámky:</p><p style="margin:0;font-size:14px;color:#78350f;">${formattedNotes}</p></div>` : ''}
      <div style="margin:20px 0;padding:15px;border:1px solid #e5e7eb;border-radius:8px;">
        <p style="margin:0 0 10px 0;font-weight:600;">Co si vzít s sebou:</p>
        <ul style="margin:0;padding-left:20px;color:#6b7280;"><li>Občanský průkaz nebo pas</li><li>Životopis (pokud máte aktualizovanou verzi)</li><li>Případné certifikáty a osvědčení</li></ul>
      </div>
      <p style="font-size:14px;color:#6b7280;margin-top:20px;">V případě, že se nemůžete v uvedený termín dostavit, kontaktujte nás prosím co nejdříve na adrese <a href="mailto:hr@kzcr.eu" style="color:#2563eb;">hr@kzcr.eu</a>.</p>
      <div style="border-top:1px solid #e5e7eb;padding-top:20px;margin-top:30px;">
        <p style="font-size:14px;color:#6b7280;margin:0;">S pozdravem,<br><strong>Personální oddělení</strong><br>${organizationName}</p>
      </div>
    </div>
    <div style="background-color:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:14px;color:#6b7280;">${organizationName}</p>
      <p style="margin:5px 0 0 0;font-size:12px;color:#9ca3af;">© ${currentYear} KZCR. Všechna práva vyhrazena.</p>
    </div>
  </div>
</body>
</html>`;

        let plainText = applicantName ? `Vážený/á ${applicantName},\n\n` : 'Vážený/á uchazeči/uchazečko,\n\n';
        plainText += 'Děkujeme za Váš zájem o práci v naší organizaci. Rádi bychom Vás pozvali na osobní pohovor.\n\n';
        if (jobTitle) plainText += `Pozice: ${jobTitle}\n\n`;
        plainText += `DETAILY POHOVORU:\n─────────────────\nDatum: ${formattedDate}\nČas: ${formattedTime}\nMísto: ${location}\n`;
        if (participants) plainText += `Účastníci: ${participants}\n`;
        if (notes) plainText += `\nPoznámky:\n${notes}\n`;
        plainText += '\nCo si vzít s sebou:\n• Občanský průkaz nebo pas\n• Životopis (pokud máte aktualizovanou verzi)\n• Případné certifikáty a osvědčení\n';
        plainText += '\nV případě, že se nemůžete v uvedený termín dostavit, kontaktujte nás prosím co nejdříve na adrese hr@kzcr.eu.\n\n---\nS pozdravem,\nPersonální oddělení\nKrajská Zdravotní a.s.\n';

        const outboxEvent = await emailOutboxPort.enqueueRawEmail({
            to: applicantEmail,
            subject: `Pozvánka na pohovor - ${organizationName}`,
            text: plainText,
            html,
            audit: { action: 'email.interview.invitation.applicant.legacy' }
        }, { aggregateType: 'applicant' });

        logger?.info?.('Interview invitation email queued', { applicantEmail, applicantName, dateTime, location });

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
