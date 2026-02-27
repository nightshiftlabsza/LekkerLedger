"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getEmployees, savePayslip } from "@/lib/storage";
import { Employee, PayslipInput } from "@/lib/schema";
import { calculatePayslip, NMW_RATE } from "@/lib/calculator";

const STEPS = [
  { label: "Hours", description: "Ordinary & overtime" },
  { label: "Sundays & Holidays", description: "Special rates" },
  { label: "Deductions", description: "Accommodations" },
  { label: "Review", description: "Final confirmation" },
];

function WizardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const empId = searchParams?.get("empId");

  const [employee, setEmployee] = React.useState<Employee | null>(null);
  const [loadingInitial, setLoadingInitial] = React.useState(true);

  const [currentStep, setCurrentStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  // Form State
  const [hours, setHours] = React.useState({
    ordinary: "0",
    overtime: "0",
    sunday: "0",
    holiday: "0",
  });
  const [dates, setDates] = React.useState({ start: "", end: "" });
  const [periodError, setPeriodError] = React.useState("");
  const [includeAccommodation, setIncludeAccommodation] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      if (!empId) {
        router.push("/employees");
        return;
      }
      const employees = await getEmployees();
      const emp = employees.find((e) => e.id === empId);
      if (emp) {
        setEmployee(emp);
      } else {
        router.push("/employees");
      }
      setLoadingInitial(false);

      // Auto-set dates to current month roughly
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];
      setDates({ start: firstDay, end: lastDay });
    }
    load();
  }, [empId, router]);

  const handleNext = async () => {
    // Basic validation
    if (currentStep === 0) {
      if (!dates.start || !dates.end) {
        setPeriodError("Please select the pay period");
        return;
      }
      setPeriodError("");
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      // Complete wizard - Generate Payslip object
      if (!employee) return;

      setLoading(true);

      const parseDate = (s: string) => {
        const d = new Date(s);
        return isNaN(d.getTime()) ? new Date() : d;
      };

      const payslipInput: PayslipInput = {
        id: crypto.randomUUID(),
        employeeId: employee.id,
        payPeriodStart: parseDate(dates.start),
        payPeriodEnd: parseDate(dates.end),
        ordinaryHours: Number(hours.ordinary) || 0,
        overtimeHours: Number(hours.overtime) || 0,
        sundayHours: Number(hours.sunday) || 0,
        publicHolidayHours: Number(hours.holiday) || 0,
        hourlyRate: employee.hourlyRate,
        includeAccommodation,
        otherDeductions: 0,
        createdAt: new Date(),
      };

      try {
        await savePayslip(payslipInput);
        // Go to preview
        router.push(`/preview?payslipId=${payslipInput.id}`);
      } catch (err) {
        console.error("Failed to save payslip", err);
        setLoading(false);
      }
    }
  };

  const safeDate = (s: string) => {
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  // Safe getter for calculations
  const breakdown = employee
    ? calculatePayslip({
        id: "preview",
        employeeId: employee.id,
        payPeriodStart: safeDate(dates.start),
        payPeriodEnd: safeDate(dates.end),
        ordinaryHours: Number(hours.ordinary) || 0,
        overtimeHours: Number(hours.overtime) || 0,
        sundayHours: Number(hours.sunday) || 0,
        publicHolidayHours: Number(hours.holiday) || 0,
        hourlyRate: employee.hourlyRate,
        includeAccommodation: includeAccommodation,
        otherDeductions: 0,
        createdAt: new Date(),
      })
    : null;

  if (loadingInitial) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between">
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
            <h1 className="font-semibold text-slate-900 tracking-tight text-lg">
              Payslip: {employee.name}
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Step {currentStep + 1} of {STEPS.length}
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-4 sm:p-8 space-y-6">
        {employee.hourlyRate === NMW_RATE && (
          <Alert variant="warning" className="bg-amber-50/80 my-2">
            <AlertDescription className="text-amber-800 text-sm">
              This payslip will be calculated using the strict National Minimum
              Wage (R{NMW_RATE}/hr).
            </AlertDescription>
          </Alert>
        )}

        {/* Stepper progress hidden on very small screens to save space */}
        <div className="hidden sm:block px-4 py-6 bg-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100">
          <Stepper steps={STEPS} currentStep={currentStep} />
        </div>

        <Card
          className="border sm:border-slate-200 shadow-sm sm:shadow-md animate-in slide-in-from-right-8 duration-300 bg-white"
          key={currentStep}
        >
          <CardHeader className="border-b border-slate-50 bg-slate-50/50 sm:bg-white rounded-t-xl pb-6">
            <CardTitle className="text-xl">
              {STEPS[currentStep].label}
            </CardTitle>
            <CardDescription className="text-base">
              {STEPS[currentStep].description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* STEP 0: HOURS & PERIOD */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start">Period Start</Label>
                    <Input
                      id="start"
                      type="date"
                      value={dates.start}
                      onChange={(e) =>
                        setDates({ ...dates, start: e.target.value })
                      }
                      error={periodError}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end">Period End</Label>
                    <Input
                      id="end"
                      type="date"
                      value={dates.end}
                      onChange={(e) =>
                        setDates({ ...dates, end: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="space-y-2">
                    <Label htmlFor="ordinary">Ordinary Hours Worked</Label>
                    <Input
                      id="ordinary"
                      type="number"
                      min="0"
                      placeholder="e.g. 160"
                      value={hours.ordinary}
                      onChange={(e) =>
                        setHours({ ...hours, ordinary: e.target.value })
                      }
                    />
                    <p className="text-xs text-slate-500">
                      Normal working hours. E.g., 40 hours/week = 160
                      hours/month.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overtime">Overtime Hours (1.5x Rate)</Label>
                    <Input
                      id="overtime"
                      type="number"
                      min="0"
                      value={hours.overtime}
                      onChange={(e) =>
                        setHours({ ...hours, overtime: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: SUNDAYS & HOLIDAYS */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <Alert variant="default" className="mb-4">
                  <AlertDescription>
                    Sundays and Public Holidays must mathematically be paid at
                    double (2.0x) the ordinary NMW hourly rate.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="sunday">Sunday Hours (2.0x Rate)</Label>
                  <Input
                    id="sunday"
                    type="number"
                    min="0"
                    value={hours.sunday}
                    onChange={(e) =>
                      setHours({ ...hours, sunday: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="holiday">
                    Public Holiday Hours (2.0x Rate)
                  </Label>
                  <Input
                    id="holiday"
                    type="number"
                    min="0"
                    value={hours.holiday}
                    onChange={(e) =>
                      setHours({ ...hours, holiday: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {/* STEP 2: DEDUCTIONS */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <Alert variant="default" className="bg-slate-50 text-slate-700">
                  <AlertDescription>
                    <strong>UIF is automatically calculated</strong> (1%
                    employee, 1% employer) if the worker worked more than 24
                    hours.
                    {Number(hours.ordinary) +
                      Number(hours.overtime) +
                      Number(hours.sunday) +
                      Number(hours.holiday) >
                    24
                      ? " (Currently: Active)"
                      : " (Currently: Inactive, 24 hours or less)"}
                  </AlertDescription>
                </Alert>

                <div className="flex items-start space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    id="accommodation"
                    checked={includeAccommodation}
                    onChange={(e) => setIncludeAccommodation(e.target.checked)}
                    className="mt-1 h-5 w-5 text-blue-600 rounded border-slate-300"
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="accommodation"
                      className="text-base cursor-pointer"
                    >
                      Include Accommodation Deduction
                    </Label>
                    <p className="text-sm text-slate-500">
                      By law, you can deduct a maximum of 10% from the gross
                      wage for accommodation provided.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW */}
            {currentStep === 3 && breakdown && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-widest text-xs flex justify-between">
                    <span>Payslip Summary</span>
                    <span>R{employee.hourlyRate}/hr</span>
                  </div>

                  <div className="p-4 sm:p-6 space-y-4 text-sm">
                    {/* Earnings */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-900 border-b pb-1">
                        Earnings
                      </h4>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Ordinary ({Number(hours.ordinary)}h)</span>
                        <span>R {breakdown.ordinaryPay.toFixed(2)}</span>
                      </div>
                      {Number(hours.overtime) > 0 && (
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Overtime ({Number(hours.overtime)}h)</span>
                          <span>R {breakdown.overtimePay.toFixed(2)}</span>
                        </div>
                      )}
                      {Number(hours.sunday) > 0 && (
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Sunday ({Number(hours.sunday)}h)</span>
                          <span>R {breakdown.sundayPay.toFixed(2)}</span>
                        </div>
                      )}
                      {Number(hours.holiday) > 0 && (
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Public Holiday ({Number(hours.holiday)}h)</span>
                          <span>R {breakdown.publicHolidayPay.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center font-medium text-slate-900 pt-1">
                        <span>Gross Pay</span>
                        <span>R {breakdown.grossPay.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                      <h4 className="font-semibold text-slate-900 border-b pb-1">
                        Deductions
                      </h4>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>
                          UIF ({breakdown.totalHours > 24 ? "1%" : "N/A"})
                        </span>
                        <span className="text-red-500">
                          -R {breakdown.deductions.uifEmployee.toFixed(2)}
                        </span>
                      </div>
                      {includeAccommodation && (
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Accommodation (10%)</span>
                          <span className="text-red-500">
                            -R {breakdown.deductions.accommodation?.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center font-medium text-slate-900 pt-1">
                        <span>Total Deductions</span>
                        <span>R {breakdown.deductions.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Final Net */}
                  <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
                    <span className="font-semibold text-lg">Net Pay</span>
                    <span className="font-extrabold text-2xl tracking-tight">
                      R {breakdown.netPay.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t border-slate-100 p-4 sm:p-6 bg-slate-50/50 sm:rounded-b-xl gap-2">
            <Button
              size="lg"
              variant="outline"
              className="bg-white font-semibold"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0 || loading}
            >
              Back
            </Button>
            <Button
              size="lg"
              onClick={handleNext}
              disabled={loading}
              className="min-w-[140px] font-semibold tracking-wide bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Finalizing
                </>
              ) : currentStep === STEPS.length - 1 ? (
                "Save & Preview"
              ) : (
                <>
                  Next Step <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}

export default function WizardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
        </div>
      }
    >
      <WizardPageContent />
    </React.Suspense>
  );
}
