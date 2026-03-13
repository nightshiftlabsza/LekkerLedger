import "./_group.css";
import {
  ArrowRight, FileText, FolderOpen, ChevronRight,
  Banknote, ShieldCheck, UserPlus, Settings,
  Users, CheckCircle2, Clock, AlertTriangle,
  Sparkles, Wifi, LayoutDashboard, Palmtree,
  Calculator, LifeBuoy, LogOut, CreditCard,
  Home,
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
    { id: "d1", fileName: "February 2026 — Zanele Khumalo", date: "28 Feb 2026", type: "Payslip" },
    { id: "d2", fileName: "February 2026 — Sipho Nkosi", date: "28 Feb 2026", type: "Payslip" },
    { id: "d3", fileName: "January 2026 — Zanele Khumalo", date: "31 Jan 2026", type: "Payslip" },
  ],
};

const NAV_GROUPS = [
  {
    label: "Work",
    items: [
      { label: "Dashboard", Icon: LayoutDashboard, active: true },
      { label: "Monthly payroll", Icon: Banknote },
      { label: "Employees", Icon: Users },
      { label: "Leave", Icon: Palmtree },
      { label: "Wage & UIF calculator", Icon: Calculator },
    ],
  },
  {
    label: "Documents",
    items: [
      { label: "Documents", Icon: FolderOpen },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Compensation Fund ROE", Icon: ShieldCheck },
      { label: "uFiling export", Icon: Sparkles },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Settings", Icon: Settings },
      { label: "Plans & billing", Icon: CreditCard },
      { label: "Help & Support", Icon: LifeBuoy },
    ],
  },
];

const MOBILE_NAV = [
  { label: "Home", Icon: Home },
  { label: "Payroll", Icon: Banknote },
  { label: "Employees", Icon: Users },
  { label: "Docs", Icon: FolderOpen },
];

