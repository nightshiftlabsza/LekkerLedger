(() => {
    const script = document.currentScript || document.getElementById("ga-init");
    const gaId = script?.dataset?.gaId;

    if (!gaId) {
        return;
    }

    window.dataLayer = window.dataLayer || [];

    function gtag() {
        window.dataLayer.push(arguments);
    }

    window.gtag = window.gtag || gtag;
    window.gtag("js", new Date());
    window.gtag("config", gaId, {
        debug_mode: script?.dataset?.gaDebug === "true",
        send_page_view: true,
    });
})();
