import { clearAllLocalData } from "./storage";
import { clearAllLocalRecoveryProfiles } from "./recovery-profile-store";
import { clearCredentialHandoff } from "./credential-handoff";
import { clearPendingBillingHandoff } from "./billing-handoff";

/**
 * Clears all locally persisted user data on sign-out.
 *
 * Paid users' data is cloud-secured, so nothing should remain on the
 * device after they sign out.  This function covers every persistence
 * surface: IndexedDB (localforage stores), localStorage keys that hold
 * user/billing data, sessionStorage handoffs, and CacheStorage entries
 * managed by the service worker.
 *
 * Theme/density preferences (ll-theme, ll-density) are intentionally
 * preserved — they are cosmetic, contain no user data, and should
 * survive sign-out for the next session.
 */
export async function clearAllUserDataOnSignOut(): Promise<void> {
    // 1. IndexedDB — all localforage stores (employees, payslips, leave,
    //    settings, audit logs, documents, contracts, households, etc.)
    await clearAllLocalData().catch(() => {});

    // 2. IndexedDB — recovery profiles (encryption keys, validation payloads)
    await clearAllLocalRecoveryProfiles().catch(() => {});

    // 3. sessionStorage — password handoff
    clearCredentialHandoff();

    // 4. localStorage — billing handoff keys
    clearPendingBillingHandoff();

    // 5. localStorage — data-change ping (cross-tab sync artifact)
    safeLocalStorageRemove("lekkerledger:data-change-ping");

    // 6. localStorage — cache heal flag (non-sensitive, but stale after sign-out)
    safeLocalStorageRemove("lekkerledger-cache-heal-v3");

    // 7. sessionStorage — recovery notice
    safeSessionStorageRemove("lekkerledger:recovery-notice");

    // 8. CacheStorage — clear all service-worker runtime caches
    await clearServiceWorkerCaches().catch(() => {});
}

function safeLocalStorageRemove(key: string) {
    try {
        globalThis.localStorage?.removeItem(key);
    } catch {}
}

function safeSessionStorageRemove(key: string) {
    try {
        globalThis.sessionStorage?.removeItem(key);
    } catch {}
}

async function clearServiceWorkerCaches(): Promise<void> {
    if (typeof caches === "undefined") return;
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
}
