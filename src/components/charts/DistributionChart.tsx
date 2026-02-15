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
import { FACTOR_LABELS, ENGAGEMENT_LABELS, FACTOR_GROUP_INDICES, FactorGroup } from "@/types/survey";
import { useState } from "react";

const LIKERT_COLORS: Record<string, string> = {
    "5 มากที่สุด": "#00B894",
    "4 มาก": "#55EFC4",
    "3 ปานกลาง": "#FDDCB5",
    "2 น้อย": "#F4B8C1",
    "1 น้อยที่สุด": "#E17055",
};

export default function DistributionChart() {
    const { state } = useAppState();
    const result = state.analysisResult;
    const [selectedGroup, setSelectedGroup] = useState<string>("all");

    if (!result || result.totalResponses === 0) return null;

    // Get item stats filtered by group
    let items = result.itemStats.filter((it) => it.index < 29); // factors only

    if (selectedGroup !== "all") {
        const indices = FACTOR_GROUP_INDICES[selectedGroup as FactorGroup];
        if (indices) {
            items = items.filter((it) => indices.includes(it.index));
        }
    }

    // Build distribution data per item
    const chartData = items.map((it) => {
        const vals = state.surveyData.map((r) => r.factors[it.index]).filter((v) => v > 0);
        const dist: Record<string, number> = {};
        for (let v = 1; v <= 5; v++) {
            const count = vals.filter((x) => x === v).length;
            const label = v === 5 ? "5 มากที่สุด" : v === 4 ? "4 มาก" : v === 3 ? "3 ปานกลาง" : v === 2 ? "2 น้อย" : "1 น้อยที่สุด";
            dist[label] = Math.round((count / Math.max(vals.length, 1)) * 100);
        }
        return {
            name: it.label.length > 12 ? it.label.substring(0, 12) + "..." : it.label,
            fullName: it.label,
            ...dist,
        };
    });

    const groups = [
        { key: "all", label: "ทั้งหมด" },
        ...Object.values(FactorGroup).map((g) => ({ key: g, label: g })),
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5"
        >
            <h3 className="text-base font-bold mb-4">การกระจายคำตอบ (Distribution)</h3>
            <div className="flex gap-1 mb-4 flex-wrap">
                {groups.map((g) => (
                    <button
                        key={g.key}
                        onClick={() => setSelectedGroup(g.key)}
                        className={`tab-btn text-xs ${selectedGroup === g.key ? "active" : ""}`}
                    >
                        {g.label}
                    </button>
                ))}
            </div>

            <ResponsiveContainer width="100%" height={Math.max(300, items.length * 32)}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF1" />
                    <XAxis type="number" domain={[0, 100]} unit="%" fontSize={11} />
                    <YAxis type="category" dataKey="name" width={100} fontSize={10} tick={{ fill: "#636E72" }} />
                    <Tooltip
                        contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #E8ECF1",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                            fontSize: "12px",
                        }}
                        formatter={(value, name) => [`${value ?? 0}%`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    {Object.entries(LIKERT_COLORS).reverse().map(([key, color]) => (
                        <Bar key={key} dataKey={key} stackId="a" fill={color} barSize={18} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
