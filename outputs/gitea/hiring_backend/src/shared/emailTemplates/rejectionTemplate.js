const generate = ({ applicantName, jobTitle, organizationName, notes }) => {
    const subject = `Odpověď na Vaši žádost o pozici ${jobTitle}`;
    let text = `Vážený/á ${applicantName},\n\nDěkujeme Vám za Váš zájem o pozici ${jobTitle} ve společnosti ${organizationName}.\n\nS potěšením Vám oznamujeme, že jsme Vaši žádost pečlivě posoudili. V tuto chvíli jsme se však rozhodli pokračovat s jinými kandidáty, jejichž profily lépe odpovídají požadavkům na danou pozici.`;

    if (notes) {
        text += `\n\nPoznámka od personalisty:\n${notes}`;
    }

    text += `\n\nPřejeme Vám mnoho úspěchů ve Vašem dalším profesním životě.\n\nS pozdravem,\nPersonální oddělení\n${organizationName}`;

    const html = `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
        
        <!-- Header -->
        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">
                Odpověď na Vaši žádost
            </h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px 20px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Vážený/á ${applicantName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
                Děkujeme Vám za Váš zájem o pozici <strong>${jobTitle}</strong> ve společnosti <strong>${organizationName}</strong>.
            </p>

            <p style="font-size: 16px; margin-bottom: 20px;">
                S potěšením Vám oznamujeme, že jsme Vaši žádost pečlivě posoudili. V tuto chvíli jsme se však rozhodli pokračovat s jinými kandidáty, jejichž profily lépe odpovídají požadavkům na danou pozici.
            </p>

            ${notes ? `
            <div style="background-color: #f3f4f6; border-left: 4px solid #6b7280; padding: 15px; margin-bottom: 20px;">
                <p style="margin: 0; font-weight: 600; color: #4b5563;">Poznámka od personalisty:</p>
                <p style="margin: 5px 0 0 0; font-style: italic;">${notes}</p>
            </div>
            ` : ''}

            <p style="font-size: 16px; margin-bottom: 30px;">
                Přejeme Vám mnoho úspěchů ve Vašem dalším profesním životě.
            </p>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                <p style="font-size: 14px; color: #6b7280; margin: 0;">
                    S pozdravem,<br>
                    <strong>Personální oddělení</strong><br>
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
                ${organizationName}
            </p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} KZCR. Všechna práva vyhrazena.
            </p>
        </div>
    </div>
</body>
</html>`;

    return { html, text, subject };
};

module.exports = { generate };
