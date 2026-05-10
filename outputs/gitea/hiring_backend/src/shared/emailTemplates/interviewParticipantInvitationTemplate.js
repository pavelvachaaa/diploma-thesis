/**
 * Interview participant invitation email template
 * Sent to internal staff members who will be conducting the interview
 */

/**
 * Generate interview participant invitation email
 * @param {Object} data - Template data
 * @param {string} data.participantName - Participant's full name (optional)
 * @param {string} data.applicantName - Applicant's full name
 * @param {string} data.interviewTitle - Interview title
 * @param {string} data.formattedDate - Formatted date string
 * @param {string} data.formattedTime - Formatted time string
 * @param {string} data.duration - Duration in minutes
 * @param {string} data.locationType - Type of location (office, online, etc.)
 * @param {string} data.location - Location details
 * @param {string} data.onlineMeetingLink - Video call URL (optional)
 * @param {string} data.participants - List of all participants
 * @param {string} data.description - Interview description
 * @param {string} data.notes - Additional notes for interviewers
 * @param {string} data.jobTitle - Job position title
 * @param {string} data.organizationName - Organization name
 * @returns {Object} - { html, text }
 */
const generate = ({
    participantName = '',
    applicantName,
    interviewTitle,
    formattedDate,
    formattedTime,
    duration = 60,
    locationType,
    location,
    onlineMeetingLink = '',
    participants = '',
    description = '',
    notes = '',
    jobTitle = '',
    organizationName = 'Krajská Zdravotní a.s.'
}) => {
    const currentYear = new Date().getFullYear();

    // Get location icon based on type
    const locationIcon = locationType === 'online' ? '💻' : '📍';

    // Format notes and description if present
    const formattedNotes = notes ? notes.replace(/\n/g, '<br>') : '';
    const formattedDescription = description ? description.replace(/\n/g, '<br>') : '';

    const html = `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pozvánka na pohovor - Interní</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

        <!-- Header -->
        <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">
                🎯 Pozvánka na pohovor - Interní
            </h1>
            ${jobTitle ? `<p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${jobTitle}</p>` : ''}
        </div>

        <!-- Content -->
        <div style="padding: 30px 20px;">
            ${participantName ? `<p style="font-size: 16px; margin-bottom: 20px;">Vážený/á ${participantName},</p>` : '<p style="font-size: 16px; margin-bottom: 20px;">Vážený/á kolego/kolegyně,</p>'}

            <p style="font-size: 16px; margin-bottom: 20px;">
                Byli jste přidáni jako účastník pohovoru s uchazečem <strong>${applicantName}</strong>.
            </p>

            ${formattedDescription ? `
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0 0 5px 0; font-weight: 600; color: #6b7280;">Popis pohovoru:</p>
                <p style="margin: 0; font-size: 14px; color: #374151;">${formattedDescription}</p>
            </div>
            ` : ''}

            <!-- Interview Details Card -->
            <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #059669;">
                <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #047857;">
                    📅 Detaily pohovoru
                </h2>

                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #6b7280; width: 140px;">Uchazeč:</td>
                        <td style="padding: 8px 0; font-weight: 600; color: #047857;">${applicantName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Název:</td>
                        <td style="padding: 8px 0;">${interviewTitle}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Datum:</td>
                        <td style="padding: 8px 0;">${formattedDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Čas:</td>
                        <td style="padding: 8px 0; font-weight: 600; color: #059669;">${formattedTime}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Délka:</td>
                        <td style="padding: 8px 0;">${duration} minut</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Místo:</td>
                        <td style="padding: 8px 0;">${locationIcon} ${location}</td>
                    </tr>
                    ${participants ? `
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Další účastníci:</td>
                        <td style="padding: 8px 0;">👥 ${participants}</td>
                    </tr>
                    ` : ''}
                </table>

                ${onlineMeetingLink ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #d1fae5;">
                    <p style="margin: 0 0 10px 0; font-weight: 600; color: #6b7280;">Online Meeting Link:</p>
                    <a href="${onlineMeetingLink}" style="display: inline-block; background-color: #059669; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600;">
                        Připojit se k online pohovoru
                    </a>
                </div>
                ` : ''}
            </div>

            ${formattedNotes ? `
            <!-- Notes Section for Interviewers -->
            <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0 0 5px 0; font-weight: 600; color: #92400e;">📝 Poznámky pro tazatele:</p>
                <p style="margin: 0; font-size: 14px; color: #78350f;">${formattedNotes}</p>
            </div>
            ` : ''}

            <!-- Instructions for Interviewers -->
            <div style="margin: 20px 0; padding: 15px; border: 1px solid #d1fae5; background-color: #f0fdf4; border-radius: 8px;">
                <p style="margin: 0 0 10px 0; font-weight: 600; color: #047857;">Příprava na pohovor:</p>
                <ul style="margin: 0; padding-left: 20px; color: #065f46;">
                    <li>Zkontrolujte si životopis a dokumenty uchazeče</li>
                    <li>Připravte si otázky relevantní pro pozici</li>
                    <li>Dostavte se na místo 5 minut před začátkem</li>
                    <li>V případě online pohovoru otestujte si připojení předem</li>
                </ul>
            </div>

            <!-- Calendar Attachment Notice -->
            <div style="background-color: #dbeafe; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #1e40af;">
                    📆 K tomuto emailu je připojena pozvánka do kalendáře (.ics soubor).
                    Otevřete ji pro přidání události do vašeho kalendáře.
                </p>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                V případě, že se nemůžete v uvedený termín zúčastnit, kontaktujte prosím co nejdříve organizátora nebo personální oddělení.
            </p>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                <p style="font-size: 14px; color: #6b7280; margin: 0;">
                    S pozdravem,<br>
                    <strong>Personální oddělení</strong><br>
                    ${organizationName}
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
                ${organizationName}
            </p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #9ca3af;">
                © ${currentYear} KZCR. Všechna práva vyhrazena.
            </p>
        </div>
    </div>
