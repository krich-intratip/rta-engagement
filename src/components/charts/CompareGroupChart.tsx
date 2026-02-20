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
import ChartModal from "@/components/ChartModal";

const DEMO_FIELDS = [
    { key: "byGender", label: "เพศ" },
    { key: "byRank", label: "ชั้นยศ" },
    { key: "byAgeGroup", label: "เจเนอเรชั่น" },
    { key: "byUnit", label: "สังกัด" },
    { key: "byMaritalStatus", label: "สถานภาพ" },
    { key: "byEducation", label: "การศึกษา" },
    { key: "byServiceYears", label: "อายุราชการ" },
    { key: "byIncome", label: "รายได้" },
    { key: "byHousing", label: "ที่อยู่อาศัย" },
    { key: "byFamilyInArmy", label: "ครอบครัวใน ทบ." },
    { key: "byHasDependents", label: "ภาระอุปการะ" },
] as const;

function CompareGroupContent({ selectedField, height = 350 }: { selectedField: string; height?: number }) {
    const { filteredAnalysis } = useAppState();
    const result = filteredAnalysis;
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
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--color-chart-text)" }}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                />
                <YAxis domain={[0, 5]} tickCount={6} fontSize={12} tick={{ fill: "var(--color-chart-text)" }} />
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
                <Legend wrapperStyle={{ color: "var(--color-text)" }} />
                <Bar dataKey="ปัจจัย" fill="#3B7DD8" radius={[6, 6, 0, 0]} barSize={28} />
                <Bar dataKey="ความผูกพัน" fill="#9B59B6" radius={[6, 6, 0, 0]} barSize={28} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export default function CompareGroupChart() {
    const { filteredAnalysis } = useAppState();
    const result = filteredAnalysis;
    const [selectedField, setSelectedField] = useState<string>("byGender");

    if (!result) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5"
        >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">เปรียบเทียบคะแนนตามกลุ่ม</h3>
                    <ChartModal title="เปรียบเทียบคะแนนตามกลุ่ม">
                        <CompareGroupContent selectedField={selectedField} height={550} />
                    </ChartModal>
                </div>
                <div className="flex gap-1 flex-wrap">
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

            <CompareGroupContent selectedField={selectedField} />
        </motion.div>
    );
}
