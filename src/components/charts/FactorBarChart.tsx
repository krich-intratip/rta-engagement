"use client";

import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAppState } from "@/lib/store";
import { interpretMean } from "@/types/survey";
import ChartModal from "@/components/ChartModal";

const COLORS = ["#3B7DD8", "#2ECC71", "#E74C8B", "#9B59B6", "#F39C12", "#F1C40F", "#1ABC9C", "#E74C3C"];

function FactorBarChartContent({ height = 380 }: { height?: number }) {
    const { state } = useAppState();
    const result = state.analysisResult;
    if (!result || result.factorStats.length === 0) return null;

    const chartData = result.factorStats.map((s, i) => ({
        name: s.groupName,
        mean: Math.round(s.mean * 100) / 100,
        sd: Math.round(s.sd * 100) / 100,
        interp: s.interpretation,
        fill: COLORS[i % COLORS.length],
    }));

    return (
        <>
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" />
                    <XAxis type="number" domain={[0, 5]} tickCount={6} fontSize={12} tick={{ fill: "var(--color-chart-text)" }} />
                    <YAxis type="category" dataKey="name" width={140} fontSize={11} tick={{ fill: "var(--color-chart-text)" }} />
                    <Tooltip
                        contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid var(--color-tooltip-border)",
                            background: "var(--color-tooltip-bg)",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                            fontSize: "13px",
                            color: "var(--color-text)",
                        }}
                        formatter={(value, name) => [`${(Number(value ?? 0)).toFixed(2)}`, "ค่าเฉลี่ย"]}
                        labelFormatter={(label) => `ปัจจัย: ${label}`}
                    />
                    <Bar dataKey="mean" radius={[0, 8, 8, 0]} barSize={24}>
                        {chartData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-3">
                {chartData.map((d, i) => (
                    <span key={i} className="badge text-xs" style={{ backgroundColor: `${d.fill}20`, color: d.fill }}>
                        {d.name}: {d.mean.toFixed(2)} ({d.interp})
                    </span>
                ))}
            </div>
        </>
    );
}

export default function FactorBarChart() {
    const { state } = useAppState();
    const result = state.analysisResult;
    if (!result || result.factorStats.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold">คะแนนเฉลี่ยรายกลุ่มปัจจัย</h3>
                <ChartModal title="คะแนนเฉลี่ยรายกลุ่มปัจจัย">
                    <FactorBarChartContent height={600} />
                </ChartModal>
            </div>
            <FactorBarChartContent />
        </motion.div>
    );
}
