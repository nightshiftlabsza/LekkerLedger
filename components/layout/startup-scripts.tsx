import Script from "next/script";

const SAMPLE_PDF_CLEANUP_SCRIPT = `
(() => {
  const cleanupKey = "lekkerledger-sample-pdf-cleanup-v1";
  const pdfPath = "/sample-payslip.pdf";

  const runCleanup = async () => {
    const pdfUrl = new URL(pdfPath, window.location.origin).href;
    let removedCachedPdf = false;

    if ("caches" in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const deletedAbsolute = await cache.delete(pdfUrl, { ignoreSearch: true });
        const deletedRelative = await cache.delete(pdfPath, { ignoreSearch: true });
        removedCachedPdf = deletedAbsolute || deletedRelative || removedCachedPdf;
      }
    }

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.update().catch(() => undefined)));

      if (removedCachedPdf && !sessionStorage.getItem(cleanupKey)) {
        sessionStorage.setItem(cleanupKey, "done");
        await Promise.all(registrations.map((registration) => registration.unregister().catch(() => false)));
        window.location.reload();
      }
    }
  };

  window.addEventListener("load", () => {
    void runCleanup();
  }, { once: true });
})();
`;

export function StartupScripts({ gaId, gaDebug }: { gaId?: string; gaDebug: boolean }) {
    return (
        <>
            <Script id="theme-init" src="/theme-init.js" strategy="beforeInteractive" />
            <Script id="sample-pdf-cleanup" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: SAMPLE_PDF_CLEANUP_SCRIPT }} />
            {gaId ? (
                <>
                    <Script
                        id="gtag-loader"
                        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                        strategy="afterInteractive"
                    />
                    <Script
                        id="ga-init"
                        src="/ga-init.js"
                        strategy="afterInteractive"
                        data-ga-id={gaId}
                        data-ga-debug={gaDebug ? "true" : "false"}
                    />
                </>
            ) : null}
        </>
    );
}
