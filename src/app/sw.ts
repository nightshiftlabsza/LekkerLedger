import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst, ExpirationPlugin, StaleWhileRevalidate } from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [
        {
            matcher: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: new StaleWhileRevalidate({
                cacheName: "google-fonts",
                plugins: [
                    new ExpirationPlugin({
                        maxEntries: 20,
                        maxAgeSeconds: 365 * 24 * 60 * 60, // 365 Days
                    }),
                ],
            }),
        },
        {
            matcher: /\.(?:png|jpg|jpeg|svg|webp)$/i,
            handler: new CacheFirst({
                cacheName: "images",
                plugins: [
                    new ExpirationPlugin({
                        maxEntries: 60,
                        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
                    }),
                    {
                        cacheWillUpdate: async ({ response }) => {
                            if (response?.status === 200) {
                                return response;
                            }
                            return null;
                        },
                    },
                ],
            }),
        },
    ],
});

serwist.addEventListeners();
