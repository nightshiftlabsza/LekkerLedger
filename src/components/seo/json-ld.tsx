export const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LekkerLedger",
    url: "https://lekkerledger.co.za",
    logo: "https://lekkerledger.co.za/icon.png",
    description: "Domestic worker payslips, UIF checks, and household-employer admin tools for South Africa.",
    address: {
        "@type": "PostalAddress",
        addressCountry: "ZA"
    }
};

export const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LekkerLedger",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "ZAR"
    },
    description: "Create domestic worker payslips, estimate UIF deductions, and keep monthly household employer admin organised."
};

export function breadcrumbSchema(crumbs: { name: string; path: string }[]) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            item: `https://lekkerledger.co.za${c.path}`,
        })),
    };
}

export function JsonLd({ schema }: { readonly schema: Record<string, unknown> }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
