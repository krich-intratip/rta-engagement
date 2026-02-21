"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useAppState } from "@/lib/store";
import ChartModal from "@/components/ChartModal";

const COLORS = ["#3B7DD8", "#2ECC71", "#E74C8B", "#9B59B6", "#F39C12", "#F1C40F", "#1ABC9C", "#E74C3C", "#3498DB", "#E67E22"];
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

function DemographicPieContent({ selectedField, height = 300 }: { selectedField: string; height?: number }) {
    const { filteredAnalysis } = useAppState();
    const result = filteredAnalysis;
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
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={chartData}
                    innerRadius={height * 0.18}
                    outerRadius={height * 0.35}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    labelLine={true}
                    animationDuration={800}
                >
                    {chartData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="var(--color-surface)" strokeWidth={2} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid var(--color-tooltip-border)",
                        background: "var(--color-tooltip-bg)",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                        fontSize: "13px",
                        color: "var(--color-text)",
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
    );
}

interface DemographicPieChartProps {
    selectedField: string;
    onFieldChange: (field: string) => void;
}

export default function DemographicPieChart({ selectedField, onFieldChange }: DemographicPieChartProps) {
    const { filteredAnalysis } = useAppState();
    const result = filteredAnalysis;

    if (!result) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5"
        >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">สัดส่วนตามข้อมูลประชากร</h3>
                    <ChartModal title="สัดส่วนตามข้อมูลประชากร">
                        <DemographicPieContent selectedField={selectedField} height={500} />
                    </ChartModal>
                </div>
                <div className="flex gap-1 flex-wrap">
                    {DEMO_FIELDS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => onFieldChange(f.key)}
                            className={`tab-btn text-xs ${selectedField === f.key ? "active" : ""}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <DemographicPieContent selectedField={selectedField} />
        </motion.div>
    );
}
