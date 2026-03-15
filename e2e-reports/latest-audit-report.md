# LekkerLedger Audit Report

Generated: 2026-03-15T00:08:46.260Z
Actions run: 165
Failures: 107

## Summary

- marketing: 32 actions, 21 flagged
- onboarding-shell: 31 actions, 23 flagged
- employees-leave-contracts: 31 actions, 18 flagged
- payroll-documents-history: 41 actions, 26 flagged
- compliance-storage-billing: 30 actions, 19 flagged

## Detailed Results

### Open homepage on phone
- Severity: medium
- Status: failed
- Route: /
- Device: mobile
- Final URL: http://localhost:3002/
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-home-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open / on mobile and run the scripted steps for "Open homepage on phone".
- Issues: High density of tiny text (29 visible elements below 12px). | Too many undersized tap targets (19 below 44px).
- Metrics: overflow=false, tinyText=29, undersizedTargets=19, fixedBottomBars=0

### Open pricing page on phone
- Severity: high
- Status: failed
- Route: /pricing
- Device: mobile
- Final URL: http://localhost:3002/pricing
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-pricing-mobile-mobile.png
- UX rule: Responsive Rules / Mobile layout containment
- Recommendation: Restructure the layout at this breakpoint and remove any width assumptions that exceed the viewport.
- Repro: Open /pricing on mobile and run the scripted steps for "Open pricing page on phone".
- Issues: Horizontal overflow detected. | Too many undersized tap targets (18 below 44px).
- Metrics: overflow=true, tinyText=25, undersizedTargets=18, fixedBottomBars=22

### Open calculator page on phone
- Severity: medium
- Status: failed
- Route: /calculator
- Device: mobile
- Final URL: http://localhost:3002/calculator
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-calculator-mobile-mobile.png
- UX rule: Mobile tap target minimums from UX guidelines
- Recommendation: Promote important links and controls to 44px touch-safe targets.
- Repro: Open /calculator on mobile and run the scripted steps for "Open calculator page on phone".
- Issues: Too many undersized tap targets (23 below 44px).
- Metrics: overflow=false, tinyText=12, undersizedTargets=23, fixedBottomBars=0

### Open rules page on phone
- Severity: info
- Status: passed
- Route: /rules
- Device: mobile
- Final URL: http://localhost:3002/rules
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-rules-mobile-mobile.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /rules on mobile and run the scripted steps for "Open rules page on phone".
- Metrics: overflow=false, tinyText=9, undersizedTargets=16, fixedBottomBars=0

### Open trust page on phone
- Severity: medium
- Status: failed
- Route: /trust
- Device: mobile
- Final URL: http://localhost:3002/trust
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-trust-mobile-mobile.png
- UX rule: Mobile tap target minimums from UX guidelines
- Recommendation: Promote important links and controls to 44px touch-safe targets.
- Repro: Open /trust on mobile and run the scripted steps for "Open trust page on phone".
- Issues: Too many undersized tap targets (24 below 44px).
- Metrics: overflow=false, tinyText=10, undersizedTargets=24, fixedBottomBars=0

### Open support page on phone
- Severity: medium
- Status: failed
- Route: /support
- Device: mobile
- Final URL: http://localhost:3002/support
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-support-mobile-mobile.png
- UX rule: Mobile tap target minimums from UX guidelines
- Recommendation: Promote important links and controls to 44px touch-safe targets.
- Repro: Open /support on mobile and run the scripted steps for "Open support page on phone".
- Issues: Too many undersized tap targets (17 below 44px).
- Metrics: overflow=false, tinyText=9, undersizedTargets=17, fixedBottomBars=0

### Open storage page on phone
- Severity: medium
- Status: failed
- Route: /storage
- Device: mobile
- Final URL: http://localhost:3002/storage
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-storage-mobile-mobile.png
- UX rule: Mobile tap target minimums from UX guidelines
- Recommendation: Promote important links and controls to 44px touch-safe targets.
- Repro: Open /storage on mobile and run the scripted steps for "Open storage page on phone".
- Issues: Too many undersized tap targets (18 below 44px).
- Metrics: overflow=false, tinyText=9, undersizedTargets=18, fixedBottomBars=0

### Open examples page on phone
- Severity: medium
- Status: failed
- Route: /examples
- Device: mobile
- Final URL: http://localhost:3002/examples
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-examples-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /examples on mobile and run the scripted steps for "Open examples page on phone".
- Issues: High density of tiny text (31 visible elements below 12px).
- Metrics: overflow=false, tinyText=31, undersizedTargets=16, fixedBottomBars=0

### Open privacy page on phone
- Severity: medium
- Status: failed
- Route: /legal/privacy
- Device: mobile
- Final URL: http://localhost:3002/legal/privacy
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-privacy-mobile-mobile.png
- UX rule: Mobile tap target minimums from UX guidelines
- Recommendation: Promote important links and controls to 44px touch-safe targets.
- Repro: Open /legal/privacy on mobile and run the scripted steps for "Open privacy page on phone".
- Issues: Too many undersized tap targets (20 below 44px).
- Metrics: overflow=false, tinyText=17, undersizedTargets=20, fixedBottomBars=0

### Open terms page on phone
- Severity: medium
- Status: failed
- Route: /legal/terms
- Device: mobile
- Final URL: http://localhost:3002/legal/terms
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-terms-mobile-mobile.png
- UX rule: Mobile tap target minimums from UX guidelines
- Recommendation: Promote important links and controls to 44px touch-safe targets.
- Repro: Open /legal/terms on mobile and run the scripted steps for "Open terms page on phone".
- Issues: Too many undersized tap targets (20 below 44px).
- Metrics: overflow=false, tinyText=9, undersizedTargets=20, fixedBottomBars=0

### Open refunds page on phone
- Severity: medium
- Status: failed
- Route: /legal/refunds
- Device: mobile
- Final URL: http://localhost:3002/legal/refunds
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-refunds-mobile-mobile.png
- UX rule: Mobile tap target minimums from UX guidelines
- Recommendation: Promote important links and controls to 44px touch-safe targets.
- Repro: Open /legal/refunds on mobile and run the scripted steps for "Open refunds page on phone".
- Issues: Too many undersized tap targets (19 below 44px).
- Metrics: overflow=false, tinyText=9, undersizedTargets=19, fixedBottomBars=0

### Open app handoff page on phone
- Severity: medium
- Status: failed
- Route: /open-app
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fdashboard
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-open-app-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /open-app on mobile and run the scripted steps for "Open app handoff page on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Re-open privacy page on phone
- Severity: medium
- Status: failed
- Route: /legal/privacy
- Device: mobile
- Final URL: http://localhost:3002/legal/privacy
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-privacy-policy-mobile-mobile.png
- UX rule: Mobile tap target minimums from UX guidelines
- Recommendation: Promote important links and controls to 44px touch-safe targets.
- Repro: Open /legal/privacy on mobile and run the scripted steps for "Re-open privacy page on phone".
- Issues: Too many undersized tap targets (20 below 44px).
- Metrics: overflow=false, tinyText=17, undersizedTargets=20, fixedBottomBars=0

