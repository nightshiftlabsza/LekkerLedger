"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Download, Eye, FolderOpen, FileSpreadsheet, Cloud, HardDrive, Database, Search, History } from "lucide-react";
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

            <div className="ultrawide-grid">
                <div className="ultrawide-main space-y-6">
                    {/* Tab bar - Horizontal on Mobile/Standard, becomes less prominent in 2-pane if we want, but keeping it inside main for now */}
                    <div className="flex items-center gap-1 border-b border-[var(--border-subtle)] -mx-4 px-4 overflow-x-auto no-scrollbar lg:mx-0 lg:px-0">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                type="button"
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

                    {/* Mobile Filters (Hidden on Ultrawide) */}
                    {!loading && documents.length > 0 && (
                        <div className="mt-4 2xl:hidden">
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
                        </div>
                    )}

                    {/* Main Table */}
                    <div className="mt-4">
                        {loading ? (
                            <div className="space-y-3 mt-6">
                                <CardSkeleton />
                                <CardSkeleton />
                            </div>
                        ) : documents.length === 0 && !search && !empFilter ? (
                            <div className="mt-8">
                                <EmptyState
                                    title="No documents found"
                                    description="Payslips, contracts, and exports will appear here automatically once generated."
                                    icon={FolderOpen}
                                    actionLabel="Go to Dashboard"
                                    actionHref="/dashboard"
                                />
                            </div>
                        ) : (
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
                                                    <div className="flex flex-col">
                                                        <span className="type-body-bold text-[var(--text-primary)] leading-none mb-1">{doc.fileName}</span>
                                                        <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">{doc.type}</span>
                                                    </div>
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
                                            return <span className="type-body text-[var(--text-primary)] font-medium">{emp?.name ?? "Unknown"}</span>;
                                        },
                                    },
                                    {
                                        key: "storage",
                                        label: "Storage",
                                        render: (doc) => (
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] w-fit">
                                                {doc.driveFileId ? (
                                                    <>
                                                        <Cloud className="h-3 w-3 text-blue-500" />
                                                        <span className="text-[10px] font-black uppercase text-blue-600">Synced</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <HardDrive className="h-3 w-3 text-[var(--text-muted)]" />
                                                        <span className="text-[10px] font-black uppercase text-[var(--text-muted)]">Local</span>
                                                    </>
                                                )}
                                            </div>
                                        )
                                    },
                                    {
                                        key: "date",
                                        label: "Timestamp",
                                        render: (doc) => (
                                            <div className="flex flex-col">
                                                <span className="type-body text-[var(--text-primary)] font-medium">{format(new Date(doc.createdAt), "d MMM yyyy")}</span>
                                                <span className="text-[10px] text-[var(--text-muted)] font-mono">{format(new Date(doc.createdAt), "HH:mm")}</span>
                                            </div>
                                        ),
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
                                                    className="h-9 w-9 p-0 hover:bg-[var(--amber-500)]/10 group"
                                                    title="View Document"
                                                    onClick={() => handlePreview(doc)}
                                                >
                                                    <Eye className="h-4 w-4 text-[var(--amber-600)] group-hover:text-[var(--amber-500)]" />
                                                </Button>
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        )}
                    </div>
                </div>

                {/* Ultrawide Sidebar (Search & Advanced Filters) */}
                <aside className="ultrawide-panel hidden 2xl:block">
                    <Card className="glass-panel border-none p-5 sticky top-0">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="type-label uppercase tracking-widest text-[var(--text-muted)]">Search Documents</h3>
                                <FiltersBar
                                    searchPlaceholder="Quick find..."
                                    searchValue={search}
                                    onSearchChange={setSearch}
                                    filters={[]}
                                />
                            </div>

                            <div className="space-y-3">
                                <h3 className="type-label uppercase tracking-widest text-[var(--text-muted)]">Filter by Employee</h3>
                                <div className="flex flex-wrap gap-2">
                                    {employees.map(e => (
                                        <button
                                            key={e.id}
                                            onClick={() => setEmpFilter(prev => prev === e.id ? "" : e.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${empFilter === e.id
                                                ? 'bg-[var(--amber-500)] border-[var(--amber-500)] text-white'
                                                : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--amber-500)]'
                                                }`}
                                        >
                                            {e.name}
                                        </button>
                                    ))}
                                    {employees.length === 0 && <p className="text-[10px] text-[var(--text-muted)]">No employees found.</p>}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[var(--border-subtle)]">
                                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium">
                                    <History className="h-3.5 w-3.5" />
                                    <span>Total matching: {filtered.length}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </aside>
            </div>

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
