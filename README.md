This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Analytics (GA4)

This project uses Google Analytics 4 to track conversions.

### Setup
1. Create a GA4 property in the [Google Analytics Console](https://analytics.google.com/).
2. Copy your **Measurement ID** (e.g., `G-XXXXXXXXXX`).
3. Add it to your environment variables:
   - Locally: Add `NEXT_PUBLIC_GA_ID=your_id_here` to `.env.local`.
   - Production: Add it as an environment variable in your hosting provider (e.g., Vercel).

### Events Tracked
- `payslip_export`: Fired when a user clicks "Download PDF" on the preview page.
  - Parameter: `{ method: "download_pdf" }`
- `onboarding_complete`: Fired when a user completes the payslip wizard.

### Verification
You can verify that events are firing by using the **GA4 Realtime report** or **DebugView**.
Alternatively, check the Network tab in Browser DevTools for requests to `google-analytics.com/g/collect`. 
Ignore this line
