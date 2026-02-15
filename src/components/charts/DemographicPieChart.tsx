"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useAppState } from "@/lib/store";
import { useState } from "react";

const COLORS = ["#6C9BCF", "#A8D8B9", "#F4B8C1", "#C3B1E1", "#FDDCB5", "#F5D76E", "#7BC09A", "#E8909E", "#A3C4E9", "#E17055"];
const DEMO_FIELDS = [
    { key: "byGender", label: "เพศ" },
    { key: "byRank", label: "ชั้นยศ" },
    { key: "byAgeGroup", label: "เจเนอเรชั่น" },
    { key: "byUnit", label: "สังกัด" },
] as const;

export default function DemographicPieChart() {
    const { state } = useAppState();
    const result = state.analysisResult;
    const [selectedField, setSelectedField] = useState<string>("byGender");

    if (!result) return null;

    const breakdown = result.demographicBreakdown[selectedField as keyof typeof result.demographicBreakdown];
    if (!breakdown) return null;

    const chartData = Object.entries(breakdown).map(([name, stats]) => ({
        name,
        value: stats.count,
        engagementMean: stats.engagementMean.toFixed(2),
        factorMean: stats.factorMean.toFixed(2),
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5"
        >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-base font-bold">สัดส่วนตามข้อมูลประชากร</h3>
                <div className="flex gap-1">
                    {DEMO_FIELDS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setSelectedField(f.key)}
                            className={`tab-btn text-xs ${selectedField === f.key ? "active" : ""}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={chartData}
                        innerRadius={60}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                        labelLine={true}
                        animationDuration={800}
                    >
                        {chartData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth={2} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #E8ECF1",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                            fontSize: "13px",
                        }}
                        formatter={(value, name, props) => {
                            const p = props?.payload as { engagementMean: string; factorMean: string } | undefined;
                            return [
                                `${value ?? 0} คน | ผูกพัน: ${p?.engagementMean ?? "-"} | ปัจจัย: ${p?.factorMean ?? "-"}`,
                                name,
                            ];
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
