"use client";

import { motion } from "framer-motion";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { useAppState } from "@/lib/store";
import { useState } from "react";

const DEMO_FIELDS = [
    { key: "byGender", label: "เพศ" },
    { key: "byRank", label: "ชั้นยศ" },
    { key: "byAgeGroup", label: "เจเนอเรชั่น" },
    { key: "byUnit", label: "สังกัด" },
] as const;

export default function CompareGroupChart() {
    const { state } = useAppState();
    const result = state.analysisResult;
    const [selectedField, setSelectedField] = useState<string>("byGender");

    if (!result) return null;

    const breakdown = result.demographicBreakdown[selectedField as keyof typeof result.demographicBreakdown];
    if (!breakdown) return null;

    const chartData = Object.entries(breakdown).map(([name, stats]) => ({
        name: name.length > 15 ? name.substring(0, 15) + "..." : name,
        fullName: name,
        ปัจจัย: Math.round(stats.factorMean * 100) / 100,
        ความผูกพัน: Math.round(stats.engagementMean * 100) / 100,
        จำนวน: stats.count,
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5"
        >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-base font-bold">เปรียบเทียบคะแนนตามกลุ่ม</h3>
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

            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF1" />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "#636E72" }}
                        angle={-20}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis domain={[0, 5]} tickCount={6} fontSize={12} />
                    <Tooltip
                        contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #E8ECF1",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                            fontSize: "13px",
                        }}
                    />
                    <Legend />
                    <Bar dataKey="ปัจจัย" fill="#6C9BCF" radius={[6, 6, 0, 0]} barSize={28} />
                    <Bar dataKey="ความผูกพัน" fill="#C3B1E1" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
