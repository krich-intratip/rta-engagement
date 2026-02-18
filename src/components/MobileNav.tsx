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
} from "lucide-react";
import { useAppState, ActiveTab } from "@/lib/store";

const navItems: { icon: React.ElementType; label: string; tab: ActiveTab }[] = [
    { icon: LayoutDashboard, label: "ภาพรวม", tab: "overview" },
    { icon: BarChart3, label: "ปัจจัย", tab: "factors" },
    { icon: Heart, label: "ผูกพัน", tab: "engagement" },
    { icon: GitCompare, label: "เทียบ", tab: "compare" },
    { icon: Table2, label: "ข้อมูล", tab: "raw" },
    { icon: FileText, label: "ข้อความ", tab: "text" },
    { icon: ClipboardList, label: "สรุป", tab: "executive" },
    { icon: Info, label: "เกี่ยวกับ", tab: "about" },
];

export default function MobileNav() {
    const { state, dispatch } = useAppState();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-[var(--color-border)] px-2 py-1.5">
            <div className="flex items-center justify-around">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = state.activeTab === item.tab;
                    return (
                        <button
                            key={item.tab}
                            onClick={() => dispatch({ type: "SET_TAB", payload: item.tab })}
                            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] transition-colors
                ${isActive ? "text-[var(--color-primary)] font-bold" : "text-[var(--color-text-light)]"}`}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
