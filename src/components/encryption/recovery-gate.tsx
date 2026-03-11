"use client";

import * as React from "react";
import { useAppMode } from "@/lib/app-mode";
import { RecoveryKeySetup } from "./recovery-key-setup";
import { RecoveryKeyInput } from "./recovery-key-input";
import { createClient } from "@/lib/supabase/client";
import { generateValidationPayload, verifyValidationPayload, type EncryptedPayload } from "@/lib/crypto";
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
                 const isValid = await verifyValidationPayload(profile.validation_payload as unknown as EncryptedPayload, cryptoKey);
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
        <div className="fixed inset-0 z-50 bg-[var(--bg)] flex items-center justify-center p-4 sm:p-8 animate-fade-in overflow-y-auto selection:bg-[var(--primary)]/20">
            <div className="w-full max-w-lg lg:max-w-4xl mx-auto">
                <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
                    {/* Main Action Area */}
                    <div className="lg:col-span-7">
                        {status === 'checking' && (
                            <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-3xl p-12 text-center shadow-[var(--shadow-lg)]">
                                <Loader2 className="w-12 h-12 animate-spin mb-6 text-[var(--primary)] mx-auto" />
                                <h2 className="font-serif text-2xl font-bold text-[var(--text)] mb-2">Verifying Vault</h2>
                                <p className="text-[var(--text-muted)] animate-pulse">Establishing secure connection...</p>
                            </div>
                        )}
                        
                        {status === 'needs_setup' && (
                            <RecoveryKeySetup onComplete={handleSetupComplete} />
                        )}

                        {status === 'needs_input' && (
                            <RecoveryKeyInput onComplete={handleInputComplete} />
                        )}
                    </div>

                    {/* Context/Help Area (Visible from LG up) */}
                    <div className="hidden lg:block lg:col-span-5 space-y-8 animate-slide-right delay-200">
                        <div className="p-8 bg-[var(--surface-raised)]/50 border-l-4 border-[var(--focus)] rounded-r-3xl shadow-sm">
                            <h3 className="font-serif text-xl font-bold text-[var(--text)] mb-4">Why is this locked?</h3>
                            <div className="space-y-4 text-sm text-[var(--text-muted)] leading-relaxed">
                                <p>
                                    LekkerLedger uses <strong>Zero-Knowledge Encryption</strong>. This means your data is "scrambled" with your recovery key before it ever leaves your device.
                                </p>
                                <p>
                                    Even if our servers were compromised, your payroll records would be unreadable to anyone without your key. Not even our team can see your data.
                                </p>
                                <p>
                                    You only need to enter this key once per device to "unlock" the cloud sync.
                                </p>
                            </div>
                        </div>

                        <div className="p-8 space-y-4">
                            <div className="flex items-center gap-3 text-[var(--primary)] font-bold uppercase tracking-widest text-[10px]">
                                <span className="w-8 h-px bg-[var(--primary)]/30" />
                                Security Standards
                            </div>
                            <ul className="space-y-4 text-xs">
                                <li className="flex gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[var(--success-soft)] text-[var(--success)] flex items-center justify-center flex-shrink-0">✓</div>
                                    <span className="text-[var(--text-muted)]">AES-256-GCM Military Grade Encryption</span>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[var(--success-soft)] text-[var(--success)] flex items-center justify-center flex-shrink-0">✓</div>
                                    <span className="text-[var(--text-muted)]">PBKDF2 Key Derivation</span>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[var(--success-soft)] text-[var(--success)] flex items-center justify-center flex-shrink-0">✓</div>
                                    <span className="text-[var(--text-muted)]">South African POPIA Compliant Architecture</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
