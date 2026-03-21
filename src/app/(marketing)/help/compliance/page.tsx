import { permanentRedirect } from "next/navigation";

export default function ComplianceHelpRedirectPage() {
    permanentRedirect("/resources/checklists");
}
