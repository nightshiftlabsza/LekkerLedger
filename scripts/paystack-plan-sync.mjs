const BILLING_PLANS = [
    {
        key: "STANDARD_MONTHLY",
        envVarName: "PAYSTACK_PLAN_STANDARD_MONTHLY",
        amountCents: 2900,
        interval: "monthly",
        currency: "ZAR",
    },
    {
        key: "STANDARD_YEARLY",
        envVarName: "PAYSTACK_PLAN_STANDARD_YEARLY",
        amountCents: 29900,
        interval: "annually",
        currency: "ZAR",
    },
    {
        key: "PRO_MONTHLY",
        envVarName: "PAYSTACK_PLAN_PRO_MONTHLY",
        amountCents: 4900,
        interval: "monthly",
        currency: "ZAR",
    },
    {
        key: "PRO_YEARLY",
        envVarName: "PAYSTACK_PLAN_PRO_YEARLY",
        amountCents: 39900,
        interval: "annually",
        currency: "ZAR",
    },
];

const CREATE_MISSING = process.argv.includes("--create-missing");

function getRequiredEnv(name) {
    const value = process.env[name]?.trim();
    if (!value || value === "undefined" || value === "null") {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

async function paystackRequest(path, init = {}) {
    const response = await fetch(`https://api.paystack.co${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${getRequiredEnv("PAYSTACK_SECRET_KEY")}`,
            "Content-Type": "application/json",
            ...(init.headers || {}),
        },
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.status === false) {
        const message = payload?.message || `Paystack request failed with HTTP ${response.status}`;
        const error = new Error(message);
        error.payload = payload;
        throw error;
    }

    return payload;
}

async function fetchPlan(planCode) {
    return paystackRequest(`/plan/${encodeURIComponent(planCode)}`, { method: "GET" });
}

async function createPlan(plan) {
    const payload = await paystackRequest("/plan", {
        method: "POST",
        body: JSON.stringify({
            name: plan.envVarName,
            amount: plan.amountCents,
            interval: plan.interval,
            currency: plan.currency,
        }),
    });

    return payload?.data?.plan_code || null;
}

function validatePlanShape(plan, remote) {
    const issues = [];
    const remoteAmount = Number(remote?.amount);
    const remoteInterval = String(remote?.interval || "").trim().toLowerCase();
    const remoteCurrency = String(remote?.currency || "").trim().toUpperCase();

    if (!Number.isFinite(remoteAmount) || remoteAmount !== plan.amountCents) {
        issues.push(`expected amount ${plan.amountCents}, received ${remote?.amount ?? "unknown"}`);
    }
    if (remoteInterval !== plan.interval) {
        issues.push(`expected interval ${plan.interval}, received ${remote?.interval ?? "unknown"}`);
    }
    if (remoteCurrency !== plan.currency) {
        issues.push(`expected currency ${plan.currency}, received ${remote?.currency ?? "unknown"}`);
    }

    return issues;
}

async function main() {
    const envAssignments = [];
    let hasErrors = false;

    for (const plan of BILLING_PLANS) {
        const configuredCode = process.env[plan.envVarName]?.trim() || null;

        if (!configuredCode) {
            if (!CREATE_MISSING) {
                hasErrors = true;
                console.error(`[missing] ${plan.envVarName} is not set.`);
                continue;
            }

            const createdPlanCode = await createPlan(plan);
            if (!createdPlanCode) {
                hasErrors = true;
                console.error(`[create-failed] ${plan.envVarName} could not be created.`);
                continue;
            }

            envAssignments.push(`${plan.envVarName}=${createdPlanCode}`);
            console.log(`[created] ${plan.envVarName} -> ${createdPlanCode}`);
            continue;
        }

        try {
            const response = await fetchPlan(configuredCode);
            const issues = validatePlanShape(plan, response?.data);
            if (issues.length > 0) {
                hasErrors = true;
                console.error(`[mismatch] ${plan.envVarName} (${configuredCode}) ${issues.join("; ")}`);
            } else {
                console.log(`[ok] ${plan.envVarName} -> ${configuredCode}`);
            }
        } catch (error) {
            if (!CREATE_MISSING) {
                hasErrors = true;
                console.error(`[lookup-failed] ${plan.envVarName} (${configuredCode}) ${error instanceof Error ? error.message : "Unknown error"}`);
                continue;
            }

            const createdPlanCode = await createPlan(plan);
            if (!createdPlanCode) {
                hasErrors = true;
                console.error(`[create-failed] ${plan.envVarName} (${configuredCode}) could not be recreated.`);
                continue;
            }

            envAssignments.push(`${plan.envVarName}=${createdPlanCode}`);
            console.log(`[recreated] ${plan.envVarName} -> ${createdPlanCode}`);
        }
    }

    if (envAssignments.length > 0) {
        console.log("\nPersist these Railway variables:");
        for (const assignment of envAssignments) {
            console.log(assignment);
        }
    }

    if (hasErrors) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
