"use client";

import { motion } from "framer-motion";
import {
    Trophy,
    AlertTriangle,
    Info,
    Star,
    Target,
    Heart,
    Lightbulb,
    Link2,
    BarChart3,
    ClipboardList,
    Zap,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { useAppState } from "@/lib/store";
import { Insight } from "@/types/survey";
import { useState } from "react";

const iconMap: Record<string, React.ElementType> = {
    trophy: Trophy,
    "alert-triangle": AlertTriangle,
    info: Info,
    star: Star,
    target: Target,
    heart: Heart,
    lightbulb: Lightbulb,
    link: Link2,
    "bar-chart": BarChart3,
    clipboard: ClipboardList,
    zap: Zap,
};

const typeStyles: Record<string, { bg: string; border: string; icon: string; label: string }> = {
    analysis: { bg: "bg-[#3B7DD8]/10", border: "border-[#3B7DD8]", icon: "text-[#3B7DD8]", label: "การวิเคราะห์" },
    strength: { bg: "bg-[#2ECC71]/10", border: "border-[#2ECC71]", icon: "text-[#2ECC71]", label: "จุดแข็ง" },
    improvement: { bg: "bg-[#E74C3C]/10", border: "border-[#E74C3C]", icon: "text-[#E74C3C]", label: "ควรพัฒนา" },
    recommendation: { bg: "bg-[#F39C12]/10", border: "border-[#F39C12]", icon: "text-[#F39C12]", label: "คำแนะนำ" },
    info: { bg: "bg-[#6C9BCF]/10", border: "border-[#A3C4E9]", icon: "text-[#6C9BCF]", label: "ข้อมูล" },
};

const COLLAPSE_THRESHOLD = 200;

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const Icon = iconMap[insight.icon] || Info;
    const style = typeStyles[insight.type] || typeStyles.info;
    const isLong = insight.description.length > COLLAPSE_THRESHOLD;
    const displayText = isLong && !expanded
        ? insight.description.substring(0, COLLAPSE_THRESHOLD) + "..."
        : insight.description;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            className={`${style.bg} border-l-4 ${style.border} rounded-lg p-4`}
        >
            <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.icon}`} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-sm font-semibold">{insight.title}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.icon} border ${style.border}`}>
                            {style.label}
                        </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] whitespace-pre-line leading-relaxed">
                        {displayText}
                    </p>
                    {isLong && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center gap-1 mt-2 text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
                        >
                            {expanded ? (
                                <>
                                    <ChevronUp className="w-3.5 h-3.5" /> ย่อ
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-3.5 h-3.5" /> อ่านเพิ่มเติม
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

type SectionKey = "all" | "analysis" | "strength" | "improvement" | "recommendation";

const sectionTabs: { key: SectionKey; label: string }[] = [
    { key: "all", label: "ทั้งหมด" },
    { key: "analysis", label: "🔍 วิเคราะห์" },
    { key: "strength", label: "✅ จุดแข็ง" },
    { key: "improvement", label: "🔴 ควรพัฒนา" },
    { key: "recommendation", label: "💡 คำแนะนำ" },
];

export default function InsightsPanel() {
    const { filteredAnalysis } = useAppState();
    const result = filteredAnalysis;
    const [activeSection, setActiveSection] = useState<SectionKey>("all");

    if (!result || result.insights.length === 0) return null;

    const filtered = activeSection === "all"
        ? result.insights
        : result.insights.filter((i) => i.type === activeSection);

    const counts: Record<string, number> = {};
    for (const ins of result.insights) {
        counts[ins.type] = (counts[ins.type] || 0) + 1;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5"
        >
            <h3 className="text-base font-bold mb-4">📊 ข้อค้นพบสำคัญ (Key Insights)</h3>

            {/* Section filter tabs */}
            <div className="flex gap-1 mb-4 flex-wrap">
                {sectionTabs.map((tab) => {
                    const count = tab.key === "all" ? result.insights.length : (counts[tab.key] || 0);
                    if (tab.key !== "all" && count === 0) return null;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveSection(tab.key)}
                            className={`tab-btn text-xs ${activeSection === tab.key ? "active" : ""}`}
                        >
                            {tab.label} ({count})
                        </button>
                    );
                })}
            </div>

            <div className="space-y-3">
                {filtered.map((insight, i) => (
                    <InsightCard key={`${insight.type}-${i}`} insight={insight} index={i} />
                ))}
            </div>
        </motion.div>
    );
}
