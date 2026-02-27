"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmployeeSchema, Employee } from "@/lib/schema";
import { saveEmployee } from "@/lib/storage";

export default function AddEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    idNumber: "",
    hourlyRate: "30.23",
    role: "Domestic Worker",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Parse to number before validation
    const submissionData = {
      id: crypto.randomUUID(),
      ...formData,
      hourlyRate: parseFloat(formData.hourlyRate),
    };

    const parsed = EmployeeSchema.safeParse(submissionData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await saveEmployee(parsed.data as Employee);
      router.push("/employees");
    } catch (err) {
      console.error(err);
      setErrors({ form: "Failed to save employee. Please try again." });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <Link href="/employees">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-900 rounded-full bg-slate-100 hover:bg-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="font-bold text-slate-900 tracking-tight">
            Add Employee
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-4 sm:p-8">
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="space-y-6">
              {errors.form && (
                <Alert variant="error">
                  <AlertDescription>{errors.form}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Sibusiso Ndlovu"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    error={errors.name}
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idNumber">
                    ID Number / Passport (Optional)
                  </Label>
                  <Input
                    id="idNumber"
                    placeholder="e.g. 9102125021081"
                    value={formData.idNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, idNumber: e.target.value })
                    }
                    error={errors.idNumber}
                    disabled={loading}
                  />
                  <p className="text-xs text-slate-500">
                    Only needed for official records.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    placeholder="e.g. Domestic Worker, Gardener"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    error={errors.role}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">
                    Default Hourly Rate (ZAR) *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-medium">
                      R
                    </span>
                    <Input
                      id="hourlyRate"
                      className="pl-8"
                      type="number"
                      step="0.01"
                      placeholder="30.23"
                      value={formData.hourlyRate}
                      onChange={(e) =>
                        setFormData({ ...formData, hourlyRate: e.target.value })
                      }
                      error={errors.hourlyRate}
                      disabled={loading}
                    />
                  </div>
                  {parseFloat(formData.hourlyRate) < 30.23 && (
                    <Alert variant="error" className="mt-2 py-3 px-3">
                      <AlertDescription className="text-xs">
                        National Minimum Wage is strictly{" "}
                        <strong>R30.23/hr</strong> for Domestic Workers
                        (Sectoral Determination 7).
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6 relative z-0">
                <Button
                  type="submit"
                  className="w-full gap-2 text-md h-12"
                  disabled={loading || parseFloat(formData.hourlyRate) < 30.23}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> Saving
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Employee
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
