import { Suspense } from "react";
import { NewContractPageClient } from "./new-contract-page-client";

export default function NewContractPage() {
    return (
        <Suspense fallback={null}>
            <NewContractPageClient />
        </Suspense>
    );
}
