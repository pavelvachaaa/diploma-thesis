/**
 * Welcome email template for new employee onboarding
 * Czech-first content with English footer note
 * Responsive design with inline styles
 */

const generateWelcomeTemplate = ({ employeeName, username, password, loginUrl, organizationName }) => {
    // Validate required parameters
    if (!employeeName || !username || !password || !loginUrl) {
        throw new Error('Missing required template parameters: employeeName, username, password, loginUrl');
    }

    const orgName = organizationName || 'Krajská Zdravotní a.s. ';
    const currentYear = new Date().getFullYear();

    // HTML template with responsive design and inline styles
    const html = `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vítejte v ${orgName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: -0.5px;">
                Vítejte v ${orgName}
            </h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                Vaše cesta začína zde
            </p>
        </div>

        <!-- Main content -->
        <div style="padding: 40px 30px;">
            <!-- Greeting -->
            <div style="margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 22px; font-weight: 600;">
                    Vážený/á ${employeeName},
                </h2>
                <p style="margin: 0; font-size: 16px; color: #4b5563;">
                    Gratulujeme k přijetí do našeho týmu! Těšíme se na spolupráci s vámi.
                </p>
            </div>

            <!-- Login credentials section -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
                    <span style="background-color: #10b981; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; margin-right: 10px;">
                        🔑
                    </span>
                    Vaše přístupové údaje
                </h3>
                
                <div style="margin-bottom: 15px;">
                    <strong style="color: #374151; display: inline-block; width: 100px;">Uživ. jméno:</strong>
                    <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 14px;">
                        ${username}
                    </code>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <strong style="color: #374151; display: inline-block; width: 100px;">Heslo:</strong>
                    <code style="background-color: #fee2e2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 14px; font-weight: bold;">
                        ${password}
                    </code>
                </div>

                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 15px; border-radius: 0 6px 6px 0;">
                    <p style="margin: 0; font-size: 14px; color: #92400e;">
                        <strong>Důležité:</strong> Toto heslo je by mělo být dočasné. Po prvním přihlášení si prosím nastavte nové, bezpečné heslo.
                    </p>
                </div>
            </div>

            <!-- Login button -->
            <div style="text-align: center; margin-bottom: 30px;">
                <a href="${loginUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2); transition: all 0.3s ease;">
                    Přihlásit se do systému
                </a>
            </div>

            <!-- Next steps -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 25px;">
                <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                    Další kroky:
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                    <li style="margin-bottom: 8px;">Přihlaste se pomocí výše uvedených údajů</li>
                    <li style="margin-bottom: 8px;">Dokončete svůj onboardingový proces</li>
                    <li style="margin-bottom: 8px;">Nahrajte požadované dokumenty</li>
                    <li style="margin-bottom: 8px;">Vyplňte všechny potřebné formuláře</li>
                </ul>
            </div>

            <!-- Support section -->
            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-top: 30px;">
                <h4 style="margin: 0 0 10px 0; color: #0c4a6e; font-size: 16px; font-weight: 600;">
                    Potřebujete pomoc?
                </h4>
                <p style="margin: 0; font-size: 14px; color: #0369a1;">
                    V případě jakýchkoli otázek nebo problémů kontaktujte naši podporu:
                </p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #0369a1; font-size: 14px;">
                    <li>Email: <a href="mailto:support@kzcr.eu" style="color: #2563eb;">support@kzcr.eu</a></li>
                    <li>Telefon: +420 477 111 111</li>
                </ul>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 25px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
                S pozdravem,<br>
                <strong>${orgName}</strong>
            </p>
            <hr style="border: none; height: 1px; background-color: #e5e7eb; margin: 15px 0;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                <em>English note: This is an automated welcome email for new employees. Please contact support if you need assistance in English.</em>
            </p>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #d1d5db;">
                © ${currentYear} ${orgName}. Všechna práva vyhrazena.
            </p>
        </div>
    </div>

    <!-- Mobile responsive styles -->
    <style type="text/css">
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content { padding: 20px !important; }
            .header { padding: 20px 15px !important; }
            .credentials { padding: 20px !important; }
            .button { padding: 12px 25px !important; font-size: 14px !important; }
        }
    </style>
</body>
</html>`;

    // Plain text version
    const text = `
Vítejte v ${orgName}

Vážený/á ${employeeName},

Gratulujeme k přijetí do našeho týmu! Těšíme se na spolupráci s vámi.

PŘÍSTUPOVÉ ÚDAJE:
==================
Uživatelské jméno: ${username}
Heslo: ${password}

DŮLEŽITÉ: Toto heslo je dočasné. Po prvním přihlášení si prosím nastavte nové, bezpečné heslo.

Přihlašovací stránka: ${loginUrl}

DALŠÍ KROKY:
============
1. Přihlaste se pomocí výše uvedených údajů
2. Dokončete svůj onboardingový proces
3. Nahrajte požadované dokumenty
4. Vyplňte všechny potřebné formuláře

POTŘEBUJETE POMOC?
==================
V případě jakýchkoli otázek nebo problémů kontaktujte naši podporu:
- Email: podpora@kzcr.eu
- Telefon: +420 477 111 111

S pozdravem,
${orgName}

---
English note: This is an automated welcome email for new employees. Please contact support if you need assistance in English.

© ${currentYear} ${orgName}. Všechna práva vyhrazena.
`;

    return { html, text };
};

module.exports = {
    generate: generateWelcomeTemplate
};