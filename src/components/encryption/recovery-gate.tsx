"use client";

import * as React from "react";
import { useAppMode } from "@/lib/app-mode";
import { RecoveryKeySetup } from "./recovery-key-setup";
import { RecoveryKeyInput } from "./recovery-key-input";
import { createClient } from "@/lib/supabase/client";
import { generateValidationPayload, verifyValidationPayload } from "@/lib/crypto";
import { Loader2 } from "lucide-react";

export function RecoveryGate({ children }: { children: React.ReactNode }) {
    const { mode, unlockAccount } = useAppMode();
    const [status, setStatus] = React.useState<'checking' | 'needs_setup' | 'needs_input' | 'ready'>('ready');
    const supabase = createClient();

    React.useEffect(() => {
        if (mode !== "account_locked") {
            setStatus('ready');
            return;
        }

        let mounted = true;

        async function checkState() {
            setStatus('checking');
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !mounted) return;

            // Check if user has already set up a key
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('key_setup_complete, validation_payload')
                .eq('id', user.id)
                .single();
            
            if (!mounted) return;

            // If we don't have a record or boolean is false, they need setup
            if (!profile || !profile.key_setup_complete) {
                setStatus('needs_setup');
            } else {
                setStatus('needs_input');
            }
        }

        checkState();

        return () => { mounted = false; };
    }, [mode, supabase]);

    const handleSetupComplete = async (keyString: string) => {
        setStatus('checking');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // They just generated a key. Let's derive it and save the payload.
            const encoder = new TextEncoder();
            const keyData = encoder.encode(keyString.replace(/-/g, '').toUpperCase());
            const hash = await crypto.subtle.digest('SHA-256', keyData);
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                hash,
                { name: 'AES-GCM' },
                false,
                ['encrypt', 'decrypt']
            );

            const payload = await generateValidationPayload(cryptoKey);

            // Save to profile
             await supabase.from('user_profiles').update({
                key_setup_complete: true,
                validation_payload: payload
            }).eq('id', user.id);

            unlockAccount(cryptoKey, user.id);
        } catch (err) {
            console.error(err);
            setStatus('needs_setup'); // reset
        }
    };

    const handleInputComplete = async (keyString: string, cryptoKey: CryptoKey) => {
        setStatus('checking');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('validation_payload')
                .eq('id', user.id)
                .single();

            if (profile?.validation_payload) {
                 const isValid = await verifyValidationPayload(profile.validation_payload as any, cryptoKey);
                 if (!isValid) {
                     alert("Incorrect Recovery Key. Please try again.");
                     setStatus('needs_input');
                     return;
                 }
            }

            unlockAccount(cryptoKey, user.id);
        } catch (err) {
             console.error(err);
             alert("Error validating key.");
             setStatus('needs_input');
        }
    };

    if (mode === "local_guest" || mode === "account_unlocked" || status === "ready") {
        return <>{children}</>;
    }

    // Modal takeover for locked state
    return (
        <div className="fixed inset-0 z-50 bg-[var(--surface-raised)] flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in overflow-y-auto">
            <div className="w-full max-w-lg mx-auto">
                {status === 'checking' && (
                    <div className="flex flex-col items-center text-[var(--text-muted)] p-12">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-[var(--primary)]" />
                        <p className="font-medium animate-pulse">Verifying secure vault...</p>
                    </div>
                )}
                
                {status === 'needs_setup' && (
                    <RecoveryKeySetup onComplete={handleSetupComplete} />
                )}

                {status === 'needs_input' && (
                    <RecoveryKeyInput onComplete={handleInputComplete} />
                )}
            </div>
        </div>
    );
}
