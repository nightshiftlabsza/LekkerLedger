# LekkerLedger Website UX Guidelines

Use this document together with [civicledger.md](/C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/civicledger.md).

Purpose:
- Turn the Civic Ledger visual system into practical website rules.
- Keep future homepage, pricing, trust, legal, and app changes consistent.
- Prevent "looks fine but feels stitched together" decisions.

These rules are now the default standard for any future LekkerLedger UI or copy changes unless you explicitly override them.

## 1. Core Principle
LekkerLedger should feel like:
- calm
- official
- trustworthy
- premium but restrained
- practical for South African households

LekkerLedger should not feel like:
- a startup template
- a dramatic legal scare page
- a generic glassmorphism SaaS dashboard
- a page made of unrelated sections with different moods

## 2. Non-Negotiables
- Marketing pages must show the real page immediately. No branded splash screen.
- Do not block browser zoom on mobile.
- Every page must have one clear primary action.
- Every major section must answer a user question, not just fill space.
- Trust claims must be precise, calm, and provable.
- Pricing must be easy to compare in seconds.
- The marketing site and app must feel like the same product family.

## 3. Homepage Rules

### 3.1 Hero
- The hero must sell the whole product, not just payslip generation.
- The headline should explain the outcome in plain English within 1 screen.
- The subheading should explain why this is worth paying for without sounding pushy.
- The main CTA should always point to the same start path unless there is a strong reason not to.
- The supporting CTA should reduce doubt, not compete with the main CTA.

### 3.2 Section Rhythm
- Do not stack too many sections that all look the same.
- Alternate section structure through composition, not random colors.
- Use contrast through layout, document previews, proof blocks, side notes, and framing.
- Avoid long runs of centered heading + paragraph + white cards.
- Every section should feel visually connected to the one before and after it.

### 3.3 Trust Strip Rule
- Trust strips must feel integrated with the page, not like a separate product.
- Do not introduce a dark band unless the rest of the page already supports that mood.
- If a trust strip appears between sections, it should behave like a refined divider, not a billboard.
- Trust badges should be short, credible, and useful.
- Weak trust items should be removed. "Open-source components" is weaker than "Refunds", "Local-first storage", or "Google Drive backup in your own account".

### 3.4 Proof
- Homepage proof should be concrete.
- Prefer:
  - real screenshots
  - sample documents
  - refund clarity
  - storage/privacy explanation
  - support contact
  - South African relevance
- Avoid vague self-praise.

## 4. Trustworthiness Rules

### 4.1 Tone
- Calm and factual beats dramatic and alarming.
- Explain legal expectations without fear language.
- Use "expected", "generally required", "helps keep records tidy", and "avoids expensive clean-up later".
- Do not use panic-heavy wording, threat-heavy framing, or exaggerated compliance promises.

### 4.2 What must be near decision points
- Near signup, upgrade, or payment CTAs, include at least one reassurance element:
  - refund policy
  - where data is stored
  - who processes payment
  - support contact
  - archive or backup benefit

### 4.3 Precision rule
- Never use absolute claims unless technically and legally exact.
- Good:
  - "No central LekkerLedger employee database"
  - "Stored on your device and optionally synced to your Google Drive"
- Bad:
  - "100% compliant"
  - "Zero risk"
  - "Fully encrypted everywhere" unless that is specifically true and defensible

### 4.4 Freshness rule
- Trust pages, legal pages, and policy pages should use clear update dates when possible.
- Avoid vague wording like "updated periodically".

## 5. Pricing Rules

### 5.1 Structure
- Pricing must support fast self-selection.
- Every plan needs:
  - who it is for
  - price
  - billing cadence
  - what changes when you upgrade
  - a clear CTA
- Homepage pricing is a teaser for fast self-selection, not the full matrix.
- The dedicated pricing page is the authoritative comparison surface.

### 5.2 Comparison matrix
- Paid plans must not be under-described.
- Important upgrade features must appear in the visible comparison, not be hidden in prose.
- Group rows into clear buckets:
  - coverage
  - core payroll
  - records and paperwork
  - storage and backup
  - household control
- On mobile, the comparison must still be scannable without becoming a wall of text.

### 5.3 Pricing language
- Show monthly and yearly clearly, with easy switching.
- Do not use percentage savings badges or copy.
- When yearly is selected, show the effective monthly price as the main number and the billed-yearly total as helper text.
- Good yearly pattern:
  - "≈ R20.75 / month"
  - "Billed yearly at R249/year"
- Free should show "Free" with no "forever" or permanence claim.
- Do not make the page sound like a sales funnel.

### 5.4 Value framing
- LekkerLedger should be positioned as:
  - priced for households
  - cheaper than managed payroll services
  - worth paying for because it reduces admin and cleanup work
- Do not name competitors unless there is a deliberate strategy to do so.

