"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Download, FileCheck2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getEmployees, getPayslipsForEmployee } from "@/lib/storage";
import { calculatePayslip } from "@/lib/calculator";
import { Employee, PayslipInput } from "@/lib/schema";
import { format } from "date-fns";
import { generatePayslipPdfBytes } from "@/lib/pdf";

function PreviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const payslipId = searchParams?.get("payslipId");

  const [employee, setEmployee] = React.useState<Employee | null>(null);
  const [payslip, setPayslip] = React.useState<PayslipInput | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [downloading, setDownloading] = React.useState(false);

  React.useEffect(() => {
    async function init() {
      if (!payslipId) {
        router.push("/employees");
        return;
      }

      const employees = await getEmployees();
      let foundEmp: Employee | null = null;
      let foundPayslip: PayslipInput | null = null;

      // Inefficient lookup, but fine for localForage given small counts
      for (const emp of employees) {
        const slips = await getPayslipsForEmployee(emp.id);
        const matchingSlip = slips.find((s) => s.id === payslipId);
        if (matchingSlip) {
          foundEmp = emp;
          foundPayslip = matchingSlip;
          break;
        }
      }

      if (foundEmp && foundPayslip) {
        setEmployee(foundEmp);
        setPayslip(foundPayslip);
      } else {
        router.push("/employees");
      }
      setLoading(false);
    }
    init();
  }, [payslipId, router]);

  const handleDownload = async () => {
    if (!employee || !payslip) return;
    try {
      setDownloading(true);
      const pdfBytes = await generatePayslipPdfBytes(employee, payslip);

      // Trigger download
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const monthStr = format(payslip.payPeriodStart, "MMM_yyyy");
      link.download = `Payslip_${employee.name.replace(/ /g, "_")}_${monthStr}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setDownloading(false);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF");
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
      </div>
    );
  }

  if (!employee || !payslip) return null;

  const breakdown = calculatePayslip(payslip);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/employees">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-slate-900 rounded-full bg-slate-100 hover:bg-slate-200"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="font-bold text-slate-900 tracking-tight text-lg">
              Payslip Overview
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="gap-2 bg-blue-600 hover:bg-blue-700 shadow shrink-0"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Download PDF</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-8 space-y-6 pb-24">
        <Alert
          variant="success"
          className="bg-green-50/80 border-green-200 backdrop-blur-sm shadow-sm animate-in fade-in slide-in-from-top-4 duration-500"
        >
          <FileCheck2 className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-800 font-medium tracking-wide">
            Payslip calculation complete and securely saved to your device.
          </AlertDescription>
        </Alert>

        <Card className="max-w-2xl mx-auto border sm:border-slate-200 shadow-xl sm:rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 relative bg-white ring-1 ring-slate-900/5">
          {/* Document Header */}
          <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-10 pb-16 sm:pb-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-10 -mt-20"></div>
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-6">
              <div>
                <h2 className="text-4xl font-extrabold tracking-tight drop-shadow-sm">
                  Payslip
                </h2>
                <p className="text-slate-400 mt-1 font-medium tracking-widest text-sm uppercase">
                  Compliant
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-semibold text-white/95 text-xl tracking-tight">
                  {employee.name}
                </p>
                <p className="text-sm text-slate-300 mt-1">
                  {format(payslip.payPeriodStart, "dd MMM")} \u2192{" "}
                  {format(payslip.payPeriodEnd, "dd MMM yyyy")}
                </p>
                {employee.idNumber && (
                  <p className="text-xs text-slate-400 mt-1 font-mono tracking-wider">
                    ID: {employee.idNumber}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Overlapping Key Info Card */}
          <div className="relative z-20 px-4 sm:px-10 -mt-10 mb-8 w-full">
            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left w-full sm:w-auto">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest bg-blue-50 text-blue-700 py-1 px-3 rounded-full inline-block mb-2">
                  Net Pay Calculation
                </p>
                <h3 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight flex items-start justify-center sm:justify-start">
                  <span className="text-2xl font-bold mr-1 text-slate-400 align-top mt-1">
                    R
                  </span>
                  {breakdown.netPay.toFixed(2)}
                </h3>
              </div>
            </div>
          </div>

          <CardContent className="p-6 sm:p-10 space-y-8 bg-white pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {/* Earnings Table */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                  Earnings
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Ordinary Pay</span>
                    <span className="font-medium text-slate-900 border-b border-transparent transition-all tabular-nums">
                      R {breakdown.ordinaryPay.toFixed(2)}
                    </span>
                  </div>
                  {breakdown.overtimePay > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Overtime Pay</span>
                      <span className="font-medium text-slate-900 tabular-nums">
                        R {breakdown.overtimePay.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {breakdown.sundayPay > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Sunday Pay</span>
                      <span className="font-medium text-slate-900 tabular-nums">
                        R {breakdown.sundayPay.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {breakdown.publicHolidayPay > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Holiday Pay</span>
                      <span className="font-medium text-slate-900 tabular-nums">
                        R {breakdown.publicHolidayPay.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-2 font-semibold">
                    <span className="text-slate-900">Gross Total</span>
                    <span className="text-slate-900 tabular-nums">
                      R {breakdown.grossPay.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions Table */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                  Deductions
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">UIF (Employee 1%)</span>
                    <span className="font-medium text-red-500 tabular-nums">
                      -R {breakdown.deductions.uifEmployee.toFixed(2)}
                    </span>
                  </div>
                  {breakdown.deductions.accommodation &&
                    breakdown.deductions.accommodation > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Accommodation</span>
                        <span className="font-medium text-red-500 tabular-nums">
                          -R {breakdown.deductions.accommodation.toFixed(2)}
                        </span>
                      </div>
                    )}
                  <div className="flex justify-between text-sm pt-2 font-semibold">
                    <span className="text-slate-900">Deductions Total</span>
                    <span className="text-slate-900 tabular-nums">
                      R {breakdown.deductions.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer summary */}
            <div className="bg-slate-50/80 rounded-xl p-6 flex flex-col items-center sm:items-start border border-slate-100 font-medium text-xs text-slate-500 mt-8 text-center sm:text-left shadow-sm">
              <p className="tracking-wide">
                This document is legally compliant and calculated accurately
                according to the{" "}
                <strong>
                  South African Basic Conditions of Employment Act
                </strong>{" "}
                and <strong>Sectoral Determination 7</strong>.
              </p>
              <p className="mt-2 text-slate-400">
                Employer UIF Contribution (1%): R{" "}
                {breakdown.employerContributions.uifEmployer.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
        </div>
      }
    >
      <PreviewPageContent />
    </React.Suspense>
  );
}
