"use client";

import { motion } from "framer-motion";
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { useAppState } from "@/lib/store";
import ChartModal from "@/components/ChartModal";

function EngagementRadarContent({ height = 350 }: { height?: number }) {
    const { filteredAnalysis } = useAppState();
    const result = filteredAnalysis;
    if (!result || result.engagementStats.length === 0) return null;

    const chartData = result.engagementStats.map((s) => ({
        subject: s.groupName,
        score: Math.round(s.mean * 100) / 100,
        fullMark: 5,
    }));

    return (
        <>
            <ResponsiveContainer width="100%" height={height}>
                <RadarChart data={chartData}>
                    <PolarGrid stroke="var(--color-chart-grid)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: "var(--color-chart-text)" }} />
                    <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 10, fill: "var(--color-chart-text)" }} />
                    <Tooltip
                        contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid var(--color-tooltip-border)",
                            background: "var(--color-tooltip-bg)",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                            fontSize: "13px",
                            color: "var(--color-text)",
                        }}
                    />
                    <Radar
                        name="คะแนนเฉลี่ย"
                        dataKey="score"
                        stroke="#9B59B6"
                        fill="#9B59B6"
                        fillOpacity={0.35}
                        strokeWidth={2}
                    />
                </RadarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
                {chartData.map((d, i) => (
                    <div key={i} className="text-center">
                        <p className="text-xs text-[var(--color-text-secondary)]">{d.subject}</p>
                        <p className="text-lg font-bold text-[var(--color-lavender-dark)]">{d.score.toFixed(2)}</p>
                    </div>
                ))}
            </div>
        </>
    );
}

export default function EngagementRadarChart() {
    const { filteredAnalysis } = useAppState();
    const result = filteredAnalysis;
    if (!result || result.engagementStats.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold">มิติความผูกพัน (Engagement Dimensions)</h3>
                <ChartModal title="มิติความผูกพัน (Engagement Dimensions)">
                    <EngagementRadarContent height={550} />
                </ChartModal>
            </div>
            <EngagementRadarContent />
        </motion.div>
    );
}