## 6. Navigation and App Chrome Rules

### 6.1 One navigation system at a time
- Desktop app: sidebar + top bar.
- Mobile app: bottom nav + FAB.
- Individual pages must not add their own extra navigation layer unless the workflow truly needs it.

### 6.2 Brand placement
- Branding should appear once per navigation context.
- Avoid repeated logo placement that wastes space or makes the layout feel unsure of itself.

### 6.3 Page headers
- Page headers should be functional and restrained.
- They should identify the page, current context, and next action.
- They should not try to act like a hero section inside the app.

## 7. Visual Cohesion Rules

### 7.1 Card language
- Cards should feel like paper panels, not floating startup widgets.
- Border, radius, shadow, and padding should be consistent across the product.
- If a page uses a different card treatment, it must be intentional and rare.

### 7.2 Accent discipline
- The primary green and civic gold are accents, not decoration paint.
- Do not introduce random blue, zinc, red, or tinted blocks unless they are semantic.
- Blue can be used for information states.
- Red can be used for errors only.
- Accent colors should guide attention, not dominate the page.

### 7.3 Texture and structure
- The Civic Ledger feel should come from:
  - subtle paper contrast
  - ruling lines
  - ledger-like grouping
  - document previews
  - stamp-like badges
- Not from big gradients, glassy effects, or trendy visual noise.

## 8. Responsive Rules

### 8.1 Mobile
- Design for thumb reach and quick scanning.
- Keep key actions near the bottom when a workflow depends on them.
- Avoid long, repetitive sections that feel endless on mobile.
- Avoid dense comparison tables with tiny text.

### 8.2 Laptop
- 13-inch and 14-inch laptops are a priority size, not an edge case.
- This is where too much shell chrome becomes painful fastest.
- Keep content width useful and reduce duplicated header/navigation patterns.

### 8.3 Desktop and ultrawide
- Do not leave a narrow strip of content floating in a sea of whitespace.
- Use side panels for useful context:
  - sync state
  - document preview
  - next actions
  - help or compliance references
- Wide layouts should feel intentional, not simply stretched.

### 8.4 Readability
- Aim for roughly 60 to 75 characters per line for body copy on desktop.
- Keep paragraph length moderate.
- Avoid giant text blocks inside very wide containers.

## 9. Content Rules

### 9.1 Headlines
- Outcome first.
- Specific beats clever.
- Household language beats corporate HR language.

### 9.2 Body copy
- Short sentences.
- Plain English.
- Explain why something matters.
- Avoid repeating the same privacy point too many times.

### 9.3 CTA copy
- Use action labels that reduce ambiguity:
  - "Start free"
  - "See full pricing"
  - "Generate ROE pack"
  - "Add employee"
- Avoid vague CTA labels like "Learn more" unless there is no better option.

## 10. Homepage-Specific "Does This Fit?" Test
Before adding a new homepage section, check:
- Does it support sign-up trust or product understanding?
- Does it add a new kind of proof or just repeat what is already said?
- Does it visually match the sections around it?
- Would a founder be able to explain why it exists in one sentence?
- If removed, would the page actually become clearer?

If the answer to the last question is "yes", the section probably should not be there.

## 11. Trust Strip Guidance for the Issue You Flagged
If a trust strip is used on the homepage:
- It should sit naturally within the Civic Ledger palette.
- It should not suddenly switch to a heavy dark banner unless the rest of the page is built around that.
- It should contain 3 to 5 strong signals only.
- Signals should be buyer-relevant:
  - local-first storage
  - Google Drive backup in your account
  - refund policy
  - South African household focus
  - POPIA-aware handling
- It should feel like reassurance, not interruption.

## 12. Implementation Standard for Future Changes
Whenever making a UI or copy change:
1. Check [civicledger.md](/C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/civicledger.md).
2. Check this file.
3. Prefer consistency over novelty.
4. If a new pattern is introduced, it must improve the system, not bypass it.
5. If a section feels visually foreign, simplify it before adding more detail.

## 13. Sources Used To Derive These Rules
- Baymard Institute: SaaS benchmark and SaaS pricing matrix scannability research
- [Responsive web design basics](https://web.dev/articles/responsive-web-design-basics)
- [Typography](https://web.dev/learn/accessibility/typography)
- [Fluid type and zoom guidance](https://web.dev/articles/baseline-in-action-fluid-type)
- [Establish trust](https://designsystem.digital.gov/patterns/complete-a-complex-form/establish-trust/)
- [Trust topic guidance](https://digital.gov/topics/trust)
- [Accessibility for visual designers](https://digital.gov/guides/accessibility-for-teams/visual-design)
- [WebAIM WCAG checklist](https://webaim.org/standards/wcag/checklist/)

## 14. Final Rule
If a page element is visually louder than the trust it creates, it should be toned down or removed.



