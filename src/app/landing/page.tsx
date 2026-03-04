// Static server-rendered landing page for crawlers and policy verification (e.g. Paddle domain review).
// This page intentionally has NO client-side JS dependencies so it renders in full for all crawlers.

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "LekkerLedger | SA Domestic Worker Payslips",
    description:
        "Create a compliant payslip for South African domestic workers in under 90 seconds. Fast, reliable, and proudly South African.",
};

export default function LandingPage() {
    return (
        <html lang="en">
            <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", backgroundColor: "#0f0f0f", color: "#f4f4f5" }}>
                <div style={{ maxWidth: "900px", margin: "0 auto", padding: "60px 24px" }}>

                    {/* Header */}
                    <header style={{ marginBottom: "60px" }}>
                        <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#f4f4f5", margin: 0 }}>
                            LekkerLedger
                        </h1>
                        <p style={{ fontSize: "1.1rem", color: "#a1a1aa", marginTop: "8px", fontWeight: 500 }}>
                            Professional payroll and compliance for South African homeowners.
                        </p>
                    </header>

                    {/* About */}
                    <section style={{ marginBottom: "48px" }}>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f4f4f5" }}>About LekkerLedger</h2>
                        <p style={{ color: "#a1a1aa", lineHeight: "1.8", fontWeight: 500 }}>
                            LekkerLedger is a payroll calculation and compliance tool designed for South African homeowners who employ domestic workers.
                            It calculates the correct National Minimum Wage, UIF contributions, and Sunday/Public Holiday rates automatically, then
                            generates a professional PDF payslip — all within 90 seconds. Your data is stored locally on your device and never
                            sent to any server.
                        </p>
                    </section>

                    {/* Key Features */}
                    <section style={{ marginBottom: "48px" }}>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f4f4f5" }}>Key Features</h2>
                        <ul style={{ color: "#a1a1aa", lineHeight: "2", fontWeight: 500, paddingLeft: "20px" }}>
                            <li>BCEA & Sectoral Determination 7 aligned payslip calculations</li>
                            <li>Automatic UIF and COIDA guidance</li>
                            <li>100% local-device storage — no data leaves your device</li>
                            <li>PDF payslip generation</li>
                            <li>Employment contract builder (Pro)</li>
                            <li>uFiling export support</li>
                        </ul>
                    </section>

                    {/* Pricing */}
                    <section style={{ marginBottom: "48px" }}>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f4f4f5" }}>Pricing</h2>
                        <p style={{ color: "#a1a1aa", lineHeight: "1.8", fontWeight: 500 }}>
                            LekkerLedger is free for core payslip generation. The Pro upgrade (R299 once-off) unlocks employment contracts,
                            priority support, and advanced compliance tools. No monthly fees or subscriptions.
                        </p>
                    </section>

                    {/* Company */}
                    <section style={{ marginBottom: "48px" }}>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f4f4f5" }}>Company</h2>
                        <p style={{ color: "#a1a1aa", lineHeight: "1.8", fontWeight: 500 }}>
                            LekkerLedger is a product of <strong style={{ color: "#f4f4f5" }}>Nightshift Labs ZA</strong>, a software development
                            company based in South Africa. For support, contact us at{" "}
                            <a href="mailto:nightshiftlabsza@gmail.com" style={{ color: "#c47a1c" }}>nightshiftlabsza@gmail.com</a>.
                        </p>
                    </section>

                    {/* Footer */}
                    <footer style={{
                        marginTop: "80px",
                        paddingTop: "32px",
                        borderTop: "1px solid #27272a",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px"
                    }}>
                        <nav style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
                            <Link href="/legal/terms" style={{ color: "#a1a1aa", textDecoration: "underline", fontWeight: 600 }}>
                                Terms of Service
                            </Link>
                            <Link href="/legal/privacy" style={{ color: "#a1a1aa", textDecoration: "underline", fontWeight: 600 }}>
                                Privacy Policy (POPIA)
                            </Link>
                            <Link href="/legal/refunds" style={{ color: "#a1a1aa", textDecoration: "underline", fontWeight: 600 }}>
                                Refund Policy
                            </Link>
                            <a href="mailto:nightshiftlabsza@gmail.com" style={{ color: "#a1a1aa", textDecoration: "underline", fontWeight: 600 }}>
                                Contact Support
                            </a>
                        </nav>
                        <p style={{ color: "#52525b", fontSize: "0.8rem", margin: 0 }}>
                            © 2026 LekkerLedger. All rights reserved. A product of Nightshift Labs ZA, South Africa.
                        </p>
                    </footer>

                </div>
            </body>
        </html>
    );
}
