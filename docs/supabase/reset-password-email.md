# Supabase reset-password email

This project keeps the reset-password email template here for manual pasting into the Supabase dashboard:

- HTML template: `docs/supabase/reset-password-email.html`
- Plain text template: `docs/supabase/reset-password-email.txt`
- Logo asset in this repo: `public/email/lekkerledger-logo.png`
- Production logo URL: `https://lekkerledger.co.za/email/lekkerledger-logo.png`
- Subject: `Reset your LekkerLedger password`

## Paste instructions

1. Open the Supabase dashboard for LekkerLedger.
2. Go to `Authentication`.
3. Open `Email Templates`.
4. Select `Reset Password`.
5. Set the subject line to `Reset your LekkerLedger password`.
6. Open `docs/supabase/reset-password-email.html` and paste its full contents into the HTML editor.
7. Open `docs/supabase/reset-password-email.txt` and paste its full contents into the plain text editor.
8. Save the template.
9. Send a test reset-password email from Supabase and confirm the logo loads from `https://lekkerledger.co.za/email/lekkerledger-logo.png`.

## Notes

- The HTML uses the required Supabase reset link variable: `{{ .ConfirmationURL }}`.
- The template uses one clear primary action only: `Reset Password`.
- The logo is a PNG and appears once, centred near the top at `96px` wide.
- Because the asset lives in Next.js `public/`, production serves it at `/email/lekkerledger-logo.png` on the site origin.
