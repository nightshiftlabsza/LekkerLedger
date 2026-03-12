import "./_group.css";
import {
  ArrowRight, AlertTriangle, FileText, FolderOpen,
  BookOpen, ChevronRight, Banknote, ShieldCheck,
  UserPlus, Settings, Wifi, WifiOff,
} from "lucide-react";

const MOCK = {
  employerName: "Nomsa Dlamini",
  employees: [
    { id: "1", name: "Zanele Khumalo", role: "Domestic Worker" },
    { id: "2", name: "Sipho Nkosi", role: "Garden Worker" },
  ],
  currentPeriod: {
    id: "p-march-2026",
    name: "March 2026",
    status: "open" as const,
    entries: [
      { employeeId: "1", status: "complete" },
      { employeeId: "2", status: "pending" },
    ],
  },
  recentDocs: [
    { id: "d1", fileName: "February 2026 - Zanele Khumalo.pdf", createdAt: "2026-02-28" },
    { id: "d2", fileName: "February 2026 - Sipho Nkosi.pdf", createdAt: "2026-02-28" },
    { id: "d3", fileName: "January 2026 - Zanele Khumalo.pdf", createdAt: "2026-01-31" },
  ],
  plan: "standard" as const,
};

export function Current() {
  const { employees, currentPeriod, recentDocs } = MOCK;
  const employeeCount = employees.length;
  const completedEntries = currentPeriod.entries.filter(e => e.status === "complete").length;
  const totalEntries = currentPeriod.entries.length;
  const progressPercent = (completedEntries / totalEntries) * 100;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)", fontFamily: "var(--font-sans)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-8 space-y-6">
        {/* Page Header */}
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text)" }}>Dashboard</h1>
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Manage your monthly payroll and records.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Primary Task Hero */}
            <div className="relative overflow-hidden rounded-2xl shadow-premium" style={{ background: "var(--surface-raised)" }}>
              <div className="absolute inset-0 opacity-50" style={{ background: "linear-gradient(135deg, rgba(0,122,77,0.05) 0%, transparent 100%)" }} />
              <div className="relative p-6 md:p-8 space-y-4">
                <div className="space-y-2">
                  <p className="type-overline flex items-center gap-2" style={{ color: "var(--primary)" }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--primary)", animation: "pulse 2s infinite" }} />
                    Current Pay Period
                  </p>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1.5" style={{ color: "var(--text)" }}>
                      March 2026 in progress
                    </h2>
                    <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      You have completed 1 of 2 entries. Finish the rest to finalise payroll.
                    </p>
                  </div>
                </div>
                <div className="max-w-md space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    <span>Progress</span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: "var(--surface-2)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)" }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPercent}%`, backgroundColor: "var(--primary)" }} />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
                  <button className="sm:w-auto h-11 px-5 gap-2 rounded-xl font-bold text-white flex items-center justify-center" style={{ backgroundColor: "var(--primary)", boxShadow: "0 4px 12px rgba(0,122,77,0.2)" }}>
                    Continue Payroll <ArrowRight className="h-4 w-4" />
                  </button>
                  <button className="sm:w-auto h-11 px-5 gap-2 rounded-xl font-bold flex items-center justify-center border" style={{ borderColor: "var(--border)", color: "var(--text)", backgroundColor: "transparent" }}>
                    View Employees
                  </button>
                </div>
              </div>
            </div>

            {/* Alert banner */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border text-sm font-bold" style={{ backgroundColor: "var(--warning-soft)", borderColor: "var(--warning-border)", color: "var(--warning)" }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "var(--warning-soft)" }}>
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <span>Sipho Nkosi's ID number is missing from their profile.</span>
              </div>
              <span className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--warning)" }}>Fix Now</span>
            </div>

            {/* Recent Records */}
            <div className="glass-panel rounded-2xl">
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="type-overline mb-0.5" style={{ color: "var(--text-muted)" }}>Recent Activity</p>
                    <h3 className="text-lg font-black" style={{ color: "var(--text)" }}>Recent Records</h3>
                  </div>
                  <button className="text-xs font-bold px-3 h-8 rounded-lg" style={{ color: "var(--primary)" }}>View all</button>
                </div>
                <div style={{ borderTop: "1px solid var(--border)" }}>
                  {recentDocs.map((doc, i) => (
                    <div key={doc.id} className="flex items-center gap-4 py-4" style={{ borderBottom: i < recentDocs.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div className="p-2 rounded-xl" style={{ backgroundColor: "var(--surface-2)" }}>
                        <FileText className="h-5 w-5" style={{ color: "var(--primary)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{doc.fileName}</p>
                        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{doc.createdAt}</p>
                      </div>
                      <ChevronRight className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Household Snapshot */}
            <div className="glass-panel rounded-2xl" style={{ outline: "1px solid var(--border)" }}>
              <div className="p-5 sm:p-6 space-y-4">
                <div>
                  <p className="type-overline mb-0.5" style={{ color: "var(--text-muted)" }}>Snapshot</p>
                  <h3 className="text-lg font-black" style={{ color: "var(--text)" }}>Household Metrics</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Active Employees</p>
                    <p className="text-2xl font-black" style={{ color: "var(--text)" }}>{employeeCount}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Documents</p>
                    <p className="text-2xl font-black" style={{ color: "var(--text)" }}>{recentDocs.length}</p>
                  </div>
                </div>
                <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-bold" style={{ color: "var(--text-muted)" }}>Storage & Sync</span>
                    <span className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: "var(--success-soft)", color: "var(--success)" }}>
                      <Wifi className="h-3 w-3" /> Synced
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="type-overline px-1" style={{ color: "var(--text-muted)" }}>Quick Access</h3>
              <div className="grid gap-2">
                {[
                  { label: "Add Employee", Icon: UserPlus, href: "#" },
                  { label: "Monthly Payroll", Icon: Banknote, href: "#" },
                  { label: "Documents Hub", Icon: FolderOpen, href: "#" },
                  { label: "Account Settings", Icon: Settings, href: "#" },
                ].map(({ label, Icon }) => (
                  <button key={label} className="w-full h-12 flex items-center gap-4 px-4 rounded-xl font-bold border" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)", color: "var(--text)" }}>
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: "var(--surface-2)" }}>
                      <Icon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                    </div>
                    <span className="text-[13px]">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Compliance Card */}
            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="type-overline" style={{ color: "var(--text-muted)" }}>Annual Paperwork</h3>
                  <ShieldCheck className="h-4 w-4" style={{ color: "var(--primary)" }} />
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="type-body font-bold" style={{ color: "var(--text)" }}>Compensation Fund ROE</h4>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      Gather your yearly wage totals and supporting records for the annual ROE submission.
                    </p>
                  </div>
                  <button className="w-full text-xs font-bold h-9 rounded-lg flex items-center justify-center gap-2 border" style={{ borderColor: "rgba(0,122,77,0.2)", color: "var(--primary)" }}>
                    Ready in 2 minutes <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Help link */}
            <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <button className="group flex items-center gap-3 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: "var(--surface-2)" }}>
                  <BookOpen className="h-4 w-4" />
                </div>
                Help & Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
