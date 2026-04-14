# Codex Task: Retire "Maximum Privacy" for New Users + Fix AI Filler Copy

## Context

This codebase has two client-side encryption modes:

1. **Recoverable** (default) – AES-256-GCM master key, wrapped with the user's password via PBKDF2-SHA256 (310 000 iterations) and also stored server-side via a separate server-secret wrap. Recovery is seamless via account login.
2. **Maximum Privacy** – AES-256-GCM master key derived from a locally-generated recovery key. No server copy. Lose the key → lose the data permanently.

**Goal:** New users must never see or be able to select Maximum Privacy. Existing users who already chose Maximum Privacy must continue to work exactly as they do now — they can still unlock their account with their recovery key. No data is lost, no existing flow is broken.

---

## Part 1 — Retire Maximum Privacy for New Users Only

### What to KEEP (existing maximum_privacy users must still work)

- `generateRecoveryKey()` in `src/lib/crypto.ts` — keep it; used during any future migration path you might add.
- `deriveKey()` in `src/lib/crypto.ts` — keep it; existing max-privacy users call this at unlock time.
- The `"max_privacy_input"` step in `src/components/encryption/recovery-gate.tsx` — keep it, along with `handleMaxPrivacyInput`. Existing users routed to this step must still be able to unlock with their recovery key.
- `RecoveryKeyInput` component (`src/components/encryption/recovery-key-input.tsx`) — keep it.
- The `canUseLegacyRecoveryKey()` helper in `src/lib/app-mode.tsx` — keep it.
- The `recoveryKey?: string` field in `RecoveryProfileRecord` (`src/lib/recovery-profile-store.ts`) — keep it.
- The `"maximum_privacy"` value in the `EncryptionMode` union type — keep it.
- All helper functions in `src/lib/encryption-mode.ts` that branch on `"maximum_privacy"` — keep those branches.
- The read paths in `src/lib/encryption-profile.ts` that detect and return `"maximum_privacy"` for legacy/cloud-data accounts — keep them.
- The `"maximum_privacy"` branch in `getAccountSyncStatus` in `src/app/(app)/app-shell.tsx` — keep it.

### What to REMOVE (new-user selection path only)

#### 1. `src/components/encryption/recovery-gate.tsx`

Remove the mode-choice screen and maximum_privacy setup path:

- Remove `"choose_mode"` and `"max_privacy_setup"` from the `RecoveryGateStep` union type. Keep `"max_privacy_input"`.
- Delete `handleMaxPrivacySetup` (the handler that calls `generateRecoveryKey`, writes `encryption_mode: "maximum_privacy"` to Supabase, and saves the key locally). This is the setup path — only new users hit it.
- In the logic that decides the initial step after profile load:
  - Where it currently sets `"choose_mode"` (for users with no mode chosen yet), replace it with a direct jump to `"recoverable_setup"`. New users now go straight to recoverable setup; they never see a mode choice.
  - Keep the branch that sets `"max_privacy_input"` for users whose profile already has `encryptionMode === "maximum_privacy"` and `keySetupComplete === true`. That path must remain intact.
- Remove import of `RecoveryKeySetup` and `EncryptionModeChoice` (both only needed for setup).
- Keep import of `RecoveryKeyInput`.
- In the render section, remove the JSX blocks for `status === "choose_mode"` and `status === "max_privacy_setup"`. Keep the block for `status === "max_privacy_input"`.

#### 2. Delete these files

- `src/components/encryption/recovery-key-setup.tsx` — only used during maximum_privacy setup, not unlock.
- `src/components/encryption/recovery-key-setup.test.tsx`
- `src/components/encryption/encryption-mode-choice.tsx` — the screen that lets users pick between the two modes.

#### 3. `src/lib/encryption-mode.ts`

- Remove `"maximum_privacy"` from the `ENCRYPTION_MODE_OPTIONS` array only (this is the UI options list shown during new-user onboarding). **Do not** change the `EncryptionMode` type, `normalizeEncryptionMode`, or any of the helper functions — those must keep their `"maximum_privacy"` branches for existing users.
- You may optionally add a comment on `ENCRYPTION_MODE_OPTIONS` noting that maximum_privacy is hidden from new users but still supported for existing accounts.

#### 4. `src/app/(app)/settings/page.tsx`

- Keep the maximum_privacy settings block (around line 743) exactly as-is. Existing users need to see their current encryption mode in settings.

---

## Part 2 — Fix AI-Filler Copy (Calm/Workflow Phrasing)

The following strings contain fluffy, AI-sounding copy. Replace each with plain, direct language. No new buzzwords. Keep it factual.

### `src/app/(marketing)/layout.tsx` — line 14
**Current:**
```
"Run South African household payroll with payslips, employee records, backup, and annual paperwork in one calm workspace."
```
**Replace with:**
```
"South African household payroll: payslips, employee records, cloud backup, and annual paperwork in one place."
```

