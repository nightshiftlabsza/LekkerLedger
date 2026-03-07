# Security Policy

## Reporting a vulnerability

If you believe you have found a security issue in LekkerLedger, email `support@lekkerledger.co.za` with:

- a short summary of the issue
- steps to reproduce it
- the affected page, route, or feature
- screenshots or logs if they help explain the risk

Please do not post undisclosed security issues in public issue trackers.

## What to expect from us

- We will acknowledge receipt as soon as we can.
- We will investigate the report and confirm whether it is valid.
- We will work on a fix based on the severity and scope of the issue.
- We may ask follow-up questions if reproduction details are unclear.

## Scope

Security reports are especially helpful for issues involving:

- authentication and Google sign-in
- backup and restore flows
- payroll or employee data exposure
- payment and billing flows
- accidental disclosure of secrets, keys, or release artifacts
- dependency vulnerabilities with a practical impact on the app

## Safe handling

When testing:

- avoid accessing data that is not yours
- avoid destructive actions where possible
- stop once you have confirmed the issue

## Current repo practice

Sensitive signing keys, release binaries, and generated artifacts must not be committed to git. Use secure secret storage, CI artifacts, and release systems instead.
