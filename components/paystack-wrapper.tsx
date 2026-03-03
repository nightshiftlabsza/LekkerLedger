"use client";

import React from "react";
import { usePaystackPayment } from "react-paystack";

export default function PaystackWrapper({
    config,
    onSuccess,
    onClose
}: {
    config: Parameters<typeof usePaystackPayment>[0];
    onSuccess: () => void;
    onClose: () => void;
}) {
    const initializePayment = usePaystackPayment(config);

    React.useEffect(() => {
        if (config && (config.amount ?? 0) > 0) {
            initializePayment({ onSuccess, onClose });
        }
    }, [config, initializePayment, onSuccess, onClose]);

    return null;
}
