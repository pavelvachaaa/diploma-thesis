/**
 * Sent when an interview is cancelled
 */

/**
 * Generate interview cancellation email
 * @param {Object} data - Template data
 * @param {string} data.applicantName - Applicant's full name
 * @param {string} data.interviewTitle - Interview title
 * @param {string} data.formattedDate - Formatted date string
 * @param {string} data.formattedTime - Formatted time string
 * @param {string} data.location - Location details
 * @param {string} data.cancellationReason - Reason for cancellation
 * @param {string} data.organizationName - Organization name
 * @returns {Object} - { html, text }
 */
const generate = ({
    applicantName,
    interviewTitle,
    formattedDate,
    formattedTime,
    location,
    cancellationReason = '',
    organizationName = 'Krajská Zdravotní a.s.'
}) => {
    const currentYear = new Date().getFullYear();
    const formattedReason = cancellationReason ? cancellationReason.replace(/\n/g, '<br>') : '';

    const html = `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zrušení pohovoru</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

        <!-- Header -->
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">
                ❌ Zrušení pohovoru
            </h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px 20px;">
            ${applicantName ? `<p style="font-size: 16px; margin-bottom: 20px;">Vážený/á ${applicantName},</p>` : '<p style="font-size: 16px; margin-bottom: 20px;">Vážený/á uchazeči/uchazečko,</p>'}

            <p style="font-size: 16px; margin-bottom: 20px;">
                S politováním Vás musíme informovat, že plánovaný pohovor byl zrušen.
            </p>

            <!-- Cancelled Interview Details -->
            <div style="background-color: #fee2e2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #991b1b;">
                    Zrušený pohovor
                </h2>

                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #991b1b; width: 120px;">Název:</td>
                        <td style="padding: 8px 0; text-decoration: line-through;">${interviewTitle}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #991b1b;">Datum:</td>
                        <td style="padding: 8px 0; text-decoration: line-through;">${formattedDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #991b1b;">Čas:</td>
                        <td style="padding: 8px 0; text-decoration: line-through;">${formattedTime}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #991b1b;">Místo:</td>
                        <td style="padding: 8px 0; text-decoration: line-through;">${location}</td>
                    </tr>
                </table>
            </div>

            ${formattedReason ? `
            <!-- Cancellation Reason -->
            <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0 0 5px 0; font-weight: 600; color: #92400e;">Důvod zrušení:</p>
                <p style="margin: 0; font-size: 14px; color: #78350f;">${formattedReason}</p>
            </div>
            ` : ''}

            <!-- Next Steps -->
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #1f2937;">Co dál?</h3>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    Budeme Vás kontaktovat ohledně náhradního termínu.
                    V případě jakýchkoliv dotazů nás neváhejte kontaktovat.
                </p>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                Omlouvame se za případné komplikace a těšíme se na další spolupráci.
            </p>

            <p style="font-size: 14px; color: #6b7280;">
                Pro další informace nás prosím kontaktujte na adrese
                <a href="mailto:hr@kzcr.eu" style="color: #2563eb; font-weight: 600;">hr@kzcr.eu</a>
                nebo na telefonním čísle uvedeném v naší nabídce.
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
    if (applicantName) {
        text += `Vážený/á ${applicantName},\n\n`;
    } else {
        text += `Vážený/á uchazeči/uchazečko,\n\n`;
    }

    text += '❌ ZRUŠENÍ POHOVORU\n\n';
    text += 'S politováním Vás musíme informovat, že plánovaný pohovor byl zrušen.\n\n';

    text += 'ZRUŠENÝ POHOVOR:\n';
    text += '═══════════════════════════\n';
    text += `Název: ${interviewTitle}\n`;
    text += `Datum: ${formattedDate}\n`;
    text += `Čas: ${formattedTime}\n`;
    text += `Místo: ${location}\n`;

    if (cancellationReason) {
        text += `\nDŮVOD ZRUŠENÍ:\n${cancellationReason}\n`;
    }

    text += '\nCO DÁL?\n';
    text += 'Budeme Vás kontaktovat ohledně náhradního termínu.\n';
    text += 'V případě jakýchkoliv dotazů nás neváhejte kontaktovat.\n\n';

    text += 'Omlouvame se za případné komplikace a těšíme se na další spolupráci.\n\n';
    text += 'Pro další informace nás prosím kontaktujte na adrese hr@kzcr.eu\n';
    text += 'nebo na telefonním čísle uvedeném v naší nabídce.\n\n';

    text += '───────────────────────────\n';
    text += 'S pozdravem,\n';
    text += 'Personální oddělení\n';
    text += `${organizationName}\n`;

    return { html, text };
};

module.exports = { generate };
