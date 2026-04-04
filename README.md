This is a [Next.js](https://nextjs.org) project for LekkerLedger.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3002](http://localhost:3002) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to load local and hosted fonts through Next.js.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy

LekkerLedger is configured for deployment on Railway with [`railway.json`](./railway.json).

General deployment guidance for Next.js is available in the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## Analytics (GA4)

This project uses Google Analytics 4 to track conversions.

### Setup
1. Create a GA4 property in the [Google Analytics Console](https://analytics.google.com/).
2. Copy your **Measurement ID** (e.g., `G-XXXXXXXXXX`).
3. Add it to your environment variables:
   - Locally: Add `NEXT_PUBLIC_GA_ID=your_id_here` to `.env.local`.
   - Production: Add it as an environment variable in your hosting provider (for this app, Railway).

### Events Tracked
Current code examples include:

- `payslip_export`: Fired when a user downloads a payslip PDF from the preview, payroll, or history flows.
  - Example parameter: `{ method: "download_pdf" }`
- `onboarding_complete`: Fired when a user completes the payslip wizard.
- `app_performance_metric`: Fired for named timing and performance metrics such as `paystack_open_latency`, `login_to_interactive`, `auth_resolved_after_login`, `subscription_resolved_after_login`, and `dashboard_mount_renders`.
- `pwa_install_prompt`: Fired when the web install prompt is shown.
- `pwa_install`: Fired when the web app install completes.

### Verification
You can verify that events are firing by using the **GA4 Realtime report** or **DebugView**.
Alternatively, check the Network tab in Browser DevTools for requests to `google-analytics.com/g/collect`.
