"use client";

import { useState, useEffect } from "react";

export const useOnlineStatus = () => {
    const [isOnline, setIsOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);

    useEffect(() => {

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        globalThis.addEventListener("online", handleOnline);
        globalThis.addEventListener("offline", handleOffline);

        return () => {
            globalThis.removeEventListener("online", handleOnline);
            globalThis.removeEventListener("offline", handleOffline);
        };
    }, []);

    return isOnline;
};
