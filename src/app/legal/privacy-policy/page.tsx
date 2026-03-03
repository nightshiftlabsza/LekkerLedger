// Redirect /legal/privacy-policy → /legal/privacy
import { redirect } from 'next/navigation';
export default function PrivacyPolicyRedirect() {
    redirect('/legal/privacy');
}
