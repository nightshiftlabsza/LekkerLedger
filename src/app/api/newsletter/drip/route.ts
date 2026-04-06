import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSubscribersDueForDrip, markDripSent } from "@/lib/newsletter";
import { sendDripEmail } from "@/lib/newsletter-emails";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
    const configuredSecret = env.NEWSLETTER_DRIP_SECRET?.trim();
    if (!configuredSecret) {
        return false;
    }

    const bearer = request.headers.get("authorization") || request.headers.get("Authorization") || "";
    const token = bearer.startsWith("Bearer ") ? bearer.slice("Bearer ".length).trim() : "";
    return token === configuredSecret;
}

export async function POST(request: Request) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: "Not authorized." }, { status: 401 });
    }

    const results = { sent: 0, failed: 0, errors: [] as string[] };

    for (const dripNumber of [1, 2, 3] as const) {
        const subscribers = await getSubscribersDueForDrip(dripNumber);
        for (const sub of subscribers) {
            try {
                await sendDripEmail(sub.email, dripNumber);
                await markDripSent(sub.email, dripNumber);
                results.sent += 1;
            } catch (error) {
                results.failed += 1;
                results.errors.push(`drip_${dripNumber}:${sub.email}`);
                console.error(`[newsletter] drip ${dripNumber} failed for ${sub.email}`, error);
            }
        }
    }

    return NextResponse.json(results, {
        headers: { "Cache-Control": "no-store" },
    });
}