### `src/app/(marketing)/onboarding/page.tsx` — line 27
**Current:**
```
Start calmly
```
**Replace with:**
```
Get started
```

### `src/app/(marketing)/page.tsx` — line 402
**Current:**
```
Keep monthly payslips, contracts, exports, and payroll records together in one calm workspace.
```
**Replace with:**
```
Keep monthly payslips, contracts, exports, and payroll records together in one place.
```

### `src/app/(marketing)/support/page.tsx` — line 44
**Current:**
```
Unsure what to check each month or each year? Open the household checklist for plain-language steps, official sources, and calmer guidance.
```
**Replace with:**
```
Unsure what to check each month or each year? Open the household checklist for plain-language steps and official sources.
```

### `src/app/(marketing)/trust/page.tsx` — line 53
**Current:**
```
How we process your data, compute your payroll, and protect your privacy. Everything laid out clearly, so your payroll records can feel calm rather than intimidating.
```
**Replace with:**
```
How we process your data, compute your payroll, and protect your privacy — laid out clearly.
```

### `src/components/auth/auth-shell.tsx` — line 80
**Current:**
```
Paid access, recovery, and setup in one calm flow.
```
**Replace with:**
```
Paid access, recovery, and setup in one place.
```

---

## Part 3 — Update Public-Facing Content (Trust, Storage, Onboarding Pages)

These marketing/info pages explicitly tell users they can choose between two encryption modes. Since new users can no longer do that, the copy must be updated to reflect reality. Existing-user references (e.g. in settings) are fine to leave.

### `src/app/(marketing)/trust/page.tsx` — line 71

**Current:**
```
This architecture means LekkerLedger does not have access to your unencrypted payroll data. You choose between Recoverable Encryption and Maximum Privacy during secure setup.
```
**Replace with:**
```
This architecture means LekkerLedger does not have access to your unencrypted payroll data. All accounts use Recoverable Encryption — your records are encrypted before upload and can be restored via account login if you lose access.
```

### `src/app/(marketing)/storage/page.tsx` — three strings

**String 1 (line 54):**
```
Choose Recoverable Encryption or Maximum Privacy during setup
```
**Replace with:**
```
Recoverable Encryption — encrypted before upload, restored via your account
```

**String 2 (line 87):**
```
You can choose between Recoverable Encryption (password-based recovery) or Maximum Privacy (recovery-key-only access).
```
**Replace with:**
```
All accounts use Recoverable Encryption: records are encrypted before upload and can be restored via your account login.
```

**String 3 (line 139) — the Maximum Privacy definition bullet:**
```
<strong className="text-[var(--text)]">Maximum Privacy:</strong> Recovery key only. If you lose the key, data cannot be recovered — not even by us.
```
Remove this list item entirely. Do not replace it with anything — just delete the `<li>` block.

### `src/app/(marketing)/onboarding/page.tsx` — line 16

This is a push notification body shown during onboarding:

**Current:**
```
body: "During secure setup, choose Recoverable Encryption for password-based recovery or Maximum Privacy for key-only access.",
```
**Replace with:**
```
body: "Your payroll records are encrypted before upload. You can restore access via your account login.",
```

---

## Summary: What changes vs. what stays

| Item | Change |
|---|---|
| New users can select Maximum Privacy | **Removed** — `choose_mode` step and mode-choice UI are gone |
| Maximum Privacy setup flow | **Removed** — `max_privacy_setup` step, `handleMaxPrivacySetup`, `RecoveryKeySetup`, `EncryptionModeChoice` deleted |
| Existing Maximum Privacy users unlocking | **Unchanged** — `max_privacy_input` step, `RecoveryKeyInput`, `deriveKey`, `canUseLegacyRecoveryKey` all kept |
| Existing Recoverable users | **Unchanged** |
| `EncryptionMode` type | **Unchanged** — still includes `"maximum_privacy"` |
| `ENCRYPTION_MODE_OPTIONS` | **Maximum Privacy entry removed** (new-user UI only) |
| All helper functions in `encryption-mode.ts` | **Unchanged** — keep maximum_privacy branches |
| `generateRecoveryKey`, `deriveKey` in `crypto.ts` | **Unchanged** |
| DB schema / migrations | **None needed** |
| Trust page (`/trust`) | **Updated** — no longer says users choose between two modes |
| Storage page (`/storage`) | **Updated** — Maximum Privacy bullet removed, copy updated to reflect single mode |
| Onboarding notification body | **Updated** — no longer mentions Maximum Privacy as an option |

### After this change, new users see

1. Sign up → straight to **Recoverable Encryption setup** (password-based, server-assisted recovery)
2. No mode-choice screen at all

### Existing Maximum Privacy users see

1. Log in → **Recovery key input screen** (exactly as before)
2. Settings page still shows their encryption mode correctly
