import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export function ComplianceDisclaimer() {
    return (
        <Alert variant="default">
            <AlertTitle>Not legal advice</AlertTitle>
            <AlertDescription>
                LekkerLedger provides administrative tools and general guidance for household
                record-keeping. This is not legal or tax advice. Verify requirements against
                official Department of Employment and Labour, uFiling, or SARS sources for
                your specific situation.
            </AlertDescription>
        </Alert>
    );
}
