"use client";

import * as React from "react";
import { Loader2, CheckCircle2, AlertCircle, CloudUpload } from "lucide-react";
import { syncEngine, SyncProgressData } from "@/lib/sync-engine";

interface SyncProgressProps {
    onComplete?: () => void;
}

export function SyncProgress({ onComplete }: SyncProgressProps) {
    const [progressData, setProgressData] = React.useState<SyncProgressData>({
        status: 'idle',
        currentTask: 'Waiting to start...',
        progress: 0
    });

    React.useEffect(() => {
        syncEngine.onProgressUpdate((data) => {
            setProgressData(data);
            if (data.status === 'completed' && onComplete) {
                // Give it a second so the user sees 100%
                setTimeout(onComplete, 1000);
            }
        });
    }, [onComplete]);

    const handleStart = async () => {
        try {
            await syncEngine.runMigration();
        } catch {
           // Error is handled in the callback
        }
    };

    if (progressData.status === 'idle') {
        return (
            <div className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-lg)] text-center animate-fade-in">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 text-blue-600 mb-6 shadow-sm border border-blue-100">
                    <CloudUpload className="w-7 h-7" strokeWidth={2.5} />
                </div>
                <h2 className="font-serif text-2xl font-bold text-[var(--text)] mb-3 tracking-tight">Sync Your Data</h2>
                <p className="text-[var(--text-muted)] text-[0.95rem] leading-relaxed max-w-[320px] mx-auto mb-8">
                    We will now encrypt all your local offline data and upload it securely to your premium cloud account.
                </p>
                <button
                    onClick={handleStart}
                    className="w-full flex justify-center items-center py-3.5 px-4 bg-[var(--primary)] text-white font-bold rounded-xl active-scale transition-all hover:bg-[#006640] shadow-[0_2px_10px_rgba(0,122,77,0.15)]"
                >
                    Start Sync
                </button>
            </div>
        );
    }

    const { status, progress, currentTask, error } = progressData;

    return (
        <div className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-lg)] animate-fade-in">
            <div className="flex flex-col items-center text-center">
                
                {status === 'running' && (
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 text-blue-600 mb-6 shadow-sm border border-blue-100 animate-pulse">
                        <Loader2 className="w-7 h-7 animate-spin" strokeWidth={2.5} />
                    </div>
                )}
                
                {status === 'completed' && (
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 text-green-600 mb-6 shadow-sm border border-green-100">
                        <CheckCircle2 className="w-7 h-7" strokeWidth={2.5} />
                    </div>
                )}

                {status === 'error' && (
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 text-red-600 mb-6 shadow-sm border border-red-100">
                        <AlertCircle className="w-7 h-7" strokeWidth={2.5} />
                    </div>
                )}

                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--text)] mb-2 tracking-tight">
                    {status === 'running' ? 'Migrating Data...' :
                     status === 'completed' ? 'Migration Complete!' : 
                     'Sync Failed'}
                </h2>
                
                <p className={`text-[0.95rem] mb-8 font-medium ${status === 'error' ? 'text-red-600 max-w-[320px]' : 'text-[var(--text-muted)]'}`}>
                    {status === 'error' ? error : currentTask}
                </p>

                <div className="w-full max-w-sm mx-auto">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Progress</span>
                        <span className="text-sm font-bold text-[var(--text)]">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-3 bg-[var(--border)] rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ease-out origin-left ${
                                status === 'error' ? 'bg-red-500' : 
                                status === 'completed' ? 'bg-green-500' : 
                                'bg-[var(--primary)]'
                            }`}
                            style={{ 
                                width: `${progress}%`,
                            }}
                        />
                    </div>
                </div>

                {status === 'error' && (
                    <button
                        onClick={handleStart}
                        className="mt-8 px-6 py-2.5 bg-red-50 text-red-700 font-bold rounded-xl active-scale transition-all hover:bg-red-100 shadow-sm border border-red-200"
                    >
                        Try Again
                    </button>
                )}
            </div>
        </div>
    );
}
