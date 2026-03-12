# LekkerLedger — replit.md

## Overview

LekkerLedger is a South African household employer payroll and compliance tool. It lets homeowners who employ domestic workers, gardeners, nannies, and similar staff:

- Calculate legally correct pay (including minimum wage rules)
- Calculate UIF (Unemployment Insurance Fund) deductions
- Generate professional payslip PDFs
- Manage employment contracts and a document vault
- Track leave and run payroll each month

The product is a **Progressive Web App (PWA)** built with **Next.js 16 (App Router)**. The core design philosophy is **privacy-first and local-first**: employee data lives on the user's device (browser IndexedDB via localForage), not on a central server. This reduces POPIA (Protection of Personal Information Act) compliance burden.

Target users are non-technical South African households. The north-star goal is "create a compliant payslip in under 90 seconds on a phone."

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Frontend

- **Framework:** Next.js 16 with the App Router (`src/app/`). Two route groups exist:
  - `(app)` — the authenticated payroll application (dashboard, employees, payroll wizard, documents, settings, billing, etc.)
  - `(marketing)` — public-facing marketing pages (homepage, pricing, calculator, resources, legal pages)
- **UI:** Custom "Civic Ledger" design system defined in `civicledger.md`. Uses IBM Plex Serif (headings) and IBM Plex Sans (body). Color palette is strictly defined with a paper-and-ink aesthetic. Tailwind CSS v4 is the utility layer, but only the exact hex tokens from the design spec should be used — no default Tailwind colors.
- **Component library:** Custom components under `src/components/` and `components/`. Radix UI is used for accessible primitives (e.g., `@radix-ui/react-checkbox`). Icons come from `lucide-react`.
- **State management:** React component state and context. No Redux or Zustand. App mode context (`src/lib/app-mode.tsx`) controls local-guest vs. authenticated behavior.

### Data Storage

- **Primary store (local-first):** Browser IndexedDB via `localforage`. All payroll, employee, and document data is stored on-device by default. Key file: `src/lib/storage.ts`.
- **Cloud sync (optional):** Google Drive backup/restore via OAuth (`components/google-sync.tsx`). This is an opt-in feature — data is encrypted before upload.
- **Supabase:** Used for authentication (Google sign-in via `@supabase/ssr`) and server-side billing/entitlement verification. **Not** used as a primary data store for payroll data. Files: `src/lib/supabase/`.
- **S3 (AWS):** Used for document/file uploads via presigned URLs (`@aws-sdk/client-s3`). Referenced in `src/lib/cloud-repository.ts`.

### Backend / Server

- **Next.js API routes and Server Actions** handle billing, entitlement checks, and Supabase session management.
- `src/lib/billing-server.ts` — server-side billing logic (Paystack integration).
- `src/lib/entitlements.ts` — plan-based feature gating (Free, Pro tiers).
- Middleware (`src/lib/supabase/middleware.ts`) handles auth session refresh on requests.

### PDF Generation

- `pdf-lib` with `@pdf-lib/fontkit` for client-side PDF generation. IBM Plex `.ttf` fonts are loaded via `src/lib/pdf-fonts.ts`. All generated PDFs must strictly follow the Civic Ledger color tokens and typography. Key file: `src/lib/pdf.ts`.

### PWA / Offline

- Service worker via `@serwist/next` (`src/app/sw.ts`). Disabled in dev to avoid file-lock issues on Windows. Configured in `next.config.ts`.

### Payroll Calculations

- Pure TypeScript calculation engine in `src/lib/calculator.ts` — stateless functions for gross pay, UIF, overtime, public holiday rates, etc.
- Compliance checking in `src/lib/compliance.ts`.
- Zod schemas define all data shapes (`src/lib/schema.ts`).

### Testing

- **Unit tests:** Vitest (`src/lib/calculator.test.ts`, `src/lib/compliance.test.ts`, `src/lib/schema.test.ts`, etc.)
- **E2E tests:** Playwright (`e2e/` directory) — smoke tests, home page checks, payslip generation flow, visual regression snapshots at multiple breakpoints.

### Key Architectural Rules

1. **Never store employee PII on the app's own servers** — local-first is the privacy guarantee.
2. **All UI must follow `civicledger.md`** — do not use Tailwind default colors, do not improvise the design.
3. **Mobile-first** — big tap targets, clear hierarchy, calm trustworthy aesthetic.
4. **Plan gating** — features are gated by entitlements checked in `src/lib/entitlements.ts`. Free vs. Pro tiers control payslip limits, document vault, leave tracking, etc.

---

## External Dependencies

| Service / Library | Purpose |
|---|---|
| **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`) | Authentication (Google OAuth), session management, middleware |
| **Paystack** (`@paystack/inline-js`) | Payment processing for Pro plan upgrades |
| **AWS S3** (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) | Document file storage (presigned URL uploads) |
| **Google Drive API** | Optional cloud backup/restore of encrypted local data |
| **Google Analytics 4** (`NEXT_PUBLIC_GA_ID`) | Conversion tracking (e.g., payslip export events) |
| **localforage** | IndexedDB abstraction for all local data persistence |
| **pdf-lib + fontkit** | Client-side payslip and contract PDF generation |
| **serwist / @serwist/next** | Service worker and PWA support |
| **date-fns** | Date formatting and calculations |
| **Zod** | Runtime schema validation for all data models |
| **Tailwind CSS v4** | Utility styling (constrained to Civic Ledger design tokens) |
| **Radix UI** | Accessible UI primitives |
| **Lucide React** | Icon set |
| **Playwright** | End-to-end browser tests |
| **Vitest** | Unit and integration tests |

### Required Environment Variables

- `NEXT_PUBLIC_GA_ID` — Google Analytics 4 Measurement ID
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- Paystack public/secret keys (for billing)
- AWS S3 credentials (for document storage)
- Google OAuth credentials (for Drive sync)