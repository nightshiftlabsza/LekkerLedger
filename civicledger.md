# Civic Ledger Design System & Architectural Guidelines
*(Persistent Source of Truth for all UI, Features, and Content)*

**CRITICAL INSTRUCTION FOR AI AGENTS:** You MUST read and strictly adhere to this document before making ANY UI changes, adding new features, or modifying marketing/app copy. Do not improvise your own design tokens, colors, or structural patterns.

---

## 1. Color Foundation (Source of Truth)
Do not use Tailwind default colors or any other color palette. Use the exact hex codes below.

### Light Mode Tokens (Exact)
- **Paper Background:** `#FAF7F0` (The base for pages and documents)
- **Surfaces:** `#FFFFFF` (Cards, modals, elevated elements)
- **Borders:** `#E6E0D6` (Dividers, ruling lines, input borders)
- **Text Ink:** `#101828` (Primary text)
- **Text Muted:** `#475467` (Secondary text)

### Dark Mode Tokens (Exact)
- **Background:** `#0B0F14`
- **Surfaces:** `#111827` (Surface-1) and `#151F2E` (Surface-2)
- **Borders:** `#223045`
- **Text:** `#E6EAF2`

### Accents (Constrained Usage)
- **Primary CTA Green:** `#007A4D`
  *Restrained "SA green" with strong contrast vs white text.*
- **Focus Ring + Micro-Highlights Gold:** `#C47A1C`
  *Warm civic gold. Mandatory for focus indicators (minimum 2px ring with 3px offset) on interactive elements.*
- **Rules on Accents:**
  - ✅ **Must use for:** Primary CTA buttons, small icons, focus rings, tiny divider lines, "badge chips", stamp motifs.
  - ❌ **Must NOT use for:** Full-bleed section backgrounds, large gradients in flag colors, body text, large illustrations.

### Semantic Colors
- **Success:** Green (distinct tone from primary CTA)
- **Warning:** Amber
- **Error:** Red (Used sparingly; no marketing drama)
- **Info:** Blue

---

## 2. Typography & Aesthetic
- **Fonts:** **IBM Plex Serif** (Headings) and **IBM Plex Sans** (Body/UI text).
- **Tone:** "Official document" - calm, structured, premium, institutional.
- **Aesthetic:** "Paper and ink". Utilize subtle ledger ruling lines and stamp-like motifs for structure.
- **PDF Generation:** All generated PDFs must use the precise color tokens and the downloaded IBM Plex `.ttf` fonts via our font-loader (`pdf-fonts.ts`), adhering strictly to the "Civic Ledger" paper look. No blocky, modern web gradients inside documents.

---

## 3. Structural & Architectural Guidelines (The Audit Mandates)

### A. Strict Marketing vs. App Separation
- **Marketing Pages** (`/`, `/pricing`, `/calculator`, `/rules`, `/legal/*`): Focus on "what this is" and building trust.
  - ❌ **MUST NOT** display the in-app navigation shell ("Work / Tools / Account").
- **App Pages** (`/app/*`): The authenticated task hub.
  - **Navigation Web:** Desktop-first left sidebar + top bar.
  - **Navigation Mobile:** Material-like bottom navigation + prominent FAB.

### B. The "Monthly Payroll" Core Workflow
- **Dashboard (`/app/dashboard`)** must be a **task hub for monthly payroll**, answering: "What is the status of this month's payroll, and what do I do next?".
- **Pay Periods** replaces "Payslip" as the core flow: `Start Period` → `Complete per-employee` → `Review ("Check Answers")` → `Generate PDFs` → `Lock & Archive`.
- **Review Step:** A mandatory review step is required before PDF generation or locking.

### C. Trust, Evidence, and Copy Constraints
- **Precise Privacy claims:** Never say "Zero servers" or "100% legal". Use precise phrasing: "No LekkerLedger central employee database; data stays on your device and/or in your own Google Drive."
- **Tone Strategy:** Calm compliance guardrails. Replace all "fear/CCMA-heavy" marketing copy with respectful, neutral education.
- **Refund/Pricing Consistency:** Align pricing copy across all surfaces using the live Free / Standard / Pro model. Free is basic payslips for one worker, Standard is the main paid plan, and Pro is the scale-and-control plan. Do not use permanence claims like "forever" or percentage-savings copy unless they are legally and operationally exact.
- **NMW Constant:** The National Minimum Wage must use the latest verified source (e.g., R30.23/hr from Mar 2026). NEVER hardcode conflicting or outdated wage constants across the app.

### D. Responsive & Interaction Principles
- **Grid:** Use a 12-column responsive grid on desktop.
- **Ultrawide Design (`>1440px`):** Prevent empty whitespace by using **contextual supporting side panels** (e.g., document previews, sync status) rather than a narrow centered text column.
- **Max text line length:** 60-75 characters for readability.
- **Mobile CTAs:** Use sticky bottom action bars for key workflows to ensure reachability.
- **Audit-ready Storage:** Surface Google Drive vs Local storage statuses prominently (sync health badge). Every action needs empty, loading, error, and recovery states.

