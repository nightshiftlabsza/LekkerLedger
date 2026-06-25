# LekkerLedger Website UX Governance

Use this document together with [civicledger.md](./civicledger.md).

This file governs website structure, proof placement, content tone, pricing clarity, and responsive behavior for marketing and trust pages.

## 1. What The Site Must Do
- Explain the product quickly.
- Show proof without clutter.
- Convert without drama.
- Keep the marketing site and app feeling like one product family.
- Avoid vague mood-language that cannot be implemented or reviewed.

## 2. Language Rules
- Replace mood words with visible behavior.
- Do not use words like "calm", "trustworthy", or "premium but restrained" unless the page shows exactly how that feeling is created.
- If a line says something is safe, official, or practical, the page must show the reason.
- Use plain statements like "refund policy sits next to the payment button" instead of "feels trustworthy".
- Do not use startup-y founder language, hype, or dramatic legal warnings.
- Founder notes should be short, factual, and human. One or two sentences is enough.

## 3. Proof Without Testimonials
- Do not fake social proof.
- Do not add placeholder quotes, invented customer stories, stock-photo testimonials, or fake logos.
- Do not make testimonials a required part of the page structure.
- If real testimonials are weak or unavailable, leave them out and use product proof and trust proof instead.
- Real testimonials may only be used when they are verified and genuinely useful. If they do not add clarity, skip them.

### Product Proof
- Use product proof when the user needs to understand output, workflow, or breadth.
- Product proof should show a real interface, real document, or real generated result.
- Product proof must be placed where it explains the section's job, not where it only fills space.

### Trust Proof
- Use trust proof when the user needs reassurance about payment, privacy, storage, support, or legitimacy.
- Trust proof should sit near pricing, checkout, signup, or legal claims.
- Trust proof must be concrete: refund policy, storage location, backup behavior, support contact, or official citation.

## 4. Homepage Rules

### IN HERO
- The hero must explain what the product is, who it is for, and the main outcome.
- The hero gets one primary proof object only.
- If the hero uses a sample document preview, do not add another dashboard screenshot there.
- Do not combine a screenshot, a preview, a stat strip, and testimonial cards in the hero.
- If the hero already proves the point, remove extra proof rows before writing new hero content.
- The primary CTA should be the most direct path into the product.
- The supporting CTA should reduce doubt, not compete with the main action.
- If proof is weak, do not pad the hero. Keep the copy clear and move stronger proof lower on the page.

### IN FEATURE SECTIONS
- Feature sections should explain one capability at a time.
- Each section needs a clear job: output, workflow, trust, pricing, or support.
- Use a screenshot only when it helps the user understand that section faster than text.
- Match the screenshot to the section's job:
  - sample payslip for pay clarity
  - uFiling CSV preview for filing and export trust
  - contracts screenshot for paperwork and document workflow
  - dashboard screenshot for "everything in one place" breadth
- Dashboard screenshots belong in lower feature sections where they explain breadth or workflow.
- Do not use screenshots as decoration.
- Every screenshot on a marketing page must answer a buyer question in under 5 seconds.
- If two screenshots say the same thing, keep the better one and delete the other.
- Real product screenshots should come from a deterministic seeded state, not fabricated mockups.
- Final exported marketing screenshots must be privacy-safe. Crop or mask full ID numbers and other overly specific personal identifiers.

### Section Rhythm
- Do not stack section after section with the same centered heading, paragraph, and card grid pattern.
- Alternate structure through layout and evidence, not random color changes.
- Remove any section that repeats a previous section's job.
- Avoid long runs of identical cards or repetitive callout rows.
- On mobile, do not create a wall of cards. Collapse repeated content into stacked groups, lists, or accordions.

### HOMEPAGE PAID-PROOF MODULE
- When the homepage needs to explain what paid plans add, use one proof module after the hero instead of separate "how it works" and "what you keep" sections.
- That module should prove two buyer questions well instead of trying to prove everything at once.
- Desktop: manual tabs on the left, active screenshot/content panel on the right.
- Mobile: accordion with one panel open at a time and one shared CTA at the bottom of the whole section.
- Do not auto-rotate panels. Do not require hover to reveal key proof.

