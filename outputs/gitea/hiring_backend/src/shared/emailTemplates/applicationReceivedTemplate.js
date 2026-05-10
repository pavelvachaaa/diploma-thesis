/**
 * Application received email template
 * Czech-first content
 * Responsive design with inline styles
 */

const generateApplicationReceivedTemplate = ({ applicantName, jobTitle, organizationName }) => {
    // Validate required parameters
    if (!applicantName || !jobTitle) {
        throw new Error('Missing required template parameters: applicantName, jobTitle');
    }

    const orgName = organizationName || 'Krajská Zdravotní a.s.';
    const currentYear = new Date().getFullYear();

    // HTML template with responsive design and inline styles
    const html = `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Potvrzení o přijetí přihlášky - ${orgName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: -0.5px;">
                Děkujeme za Váš zájem
            </h1>
        </div>

        <!-- Main content -->
        <div style="padding: 40px 30px;">
            <!-- Greeting -->
            <div style="margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 22px; font-weight: 600;">
                    Vážený/á ${applicantName},
                </h2>
                <p style="margin: 0; font-size: 16px; color: #4b5563;">
                    potvrzujeme přijetí Vaší přihlášky na pozici <strong>${jobTitle}</strong>.
                </p>
                <p style="margin-top: 15px; font-size: 16px; color: #4b5563;">
                    Vaši přihlášku pečlivě posoudíme a brzy se Vám ozveme s dalšími informacemi.
                </p>
            </div>

            <!-- Support section -->
            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-top: 30px;">
                <h4 style="margin: 0 0 10px 0; color: #0c4a6e; font-size: 16px; font-weight: 600;">
                    Máte dotaz?
                </h4>
                <p style="margin: 0; font-size: 14px; color: #0369a1;">
                    V případě jakýchkoli otázek nás neváhejte kontaktovat.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 25px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
                S pozdravem,<br>
                <strong>Tým ${orgName}</strong>
            </p>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #d1d5db;">
                © ${currentYear} ${orgName}. Všechna práva vyhrazena.
            </p>
        </div>
    </div>
</body>
</html>`;

    // Plain text version
    const text = `
Děkujeme za Váš zájem

Vážený/á ${applicantName},

potvrzujeme přijetí Vaší přihlášky na pozici ${jobTitle}.

Vaši přihlášku pečlivě posoudíme a brzy se Vám ozveme s dalšími informacemi.

S pozdravem,
Tým ${orgName}

© ${currentYear} ${orgName}. Všechna práva vyhrazena.
`;

    return { html, text };
};

module.exports = {
    generate: generateApplicationReceivedTemplate
};