function Sidebar() {
  return (
    <aside style={{
      width: "220px",
      flexShrink: 0,
      backgroundColor: "var(--surface-1)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      position: "sticky",
      top: 0,
      overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "var(--grad-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontSize: "13px", fontWeight: 800 }}>L</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: "15px", color: "var(--text)", letterSpacing: "-0.02em" }}>LekkerLedger</span>
        </div>
        {/* Household */}
        <div style={{ marginTop: "10px", padding: "6px 8px", borderRadius: "8px", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Household</p>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginTop: "1px" }}>Main household</p>
          </div>
          <ChevronRight style={{ width: "14px", height: "14px", color: "var(--text-muted)" }} />
        </div>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, padding: "8px 8px", overflowY: "auto" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: "4px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "8px 8px 4px" }}>{group.label}</p>
            {group.items.map(({ label, Icon, active }: { label: string; Icon: React.ElementType; active?: boolean }) => (
              <button key={label} style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "9px",
                padding: "7px 8px",
                borderRadius: "8px",
                border: "none",
                background: active ? "rgba(0,122,77,0.08)" : "transparent",
                cursor: "pointer",
                textAlign: "left",
              }}>
                <Icon style={{ width: "15px", height: "15px", color: active ? "var(--primary)" : "var(--text-muted)", flexShrink: 0 }} />
                <span style={{ fontSize: "13px", fontWeight: active ? 700 : 500, color: active ? "var(--primary)" : "var(--text)" }}>{label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--grad-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "white", fontSize: "11px", fontWeight: 800 }}>ND</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Nomsa Dlamini</p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Standard Plan</p>
          </div>
          <LogOut style={{ width: "14px", height: "14px", color: "var(--text-muted)", flexShrink: 0, cursor: "pointer" }} />
        </div>
      </div>
    </aside>
  );
}

export function Redesign() {
  const { employees, currentPeriod, recentDocs, plan, planExpiry } = MOCK;
  const progressPercent = (currentPeriod.completedEntries / currentPeriod.totalEntries) * 100;
  const pendingEmployee = employees.find(e => e.status === "pending");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)", fontFamily: "var(--font-sans)", display: "flex" }}>

      {/* Sidebar — hidden on mobile via CSS workaround using a wrapper */}
      <div className="sidebar-wrapper" style={{ display: "flex" }}>
        <Sidebar />
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Top bar */}
        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: "var(--surface-1)",
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}>
          <div>
            <h1 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em" }}>Dashboard</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", backgroundColor: "rgba(0,122,77,0.08)", color: "var(--primary)" }}>
              <Sparkles style={{ width: "11px", height: "11px" }} />
              {plan} Plan · Renews {planExpiry}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "var(--success)" }}>
              <Wifi style={{ width: "12px", height: "12px" }} /> Synced
            </span>
          </div>
        </header>

        {/* Scrollable content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {/* Max-width container — works for ultrawide */}
          <div style={{ maxWidth: "1100px", width: "100%", margin: "0 auto" }}>

            {/* Alert */}
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "9px 14px", borderRadius: "10px", marginBottom: "20px",
              border: "1px solid var(--warning-border)",
              backgroundColor: "var(--warning-soft)",
              fontSize: "13px", fontWeight: 600, color: "var(--warning)",
            }}>
              <AlertTriangle style={{ width: "14px", height: "14px", flexShrink: 0 }} />
              <span style={{ flex: 1 }}>Sipho Nkosi&apos;s ID number is missing - required for UIF submissions.</span>
              <button style={{ fontSize: "12px", fontWeight: 800, color: "var(--warning)", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>Fix now →</button>
            </div>

            {/* Two-column grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", alignItems: "start" }}>

              {/* LEFT COLUMN */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Payroll CTA card */}
                <div style={{
                  borderRadius: "14px",
                  overflow: "hidden",
                  background: "linear-gradient(135deg, #007A4D 0%, #009D63 100%)",
                  boxShadow: "0 4px 20px rgba(0,122,77,0.2)",
                }}>
                  <div style={{ padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                      <div>
                        <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>
                          Current Pay Period
                        </p>
                        <h2 style={{ fontSize: "22px", fontWeight: 900, color: "white", letterSpacing: "-0.02em", marginBottom: "4px" }}>
                          March 2026 — in progress
                        </h2>
                        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                          {pendingEmployee?.name} still needs hours entered.
                        </p>
                      </div>
                      <button style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        height: "36px", padding: "0 16px",
                        borderRadius: "9px", border: "none",
                        backgroundColor: "white", color: "var(--primary)",
                        fontSize: "13px", fontWeight: 800, cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                        whiteSpace: "nowrap", flexShrink: 0,
                      }}>
                        Continue Payroll <ArrowRight style={{ width: "13px", height: "13px" }} />
                      </button>
                    </div>
                    {/* Progress bar */}
                    <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ flex: 1, height: "6px", borderRadius: "99px", backgroundColor: "rgba(255,255,255,0.25)", overflow: "hidden" }}>
                        <div style={{ width: `${progressPercent}%`, height: "100%", borderRadius: "99px", backgroundColor: "white" }} />
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap" }}>
                        {currentPeriod.completedEntries} / {currentPeriod.totalEntries} employees
                      </span>
                    </div>
                  </div>
                </div>

                {/* Employee rows */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <h3 style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                      March 2026 — Employees
                    </h3>
                    <button style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <UserPlus style={{ width: "12px", height: "12px" }} /> Add employee
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {employees.map(emp => (
                      <div key={emp.id} style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        padding: "10px 14px", borderRadius: "10px", border: "1px solid",
                        borderColor: emp.status === "complete" ? "var(--success-border)" : "var(--border)",
                        backgroundColor: emp.status === "complete" ? "var(--success-soft)" : "var(--surface-1)",
                      }}>
                        <div style={{
                          width: "32px", height: "32px", borderRadius: "50%",
                          background: "var(--grad-primary)", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          fontSize: "11px", fontWeight: 800, color: "white", flexShrink: 0,
                        }}>
                          {emp.name.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{emp.name}</p>
                          <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{emp.role}</p>
                        </div>
                        {emp.status === "complete" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text)" }}>R {emp.netPay?.toLocaleString()}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "99px", backgroundColor: "var(--success-soft)", color: "var(--success)" }}>
                              <CheckCircle2 style={{ width: "11px", height: "11px" }} /> Done
                            </span>
                          </div>
                        ) : (
                          <button style={{
                            display: "flex", alignItems: "center", gap: "5px",
                            fontSize: "12px", fontWeight: 700, padding: "5px 12px",
                            borderRadius: "8px", border: "none",
                            backgroundColor: "var(--primary)", color: "white", cursor: "pointer",
                          }}>
                            <Clock style={{ width: "11px", height: "11px" }} /> Enter hours
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Records */}
                <div style={{ borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--surface-1)", overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                    <div>
                      <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "2px" }}>Recent activity</p>
                      <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--text)" }}>Recent Records</h3>
                    </div>
                    <button style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary)", background: "none", border: "none", cursor: "pointer" }}>View all →</button>
                  </div>
                  {recentDocs.map((doc, i) => (
                    <div key={doc.id} style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "10px 16px",
                      borderBottom: i < recentDocs.length - 1 ? "1px solid var(--border)" : "none",
                      cursor: "pointer",
                    }}>
                      <div style={{ padding: "6px", borderRadius: "8px", backgroundColor: "rgba(0,122,77,0.06)", flexShrink: 0 }}>
                        <FileText style={{ width: "14px", height: "14px", color: "var(--primary)" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.fileName}</p>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{doc.type} · {doc.date}</p>
                      </div>
                      <ChevronRight style={{ width: "14px", height: "14px", color: "var(--text-muted)", flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* Household snapshot */}
                <div style={{ borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--surface-1)", padding: "14px 16px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "10px" }}>Household snapshot</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                    {[
                      { value: "2", label: "Employees" },
                      { value: "3", label: "Documents" },
                    ].map(({ value, label }) => (
                      <div key={label} style={{ padding: "10px 12px", borderRadius: "8px", backgroundColor: "var(--bg)", textAlign: "center" }}>
                        <p style={{ fontSize: "22px", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>{value}</p>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick nav shortcuts */}
                <div style={{ borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--surface-1)", padding: "14px 16px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "8px" }}>Quick actions</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {[
                      { label: "Add employee", Icon: UserPlus, href: "/employees/new" },
                      { label: "Monthly payroll", Icon: Banknote, href: "/payroll" },
                      { label: "Documents hub", Icon: FolderOpen, href: "/documents" },
                      { label: "Leave tracker", Icon: Palmtree, href: "/leave" },
                      { label: "Wage calculator", Icon: Calculator, href: "/tools/wage-calculator" },
                    ].map(({ label, Icon }) => (
                      <button key={label} style={{
                        display: "flex", alignItems: "center", gap: "9px",
                        padding: "7px 8px", borderRadius: "8px", border: "none",
                        backgroundColor: "transparent", cursor: "pointer", textAlign: "left", width: "100%",
                      }}>
                        <Icon style={{ width: "14px", height: "14px", color: "var(--text-muted)", flexShrink: 0 }} />
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Annual compliance */}
                <div style={{ borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--surface-1)", padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <ShieldCheck style={{ width: "13px", height: "13px", color: "var(--primary)" }} />
                    <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Annual admin</p>
                  </div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "3px" }}>Compensation Fund ROE</p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "10px" }}>Yearly wage totals for the annual ROE submission.</p>
                  <button style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                    width: "100%", height: "32px", borderRadius: "8px",
                    border: "1px solid rgba(0,122,77,0.25)", backgroundColor: "transparent",
                    fontSize: "12px", fontWeight: 700, color: "var(--primary)", cursor: "pointer",
                  }}>
                    Ready in 2 minutes <ArrowRight style={{ width: "12px", height: "12px" }} />
                  </button>
                </div>

                {/* uFiling */}
                <div style={{ borderRadius: "12px", border: "1px dashed var(--border)", backgroundColor: "var(--bg)", padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <Sparkles style={{ width: "13px", height: "13px", color: "var(--primary)" }} />
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)" }}>uFiling export</p>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>Export UIF data to submit on uFiling.gov.za.</p>
                </div>

              </div>
            </div>
          </div>
        </main>

        {/* Mobile bottom nav (visible only on narrow screens — simulated here at < 640px) */}
        <nav style={{
          borderTop: "1px solid var(--border)",
          backgroundColor: "var(--surface-1)",
          display: "none",
          padding: "0",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
            {MOBILE_NAV.map(({ label, Icon }) => (
              <button key={label} style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: "3px", padding: "10px 0", border: "none",
                backgroundColor: "transparent", cursor: "pointer",
              }}>
                <Icon style={{ width: "20px", height: "20px", color: "var(--text-muted)" }} />
                <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)" }}>{label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
