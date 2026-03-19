import { z } from "zod";

const serverSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    // Paystack
    PAYSTACK_SECRET_KEY: z.string().min(1, "PAYSTACK_SECRET_KEY is required"),
    PAYSTACK_PLAN_STANDARD_MONTHLY: z.string().optional(),
    PAYSTACK_PLAN_STANDARD_YEARLY: z.string().optional(),
    PAYSTACK_PLAN_PRO_MONTHLY: z.string().optional(),
    PAYSTACK_PLAN_PRO_YEARLY: z.string().optional(),
    BILLING_RENEWALS_SECRET: z.string().optional(),

    // Cloudflare D1
    CLOUDFLARE_ACCOUNT_ID: z.string().min(1, "CLOUDFLARE_ACCOUNT_ID is required"),
    CLOUDFLARE_D1_DATABASE_ID: z.string().min(1, "CLOUDFLARE_D1_DATABASE_ID is required"),
    CLOUDFLARE_D1_API_TOKEN: z.string().min(1, "CLOUDFLARE_D1_API_TOKEN is required"),

    // Cloudflare R2
    CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().optional(),
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().optional(),
    CLOUDFLARE_R2_ENDPOINT: z.string().optional(),
    CLOUDFLARE_R2_BUCKET_NAME: z.string().optional(),

    // Supabase Server
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
    RECOVERABLE_WRAP_SECRET: z.string().min(1, "RECOVERABLE_WRAP_SECRET is required"),
});

const publicSchema = z.object({
    NEXT_PUBLIC_APP_URL: z.string().optional(),
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().optional(),
    NEXT_PUBLIC_SITE_URL: z.string().optional(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().min(1, "NEXT_PUBLIC_SUPABASE_URL is required"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
});

/**
 * Validates variables and returns them.
 * This is designed to be called in a server environment.
 */
function validateServerEnv() {
    // Only validate server vars on the server
    if (typeof window !== "undefined") return {} as z.infer<typeof serverSchema>;

    const parsed = serverSchema.safeParse(process.env);
    if (!parsed.success) {
        const errors = parsed.error.flatten().fieldErrors;
        console.error("❌ Invalid server environment variables:", errors);
        if (process.env.NODE_ENV === "production") {
            throw new Error(`Missing required server environment variables: ${Object.keys(errors).join(", ")}`);
        }
        return process.env as unknown as z.infer<typeof serverSchema>;
    }
    return parsed.data;
}

/**
 * Validates public variables and returns them.
 * Safe for both server and client.
 */
function validatePublicEnv() {
    const parsed = publicSchema.safeParse({
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
    if (!parsed.success) {
        const errors = parsed.error.flatten().fieldErrors;
        console.error("❌ Invalid public environment variables:", errors);
        if (process.env.NODE_ENV === "production") {
            throw new Error(`Missing required public environment variables: ${Object.keys(errors).join(", ")}`);
        }
        return {
            NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
            NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
            NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        } as z.infer<typeof publicSchema>;
    }
    return parsed.data;
}

export function getRequiredEnvValue(name: string): string {
    const publicEnvValues: Record<string, string | undefined> = {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    };

    const value = (publicEnvValues[name] ?? process.env[name])?.trim();
    if (!value || value === "undefined" || value === "null") {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export const env = {
    ...validateServerEnv(),
    ...validatePublicEnv(),
};
