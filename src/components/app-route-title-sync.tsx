"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const APP_NAME = "LekkerLedger";

const APP_ROUTE_TITLES: Array<{ pattern: RegExp; title: string }> = [
    { pattern: /^\/dashboard$/, title: "Dashboard" },
    { pattern: /^\/billing$/, title: "Billing" },
    { pattern: /^\/billing\/cancel$/, title: "Billing Cancelled" },
    { pattern: /^\/compliance\/coida\/roe$/, title: "Return of Earnings (ROE)" },
    { pattern: /^\/contracts$/, title: "Employment Contracts" },
    { pattern: /^\/contracts\/new$/, title: "New Contract" },
    { pattern: /^\/contracts\/[^/]+\/edit$/, title: "Edit Contract" },
    { pattern: /^\/contracts\/[^/]+\/preview$/, title: "Contract Preview" },
    { pattern: /^\/documents$/, title: "Documents" },
    { pattern: /^\/employees$/, title: "Employees" },
    { pattern: /^\/employees\/new$/, title: "Add Employee" },
    { pattern: /^\/employees\/[^/]+$/, title: "Employee Record" },
    { pattern: /^\/employees\/[^/]+\/edit$/, title: "Edit Employee" },
    { pattern: /^\/employees\/[^/]+\/history$/, title: "Pay History" },
    { pattern: /^\/employees\/[^/]+\/leave\/new$/, title: "Record Leave" },
    { pattern: /^\/leave$/, title: "Leave Overview" },
    { pattern: /^\/leave\/new$/, title: "Record Leave" },
    { pattern: /^\/payroll$/, title: "Monthly Payroll" },
    { pattern: /^\/payroll\/new$/, title: "Create Payroll" },
    { pattern: /^\/payroll\/[^/]+$/, title: "Payroll Period" },
    { pattern: /^\/preview$/, title: "Payslip Preview" },
    { pattern: /^\/settings$/, title: "Settings" },
    { pattern: /^\/tools\/wage-calculator$/, title: "Wage Calculator" },
    { pattern: /^\/ufiling$/, title: "uFiling Export" },
    { pattern: /^\/upgrade$/, title: "Upgrade" },
    { pattern: /^\/wizard$/, title: "Setup Wizard" },
];

function getFallbackTitle(pathname: string): string {
    const matched = APP_ROUTE_TITLES.find((route) => route.pattern.test(pathname));
    if (matched) return matched.title;

    const pathSegments = pathname.split("/").filter(Boolean);
    if (pathSegments.length === 0) return APP_NAME;

    const readableTitle = pathSegments.at(-1)
        ?.replaceAll(/[-_]+/g, " ")
        .replaceAll(/\b\w/g, (character) => character.toUpperCase());

    return readableTitle || APP_NAME;
}

function getVisibleHeading(): string | null {
    if (typeof document === "undefined") return null;

    const heading = document.querySelector<HTMLElement>("[data-page-title], main h1, h1");
    const title = heading?.textContent?.replaceAll(/\s+/g, " ").trim();

    if (!title) return null;
    return title.length > 90 ? title.slice(0, 90).trim() : title;
}

function formatDocumentTitle(title: string): string {
    if (!title) return APP_NAME;
    return title.includes(APP_NAME) ? title : `${title} | ${APP_NAME}`;
}

export function AppRouteTitleSync() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const search = searchParams?.toString() ?? "";

    useEffect(() => {
        if (!pathname) return;

        let frameId: number | null = null;

        const updateTitle = () => {
            const nextTitle = getVisibleHeading() || getFallbackTitle(pathname);
            document.title = formatDocumentTitle(nextTitle);
        };

        const scheduleTitleUpdate = () => {
            if (frameId !== null) {
                globalThis.cancelAnimationFrame(frameId);
            }

            frameId = globalThis.requestAnimationFrame(() => {
                frameId = null;
                updateTitle();
            });
        };

        updateTitle();

        const observer = new MutationObserver(() => {
            scheduleTitleUpdate();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        return () => {
            observer.disconnect();
            if (frameId !== null) {
                globalThis.cancelAnimationFrame(frameId);
            }
        };
    }, [pathname, search]);

    return null;
}
