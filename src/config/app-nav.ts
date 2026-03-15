import {
    Banknote,
    Calculator,
    FolderOpen,
    LayoutDashboard,
    LifeBuoy,
    Palmtree,
    Settings,
    ShieldCheck,
    Sparkles,
    Users,
    type LucideIcon,
} from "lucide-react";

export interface AppNavLink {
    href: string;
    label: string;
    icon: LucideIcon;
    sublabel?: string;
}

export interface AppNavGroup {
    label: string;
    links: AppNavLink[];
}

export const APP_NAV_GROUPS: AppNavGroup[] = [
    {
        label: "Work",
        links: [
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: "/payroll", label: "Monthly payroll", icon: Banknote },
            { href: "/employees", label: "Employees", icon: Users },
            { href: "/leave", label: "Leave", icon: Palmtree },
            { href: "/tools/wage-calculator", label: "Wage & UIF calculator", icon: Calculator },
        ],
    },
    {
        label: "Documents",
        links: [{ href: "/documents", label: "Documents", icon: FolderOpen }],
    },
    {
        label: "Admin",
        links: [
            {
                href: "/compliance/coida/roe",
                label: "Compensation Fund ROE",
                sublabel: "Annual return submission",
                icon: ShieldCheck,
            },
            { href: "/ufiling", label: "uFiling export", icon: Sparkles },
        ],
    },
    {
        label: "Account",
        links: [
            { href: "/settings", label: "Settings", icon: Settings },
            { href: "/upgrade", label: "Plans & billing", icon: Sparkles },
            { href: "/support", label: "Help & Support", icon: LifeBuoy },
        ],
    },
];

export const ACCOUNT_MENU_LINKS: AppNavLink[] = [
    {
        href: "/settings",
        label: "Settings",
        sublabel: "Employer details, storage, and app preferences",
        icon: Settings,
    },
    {
        href: "/upgrade",
        label: "Plans & billing",
        sublabel: "Plans, pricing, and subscription management",
        icon: Sparkles,
    },
    {
        href: "/support",
        label: "Help & Support",
        sublabel: "Guides, support resources, and official references",
        icon: LifeBuoy,
    },
];

export const MOBILE_NAV_ITEMS: AppNavLink[] = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/payroll", label: "Payroll", icon: Banknote },
    { href: "/employees", label: "Employees", icon: Users },
    { href: "/documents", label: "Docs", icon: FolderOpen },
];