### Open terms alias on phone
- Severity: medium
- Status: failed
- Route: /legal/terms-of-service
- Device: mobile
- Final URL: http://localhost:3002/legal/terms
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-terms-alias-mobile-mobile.png
- UX rule: Mobile tap target minimums from UX guidelines
- Recommendation: Promote important links and controls to 44px touch-safe targets.
- Repro: Open /legal/terms-of-service on mobile and run the scripted steps for "Open terms alias on phone".
- Issues: Too many undersized tap targets (20 below 44px).
- Metrics: overflow=false, tinyText=9, undersizedTargets=20, fixedBottomBars=0

### Open homepage on desktop
- Severity: info
- Status: passed
- Route: /
- Device: desktop
- Final URL: http://localhost:3002/
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-home-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open / on desktop and run the scripted steps for "Open homepage on desktop".
- Metrics: overflow=false, tinyText=41, undersizedTargets=26, fixedBottomBars=0

### Open pricing page on desktop
- Severity: info
- Status: passed
- Route: /pricing
- Device: desktop
- Final URL: http://localhost:3002/pricing
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-pricing-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /pricing on desktop and run the scripted steps for "Open pricing page on desktop".
- Metrics: overflow=false, tinyText=25, undersizedTargets=25, fixedBottomBars=22

### Open calculator page on desktop
- Severity: info
- Status: passed
- Route: /calculator
- Device: desktop
- Final URL: http://localhost:3002/calculator
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-calculator-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /calculator on desktop and run the scripted steps for "Open calculator page on desktop".
- Metrics: overflow=false, tinyText=12, undersizedTargets=28, fixedBottomBars=0

### Open trust page on desktop
- Severity: info
- Status: passed
- Route: /trust
- Device: desktop
- Final URL: http://localhost:3002/trust
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-trust-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /trust on desktop and run the scripted steps for "Open trust page on desktop".
- Metrics: overflow=false, tinyText=10, undersizedTargets=29, fixedBottomBars=0

### Open support page on desktop
- Severity: info
- Status: passed
- Route: /support
- Device: desktop
- Final URL: http://localhost:3002/support
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-support-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /support on desktop and run the scripted steps for "Open support page on desktop".
- Metrics: overflow=false, tinyText=9, undersizedTargets=16, fixedBottomBars=0

### Open storage page on desktop
- Severity: info
- Status: passed
- Route: /storage
- Device: desktop
- Final URL: http://localhost:3002/storage
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-storage-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /storage on desktop and run the scripted steps for "Open storage page on desktop".
- Metrics: overflow=false, tinyText=9, undersizedTargets=17, fixedBottomBars=0

### Open examples page on desktop
- Severity: info
- Status: passed
- Route: /examples
- Device: desktop
- Final URL: http://localhost:3002/examples
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-examples-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /examples on desktop and run the scripted steps for "Open examples page on desktop".
- Metrics: overflow=false, tinyText=31, undersizedTargets=15, fixedBottomBars=0

### Open privacy page on desktop
- Severity: info
- Status: passed
- Route: /legal/privacy
- Device: desktop
- Final URL: http://localhost:3002/legal/privacy
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-privacy-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /legal/privacy on desktop and run the scripted steps for "Open privacy page on desktop".
- Metrics: overflow=false, tinyText=14, undersizedTargets=19, fixedBottomBars=0

### Open terms page on desktop
- Severity: info
- Status: passed
- Route: /legal/terms
- Device: desktop
- Final URL: http://localhost:3002/legal/terms
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-terms-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /legal/terms on desktop and run the scripted steps for "Open terms page on desktop".
- Metrics: overflow=false, tinyText=9, undersizedTargets=19, fixedBottomBars=0

### Open refunds page on desktop
- Severity: info
- Status: passed
- Route: /legal/refunds
- Device: desktop
- Final URL: http://localhost:3002/legal/refunds
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-refunds-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /legal/refunds on desktop and run the scripted steps for "Open refunds page on desktop".
- Metrics: overflow=false, tinyText=9, undersizedTargets=18, fixedBottomBars=0

### Open the homepage mobile menu
- Severity: medium
- Status: failed
- Route: /
- Device: mobile
- Final URL: http://localhost:3002/
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-home-menu-open-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open / on mobile and run the scripted steps for "Open the homepage mobile menu".
- Issues: High density of tiny text (29 visible elements below 12px). | Too many undersized tap targets (19 below 44px).
- Metrics: overflow=false, tinyText=29, undersizedTargets=19, fixedBottomBars=1

### Close the homepage mobile menu
- Severity: medium
- Status: failed
- Route: /
- Device: mobile
- Final URL: http://localhost:3002/
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-home-menu-close-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open / on mobile and run the scripted steps for "Close the homepage mobile menu".
- Issues: High density of tiny text (29 visible elements below 12px). | Too many undersized tap targets (19 below 44px).
- Metrics: overflow=false, tinyText=29, undersizedTargets=19, fixedBottomBars=0

