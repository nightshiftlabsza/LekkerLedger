"use client";

import * as React from "react";
import { Download, Upload, Loader2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { exportData, importData } from "@/lib/storage";

export function BulkActions() {
    const [loading, setLoading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        setLoading(true);
        try {
            const json = await exportData();
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `lekkerledger-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Export failed", e);
            alert("Export failed. Please check the console for details.");
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!confirm("This will REPLACE all current data with the backup. Are you sure?")) {
            event.target.value = "";
            return;
        }

        setLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const content = e.target?.result as string;
                await importData(content);
                alert("Data imported successfully. The page will now reload.");
                window.location.reload();
            };
            reader.readAsText(file);
        } catch (e) {
            console.error("Import failed", e);
            alert("Import failed. Ensure the file is a valid LekkerLedger backup.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="glass-panel border-dashed border-2">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-amber-600" />
                    <CardTitle className="text-sm">Practitioner Data Tools</CardTitle>
                </div>
                <CardDescription className="text-xs">
                    Export your entire workspace for backup or migration to another device.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
                <Button
                    variant="outline"
                    className="flex-1 gap-2 text-xs h-9"
                    onClick={handleExport}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                    Export Workspace (JSON)
                </Button>

                <Button
                    variant="outline"
                    className="flex-1 gap-2 text-xs h-9"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                >
                    <Upload className="h-3 w-3" />
                    Import Workspace
                </Button>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".json"
                    onChange={handleImport}
                />
            </CardContent>
        </Card>
    );
}
