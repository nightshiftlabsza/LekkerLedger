import "./_group.css";
import {
  ArrowRight, FileText, FolderOpen, ChevronRight,
  Banknote, ShieldCheck, UserPlus, Settings,
  Users, CheckCircle2, Clock, AlertTriangle,
  Sparkles, Wifi,
} from "lucide-react";

const MOCK = {
  employerName: "Nomsa Dlamini",
  plan: "Standard",
  planExpiry: "30 Apr 2026",
  employees: [
    { id: "1", name: "Zanele Khumalo", role: "Domestic Worker", status: "complete" as const, netPay: 4820 },
    { id: "2", name: "Sipho Nkosi", role: "Garden Worker", status: "pending" as const, netPay: null },
  ],
  currentPeriod: { name: "March 2026", completedEntries: 1, totalEntries: 2 },
  recentDocs: [
    { id: "d1", fileName: "February 2026 — Zanele Khumalo", date: "28 Feb 2026" },
    { id: "d2", fileName: "February 2026 — Sipho Nkosi", date: "28 Feb 2026" },
    { id: "d3", fileName: "January 2026 — Zanele Khumalo", date: "31 Jan 2026" },
  ],
};

export function Redesign() {
  const { employees, currentPeriod, recentDocs, plan, planExpiry, employerName } = MOCK;
  const progressPercent = (currentPeriod.completedEntries / currentPeriod.totalEntries) * 100;
  const pendingEmployee = employees.find(e => e.status === "pending");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)", fontFamily: "var(--font-sans)" }}>
      {/* Top status bar */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between border-b" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {employerName}
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(0,122,77,0.08)", color: "var(--primary)" }}>
            <Sparkles className="h-3 w-3" />
            {plan} Plan
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Renews {planExpiry}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-12 space-y-5">
        {/* Payroll CTA — full-width, prominent */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #007A4D 0%, #009D63 100%)", boxShadow: "0 8px 24px rgba(0,122,77,0.25)" }}>
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.65)" }}>
                  March 2026 · Pay Period
                </p>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  1 of 2 employees done
                </h2>
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>
                  {pendingEmployee?.name} still needs their hours recorded.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end shrink-0">
                <button className="flex items-center justify-center gap-2 h-12 px-6 rounded-xl font-bold text-sm bg-white" style={{ color: "var(--primary)", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
                  Continue Payroll <ArrowRight className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.25)", minWidth: "120px" }}>
                    <div className="h-full rounded-full bg-white" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <span className="text-xs font-bold text-white">{Math.round(progressPercent)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alert — missing ID */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold" style={{ backgroundColor: "var(--warning-soft)", borderColor: "var(--warning-border)", color: "var(--warning)" }}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">Sipho Nkosi's ID number is missing — needed for UIF.</span>
          <button className="text-xs font-black uppercase tracking-wide shrink-0" style={{ color: "var(--warning)" }}>Fix →</button>
        </div>

        <div className="grid gap-5 lg:grid-cols-12 items-start">
          {/* Left */}
          <div className="lg:col-span-8 space-y-5">
            {/* Employee status cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Employees · March 2026</h3>
                <button className="text-xs font-bold" style={{ color: "var(--primary)" }}>+ Add</button>
              </div>
              <div className="space-y-2">
                {employees.map(emp => (
                  <div key={emp.id} className="flex items-center gap-4 p-4 rounded-xl border" style={{ backgroundColor: "var(--surface-1)", borderColor: emp.status === "complete" ? "var(--success-border)" : "var(--border)" }}>
                    <div className="h-10 w-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 text-white" style={{ background: "var(--grad-primary)" }}>
                      {emp.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{emp.name}</p>
                      <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{emp.role}</p>
                    </div>
                    {emp.status === "complete" ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-black" style={{ color: "var(--text)" }}>R {emp.netPay?.toLocaleString()}</span>
                        <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: "var(--success-soft)", color: "var(--success)" }}>
                          <CheckCircle2 className="h-3 w-3" /> Done
                        </span>
                      </div>
                    ) : (
                      <button className="flex items-center gap-1.5 text-xs font-bold px-3 h-8 rounded-lg shrink-0" style={{ backgroundColor: "var(--primary)", color: "white" }}>
                        <Clock className="h-3 w-3" /> Enter Hours
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Records */}
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                <div>
                  <p className="type-overline" style={{ color: "var(--text-muted)" }}>Recent Activity</p>
                  <h3 className="text-base font-black" style={{ color: "var(--text)" }}>Recent Records</h3>
                </div>
                <button className="text-xs font-bold px-3 h-8 rounded-lg" style={{ color: "var(--primary)" }}>View all →</button>
              </div>
              <div>
                {recentDocs.map((doc, i) => (
                  <div key={doc.id} className="flex items-center gap-4 px-5 py-3.5" style={{ borderBottom: i < recentDocs.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: "rgba(0,122,77,0.06)" }}>
                      <FileText className="h-4 w-4" style={{ color: "var(--primary)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{doc.fileName}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{doc.date}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-4 space-y-5">
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4 border text-center" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
                <Users className="h-5 w-5 mx-auto mb-1" style={{ color: "var(--primary)" }} />
                <p className="text-2xl font-black" style={{ color: "var(--text)" }}>2</p>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Employees</p>
              </div>
              <div className="rounded-xl p-4 border text-center" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
                <FileText className="h-5 w-5 mx-auto mb-1" style={{ color: "var(--primary)" }} />
                <p className="text-2xl font-black" style={{ color: "var(--text)" }}>3</p>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Documents</p>
              </div>
            </div>

            {/* Sync status */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl border" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
              <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Cloud sync</span>
              <span className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: "var(--success-soft)", color: "var(--success)" }}>
                <Wifi className="h-3 w-3" /> Synced
              </span>
            </div>

            {/* Quick Actions — icon grid */}
            <div className="space-y-3">
              <h3 className="type-overline px-1" style={{ color: "var(--text-muted)" }}>Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Add Employee", Icon: UserPlus },
                  { label: "Payroll", Icon: Banknote },
                  { label: "Documents", Icon: FolderOpen },
                  { label: "Settings", Icon: Settings },
                ].map(({ label, Icon }) => (
                  <button key={label} className="flex flex-col items-center gap-2 p-4 rounded-xl border font-semibold text-center" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)", color: "var(--text)" }}>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(0,122,77,0.06)" }}>
                      <Icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
                    </div>
                    <span className="text-xs font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Annual compliance */}
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" style={{ color: "var(--primary)" }} />
                  <span className="type-overline" style={{ color: "var(--text-muted)" }}>Annual Paperwork</span>
                </div>
                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Compensation Fund ROE</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>Gather yearly wage totals for the annual ROE submission.</p>
                <button className="w-full text-xs font-bold h-9 rounded-lg flex items-center justify-center gap-1.5 border" style={{ borderColor: "rgba(0,122,77,0.2)", color: "var(--primary)" }}>
                  Ready in 2 minutes <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