### Follow the homepage Start free CTA on phone
- Severity: high
- Status: failed
- Route: /
- Device: mobile
- Final URL: http://localhost:3002/resources/tools/domestic-worker-payslip
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-home-start-free-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open / on mobile and run the scripted steps for "Follow the homepage Start free CTA on phone".
- Issues: High density of tiny text (31 visible elements below 12px). | Too many undersized tap targets (17 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=31, undersizedTargets=17, fixedBottomBars=0
- Page errors: page.waitForURL: Timeout 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================

### Follow the homepage pricing CTA on phone
- Severity: high
- Status: failed
- Route: /
- Device: mobile
- Final URL: http://localhost:3002/pricing
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-home-pricing-cta-mobile-mobile.png
- UX rule: Responsive Rules / Mobile layout containment
- Recommendation: Restructure the layout at this breakpoint and remove any width assumptions that exceed the viewport.
- Repro: Open / on mobile and run the scripted steps for "Follow the homepage pricing CTA on phone".
- Issues: Horizontal overflow detected. | Too many undersized tap targets (18 below 44px).
- Metrics: overflow=true, tinyText=25, undersizedTargets=18, fixedBottomBars=22

### Follow the homepage storage CTA on phone
- Severity: high
- Status: failed
- Route: /
- Device: mobile
- Final URL: http://localhost:3002/
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-home-storage-cta-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open / on mobile and run the scripted steps for "Follow the homepage storage CTA on phone".
- Issues: High density of tiny text (29 visible elements below 12px). | Too many undersized tap targets (19 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=29, undersizedTargets=19, fixedBottomBars=0
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByRole('link', { name: 'How storage works' }).first() to be visible[22m


### Switch pricing to monthly on phone
- Severity: medium
- Status: failed
- Route: /pricing
- Device: mobile
- Final URL: http://localhost:3002/pricing
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-pricing-toggle-monthly-mobile-mobile.png
- UX rule: Mobile tap target minimums from UX guidelines
- Recommendation: Promote important links and controls to 44px touch-safe targets.
- Repro: Open /pricing on mobile and run the scripted steps for "Switch pricing to monthly on phone".
- Issues: Too many undersized tap targets (31 below 44px). | Console errors present (20).
- Metrics: overflow=false, tinyText=0, undersizedTargets=31, fixedBottomBars=0
- Console errors: Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error)

### Switch pricing to yearly on phone
- Severity: medium
- Status: failed
- Route: /pricing
- Device: mobile
- Final URL: http://localhost:3002/pricing
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-pricing-toggle-yearly-mobile-mobile.png
- UX rule: Mobile tap target minimums from UX guidelines
- Recommendation: Promote important links and controls to 44px touch-safe targets.
- Repro: Open /pricing on mobile and run the scripted steps for "Switch pricing to yearly on phone".
- Issues: Too many undersized tap targets (31 below 44px). | Console errors present (20).
- Metrics: overflow=false, tinyText=0, undersizedTargets=31, fixedBottomBars=0
- Console errors: Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error)

### Open a homepage FAQ item on phone
- Severity: high
- Status: failed
- Route: /
- Device: mobile
- Final URL: http://localhost:3002/
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/marketing-home-faq-open-mobile-mobile.png
- UX rule: Mobile tap target minimums from UX guidelines
- Recommendation: Promote important links and controls to 44px touch-safe targets.
- Repro: Open / on mobile and run the scripted steps for "Open a homepage FAQ item on phone".
- Issues: Too many undersized tap targets (34 below 44px). | Runtime errors present (1). | Console errors present (20).
- Metrics: overflow=false, tinyText=0, undersizedTargets=34, fixedBottomBars=0
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByRole('button', { name: 'Is my employee data stored on LekkerLedger\'s servers?' }).first() to be visible[22m

- Console errors: Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error)

### Open onboarding on phone
- Severity: info
- Status: passed
- Route: /onboarding
- Device: mobile
- Final URL: http://localhost:3002/onboarding
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-onboarding-mobile-mobile.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /onboarding on mobile and run the scripted steps for "Open onboarding on phone".
- Metrics: overflow=false, tinyText=14, undersizedTargets=16, fixedBottomBars=0

### Open dashboard on phone
- Severity: medium
- Status: failed
- Route: /dashboard
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fdashboard
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-dashboard-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /dashboard on mobile and run the scripted steps for "Open dashboard on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open settings on phone
- Severity: medium
- Status: failed
- Route: /settings
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-settings-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /settings on mobile and run the scripted steps for "Open settings on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open storage settings on phone
- Severity: medium
- Status: failed
- Route: /settings?tab=storage
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings%3Ftab%3Dstorage
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-settings-storage-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /settings?tab=storage on mobile and run the scripted steps for "Open storage settings on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open billing settings on phone
- Severity: medium
- Status: failed
- Route: /settings?tab=plan
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings%3Ftab%3Dplan
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-settings-plan-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /settings?tab=plan on mobile and run the scripted steps for "Open billing settings on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open exports settings on phone
- Severity: medium
- Status: failed
- Route: /settings?tab=exports
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings%3Ftab%3Dexports
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-settings-exports-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /settings?tab=exports on mobile and run the scripted steps for "Open exports settings on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open support settings on phone
- Severity: medium
- Status: failed
- Route: /settings?tab=support
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings%3Ftab%3Dsupport
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-settings-support-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /settings?tab=support on mobile and run the scripted steps for "Open support settings on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open onboarding on desktop
- Severity: info
- Status: passed
- Route: /onboarding
- Device: desktop
- Final URL: http://localhost:3002/onboarding
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-onboarding-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /onboarding on desktop and run the scripted steps for "Open onboarding on desktop".
- Metrics: overflow=false, tinyText=14, undersizedTargets=15, fixedBottomBars=0

### Open dashboard on desktop
- Severity: info
- Status: passed
- Route: /dashboard
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fdashboard
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-dashboard-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /dashboard on desktop and run the scripted steps for "Open dashboard on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open settings on desktop
- Severity: info
- Status: passed
- Route: /settings
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-settings-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /settings on desktop and run the scripted steps for "Open settings on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open storage settings on desktop
- Severity: info
- Status: passed
- Route: /settings?tab=storage
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings%3Ftab%3Dstorage
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-settings-storage-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /settings?tab=storage on desktop and run the scripted steps for "Open storage settings on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open billing settings on desktop
- Severity: info
- Status: passed
- Route: /settings?tab=plan
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings%3Ftab%3Dplan
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-settings-plan-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /settings?tab=plan on desktop and run the scripted steps for "Open billing settings on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open exports settings on desktop
- Severity: info
- Status: passed
- Route: /settings?tab=exports
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings%3Ftab%3Dexports
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-settings-exports-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /settings?tab=exports on desktop and run the scripted steps for "Open exports settings on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open support settings on desktop
- Severity: info
- Status: passed
- Route: /settings?tab=support
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings%3Ftab%3Dsupport
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-settings-support-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /settings?tab=support on desktop and run the scripted steps for "Open support settings on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Advance onboarding to employer details on phone
- Severity: high
- Status: failed
- Route: /onboarding
- Device: mobile
- Final URL: http://localhost:3002/onboarding
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-onboarding-next-mobile-mobile.png
- UX rule: Stability and recovery states
- Recommendation: Stabilize the route and add guard states before rendering dependent client logic.
- Repro: Open /onboarding on mobile and run the scripted steps for "Advance onboarding to employer details on phone".
- Issues: Runtime errors present (1).
- Metrics: overflow=false, tinyText=14, undersizedTargets=16, fixedBottomBars=0
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByRole('button', { name: 'Next: Employer Details' }).first() to be visible[22m


### Go back from employer details in onboarding on phone
- Severity: high
- Status: failed
- Route: /onboarding
- Device: mobile
- Final URL: http://localhost:3002/onboarding
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-onboarding-back-mobile-mobile.png
- UX rule: Stability and recovery states
- Recommendation: Stabilize the route and add guard states before rendering dependent client logic.
- Repro: Open /onboarding on mobile and run the scripted steps for "Go back from employer details in onboarding on phone".
- Issues: Runtime errors present (1).
- Metrics: overflow=false, tinyText=14, undersizedTargets=16, fixedBottomBars=0
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByRole('button', { name: 'Next: Employer Details' }).first() to be visible[22m


### Save onboarding employer details on phone
- Severity: high
- Status: failed
- Route: /onboarding
- Device: mobile
- Final URL: http://localhost:3002/onboarding
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-onboarding-save-mobile-mobile.png
- UX rule: Stability and recovery states
- Recommendation: Stabilize the route and add guard states before rendering dependent client logic.
- Repro: Open /onboarding on mobile and run the scripted steps for "Save onboarding employer details on phone".
- Issues: Runtime errors present (1).
- Metrics: overflow=false, tinyText=14, undersizedTargets=16, fixedBottomBars=0
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByRole('button', { name: 'Next: Employer Details' }).first() to be visible[22m


### Open the desktop account menu
- Severity: high
- Status: failed
- Route: /dashboard
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fdashboard
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-dashboard-open-account-desktop-desktop.png
- UX rule: Stability and recovery states
- Recommendation: Stabilize the route and add guard states before rendering dependent client logic.
- Repro: Open /dashboard on desktop and run the scripted steps for "Open the desktop account menu".
- Issues: Runtime errors present (1).
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByTestId('account-menu-toggle').first() to be visible[22m


### Confirm the Home tab is visible on phone
- Severity: high
- Status: failed
- Route: /payroll
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-bottom-nav-home-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /payroll on mobile and run the scripted steps for "Confirm the Home tab is visible on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1
- Page errors: page.waitForFunction: Timeout 12000ms exceeded.

### Use bottom nav Payroll on phone
- Severity: high
- Status: failed
- Route: /dashboard
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fdashboard
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-bottom-nav-payroll-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /dashboard on mobile and run the scripted steps for "Use bottom nav Payroll on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByTestId('bottom-nav-payroll').first() to be visible[22m


### Use bottom nav Employees on phone
- Severity: high
- Status: failed
- Route: /dashboard
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fdashboard
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-bottom-nav-employees-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /dashboard on mobile and run the scripted steps for "Use bottom nav Employees on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByTestId('bottom-nav-employees').first() to be visible[22m


### Use bottom nav Documents on phone
- Severity: high
- Status: failed
- Route: /employees
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-bottom-nav-documents-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /employees on mobile and run the scripted steps for "Use bottom nav Documents on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByTestId('bottom-nav-documents').first() to be visible[22m


### Use bottom nav More on phone
- Severity: high
- Status: failed
- Route: /dashboard
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fdashboard
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-bottom-nav-more-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /dashboard on mobile and run the scripted steps for "Use bottom nav More on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByTestId('bottom-nav-more').first() to be visible[22m


### Open the global create FAB on phone
- Severity: high
- Status: failed
- Route: /dashboard
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fdashboard
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-global-create-open-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /dashboard on mobile and run the scripted steps for "Open the global create FAB on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByTestId('global-create-fab').first() to be visible[22m


### Start payroll from the global create FAB on phone
- Severity: high
- Status: failed
- Route: /dashboard
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fdashboard
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-global-create-start-payroll-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /dashboard on mobile and run the scripted steps for "Start payroll from the global create FAB on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByTestId('global-create-fab').first() to be visible[22m


### Reveal the Add Employee action from the global create FAB on phone
- Severity: high
- Status: failed
- Route: /dashboard
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fdashboard
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-global-create-add-employee-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /dashboard on mobile and run the scripted steps for "Reveal the Add Employee action from the global create FAB on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByTestId('global-create-fab').first() to be visible[22m


### Open the General settings tab on phone
- Severity: high
- Status: failed
- Route: /settings
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-settings-tab-general-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /settings on mobile and run the scripted steps for "Open the General settings tab on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByTestId('settings-tab-general').first() to be visible[22m


### Open the Storage settings tab on phone
- Severity: high
- Status: failed
- Route: /settings
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-settings-tab-storage-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /settings on mobile and run the scripted steps for "Open the Storage settings tab on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByTestId('settings-tab-storage').first() to be visible[22m


### Open the Billing settings tab on phone
- Severity: high
- Status: failed
- Route: /settings
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-settings-tab-plan-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /settings on mobile and run the scripted steps for "Open the Billing settings tab on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByTestId('settings-tab-plan').first() to be visible[22m


### Open the Exports settings tab on phone
- Severity: high
- Status: failed
- Route: /settings
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-settings-tab-exports-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /settings on mobile and run the scripted steps for "Open the Exports settings tab on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByTestId('settings-tab-exports').first() to be visible[22m


### Open the Help settings tab on phone
- Severity: high
- Status: failed
- Route: /settings
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/shell-settings-tab-support-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /settings on mobile and run the scripted steps for "Open the Help settings tab on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByTestId('settings-tab-support').first() to be visible[22m


### Open employees list on phone
- Severity: medium
- Status: failed
- Route: /employees
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-list-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /employees on mobile and run the scripted steps for "Open employees list on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open new employee page on phone
- Severity: medium
- Status: failed
- Route: /employees/new
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees%2Fnew
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-new-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /employees/new on mobile and run the scripted steps for "Open new employee page on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open employee A detail on phone
- Severity: medium
- Status: failed
- Route: /employees/11111111-1111-4111-8111-111111111111
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees%2F11111111-1111-4111-8111-111111111111
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-detail-a-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /employees/11111111-1111-4111-8111-111111111111 on mobile and run the scripted steps for "Open employee A detail on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open employee B detail on phone
- Severity: medium
- Status: failed
- Route: /employees/22222222-2222-4222-8222-222222222222
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees%2F22222222-2222-4222-8222-222222222222
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-detail-b-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /employees/22222222-2222-4222-8222-222222222222 on mobile and run the scripted steps for "Open employee B detail on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open employee edit page on phone
- Severity: medium
- Status: failed
- Route: /employees/11111111-1111-4111-8111-111111111111/edit
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees%2F11111111-1111-4111-8111-111111111111%2Fedit
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-edit-a-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /employees/11111111-1111-4111-8111-111111111111/edit on mobile and run the scripted steps for "Open employee edit page on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open employee history on phone
- Severity: medium
- Status: failed
- Route: /employees/11111111-1111-4111-8111-111111111111/history
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees%2F11111111-1111-4111-8111-111111111111%2Fhistory
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-history-a-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /employees/11111111-1111-4111-8111-111111111111/history on mobile and run the scripted steps for "Open employee history on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open leave page on phone
- Severity: medium
- Status: failed
- Route: /leave
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fleave
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-leave-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /leave on mobile and run the scripted steps for "Open leave page on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open new leave page on phone
- Severity: medium
- Status: failed
- Route: /leave/new
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fleave%2Fnew
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-leave-new-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /leave/new on mobile and run the scripted steps for "Open new leave page on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open contracts page on phone
- Severity: medium
- Status: failed
- Route: /documents?tab=contracts
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fdocuments%3Ftab%3Dcontracts
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-contracts-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /documents?tab=contracts on mobile and run the scripted steps for "Open contracts page on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open new contract page on phone
- Severity: medium
- Status: failed
- Route: /contracts/new
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fcontracts%2Fnew
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-contracts-new-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /contracts/new on mobile and run the scripted steps for "Open new contract page on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Re-open employees list on phone
- Severity: medium
- Status: failed
- Route: /employees
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-employees-again-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /employees on mobile and run the scripted steps for "Re-open employees list on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Re-open contracts page on phone
- Severity: medium
- Status: failed
- Route: /documents?tab=contracts
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fdocuments%3Ftab%3Dcontracts
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-contracts-again-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /documents?tab=contracts on mobile and run the scripted steps for "Re-open contracts page on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open employees list on desktop
- Severity: info
- Status: passed
- Route: /employees
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-list-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /employees on desktop and run the scripted steps for "Open employees list on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open new employee page on desktop
- Severity: info
- Status: passed
- Route: /employees/new
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees%2Fnew
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-new-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /employees/new on desktop and run the scripted steps for "Open new employee page on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open employee A detail on desktop
- Severity: info
- Status: passed
- Route: /employees/11111111-1111-4111-8111-111111111111
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees%2F11111111-1111-4111-8111-111111111111
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-detail-a-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /employees/11111111-1111-4111-8111-111111111111 on desktop and run the scripted steps for "Open employee A detail on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open employee B detail on desktop
- Severity: info
- Status: passed
- Route: /employees/22222222-2222-4222-8222-222222222222
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees%2F22222222-2222-4222-8222-222222222222
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-detail-b-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /employees/22222222-2222-4222-8222-222222222222 on desktop and run the scripted steps for "Open employee B detail on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open employee edit page on desktop
- Severity: info
- Status: passed
- Route: /employees/11111111-1111-4111-8111-111111111111/edit
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees%2F11111111-1111-4111-8111-111111111111%2Fedit
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-edit-a-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /employees/11111111-1111-4111-8111-111111111111/edit on desktop and run the scripted steps for "Open employee edit page on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open employee history on desktop
- Severity: info
- Status: passed
- Route: /employees/11111111-1111-4111-8111-111111111111/history
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees%2F11111111-1111-4111-8111-111111111111%2Fhistory
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-history-a-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /employees/11111111-1111-4111-8111-111111111111/history on desktop and run the scripted steps for "Open employee history on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open leave page on desktop
- Severity: info
- Status: passed
- Route: /leave
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fleave
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-leave-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /leave on desktop and run the scripted steps for "Open leave page on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open new leave page on desktop
- Severity: info
- Status: passed
- Route: /leave/new
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fleave%2Fnew
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-leave-new-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /leave/new on desktop and run the scripted steps for "Open new leave page on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open contracts page on desktop
- Severity: info
- Status: passed
- Route: /documents?tab=contracts
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fdocuments%3Ftab%3Dcontracts
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-contracts-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /documents?tab=contracts on desktop and run the scripted steps for "Open contracts page on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open new contract page on desktop
- Severity: info
- Status: passed
- Route: /contracts/new
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fcontracts%2Fnew
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-contracts-new-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /contracts/new on desktop and run the scripted steps for "Open new contract page on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Re-open employees list for search on desktop
- Severity: info
- Status: passed
- Route: /employees
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-employees-search-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /employees on desktop and run the scripted steps for "Re-open employees list for search on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Re-open contracts page on desktop
- Severity: info
- Status: passed
- Route: /documents?tab=contracts
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fdocuments%3Ftab%3Dcontracts
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-contracts-again-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /documents?tab=contracts on desktop and run the scripted steps for "Re-open contracts page on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Search employees for Thandi on desktop
- Severity: high
- Status: failed
- Route: /employees
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-search-thandi-desktop-desktop.png
- UX rule: Stability and recovery states
- Recommendation: Stabilize the route and add guard states before rendering dependent client logic.
- Repro: Open /employees on desktop and run the scripted steps for "Search employees for Thandi on desktop".
- Issues: Runtime errors present (1).
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1
- Page errors: locator.fill: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for locator('input[placeholder=\'Find employee...\']').first()[22m


### Search employees for Sipho on desktop
- Severity: high
- Status: failed
- Route: /employees
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-search-sipho-desktop-desktop.png
- UX rule: Stability and recovery states
- Recommendation: Stabilize the route and add guard states before rendering dependent client logic.
- Repro: Open /employees on desktop and run the scripted steps for "Search employees for Sipho on desktop".
- Issues: Runtime errors present (1).
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1
- Page errors: locator.fill: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for locator('input[placeholder=\'Find employee...\']').first()[22m


### Fill key employee fields on the new employee form on phone
- Severity: high
- Status: failed
- Route: /employees/new
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees%2Fnew
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-create-form-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /employees/new on mobile and run the scripted steps for "Fill key employee fields on the new employee form on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1
- Page errors: locator.fill: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for locator('#name').first()[22m


### Fill key employee fields on the new employee form on desktop
- Severity: high
- Status: failed
- Route: /employees/new
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees%2Fnew
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-create-form-desktop-desktop.png
- UX rule: Stability and recovery states
- Recommendation: Stabilize the route and add guard states before rendering dependent client logic.
- Repro: Open /employees/new on desktop and run the scripted steps for "Fill key employee fields on the new employee form on desktop".
- Issues: Runtime errors present (1).
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1
- Page errors: locator.fill: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for locator('#name').first()[22m


### Open an employee from the table on desktop
- Severity: high
- Status: failed
- Route: /employees
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-open-detail-from-list-desktop-desktop.png
- UX rule: Stability and recovery states
- Recommendation: Stabilize the route and add guard states before rendering dependent client logic.
- Repro: Open /employees on desktop and run the scripted steps for "Open an employee from the table on desktop".
- Issues: Runtime errors present (1).
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for locator('a[href=\'/employees/11111111-1111-4111-8111-111111111111\']').first() to be visible[22m


### Open an employee from the list on phone
- Severity: high
- Status: failed
- Route: /employees
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-open-detail-from-list-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /employees on mobile and run the scripted steps for "Open an employee from the list on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1
- Page errors: page.waitForFunction: Timeout 12000ms exceeded.

### Open leave records again on desktop
- Severity: info
- Status: passed
- Route: /leave
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fleave
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/employees-open-leave-route-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /leave on desktop and run the scripted steps for "Open leave records again on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open payroll list on tablet
- Severity: medium
- Status: failed
- Route: /payroll
- Device: tablet
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-list-tablet-tablet.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /payroll on tablet and run the scripted steps for "Open payroll list on tablet".
- Issues: High density of tiny text (42 visible elements below 12px). | Too many undersized tap targets (20 below 44px).
- Metrics: overflow=false, tinyText=42, undersizedTargets=20, fixedBottomBars=1

### Open draft pay period on tablet
- Severity: medium
- Status: failed
- Route: /payroll/period-draft-april-2026
- Device: tablet
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll%2Fperiod-draft-april-2026
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-draft-tablet-tablet.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /payroll/period-draft-april-2026 on tablet and run the scripted steps for "Open draft pay period on tablet".
- Issues: High density of tiny text (42 visible elements below 12px). | Too many undersized tap targets (20 below 44px).
- Metrics: overflow=false, tinyText=42, undersizedTargets=20, fixedBottomBars=1

### Open payslip preview on tablet
- Severity: medium
- Status: failed
- Route: /preview?payslipId=payslip-thandi-april-2026&empId=11111111-1111-4111-8111-111111111111
- Device: tablet
- Final URL: http://localhost:3002/?auth=login&next=%2Fpreview%3FpayslipId%3Dpayslip-thandi-april-2026%26empId%3D11111111-1111-4111-8111-111111111111
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-preview-tablet-tablet.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /preview?payslipId=payslip-thandi-april-2026&empId=11111111-1111-4111-8111-111111111111 on tablet and run the scripted steps for "Open payslip preview on tablet".
- Issues: High density of tiny text (42 visible elements below 12px). | Too many undersized tap targets (20 below 44px).
- Metrics: overflow=false, tinyText=42, undersizedTargets=20, fixedBottomBars=1

### Open documents hub on tablet
- Severity: medium
- Status: failed
- Route: /documents
- Device: tablet
- Final URL: http://localhost:3002/?auth=login&next=%2Fdocuments
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-documents-tablet-tablet.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /documents on tablet and run the scripted steps for "Open documents hub on tablet".
- Issues: High density of tiny text (42 visible elements below 12px). | Too many undersized tap targets (20 below 44px).
- Metrics: overflow=false, tinyText=42, undersizedTargets=20, fixedBottomBars=1

### Open history page on tablet
- Severity: medium
- Status: failed
- Route: /history
- Device: tablet
- Final URL: http://localhost:3002/?auth=login&next=%2Fhistory
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-history-tablet-tablet.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /history on tablet and run the scripted steps for "Open history page on tablet".
- Issues: High density of tiny text (42 visible elements below 12px). | Too many undersized tap targets (20 below 44px).
- Metrics: overflow=false, tinyText=42, undersizedTargets=20, fixedBottomBars=1

### Open payroll list on phone
- Severity: medium
- Status: failed
- Route: /payroll
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-list-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /payroll on mobile and run the scripted steps for "Open payroll list on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open new payroll wizard on phone
- Severity: medium
- Status: failed
- Route: /payroll/new
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll%2Fnew
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-new-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /payroll/new on mobile and run the scripted steps for "Open new payroll wizard on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open draft pay period on phone
- Severity: medium
- Status: failed
- Route: /payroll/period-draft-april-2026
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll%2Fperiod-draft-april-2026
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-draft-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /payroll/period-draft-april-2026 on mobile and run the scripted steps for "Open draft pay period on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open locked pay period on phone
- Severity: medium
- Status: failed
- Route: /payroll/period-locked-march-2026
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll%2Fperiod-locked-march-2026
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-locked-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /payroll/period-locked-march-2026 on mobile and run the scripted steps for "Open locked pay period on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open payslip wizard on phone
- Severity: medium
- Status: failed
- Route: /wizard?empId=11111111-1111-4111-8111-111111111111
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fwizard%3FempId%3D11111111-1111-4111-8111-111111111111
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-wizard-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /wizard?empId=11111111-1111-4111-8111-111111111111 on mobile and run the scripted steps for "Open payslip wizard on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open payslip preview on phone
- Severity: medium
- Status: failed
- Route: /preview?payslipId=payslip-thandi-april-2026&empId=11111111-1111-4111-8111-111111111111
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fpreview%3FpayslipId%3Dpayslip-thandi-april-2026%26empId%3D11111111-1111-4111-8111-111111111111
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-preview-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /preview?payslipId=payslip-thandi-april-2026&empId=11111111-1111-4111-8111-111111111111 on mobile and run the scripted steps for "Open payslip preview on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open documents hub on phone
- Severity: medium
- Status: failed
- Route: /documents
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fdocuments
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-documents-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /documents on mobile and run the scripted steps for "Open documents hub on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open history page on phone
- Severity: medium
- Status: failed
- Route: /history
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fhistory
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-history-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /history on mobile and run the scripted steps for "Open history page on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open employee history from payroll context on phone
- Severity: medium
- Status: failed
- Route: /employees/11111111-1111-4111-8111-111111111111/history
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees%2F11111111-1111-4111-8111-111111111111%2Fhistory
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-employee-history-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /employees/11111111-1111-4111-8111-111111111111/history on mobile and run the scripted steps for "Open employee history from payroll context on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Re-open documents hub on phone
- Severity: medium
- Status: failed
- Route: /documents
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fdocuments
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-documents-again-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /documents on mobile and run the scripted steps for "Re-open documents hub on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Re-open preview page on phone
- Severity: medium
- Status: failed
- Route: /preview
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fpreview
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-preview-again-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /preview on mobile and run the scripted steps for "Re-open preview page on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Re-open payroll list on phone
- Severity: medium
- Status: failed
- Route: /payroll
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-payroll-again-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /payroll on mobile and run the scripted steps for "Re-open payroll list on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Re-open draft pay period on phone
- Severity: medium
- Status: failed
- Route: /payroll/period-draft-april-2026
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll%2Fperiod-draft-april-2026
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-draft-again-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /payroll/period-draft-april-2026 on mobile and run the scripted steps for "Re-open draft pay period on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open payroll list on desktop
- Severity: info
- Status: passed
- Route: /payroll
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-list-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /payroll on desktop and run the scripted steps for "Open payroll list on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open new payroll wizard on desktop
- Severity: info
- Status: passed
- Route: /payroll/new
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll%2Fnew
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-new-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /payroll/new on desktop and run the scripted steps for "Open new payroll wizard on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open draft pay period on desktop
- Severity: info
- Status: passed
- Route: /payroll/period-draft-april-2026
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll%2Fperiod-draft-april-2026
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-draft-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /payroll/period-draft-april-2026 on desktop and run the scripted steps for "Open draft pay period on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open locked pay period on desktop
- Severity: info
- Status: passed
- Route: /payroll/period-locked-march-2026
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll%2Fperiod-locked-march-2026
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-locked-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /payroll/period-locked-march-2026 on desktop and run the scripted steps for "Open locked pay period on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open payslip wizard on desktop
- Severity: info
- Status: passed
- Route: /wizard?empId=11111111-1111-4111-8111-111111111111
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fwizard%3FempId%3D11111111-1111-4111-8111-111111111111
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-wizard-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /wizard?empId=11111111-1111-4111-8111-111111111111 on desktop and run the scripted steps for "Open payslip wizard on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open payslip preview on desktop
- Severity: info
- Status: passed
- Route: /preview?payslipId=payslip-thandi-april-2026&empId=11111111-1111-4111-8111-111111111111
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fpreview%3FpayslipId%3Dpayslip-thandi-april-2026%26empId%3D11111111-1111-4111-8111-111111111111
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-preview-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /preview?payslipId=payslip-thandi-april-2026&empId=11111111-1111-4111-8111-111111111111 on desktop and run the scripted steps for "Open payslip preview on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open documents hub on desktop
- Severity: info
- Status: passed
- Route: /documents
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fdocuments
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-documents-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /documents on desktop and run the scripted steps for "Open documents hub on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open history page on desktop
- Severity: info
- Status: passed
- Route: /history
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fhistory
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-history-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /history on desktop and run the scripted steps for "Open history page on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open employee history from payroll context on desktop
- Severity: info
- Status: passed
- Route: /employees/11111111-1111-4111-8111-111111111111/history
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Femployees%2F11111111-1111-4111-8111-111111111111%2Fhistory
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-employee-history-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /employees/11111111-1111-4111-8111-111111111111/history on desktop and run the scripted steps for "Open employee history from payroll context on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Re-open documents hub on desktop
- Severity: info
- Status: passed
- Route: /documents
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fdocuments
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-documents-again-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /documents on desktop and run the scripted steps for "Re-open documents hub on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Re-open preview page on desktop
- Severity: info
- Status: passed
- Route: /preview
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fpreview
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-preview-again-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /preview on desktop and run the scripted steps for "Re-open preview page on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Re-open payroll list on desktop
- Severity: info
- Status: passed
- Route: /payroll
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-payroll-again-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /payroll on desktop and run the scripted steps for "Re-open payroll list on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Re-open draft pay period on desktop
- Severity: info
- Status: passed
- Route: /payroll/period-draft-april-2026
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll%2Fperiod-draft-april-2026
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-draft-again-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /payroll/period-draft-april-2026 on desktop and run the scripted steps for "Re-open draft pay period on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Start the new payroll wizard on phone
- Severity: high
- Status: failed
- Route: /payroll/new
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll%2Fnew
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-wizard-start-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /payroll/new on mobile and run the scripted steps for "Start the new payroll wizard on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByTestId('payroll-wizard-start').first() to be visible[22m


### Review employee choices in the new payroll wizard on phone
- Severity: high
- Status: failed
- Route: /payroll/new
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll%2Fnew
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-wizard-select-employee-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /payroll/new on mobile and run the scripted steps for "Review employee choices in the new payroll wizard on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByTestId('payroll-wizard-start').first() to be visible[22m


### Advance the new payroll wizard to dates on phone
- Severity: high
- Status: failed
- Route: /payroll/new
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll%2Fnew
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-wizard-next-to-dates-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /payroll/new on mobile and run the scripted steps for "Advance the new payroll wizard to dates on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByTestId('payroll-wizard-start').first() to be visible[22m


### Edit pay period dates in the wizard on phone
- Severity: high
- Status: failed
- Route: /payroll/new
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll%2Fnew
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-wizard-set-dates-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /payroll/new on mobile and run the scripted steps for "Edit pay period dates in the wizard on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px). | Runtime errors present (1).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByTestId('payroll-wizard-start').first() to be visible[22m


### Start the new payroll wizard on desktop
- Severity: high
- Status: failed
- Route: /payroll/new
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll%2Fnew
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-wizard-start-desktop-desktop.png
- UX rule: Stability and recovery states
- Recommendation: Stabilize the route and add guard states before rendering dependent client logic.
- Repro: Open /payroll/new on desktop and run the scripted steps for "Start the new payroll wizard on desktop".
- Issues: Runtime errors present (1).
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByTestId('payroll-wizard-start').first() to be visible[22m


### Initialize a new pay run on desktop
- Severity: high
- Status: failed
- Route: /payroll/new
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll%2Fnew
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-wizard-initialize-desktop-desktop.png
- UX rule: Stability and recovery states
- Recommendation: Stabilize the route and add guard states before rendering dependent client logic.
- Repro: Open /payroll/new on desktop and run the scripted steps for "Initialize a new pay run on desktop".
- Issues: Runtime errors present (1).
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByTestId('payroll-wizard-start').first() to be visible[22m


### Open the current payroll period from the list on desktop
- Severity: high
- Status: failed
- Route: /payroll
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fpayroll
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-open-current-period-desktop-desktop.png
- UX rule: Stability and recovery states
- Recommendation: Stabilize the route and add guard states before rendering dependent client logic.
- Repro: Open /payroll on desktop and run the scripted steps for "Open the current payroll period from the list on desktop".
- Issues: Runtime errors present (1).
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1
- Page errors: locator.waitFor: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for getByRole('link', { name: 'Open April 2026' }).first() to be visible[22m


### Inspect document actions on desktop
- Severity: info
- Status: passed
- Route: /documents
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fdocuments
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-documents-view-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /documents on desktop and run the scripted steps for "Inspect document actions on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Inspect document actions on phone
- Severity: medium
- Status: failed
- Route: /documents
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fdocuments
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-documents-view-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /documents on mobile and run the scripted steps for "Inspect document actions on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Inspect the preview download surface on desktop
- Severity: info
- Status: passed
- Route: /preview?payslipId=payslip-thandi-april-2026&empId=11111111-1111-4111-8111-111111111111
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fpreview%3FpayslipId%3Dpayslip-thandi-april-2026%26empId%3D11111111-1111-4111-8111-111111111111
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/payroll-preview-download-surface-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /preview?payslipId=payslip-thandi-april-2026&empId=11111111-1111-4111-8111-111111111111 on desktop and run the scripted steps for "Inspect the preview download surface on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open audit log page on phone
- Severity: medium
- Status: failed
- Route: /audit
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Faudit
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-audit-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /audit on mobile and run the scripted steps for "Open audit log page on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open uFiling page on phone
- Severity: medium
- Status: failed
- Route: /ufiling
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fufiling
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-ufiling-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /ufiling on mobile and run the scripted steps for "Open uFiling page on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open COIDA ROE page on phone
- Severity: medium
- Status: failed
- Route: /compliance/coida/roe
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fcompliance%2Fcoida%2Froe
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-roe-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /compliance/coida/roe on mobile and run the scripted steps for "Open COIDA ROE page on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open compliance help on phone
- Severity: medium
- Status: failed
- Route: /help/compliance
- Device: mobile
- Final URL: http://localhost:3002/help/admin#uif
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-help-compliance-mobile-mobile.png
- UX rule: No rule breach detected
- Recommendation: Investigate console failures and add focused regression coverage for this route.
- Repro: Open /help/compliance on mobile and run the scripted steps for "Open compliance help on phone".
- Issues: Console errors present (1).
- Metrics: overflow=false, tinyText=0, undersizedTargets=0, fixedBottomBars=0
- Console errors: Failed to load resource: the server responded with a status of 404 (Not Found)

### Open COIDA help on phone
- Severity: medium
- Status: failed
- Route: /help/coida
- Device: mobile
- Final URL: http://localhost:3002/help/coida
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-help-coida-mobile-mobile.png
- UX rule: No rule breach detected
- Recommendation: Investigate console failures and add focused regression coverage for this route.
- Repro: Open /help/coida on mobile and run the scripted steps for "Open COIDA help on phone".
- Issues: Console errors present (1).
- Metrics: overflow=false, tinyText=0, undersizedTargets=0, fixedBottomBars=0
- Console errors: Failed to load resource: the server responded with a status of 404 (Not Found)

### Open upgrade page on phone
- Severity: medium
- Status: failed
- Route: /upgrade
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fupgrade
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-upgrade-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /upgrade on mobile and run the scripted steps for "Open upgrade page on phone".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open billing success page on phone
- Severity: high
- Status: failed
- Route: /billing/success
- Device: mobile
- Final URL: http://localhost:3002/pricing
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-billing-success-mobile-mobile.png
- UX rule: Responsive Rules / Mobile layout containment
- Recommendation: Restructure the layout at this breakpoint and remove any width assumptions that exceed the viewport.
- Repro: Open /billing/success on mobile and run the scripted steps for "Open billing success page on phone".
- Issues: Horizontal overflow detected. | Too many undersized tap targets (18 below 44px). | Console errors present (1).
- Metrics: overflow=true, tinyText=25, undersizedTargets=18, fixedBottomBars=22
- Console errors: Failed to load resource: the server responded with a status of 401 (Unauthorized)

### Open billing cancel page on phone
- Severity: high
- Status: failed
- Route: /billing/cancel
- Device: mobile
- Final URL: http://localhost:3002/pricing
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-billing-cancel-mobile-mobile.png
- UX rule: Responsive Rules / Mobile layout containment
- Recommendation: Restructure the layout at this breakpoint and remove any width assumptions that exceed the viewport.
- Repro: Open /billing/cancel on mobile and run the scripted steps for "Open billing cancel page on phone".
- Issues: Horizontal overflow detected. | Too many undersized tap targets (18 below 44px). | Console errors present (1).
- Metrics: overflow=true, tinyText=25, undersizedTargets=18, fixedBottomBars=22
- Console errors: Failed to load resource: the server responded with a status of 401 (Unauthorized)

### Open storage settings on phone for sync review
- Severity: medium
- Status: failed
- Route: /settings?tab=storage
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings%3Ftab%3Dstorage
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-settings-storage-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /settings?tab=storage on mobile and run the scripted steps for "Open storage settings on phone for sync review".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open exports settings on phone for backup review
- Severity: medium
- Status: failed
- Route: /settings?tab=exports
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings%3Ftab%3Dexports
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-settings-exports-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /settings?tab=exports on mobile and run the scripted steps for "Open exports settings on phone for backup review".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open support settings on phone for help review
- Severity: medium
- Status: failed
- Route: /settings?tab=support
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings%3Ftab%3Dsupport
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-settings-support-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /settings?tab=support on mobile and run the scripted steps for "Open support settings on phone for help review".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open app handoff on phone for billing/compliance context
- Severity: medium
- Status: failed
- Route: /open-app
- Device: mobile
- Final URL: http://localhost:3002/?auth=login&next=%2Fdashboard
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-open-app-mobile-mobile.png
- UX rule: Civic Ledger readability and scanability
- Recommendation: Condense the information architecture for phone instead of shrinking the typography.
- Repro: Open /open-app on mobile and run the scripted steps for "Open app handoff on phone for billing/compliance context".
- Issues: High density of tiny text (30 visible elements below 12px). | Too many undersized tap targets (21 below 44px).
- Metrics: overflow=false, tinyText=30, undersizedTargets=21, fixedBottomBars=1

### Open support page on phone for contact checks
- Severity: medium
- Status: failed
- Route: /support
- Device: mobile
- Final URL: http://localhost:3002/support
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-support-mobile-mobile.png
- UX rule: Mobile tap target minimums from UX guidelines
- Recommendation: Promote important links and controls to 44px touch-safe targets.
- Repro: Open /support on mobile and run the scripted steps for "Open support page on phone for contact checks".
- Issues: Too many undersized tap targets (17 below 44px).
- Metrics: overflow=false, tinyText=9, undersizedTargets=17, fixedBottomBars=0

### Open trust page on phone for privacy checks
- Severity: medium
- Status: failed
- Route: /trust
- Device: mobile
- Final URL: http://localhost:3002/trust
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-trust-mobile-mobile.png
- UX rule: Mobile tap target minimums from UX guidelines
- Recommendation: Promote important links and controls to 44px touch-safe targets.
- Repro: Open /trust on mobile and run the scripted steps for "Open trust page on phone for privacy checks".
- Issues: Too many undersized tap targets (24 below 44px).
- Metrics: overflow=false, tinyText=10, undersizedTargets=24, fixedBottomBars=0

### Re-open pricing page on phone for billing comparison
- Severity: high
- Status: failed
- Route: /pricing
- Device: mobile
- Final URL: http://localhost:3002/pricing
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-pricing-mobile-mobile.png
- UX rule: Responsive Rules / Mobile layout containment
- Recommendation: Restructure the layout at this breakpoint and remove any width assumptions that exceed the viewport.
- Repro: Open /pricing on mobile and run the scripted steps for "Re-open pricing page on phone for billing comparison".
- Issues: Horizontal overflow detected. | Too many undersized tap targets (18 below 44px).
- Metrics: overflow=true, tinyText=25, undersizedTargets=18, fixedBottomBars=22

### Open audit log page on desktop
- Severity: info
- Status: passed
- Route: /audit
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Faudit
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-audit-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /audit on desktop and run the scripted steps for "Open audit log page on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open uFiling page on desktop
- Severity: info
- Status: passed
- Route: /ufiling
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fufiling
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-ufiling-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /ufiling on desktop and run the scripted steps for "Open uFiling page on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open COIDA ROE page on desktop
- Severity: info
- Status: passed
- Route: /compliance/coida/roe
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fcompliance%2Fcoida%2Froe
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-roe-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /compliance/coida/roe on desktop and run the scripted steps for "Open COIDA ROE page on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open compliance help on desktop
- Severity: medium
- Status: failed
- Route: /help/compliance
- Device: desktop
- Final URL: http://localhost:3002/help/admin#uif
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-help-compliance-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: Investigate console failures and add focused regression coverage for this route.
- Repro: Open /help/compliance on desktop and run the scripted steps for "Open compliance help on desktop".
- Issues: Console errors present (1).
- Metrics: overflow=false, tinyText=0, undersizedTargets=0, fixedBottomBars=0
- Console errors: Failed to load resource: the server responded with a status of 404 (Not Found)

### Open COIDA help on desktop
- Severity: medium
- Status: failed
- Route: /help/coida
- Device: desktop
- Final URL: http://localhost:3002/help/coida
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-help-coida-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: Investigate console failures and add focused regression coverage for this route.
- Repro: Open /help/coida on desktop and run the scripted steps for "Open COIDA help on desktop".
- Issues: Console errors present (1).
- Metrics: overflow=false, tinyText=0, undersizedTargets=0, fixedBottomBars=0
- Console errors: Failed to load resource: the server responded with a status of 404 (Not Found)

### Open upgrade page on desktop
- Severity: info
- Status: passed
- Route: /upgrade
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fupgrade
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-upgrade-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /upgrade on desktop and run the scripted steps for "Open upgrade page on desktop".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open billing success page on desktop
- Severity: medium
- Status: failed
- Route: /billing/success
- Device: desktop
- Final URL: http://localhost:3002/pricing
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-billing-success-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: Investigate console failures and add focused regression coverage for this route.
- Repro: Open /billing/success on desktop and run the scripted steps for "Open billing success page on desktop".
- Issues: Console errors present (1).
- Metrics: overflow=false, tinyText=25, undersizedTargets=25, fixedBottomBars=22
- Console errors: Failed to load resource: the server responded with a status of 401 (Unauthorized)

### Open billing cancel page on desktop
- Severity: medium
- Status: failed
- Route: /billing/cancel
- Device: desktop
- Final URL: http://localhost:3002/pricing
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-billing-cancel-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: Investigate console failures and add focused regression coverage for this route.
- Repro: Open /billing/cancel on desktop and run the scripted steps for "Open billing cancel page on desktop".
- Issues: Console errors present (1).
- Metrics: overflow=false, tinyText=25, undersizedTargets=25, fixedBottomBars=22
- Console errors: Failed to load resource: the server responded with a status of 401 (Unauthorized)

### Open storage settings on desktop for sync review
- Severity: info
- Status: passed
- Route: /settings?tab=storage
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings%3Ftab%3Dstorage
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-settings-storage-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /settings?tab=storage on desktop and run the scripted steps for "Open storage settings on desktop for sync review".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open exports settings on desktop for backup review
- Severity: info
- Status: passed
- Route: /settings?tab=exports
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings%3Ftab%3Dexports
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-settings-exports-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /settings?tab=exports on desktop and run the scripted steps for "Open exports settings on desktop for backup review".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open support settings on desktop for help review
- Severity: info
- Status: passed
- Route: /settings?tab=support
- Device: desktop
- Final URL: http://localhost:3002/?auth=login&next=%2Fsettings%3Ftab%3Dsupport
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-settings-support-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /settings?tab=support on desktop and run the scripted steps for "Open support settings on desktop for help review".
- Metrics: overflow=false, tinyText=42, undersizedTargets=28, fixedBottomBars=1

### Open support page on desktop for contact checks
- Severity: info
- Status: passed
- Route: /support
- Device: desktop
- Final URL: http://localhost:3002/support
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-support-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /support on desktop and run the scripted steps for "Open support page on desktop for contact checks".
- Metrics: overflow=false, tinyText=9, undersizedTargets=16, fixedBottomBars=0

### Open trust page on desktop for privacy checks
- Severity: info
- Status: passed
- Route: /trust
- Device: desktop
- Final URL: http://localhost:3002/trust
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-trust-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /trust on desktop and run the scripted steps for "Open trust page on desktop for privacy checks".
- Metrics: overflow=false, tinyText=10, undersizedTargets=29, fixedBottomBars=0

### Re-open pricing page on desktop for billing comparison
- Severity: info
- Status: passed
- Route: /pricing
- Device: desktop
- Final URL: http://localhost:3002/pricing
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-pricing-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /pricing on desktop and run the scripted steps for "Re-open pricing page on desktop for billing comparison".
- Metrics: overflow=false, tinyText=25, undersizedTargets=25, fixedBottomBars=22

### Open storage explainer on desktop
- Severity: info
- Status: passed
- Route: /storage
- Device: desktop
- Final URL: http://localhost:3002/storage
- Screenshot: C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/e2e-screenshots/audit/compliance-storage-desktop-desktop.png
- UX rule: No rule breach detected
- Recommendation: No change required from this run.
- Repro: Open /storage on desktop and run the scripted steps for "Open storage explainer on desktop".
- Metrics: overflow=false, tinyText=9, undersizedTargets=17, fixedBottomBars=0

