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
} from "lucide-react";
import { useAppState, ActiveTab } from "@/lib/store";
import { useState } from "react";

const navItems: { icon: React.ElementType; label: string; tab: ActiveTab }[] = [
    { icon: LayoutDashboard, label: "ภาพรวม", tab: "overview" },
    { icon: BarChart3, label: "ปัจจัย", tab: "factors" },
    { icon: Heart, label: "ความผูกพัน", tab: "engagement" },
    { icon: GitCompare, label: "เปรียบเทียบ", tab: "compare" },
    { icon: Table2, label: "ข้อมูลดิบ", tab: "raw" },
    { icon: Info, label: "เกี่ยวกับ", tab: "about" },
];

export default function Sidebar() {
    const { state, dispatch } = useAppState();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`hidden md:flex flex-col ${collapsed ? "w-20" : "w-64"} transition-all duration-300 h-screen sticky top-0 bg-white/80 backdrop-blur-lg border-r border-[var(--color-border)]`}
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
            <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => {
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
                            {!collapsed && <span>{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

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
