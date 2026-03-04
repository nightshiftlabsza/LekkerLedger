"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Download, Eye, FolderOpen, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FiltersBar, type FilterChip } from "@/components/ui/filters-bar";
import { DocumentPreview } from "@/components/ui/document-preview";
import { getDocuments, getEmployees, getPayslipsForEmployee, getSettings } from "@/lib/storage";
import { DocumentMeta, Employee, PayslipInput } from "@/lib/schema";
import { generatePayslipPdfBytes } from "@/lib/pdf";

const TABS = ["Payslips", "Contracts", "Exports", "Archive"] as const;
type Tab = typeof TABS[number];
const TAB_TYPE_MAP: Record<Tab, DocumentMeta["type"]> = {
    Payslips: "payslip",
    Contracts: "contract",
    Exports: "export",
    Archive: "archive",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
    payslip: FileText,
    contract: FileText,
    export: FileSpreadsheet,
    archive: FolderOpen,
};

export default function DocumentsPage() {
    const [activeTab, setActiveTab] = React.useState<Tab>("Payslips");
    const [loading, setLoading] = React.useState(true);
    const [documents, setDocuments] = React.useState<DocumentMeta[]>([]);
    const [employees, setEmployees] = React.useState<Employee[]>([]);

    const [search, setSearch] = React.useState("");
    const [empFilter, setEmpFilter] = React.useState<string>("");

    // Preview state
    const [previewDoc, setPreviewDoc] = React.useState<DocumentMeta | null>(null);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [isGenerating, setIsGenerating] = React.useState(false);

    React.useEffect(() => {
        async function load() {
            setLoading(true);
            const [docs, emps] = await Promise.all([getDocuments(), getEmployees()]);
            setDocuments(docs);
            setEmployees(emps);
            setLoading(false);
        }
        load();
    }, []);

    const filtered = React.useMemo(() => {
        return documents.filter(doc => {
            if (doc.type !== TAB_TYPE_MAP[activeTab]) return false;
            if (empFilter && doc.employeeId !== empFilter) return false;

            if (search) {
                const searchLower = search.toLowerCase();
                const empName = employees.find(e => e.id === doc.employeeId)?.name.toLowerCase() ?? "";
                if (!doc.fileName.toLowerCase().includes(searchLower) && !empName.includes(searchLower)) {
                    return false;
                }
            }
            return true;
        });
    }, [documents, activeTab, empFilter, search, employees]);

    const filters: FilterChip[] = employees.map(e => ({
        key: e.id,
        label: e.name,
        active: empFilter === e.id
    }));

    const handlePreview = async (doc: DocumentMeta) => {
        setPreviewDoc(doc);
        if (doc.type === "payslip" && doc.employeeId) {
            setIsGenerating(true);
            try {
                const [payslips, settings] = await Promise.all([
                    getPayslipsForEmployee(doc.employeeId),
                    getSettings()
                ]);
                const employee = employees.find(e => e.id === doc.employeeId);
                // The doc.id might match the payslip id
                const payslip = payslips.find(p => p.id === doc.id);

                if (payslip && employee && settings) {
                    const pdfBytes = await generatePayslipPdfBytes(employee, payslip, settings);
                    const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
                    setPreviewUrl(URL.createObjectURL(blob));
                }
            } catch (err) {
                console.error("Failed to generate preview", err);
            } finally {
                setIsGenerating(false);
            }
        }
    };

    const handleClosePreview = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewDoc(null);
        setPreviewUrl(null);
    };

    return (
        <>
            <PageHeader title="Documents" subtitle="Payslips, contracts, exports, and archives" />

            {/* Tab bar */}
            <div className="flex items-center gap-1 border-b border-[var(--border-subtle)] -mx-4 px-4 overflow-x-auto no-scrollbar">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-3 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === tab
                            ? "border-[var(--amber-500)] text-[var(--amber-500)]"
                            : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-3 mt-6">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            ) : (
                <div className="mt-4">
                    {(filtered.length > 0 || search || empFilter) && (
                        <div className="mb-4">
                            <FiltersBar
                                searchPlaceholder={`Search ${activeTab.toLowerCase()}...`}
                                searchValue={search}
                                onSearchChange={setSearch}
                                filters={filters}
                                onFilterToggle={(key) => setEmpFilter(prev => prev === key ? "" : key)}
                            />
                        </div>
                    )}

                    <DataTable<DocumentMeta>
                        data={filtered}
                        keyField={(doc) => doc.id}
                        emptyMessage={
                            search || empFilter
                                ? `No ${activeTab.toLowerCase()} match your filters.`
                                : `No ${activeTab.toLowerCase()} yet.`
                        }
                        columns={[
                            {
                                key: "fileName",
                                label: "File Name",
                                render: (doc) => {
                                    const Icon = TYPE_ICONS[doc.type] ?? FileText;
                                    return (
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-center shrink-0">
                                                <Icon className="h-4 w-4 text-[var(--amber-500)]" />
                                            </div>
                                            <span className="type-body-bold text-[var(--text-primary)]">{doc.fileName}</span>
                                        </div>
                                    );
                                },
                            },
                            {
                                key: "employee",
                                label: "Employee",
                                render: (doc) => {
                                    if (!doc.employeeId) return <span className="text-[var(--text-muted)]">-</span>;
                                    const emp = employees.find(e => e.id === doc.employeeId);
                                    return <span className="type-body text-[var(--text-primary)]">{emp?.name ?? "Unknown"}</span>;
                                },
                            },
                            {
                                key: "date",
                                label: "Date Created",
                                render: (doc) => <span className="type-body text-[var(--text-primary)]">{format(new Date(doc.createdAt), "d MMM yyyy, HH:mm")}</span>,
                            },
                            {
                                key: "actions",
                                label: "",
                                align: "right",
                                render: (doc) => (
                                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            title="View Document"
                                            onClick={() => handlePreview(doc)}
                                        >
                                            <Eye className="h-4 w-4 text-[var(--amber-600)]" />
                                        </Button>
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>
            )}

            {isGenerating && (
                <div className="fixed flex items-center justify-center p-4 bg-[var(--amber-500)] text-white rounded-full bottom-6 right-6 shadow-2xl z-50 animate-pulse">
                    Generating preview...
                </div>
            )}

            {previewUrl && (
                <DocumentPreview
                    url={previewUrl}
                    fileName={previewDoc?.fileName}
                    onClose={handleClosePreview}
                    onDownload={() => {
                        const a = document.createElement("a");
                        a.href = previewUrl;
                        a.download = previewDoc?.fileName ?? "document.pdf";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }}
                />
            )}
        </>
    );
}
