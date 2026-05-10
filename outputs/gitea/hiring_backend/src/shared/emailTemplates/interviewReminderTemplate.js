/**
 * Interview reminder email template
 * Sent 24 hours before the scheduled interview
 */

/**
 * Generate interview reminder email
 * @param {Object} data - Template data
 * @param {string} data.applicantName - Applicant's full name
 * @param {string} data.interviewTitle - Interview title
 * @param {string} data.formattedDate - Formatted date string
 * @param {string} data.formattedTime - Formatted time string
 * @param {string} data.duration - Duration in minutes
 * @param {string} data.locationType - Type of location
 * @param {string} data.location - Location details
 * @param {string} data.onlineMeetingLink - Video call URL (optional)
 * @param {string} data.participants - List of participants
 * @param {string} data.organizationName - Organization name
 * @returns {Object} - { html, text }
 */
const generate = ({
    applicantName,
    interviewTitle,
    formattedDate,
    formattedTime,
    duration = 60,
    locationType,
    location,
    onlineMeetingLink = '',
    participants = '',
    organizationName = 'Krajská Zdravotní a.s.'
}) => {
    const currentYear = new Date().getFullYear();
    const locationIcon = locationType === 'online' ? '💻' : '📍';

    const html = `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Připomínka pohovoru</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

        <!-- Header -->
        <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">
                ⏰ Připomínka pohovoru
            </h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                Váš pohovor se koná zítra
            </p>
        </div>

        <!-- Content -->
        <div style="padding: 30px 20px;">
            ${applicantName ? `<p style="font-size: 16px; margin-bottom: 20px;">Vážený/á ${applicantName},</p>` : '<p style="font-size: 16px; margin-bottom: 20px;">Vážený/á uchazeči/uchazečko,</p>'}

            <p style="font-size: 16px; margin-bottom: 20px;">
                Tímto Vám připomínáme nadcházející pohovor v naší organizaci.
            </p>

            <!-- Interview Details Card -->
            <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #92400e;">
                    📅 Detaily pohovoru
                </h2>

                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #92400e; width: 120px;">Název:</td>
                        <td style="padding: 8px 0; font-weight: 600;">${interviewTitle}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #92400e;">Datum:</td>
                        <td style="padding: 8px 0; font-weight: 600; color: #dc2626;">${formattedDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #92400e;">Čas:</td>
                        <td style="padding: 8px 0; font-weight: 600; font-size: 18px; color: #dc2626;">${formattedTime}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #92400e;">Délka:</td>
                        <td style="padding: 8px 0;">${duration} minut</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #92400e;">Místo:</td>
                        <td style="padding: 8px 0;">${locationIcon} ${location}</td>
                    </tr>
                    ${participants ? `
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #92400e;">Účastníci:</td>
                        <td style="padding: 8px 0;">👥 ${participants}</td>
                    </tr>
                    ` : ''}
                </table>

                ${onlineMeetingLink ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #fde68a;">
                    <p style="margin: 0 0 10px 0; font-weight: 600; color: #92400e;">Online Meeting Link:</p>
                    <a href="${onlineMeetingLink}" style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                        Připojit se k pohovoru
                    </a>
                </div>
                ` : ''}
            </div>

            <!-- Preparation Checklist -->
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #1f2937;">✓ Příprava na pohovor:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
                    <li style="margin-bottom: 8px;">Připravte si občanský průkaz nebo pas</li>
                    <li style="margin-bottom: 8px;">Zkontrolujte si životopis</li>
                    <li style="margin-bottom: 8px;">Připravte si případné certifikáty</li>
                    ${locationType === 'online' ? '<li style="margin-bottom: 8px;">Otestujte si video a mikrofon</li>' : ''}
                    ${locationType === 'online' ? '<li style="margin-bottom: 8px;">Připojte se 5 minut před začátkem</li>' : '<li style="margin-bottom: 8px;">Dorazte 10 minut před začátkem</li>'}
                </ul>
            </div>

            <div style="background-color: #dbeafe; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #1e40af; font-weight: 600;">
                    💡 Tip: Přidejte si událost do kalendáře, abyste na ni nezapomněli!
                </p>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                V případě, že se nemůžete dostavit, kontaktujte nás prosím co nejdříve na adrese
                <a href="mailto:hr@kzcr.eu" style="color: #2563eb; font-weight: 600;">hr@kzcr.eu</a>.
            </p>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                <p style="font-size: 14px; color: #6b7280; margin: 0;">
                    Těšíme se na setkání s Vámi!<br><br>
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
    if (applicantName) {
        text += `Vážený/á ${applicantName},\n\n`;
    } else {
        text += 'Vážený/á uchazeči/uchazečko,\n\n';
    }

    text += '⏰ PŘIPOMÍNKA POHOVORU\n';
    text += 'Váš pohovor se koná zítra!\n\n';

    text += 'DETAILY POHOVORU:\n';
    text += '═══════════════════════════\n';
    text += `Název: ${interviewTitle}\n`;
    text += `Datum: ${formattedDate}\n`;
    text += `Čas: ${formattedTime}\n`;
    text += `Délka: ${duration} minut\n`;
    text += `Místo: ${location}\n`;

    if (participants) {
        text += `Účastníci: ${participants}\n`;
    }

    if (onlineMeetingLink) {
        text += `\nOnline Meeting Link:\n${onlineMeetingLink}\n`;
    }

    text += '\n✓ PŘÍPRAVA NA POHOVOR:\n';
    text += '• Připravte si občanský průkaz nebo pas\n';
    text += '• Zkontrolujte si životopis\n';
    text += '• Připravte si případné certifikáty\n';
    if (locationType === 'online') {
        text += '• Otestujte si video a mikrofon\n';
        text += '• Připojte se 5 minut před začátkem\n';
    } else {
        text += '• Dorazte 10 minut před začátkem\n';
    }

    text += '\nV případě, že se nemůžete dostavit, kontaktujte nás prosím co nejdříve na adrese hr@kzcr.eu.\n\n';

    text += '───────────────────────────\n';
    text += 'Těšíme se na setkání s Vámi!\n\n';
    text += 'Personální oddělení\n';
    text += `${organizationName}\n`;

    return { html, text };
};

module.exports = { generate };
