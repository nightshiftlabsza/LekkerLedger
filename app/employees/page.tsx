"use client";

import * as React from "react";
import Link from "next/link";
import {
  UserPlus,
  Trash2,
  FileText,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getEmployees, deleteEmployee } from "@/lib/storage";
import { Employee } from "@/lib/schema";

export default function EmployeesPage() {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      const data = await getEmployees();
      setEmployees(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      await deleteEmployee(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Active Team
            </h1>
            <Link href="/employees/new">
              <Button className="gap-2 shadow-sm h-9 md:h-10">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Employee</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : employees.length === 0 ? (
          <Card className="border-dashed border-2 py-12 bg-slate-50/50">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-slate-100 p-4 rounded-full">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-slate-900">
                  No employees yet
                </h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  Add your first employee to start generating their payslips.
                </p>
              </div>
              <Link href="/employees/new">
                <Button variant="outline" className="mt-4 gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Employee
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <Alert
              variant="default"
              className="bg-blue-50/80 border-blue-200 backdrop-blur-sm shadow-sm hidden md:flex"
            >
              <AlertTitle>Payroll Cycle ending soon</AlertTitle>
              <AlertDescription>
                You can draft your payslips now. The calculations ensure
                compliance with the NMW automatically.
              </AlertDescription>
            </Alert>
            <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden text-sm">
              <div className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-4 sm:p-6 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center border border-blue-200 text-blue-700 font-bold uppercase text-lg">
                          {emp.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-base">
                          {emp.name}
                        </h4>
                        <p className="text-slate-500">
                          Rate: R{emp.hourlyRate}/hr
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(emp.id, emp.name)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 hidden sm:flex"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Link href={`/wizard?empId=${emp.id}`}>
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-2 sm:hidden px-3 bg-blue-600"
                        >
                          Payslip <ChevronRight className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          className="hidden sm:flex gap-2 group-hover:border-blue-300 group-hover:bg-blue-50 group-hover:text-blue-700 transition-all font-semibold"
                        >
                          Create Payslip <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
