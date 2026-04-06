import { getRequiredEnvValue } from "./env";

const RESEND_API_URL = "https://api.resend.com/emails";

interface DripEmail {
    subject: string;
    html: string;
    text: string;
}

function brandedWrapper(tag: string, heading: string, bodyHtml: string, ctaText: string, ctaUrl: string): string {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${heading}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#FAF7F0; color:#101828;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; margin:0; padding:32px 0; background-color:#FAF7F0;">
      <tr>
        <td align="center" style="padding:0 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; width:100%; background-color:#FFFFFF; border:1px solid #E6E0D6; border-radius:14px; overflow:hidden;">
            <tr>
              <td style="height:6px; background-color:#C47A1C; line-height:6px; font-size:0;">&nbsp;</td>
            </tr>

            <tr>
              <td align="center" style="padding:28px 32px 12px 32px;">
                <img src="https://lekkerledger.co.za/email/lekkerledger-logo.png" alt="LekkerLedger" width="96" style="display:block; width:96px; max-width:96px; height:auto; border:0;" />
              </td>
            </tr>

            <tr>
              <td style="padding:0 32px;">
                <div style="height:1px; background-color:#E6E0D6; line-height:1px; font-size:0;">&nbsp;</div>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 32px 0 32px;">
                <span style="display:inline-block; font-family:'IBM Plex Sans', Arial, Helvetica, sans-serif; font-size:12px; line-height:1; letter-spacing:0.06em; text-transform:uppercase; color:#475467; border:1px solid #E6E0D6; border-radius:999px; padding:8px 12px; background-color:#FAF7F0;">
                  ${tag}
                </span>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 32px 0 32px;">
                <h1 style="margin:0; font-family:'IBM Plex Serif', Georgia, 'Times New Roman', serif; font-size:30px; line-height:1.2; font-weight:600; color:#101828;">
                  ${heading}
                </h1>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 32px 0 32px;">
                ${bodyHtml}
              </td>
            </tr>

            <tr>
              <td align="left" style="padding:28px 32px 0 32px;">
                <a href="${ctaUrl}" style="display:inline-block; background-color:#007A4D; color:#FFFFFF; text-decoration:none; font-family:'IBM Plex Sans', Arial, Helvetica, sans-serif; font-size:16px; line-height:1; font-weight:600; padding:15px 22px; border-radius:10px;">
                  ${ctaText}
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 32px 32px 32px;">
                <div style="height:1px; background-color:#E6E0D6; line-height:1px; font-size:0; margin-bottom:16px;">&nbsp;</div>
                <p style="margin:0; font-family:'IBM Plex Sans', Arial, Helvetica, sans-serif; font-size:12px; line-height:1.7; color:#475467;">
                  LekkerLedger helps South African households keep payroll records, documents, and monthly admin in order.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const BODY_STYLE = "margin:0; font-family:'IBM Plex Sans', Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#475467;";

const SITE_URL = "https://lekkerledger.co.za";

export function getDripEmail(dripNumber: 1 | 2 | 3): DripEmail {
    switch (dripNumber) {
        case 1:
            return {
                subject: "The one UIF rule most household employers miss",
                text: `Hi there,

Did you know that if your domestic worker works more than 24 hours a month, you're legally required to register for UIF — and deduct 1% from their pay?

Most household employers don't realise this until it's too late. The penalty for non-registration can be a fine or even prosecution under the UIF Act.

The good news: it's straightforward to sort out.

Read our quick UIF guide: ${SITE_URL}/resources

If you'd like LekkerLedger to handle UIF deductions, payslips, and leave tracking automatically, our Standard plan is R29/month.

Zakariyya, LekkerLedger`,
                html: brandedWrapper(
                    "Compliance tip",
                    "The one UIF rule most household employers miss",
                    `<p style="${BODY_STYLE}">
                      Did you know that if your domestic worker works more than 24 hours a month, you're legally required to register for UIF — and deduct 1% from their pay?
                    </p>
                    <p style="${BODY_STYLE} margin-top:16px;">
                      Most household employers don't realise this until it's too late. The penalty for non-registration can be a fine or even prosecution under the UIF Act.
                    </p>
                    <p style="${BODY_STYLE} margin-top:16px;">
                      The good news: it's straightforward to sort out.
                    </p>`,
                    "Read our UIF guide",
                    `${SITE_URL}/resources`,
                ),
            };

        case 2:
            return {
                subject: "5 things every domestic worker payslip should show",
                text: `Hi there,

A proper payslip isn't just nice to have — if your worker ever claims UIF or you face a CCMA dispute, you'll need records.

Every payslip should show:

1. Gross pay
2. UIF deduction (1% of gross)
3. Accommodation deduction (if applicable)
4. Net pay
5. Employer UIF contribution (1% of gross)

LekkerLedger calculates all of this automatically and generates a professional PDF each month.

See plans and pricing: ${SITE_URL}/pricing

Zakariyya, LekkerLedger`,
                html: brandedWrapper(
                    "Payslip guide",
                    "5 things every domestic worker payslip should show",
                    `<p style="${BODY_STYLE}">
                      A proper payslip isn't just nice to have — if your worker ever claims UIF or you face a CCMA dispute, you'll need records.
                    </p>
                    <p style="${BODY_STYLE} margin-top:16px;">Every payslip should show:</p>
                    <ol style="${BODY_STYLE} margin:12px 0 0 0; padding-left:20px;">
                      <li style="margin-bottom:6px;">Gross pay</li>
                      <li style="margin-bottom:6px;">UIF deduction (1% of gross)</li>
                      <li style="margin-bottom:6px;">Accommodation deduction (if applicable)</li>
                      <li style="margin-bottom:6px;">Net pay</li>
                      <li>Employer UIF contribution (1% of gross)</li>
                    </ol>
                    <p style="${BODY_STYLE} margin-top:16px;">
                      LekkerLedger calculates all of this automatically and generates a professional PDF each month.
                    </p>`,
                    "See plans and pricing",
                    `${SITE_URL}/pricing`,
                ),
            };

        case 3:
            return {
                subject: "R29/month for sorted household payroll \u2014 ends 30 April",
                text: `Hi there,

Our early-bird pricing won't last forever. For R29/month you get:

- Up to 3 employees
- Leave tracking
- Employment contracts
- Cloud-secured records
- UIF exports

There's a 7-day money-back guarantee and you can cancel anytime.

Start your subscription: ${SITE_URL}/pricing

Zakariyya, LekkerLedger`,
                html: brandedWrapper(
                    "Limited offer",
                    "R29/month for sorted household payroll",
                    `<p style="${BODY_STYLE}">
                      Our early-bird pricing won't last forever. For R29/month you get:
                    </p>
                    <ul style="${BODY_STYLE} margin:12px 0 0 0; padding-left:20px;">
                      <li style="margin-bottom:6px;">Up to 3 employees</li>
                      <li style="margin-bottom:6px;">Leave tracking</li>
                      <li style="margin-bottom:6px;">Employment contracts</li>
                      <li style="margin-bottom:6px;">Cloud-secured records</li>
                      <li>UIF exports</li>
                    </ul>
                    <p style="${BODY_STYLE} margin-top:16px;">
                      There's a 7-day money-back guarantee and you can cancel anytime.
                    </p>`,
                    "Start your subscription",
                    `${SITE_URL}/pricing`,
                ),
            };
    }
}

export async function sendDripEmail(to: string, dripNumber: 1 | 2 | 3): Promise<void> {
    const apiKey = getRequiredEnvValue("RESEND_API_KEY");
    const from = getRequiredEnvValue("FREE_PAYSLIP_FROM_EMAIL");
    const drip = getDripEmail(dripNumber);

    const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to: [to],
            subject: drip.subject,
            html: drip.html,
            text: drip.text,
        }),
        cache: "no-store",
    });

    if (response.ok) {
        return;
    }

    let message = "The newsletter email could not be sent.";
    try {
        const payload = await response.json() as { error?: { message?: string }; message?: string };
        message = payload.error?.message || payload.message || message;
    } catch {
        // Fall back to the generic message.
    }

    throw new Error(message);
}
