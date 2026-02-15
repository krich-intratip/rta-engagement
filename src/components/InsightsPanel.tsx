"use client";

import { motion } from "framer-motion";
import { Trophy, AlertTriangle, Info, Star, Target, Heart } from "lucide-react";
import { useAppState } from "@/lib/store";
import { Insight } from "@/types/survey";

const iconMap: Record<string, React.ElementType> = {
    trophy: Trophy,
    "alert-triangle": AlertTriangle,
    info: Info,
    star: Star,
    target: Target,
    heart: Heart,
};

const typeStyles: Record<string, { bg: string; border: string; icon: string }> = {
    strength: { bg: "bg-[#A8D8B9]/15", border: "border-[#A8D8B9]", icon: "text-[#00B894]" },
    improvement: { bg: "bg-[#F4B8C1]/15", border: "border-[#F4B8C1]", icon: "text-[#E17055]" },
    info: { bg: "bg-[#6C9BCF]/10", border: "border-[#A3C4E9]", icon: "text-[#6C9BCF]" },
};

export default function InsightsPanel() {
    const { state } = useAppState();
    const result = state.analysisResult;
    if (!result || result.insights.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5"
        >
            <h3 className="text-base font-bold mb-4">📊 ข้อค้นพบสำคัญ (Key Insights)</h3>
            <div className="space-y-3">
                {result.insights.map((insight, i) => {
                    const Icon = iconMap[insight.icon] || Info;
                    const style = typeStyles[insight.type] || typeStyles.info;
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`${style.bg} border-l-4 ${style.border} rounded-lg p-4`}
                        >
                            <div className="flex items-start gap-3">
                                <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.icon}`} />
                                <div>
                                    <h4 className="text-sm font-semibold mb-1">{insight.title}</h4>
                                    <p className="text-xs text-[var(--color-text-secondary)] whitespace-pre-line">
                                        {insight.description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
