"use client";

import { track } from "./analytics";

type MetricName =
    | "login_to_interactive"
    | "auth_resolved_after_login"
    | "subscription_resolved_after_login"
    | "paystack_open_latency"
    | "dashboard_mount_renders";

interface ActiveMetric {
    startedAt: number;
}

const activeMetrics = new Map<MetricName, ActiveMetric>();

function now() {
    if (typeof globalThis.performance !== "undefined" && typeof globalThis.performance.now === "function") {
        return globalThis.performance.now();
    }

    return Date.now();
}

function roundDuration(value: number) {
    return Math.max(0, Math.round(value));
}

function logMetric(name: MetricName, payload: Record<string, string | number | boolean>) {
    track("app_performance_metric", {
        metric_name: name,
        ...payload,
    });

    if (process.env.NODE_ENV !== "production") {
        console.info(`[perf] ${name}`, payload);
    }
}

export function startAppMetric(name: MetricName) {
    activeMetrics.set(name, {
        startedAt: now(),
    });
}

export function endAppMetric(name: MetricName, params: Record<string, string | number | boolean> = {}) {
    const metric = activeMetrics.get(name);

    if (!metric) {
        return null;
    }

    const durationMs = roundDuration(now() - metric.startedAt);
    activeMetrics.delete(name);
    logMetric(name, {
        duration_ms: durationMs,
        ...params,
    });
    return durationMs;
}

export function recordAppMetric(name: MetricName, params: Record<string, string | number | boolean>) {
    logMetric(name, params);
}
