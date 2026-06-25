# Civic Ledger Design System and Governance

This is the source of truth for Civic Ledger visual rules, proof strategy, responsive checks, and when new patterns must be documented.

If a UI, copy, screenshot, or layout decision cannot be stated as a rule here, it is not ready to become a default pattern.

## 1. Scope
- Applies to marketing pages, app pages, generated PDFs, and any reusable component or content pattern.
- Marketing pages and app pages are different jobs. Do not blend their navigation, content density, or proof styles.
- If a new pattern is introduced, update this file and `ux.md` in the same change.
- If a section feels visually foreign, simplify it before adding more detail.

## 2. Color Foundation
- Do not use Tailwind default colors or any unapproved palette.
- Use the exact Civic Ledger tokens below unless a semantic state requires its own approved token.

### Light Mode Tokens
- Paper background: `#FAF7F0`
- Surfaces: `#FFFFFF`
- Borders: `#E6E0D6`
- Text ink: `#101828`
- Text muted: `#475467`

### Dark Mode Tokens
- Background: `#0B0F14`
- Surface 1: `#111827`
- Surface 2: `#151F2E`
- Borders: `#223045`
- Text: `#E6EAF2`

### Accents
- Primary CTA green: `#007A4D`
- Focus ring and micro-highlights gold: `#C47A1C`
- Success, warning, error, and info may be used only as semantic states, not decoration.

### Accent Rules
- MUST use green for the primary action, small attention cues, and positive system states.
- MUST use gold for focus rings and small highlight details.
- MUST NOT use accents for full-bleed backgrounds, large gradients, or body text.
- MUST NOT introduce random blue, zinc, purple, or tinted blocks unless they are semantic states.

## 3. Typography
- Use IBM Plex Serif for headings and IBM Plex Sans for body and UI text.
- Do not add a third font family.
- Headings should be sentence case unless a page needs a legal label or acronym.
- Body copy must stay readable on mobile and wide screens.
- On desktop and ultrawide screens, keep body copy in a readable measure of about 60 to 75 characters per line.
- Avoid all caps except for short labels where the UI already expects it.

## 4. Surface and Layout
- The system should look like paper, ledger lines, and document panels, not a generic SaaS theme.
- Use borders, spacing, and structure to organize content. Do not rely on loud color to do the job.
- Cards should feel like paper panels with consistent radius, padding, and border weight.
- Do not mix multiple card styles on the same page unless the difference is intentional and documented.
- Subtle ruling lines, stamps, and document previews are allowed. Glassmorphism is not.
- Section backgrounds should stay quiet. Change structure through layout and evidence, not through random mood shifts.

## 5. Marketing vs App Separation
- Marketing pages must show the page immediately. No branded splash screen.
- Marketing pages must not show the authenticated app shell.
- App pages must use the app shell only.
- Desktop app navigation: left sidebar plus top bar.
- Mobile app navigation: bottom navigation plus a prominent FAB where the workflow needs it.
- Individual pages must not add a second navigation system unless the workflow truly requires it.

## 6. Proof Strategy
- Do not fake social proof.
- Do not invent testimonials, star ratings, customer logos, or quote cards.
- If customer proof is weak, omit it. Use product proof and trust proof instead.

### Product Proof
- Product proof explains what the product does and what the user will see.
- Use real screenshots, sample documents, and workflow previews.
- Product proof belongs where it explains a specific capability, not as decoration.

### Trust Proof
- Trust proof explains why the user can believe the product, pay for it, or store data in it.
- Use refund clarity, storage and backup clarity, support contact, privacy wording, update dates, and official citations.
- Trust proof belongs near payment, pricing, legal claims, and signup decisions.

### Screenshot Rules
- Hero gets one primary proof object only.
- A hero may carry one screenshot, one sample document preview, or one compact stat block. Not two of those at once.
- If a sample document preview is in the hero, do not add a dashboard screenshot there.
- If the hero already has a strong proof object, remove extra trust strips, stat rows, or proof-card grids before adding anything new.
- Do not use screenshots as filler or decoration.
- Every screenshot on a marketing page must answer one buyer question in under 5 seconds.
- If a screenshot does not explain the section faster than text, remove it.
- Use real product screenshots from a deterministic seeded state when the page is proving product breadth or workflow.
- Do not ship fabricated dashboard mockups when the real product can be captured.
- Exported marketing screenshots must be privacy-safe. Do not show full ID numbers, bank-like identifiers, or overly specific personal details.