</body>
</html>`;

    // Plain text version
    let text = '';
    if (participantName) {
        text += `Vážený/á ${participantName},\n\n`;
    } else {
        text += 'Vážený/á kolego/kolegyně,\n\n';
    }

    text += `Byli jste přidáni jako účastník pohovoru s uchazečem ${applicantName}.\n\n`;

    if (description) {
        text += `Popis pohovoru:\n${description}\n\n`;
    }

    text += 'DETAILY POHOVORU:\n';
    text += '═══════════════════════════\n';
    text += `Uchazeč: ${applicantName}\n`;
    text += `Název: ${interviewTitle}\n`;
    text += `Datum: ${formattedDate}\n`;
    text += `Čas: ${formattedTime}\n`;
    text += `Délka: ${duration} minut\n`;
    text += `Místo: ${location}\n`;

    if (participants) {
        text += `Další účastníci: ${participants}\n`;
    }

    if (onlineMeetingLink) {
        text += `\nOnline Meeting Link:\n${onlineMeetingLink}\n`;
    }

    if (notes) {
        text += `\nPoznámky pro tazatele:\n${notes}\n`;
    }

    text += '\nPŘÍPRAVA NA POHOVOR:\n';
    text += '• Zkontrolujte si životopis a dokumenty uchazeče\n';
    text += '• Připravte si otázky relevantní pro pozici\n';
    text += '• Dostavte se na místo 5 minut před začátkem\n';
    text += '• V případě online pohovoru otestujte si připojení předem\n';

    text += '\n📆 K tomuto emailu je připojena pozvánka do kalendáře (.ics soubor).\n';

    text += '\nV případě, že se nemůžete v uvedený termín zúčastnit, kontaktujte prosím co nejdříve organizátora nebo personální oddělení.\n\n';

    text += '───────────────────────────\n';
    text += 'S pozdravem,\n';
    text += 'Personální oddělení\n';
    text += `${organizationName}\n`;

    return { html, text };
};

module.exports = { generate };