## 5. Pricing And Checkout
- Every plan card must show price, billing cadence, who it is for, and the primary CTA.
- The pricing page is the authoritative comparison surface.
- The homepage pricing area is a teaser, not the full matrix.
- Important upgrade differences must be visible, not hidden in prose.
- Do not use percentage-savings copy unless it is exact and stable.
- Do not use "forever" language for Free unless the guarantee is truly permanent.
- On pricing pages, plans must be scannable in seconds, not studied like a spreadsheet.

### NEAR PRICING
- Refund messaging must sit beside the paid CTA or directly below it.
- Near pricing and checkout, show at least one of the following in the visible decision area:
  - refund policy
  - storage location
  - backup or sync behavior
  - support contact
  - payment processor or billing note
- On the homepage, prefer a compact reassurance block beside pricing over a separate trust banner or extra section.
- Contact and support timing copy should come from centralized verified config or canonical copy, not a one-off line written directly into the component.
- The user should know what happens if they pay and then change their mind.
- Trust text near pricing must be short and concrete, not a paragraph of reassurance.

## 6. Trust Pages
- Trust and legal pages must answer one question at a time.
- Use official citations and visible update dates when you make legal or compliance claims.
- Avoid threat-heavy wording. Explain the rule, the consequence, and the action in plain language.
- Replace "compliance theater" with concrete help: storage, backup, export, records, and support.
- If a claim is not exact, soften it or remove it.

## 7. Navigation And Chrome
- Desktop app: sidebar plus top bar.
- Mobile app: bottom nav plus FAB where the workflow needs it.
- Marketing pages must not show app navigation chrome.
- Do not add a second navigation layer inside individual pages unless the workflow truly needs it.
- Branding should appear once per navigation context, not on every nested panel.
- Page headers inside the app should identify the current task and next action. They should not act like homepage heroes.

## 8. Content Rules
- Outcome first. Specific beats clever.
- Household language beats corporate HR language.
- Use short sentences.
- Keep body copy plain enough to scan on mobile.
- Avoid repeating the same privacy or compliance point too many times.
- Keep storage and privacy wording aligned with the product's actual implemented behavior. Do not broaden claims for reassurance.
- CTAs should say what happens next. Avoid vague labels like "Learn more" when a direct action exists.

## 9. Responsive Rules
- Every meaningful UI change must be reviewed at:
  `320`, `360`, `375`, `390`, `412`, `430`, `480`, `640`, `768`, `820`, `1024`, `1280`, `1440`, `1728`, `1920`, `2560`.
- Mobile first, then laptop, then ultrawide.
- On mobile, key actions must stay reachable without fighting sticky chrome.
- On mobile, avoid long repetitive card rows and dense comparison tables.
- On mobile, convert repeated card layouts into stacked groups or accordion sections.
- No hero or pricing layout may rely on hover for critical understanding.
- No essential decision point may depend on a desktop-only interaction.
- On ultrawide, do not leave the core content as a thin centered column.
- On ultrawide, use side rails, preview panels, or split layouts so the page feels intentional.
- Keep line length readable on wide screens. Large viewports do not justify very long text blocks.

## 10. Check Before Shipping
- Does the hero have one primary proof object only?
- Does every screenshot answer one buyer question in under 5 seconds?
- Is proof placed where it answers the section's job?
- Is the refund rule visible beside the paid CTA?
- Is the storage or backup answer visible near payment and signup?
- Does the page still work on mobile without hover?
- Does the ultrawide layout still read like a designed page, not a stretched narrow column?
- If the page introduced a new pattern, was `civicledger.md` updated too?

## 11. Pattern Change Rule
- Any new proof pattern, pricing pattern, trust block, or responsive exception must be documented in both this file and `civicledger.md`.
- If a new pattern cannot be described as a rule, it should stay a one-off.
- If a section looks like marketing clutter, remove content before adding more styling.