### Section Matching
- Sample payslip: use for pay clarity.
- uFiling CSV preview: use for filing and export trust.
- Contracts screenshot: use for paperwork and document workflow.
- Dashboard screenshot: use for "everything in one place" or product breadth.
- Dashboard screenshots belong in lower feature sections unless the page is specifically about the dashboard.

### Homepage Proof Module
- The homepage may use one lower-page paid-proof module after the hero to explain what paid plans add.
- That module must replace redundant explainer sections rather than stack on top of them.
- For the homepage paid-proof module, use desktop manual tabs and a mobile single-open accordion. Do not auto-rotate. Do not require hover.
- Keep the module focused. Two screenshot-backed panels are better than a long row of weaker proof cards.
- Panel CTAs may appear inside the active desktop panel. On mobile, use one shared CTA at the bottom of the section to avoid duplicate buttons.

## 7. Trust Copy
- Never use absolute claims unless they are technically and legally exact.
- Use precise storage language. Say where data lives, what is synced, and what is backed up.
- Storage and privacy wording must match the product's actual implemented behavior and trust/legal pages exactly. Do not broaden the claim for marketing copy.
- Do not say "100% compliant", "zero risk", or similar absolute promises.
- Do not use fear-heavy compliance copy or startup-style bragging.
- Founder notes must sound like a person explaining the product plainly, not a launch post.
- A founder note should be short, factual, and specific: what the product does, who it is for, and what it does not promise.
- If you cite a law, rate, or rule, include the current source or a visible update date in the page.

### Near Pricing and Checkout
- Refund messaging must sit beside the paid CTA, not buried in the footer.
- Near pricing and checkout, show at least one of these in the visible decision area:
  - refund policy
  - storage location
  - backup or sync behavior
  - support contact
  - payment processor or billing note
- On homepage pricing previews, use a compact reassurance rail or inset beside the plans instead of a full extra trust section.
- Pricing-adjacent trust copy must come from verified config or canonical copy when contact or policy details are involved.
- If the user is about to pay, the page must answer what happens if the product is not right for them.

## 8. Responsive Rules
- Every meaningful UI change must be checked at:
  `320`, `360`, `375`, `390`, `412`, `430`, `480`, `640`, `768`, `820`, `1024`, `1280`, `1440`, `1728`, `1920`, `2560`.
- Review mobile first, then laptop, then ultrawide.
- Do not ship a layout that only works at one desktop width.
- Do not rely on hover for critical understanding.
- Do not hide important pricing, comparison, or workflow information behind hover-only states.
- On mobile, avoid long repetitive rows of cards. Collapse them into stacked groups, lists, or accordions.
- On mobile, if a section turns into a wall of cards, remove repetition or merge the cards.
- On ultrawide, do not leave core content as a thin centered strip in a sea of whitespace.
- On ultrawide, use side panels, preview rails, or split layouts to keep the page useful.
- Keep line length readable on wide screens. Do not widen text blocks just because the viewport is larger.

## 9. Review Checklist
- MUST ask whether the page is using product proof, trust proof, or both.
- MUST ask whether every screenshot answers a buyer question.
- MUST ask whether the hero has only one primary proof object.
- MUST ask whether pricing and checkout show refund and support clarity near the CTA.
- MUST ask whether the page still works at mobile widths before adding more desktop detail.
- MUST ask whether the new pattern improves the system or just adds novelty.

## 10. Maintenance Rule
- Any new pattern, exception, or reusable component must update this document and `ux.md` before it becomes a default.
- Any new screenshot style, proof block, or pricing pattern must be documented with an example or it should not spread.
- Any page that introduces a new visual rhythm must prove that the same rhythm still works on mobile and ultrawide.
