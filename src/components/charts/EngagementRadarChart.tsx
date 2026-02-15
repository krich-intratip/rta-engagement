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

export default function EngagementRadarChart() {
    const { state } = useAppState();
    const result = state.analysisResult;
    if (!result || result.engagementStats.length === 0) return null;

    const chartData = result.engagementStats.map((s) => ({
        subject: s.groupName,
        score: Math.round(s.mean * 100) / 100,
        fullMark: 5,
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5"
        >
            <h3 className="text-base font-bold mb-4">มิติความผูกพัน (Engagement Dimensions)</h3>
            <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={chartData}>
                    <PolarGrid stroke="#E8ECF1" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: "#636E72" }} />
                    <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 10 }} />
                    <Tooltip
                        contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #E8ECF1",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                            fontSize: "13px",
                        }}
                    />
                    <Radar
                        name="คะแนนเฉลี่ย"
                        dataKey="score"
                        stroke="#C3B1E1"
                        fill="#C3B1E1"
                        fillOpacity={0.4}
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
        </motion.div>
    );
}
