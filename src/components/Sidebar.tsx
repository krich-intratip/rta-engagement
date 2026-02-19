"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
    LayoutDashboard,
    BarChart3,
    Heart,
    GitCompare,
    Table2,
    Info,
    ChevronLeft,
    ChevronRight,
    Sun,
    Moon,
    FileText,
    ClipboardList,
    Users,
    GitMerge,
    ClipboardCheck,
    AlertTriangle,
    Settings2,
    TrendingUp,
} from "lucide-react";
import { useAppState, ActiveTab } from "@/lib/store";
import { useTheme } from "@/components/ThemeProvider";
import { useState } from "react";

type NavSection = { section: string; items: { icon: React.ElementType; label: string; tab: ActiveTab; badge?: string }[] };

const navSections: NavSection[] = [
    {
        section: "วิเคราะห์",
        items: [
            { icon: LayoutDashboard, label: "ภาพรวม", tab: "overview" },
            { icon: BarChart3, label: "ส่วนที่ 2 — ปัจจัย", tab: "factors2" },
            { icon: Heart, label: "ส่วนที่ 3 — ความผูกพัน", tab: "engagement2" },
            { icon: GitCompare, label: "เปรียบเทียบรายกลุ่ม", tab: "compare" },
            { icon: FileText, label: "วิเคราะห์ข้อความ", tab: "text" },
        ],
    },
    {
        section: "เชิงลึก",
        items: [
            { icon: Users, label: "Cluster Analysis", tab: "cluster" },
            { icon: GitMerge, label: "Correlation Matrix", tab: "correlation" },
            { icon: AlertTriangle, label: "Anomaly Detection", tab: "anomaly" },
            { icon: TrendingUp, label: "Benchmark", tab: "benchmark", badge: "Soon" },
        ],
    },
    {
        section: "จัดการ",
        items: [
            { icon: ClipboardList, label: "สรุปผู้บริหาร", tab: "executive" },
            { icon: Table2, label: "ข้อมูลดิบ", tab: "raw" },
            { icon: ClipboardCheck, label: "Action Plan", tab: "actionplan" },
            { icon: Settings2, label: "Survey Builder", tab: "surveybuilder" },
        ],
    },
    {
        section: "",
        items: [
            { icon: Info, label: "เกี่ยวกับ", tab: "about" },
        ],
    },
];

export default function Sidebar() {
    const { state, dispatch } = useAppState();
    const { theme, toggleTheme } = useTheme();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`hidden md:flex flex-col ${collapsed ? "w-20" : "w-64"} transition-all duration-300 h-screen sticky top-0 bg-[var(--color-sidebar-bg)] backdrop-blur-lg border-r border-[var(--color-border)]`}
        >
            {/* Logo */}
            <div className="p-4 flex items-center gap-3 border-b border-[var(--color-border)]">
                <Image
                    src="/RTA.png"
                    alt="RTA Logo"
                    width={40}
                    height={40}
                    className="rounded-xl object-contain flex-shrink-0"
                    priority
                />
                {!collapsed && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h1 className="text-sm font-bold text-[var(--color-text)]">RTA Analysis</h1>
                        <p className="text-xs text-[var(--color-text-secondary)]">Engagement & Happiness</p>
                    </motion.div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navSections.map((section) => (
                    <div key={section.section}>
                        {section.section && !collapsed && (
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-light)] px-3 pt-3 pb-1">{section.section}</p>
                        )}
                        {section.items.map((item) => {
                            const isActive = state.activeTab === item.tab;
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.tab}
                                    onClick={() => dispatch({ type: "SET_TAB", payload: item.tab })}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                        ${isActive
                                            ? "bg-[var(--color-primary)] text-white shadow-md"
                                            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)]/20 hover:text-[var(--color-primary-dark)]"
                                        }`}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    {!collapsed && (
                                        <span className="flex-1 text-left">{item.label}</span>
                                    )}
                                    {!collapsed && item.badge && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">{item.badge}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Theme toggle */}
            <button
                onClick={toggleTheme}
                className="mx-3 mb-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)]/20 hover:text-[var(--color-primary-dark)] transition-all duration-200"
            >
                {theme === "light" ? <Moon className="w-5 h-5 flex-shrink-0" /> : <Sun className="w-5 h-5 flex-shrink-0" />}
                {!collapsed && <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>}
            </button>

            {/* Collapse btn */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-3 border-t border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            >
                {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
        </motion.aside>
    );
}
