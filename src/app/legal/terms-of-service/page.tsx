// Redirect /legal/terms-of-service → /legal/terms
import { redirect } from 'next/navigation';
export default function TermsOfServiceRedirect() {
    redirect('/legal/terms');
}
