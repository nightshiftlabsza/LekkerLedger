import Script from "next/script";

export function StartupScripts({ gaId, gaDebug }: { gaId?: string; gaDebug: boolean }) {
    return (
        <>
            <Script id="theme-init" src="/theme-init.js" strategy="beforeInteractive" />
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
