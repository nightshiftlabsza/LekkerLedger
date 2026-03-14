export const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LekkerLedger",
    url: "https://www.lekkerledger.co.za",
    logo: "https://www.lekkerledger.co.za/icon.png",
    description: "South African household employment administration software. Manage payslips, UIF, and employment records.",
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
    description: "Payslip generator, UIF calculator, and employment record management for South African household employers."
};

export function JsonLd({ schema }: { readonly schema: Record<string, unknown> }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
