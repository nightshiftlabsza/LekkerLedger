import { z } from "zod";

const serverSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    
    // Paystack
    PAYSTACK_SECRET_KEY: z.string().min(1, "PAYSTACK_SECRET_KEY is required"),
    PAYSTACK_PLAN_STANDARD_MONTHLY: z.string().optional(),
    PAYSTACK_PLAN_STANDARD_YEARLY: z.string().optional(),
    PAYSTACK_PLAN_PRO_MONTHLY: z.string().optional(),
    PAYSTACK_PLAN_PRO_YEARLY: z.string().optional(),
    
    // Cloudflare D1
    CLOUDFLARE_ACCOUNT_ID: z.string().min(1, "CLOUDFLARE_ACCOUNT_ID is required"),
    CLOUDFLARE_D1_DATABASE_ID: z.string().min(1, "CLOUDFLARE_D1_DATABASE_ID is required"),
    CLOUDFLARE_D1_API_TOKEN: z.string().min(1, "CLOUDFLARE_D1_API_TOKEN is required"),
});

const publicSchema = z.object({
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().optional(),
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
        console.error("❌ Invalid server environment variables:", parsed.error.flatten().fieldErrors);
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
        NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    });
    if (!parsed.success) {
        console.error("❌ Invalid public environment variables:", parsed.error.flatten().fieldErrors);
        return {
            NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        } as z.infer<typeof publicSchema>;
    }
    return parsed.data;
}

export const env = {
    ...validateServerEnv(),
    ...validatePublicEnv(),
};
