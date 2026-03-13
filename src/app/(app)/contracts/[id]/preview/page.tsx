"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEmployee, getSettings, getContracts, updateContractStatus } from "@/lib/storage";
import { generateEmploymentContract } from "@/lib/contracts/pdfGenerator";
import type { Contract, Employee, EmployerSettings } from "@/lib/schema";
import { ContractPdfPreview } from "@/components/contracts/ContractPdfPreview";

export default function ContractPreviewPage() {
    const params = useParams();
    const router = useRouter();
    const [url, setUrl] = React.useState<string | null>(null);
    const [fileName, setFileName] = React.useState<string>("contract.pdf");
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [contract, setContract] = React.useState<Contract | null>(null);
    const [employee, setEmployee] = React.useState<Employee | null>(null);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);

    React.useEffect(() => {
        let active = true;

        async function load() {
            setLoading(true);
            try {
                const id = Array.isArray(params.id) ? params.id[0] : params.id;
                const contracts = await getContracts();
                const contractData = contracts.find((c) => c.id === id);
                if (!contractData) {
                    router.push("/documents");
                    return;
                }

                const employee = await getEmployee(contractData.employeeId);
                const settings = await getSettings();

                if (!employee || !settings) {
                    router.push("/documents");
                    return;
                }

                setContract(contractData);
                setEmployee(employee);
                setSettings(settings);

                const nameStr = employee.name.replaceAll(/\s+/g, "_");
                const fName = `Contract_${nameStr}_v${contractData.version}.pdf`;
                setFileName(fName);

                const pdfBytes = await generateEmploymentContract(contractData, employee, settings);
                const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });

                if (!active) return;

                setUrl(URL.createObjectURL(blob));
            } catch (error) {
                console.error(error);
                setError("Could not prepare draft. Please go back and try again.");
            } finally {
                if (active) setLoading(false);
            }
        }

        void load();

        return () => {
            active = false;
        };
    }, [params.id, router]);

    const handleDownload = async () => {
        if (!url || !contract) return;
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        if (contract.status === "draft") {
            await updateContractStatus(contract.id, "awaiting_signed_copy");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--primary)]" />
                <p className="text-sm font-semibold text-[var(--text-muted)]">Generating preview...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: "var(--danger-soft)" }}>
                    <span className="font-bold text-[var(--danger)]">!</span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-[var(--text)]">Generation failed</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">{error}</p>
                </div>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Go back
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] -m-4 sm:-m-6 md:-m-8 bg-[var(--surface-2)]">
            <div className="flex-none flex items-center justify-between p-4 bg-[var(--surface-1)] border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 px-2 gap-1 text-[var(--text-muted)]">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <h1 className="text-sm font-bold text-[var(--text)]">{fileName}</h1>
                </div>
                <div className="flex items-center gap-2">
                    {url && (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="h-8 min-w-[32px] px-2 sm:px-3 gap-2 border-[var(--border)]">
                                <ExternalLink className="h-3 w-3" />
                                <span className="hidden sm:inline text-xs font-semibold">Open in new tab</span>
                            </Button>
                        </a>
                    )}
                    <Button size="sm" onClick={() => void handleDownload()} className="h-8 min-w-[32px] px-2 sm:px-3 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] gap-2 border-0">
                        <Download className="h-3 w-3" />
                        <span className="hidden sm:inline text-xs font-semibold">Download PDF</span>
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto relative bg-[var(--surface-2)]">
                {contract && employee && settings ? (
                    <div className="py-8">
                        <ContractPdfPreview contract={contract} employee={employee} settings={settings} />
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)] text-sm">
                        Preview not available
                    </div>
                )}
            </div>
        </div>
    );
}
