# SA Domestic Worker Payslips — Product Brief (Source of Truth)

## 1) What this app is (plain English)

A simple tool for South African homeowners to:

- calculate domestic worker pay correctly (including legal minimum wage rules),
- calculate Unemployment Insurance Fund (UIF) amounts,
- generate a professional payslip PDF (and later an employment contract PDF).

This exists because most employers are not trying to break the law — they’re busy and the admin is painful. :contentReference[oaicite:8]{index=8}

## 2) Who it’s for

Primary user: South African homeowner employing a domestic worker / gardener / au pair.
They want: speed, confidence, and a document that looks official (not an ugly spreadsheet).

## 3) North-star outcome

“Create a compliant payslip in under 90 seconds on a phone.”

## 4) Design philosophy (do not improvise)

The UI must feel like a modern consumer product — “Uber/Airbnb-level” simplicity applied to household admin. :contentReference[oaicite:9]{index=9}

Rules:

- Mobile-first
- Big tap targets
- Clear hierarchy
- Calm, trustworthy look
- Friendly but firm error messages (especially minimum wage)

## 5) Architecture philosophy (privacy + simplicity)

We use a “zero-server” approach:

- No storing employee data on our servers.
- All data saved only on the user’s device (browser storage).

Implementation: Progressive Web App (PWA) + IndexedDB (browser database) using a helper library like localForage. :contentReference[oaicite:10]{index=10}

Why: avoids heavy Protection of Personal Information Act (POPIA) burdens and reduces risk. :contentReference[oaicite:11]{index=11}

Important consequence:

- If the user clears browser data / loses device, data is gone. That’s acceptable for this product.

## 6) Closed Beta scope (NO PAYMENTS in beta)

Closed beta goal: prove the experience is premium + calculations are correct.

Beta includes:
A) Free “Minimum Wage + UIF Calculator” screen (front door) :contentReference[oaicite:12]{index=12}  
B) Payslip generator wizard (step-by-step)  
C) PDF preview + PDF download (both watermarked and clean are FREE for beta)
D) Save employees and employer details locally (so next month is fast)

Beta does NOT include:

- Any payment gateway
- Any in-app purchases or paywalls
- Any government submission (UIF filing etc.)
- Any accounts / login

Optional “closed” aspect for beta:

- Do NOT build an invite code system.
- If you must restrict access, use the simplest possible “shared secret” (single password gate) — but only if needed.

## 7) Post-beta (business model later — do not build now)

The doc’s monetisation idea is pay-per-export later (e.g., Paystack) — but this is explicitly postponed until after beta. :contentReference[oaicite:13]{index=13}

## 8) Core user flow (beta)

1. Landing / Calculator:
   - user enters hours and hourly rate → app shows breakdown
2. Employee list:
   - add/select employee
3. Payslip wizard (5 steps):
   - Employee → Pay period → Hours & rate → Deductions → Preview
4. Preview/export:
   - show professional A4 preview
   - download PDF

## 9) Calculation rules (must follow exactly)

Definitions:

- National Minimum Wage (NMW): legal minimum hourly pay.
- Basic Conditions of Employment Act (BCEA): main labour law framework.
- Sectoral Determination 7 (SD7): rules specific to domestic workers.
- UIF: unemployment insurance contributions.
- Commission for Conciliation, Mediation and Arbitration (CCMA): labour dispute forum.

Hard rules from the blueprint:

- Default hourly rate must start at R30.23 and the app must block rates below that, with a clear warning. :contentReference[oaicite:14]{index=14}
- Four-hour minimum rule: if a worker works >0 but <4 hours on a day, they must be paid for 4 hours. :contentReference[oaicite:15]{index=15}
- Overtime rate = hourly rate × 1.5. :contentReference[oaicite:16]{index=16}
- Sunday rate (default assumption for “occasional Sunday work”) = hourly rate × 2.0. :contentReference[oaicite:17]{index=17}
- Public holiday rate = hourly rate × 2.0. :contentReference[oaicite:18]{index=18}
- UIF applies only if total hours in the month exceed 24 hours; otherwise UIF is 0. :contentReference[oaicite:19]{index=19}
- UIF base is capped at R17,712/month. :contentReference[oaicite:20]{index=20}
- Employee UIF deduction = 1% of UIF base; employer UIF contribution = 1% of UIF base (shown separately). :contentReference[oaicite:21]{index=21}
- Accommodation deduction (optional): maximum 10% (only if user explicitly toggles it on). :contentReference[oaicite:22]{index=22}

## 10) Payslip PDF requirements (must look official)

The payslip must include required fields (the blueprint lists what to show), including:

- employer details, employee details, pay period
- gross pay, itemised deductions, net pay
- hours and rates for ordinary/overtime/Sunday/public holiday when relevant :contentReference[oaicite:23]{index=23}

PDF generation approach:

- Use pdf-lib and inject values onto a pre-designed PDF template for a pixel-perfect result. :contentReference[oaicite:24]{index=24}

## 11) UI acceptance checklist (beta must pass)

- Looks excellent at 360px width (mobile)
- Wizard stepper is clear
- Errors are readable and helpful
- Minimum wage block is obvious
- Preview feels like a real A4 document viewer
- No clutter, no “enterprise HR” vibe

## 12) Quality “bug shields” (non-negotiable)

- TypeScript strict checks
- Input validation (so nonsense inputs don’t break PDF)
- Unit tests for calculation logic
- End-to-end test for the main happy path (create employee → create payslip → download PDF)

Definition of done for beta:

- A user can create an employee, generate a payslip, and download the PDF with no crashes and a premium look.
