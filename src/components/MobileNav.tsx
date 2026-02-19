"use client";

import {
    LayoutDashboard,
    BarChart3,
    Heart,
    GitCompare,
    Table2,
    Info,
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

const navItems: { icon: React.ElementType; label: string; tab: ActiveTab }[] = [
    { icon: LayoutDashboard, label: "ภาพรวม", tab: "overview" },
    { icon: BarChart3, label: "ส่วน 2", tab: "factors2" },
    { icon: Heart, label: "ส่วน 3", tab: "engagement2" },
    { icon: GitCompare, label: "เทียบ", tab: "compare" },
    { icon: FileText, label: "ข้อความ", tab: "text" },
    { icon: Users, label: "Cluster", tab: "cluster" },
    { icon: GitMerge, label: "Corr.", tab: "correlation" },
    { icon: AlertTriangle, label: "Anomaly", tab: "anomaly" },
    { icon: TrendingUp, label: "Benchmark", tab: "benchmark" },
    { icon: ClipboardList, label: "สรุป", tab: "executive" },
    { icon: ClipboardCheck, label: "Action", tab: "actionplan" },
    { icon: Settings2, label: "Builder", tab: "surveybuilder" },
    { icon: Table2, label: "ข้อมูล", tab: "raw" },
    { icon: Info, label: "เกี่ยวกับ", tab: "about" },
];

export default function MobileNav() {
    const { state, dispatch } = useAppState();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)]/95 backdrop-blur-lg border-t border-[var(--color-border)] px-1 py-1">
            <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = state.activeTab === item.tab;
                    return (
                        <button
                            key={item.tab}
                            onClick={() => dispatch({ type: "SET_TAB", payload: item.tab })}
                            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-[9px] transition-colors flex-shrink-0
                                ${isActive ? "text-[var(--color-primary)] font-bold" : "text-[var(--color-text-light)]"}`}
                        >
                            <Icon className="w-4 h-4" />
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
