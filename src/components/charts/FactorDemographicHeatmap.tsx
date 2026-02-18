"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAppState } from "@/lib/store";
import { FACTOR_LABELS, FACTOR_GROUP_INDICES, FactorGroup } from "@/types/survey";
import ChartModal from "@/components/ChartModal";

const DEMO_FIELDS = [
    { key: "gender", label: "เพศ" },
    { key: "rank", label: "ชั้นยศ" },
    { key: "ageGroup", label: "เจเนอเรชั่น" },
    { key: "unit", label: "สังกัด" },
    { key: "maritalStatus", label: "สถานภาพสมรส" },
    { key: "education", label: "ระดับการศึกษา" },
    { key: "serviceYears", label: "อายุราชการ" },
    { key: "income", label: "รายได้" },
    { key: "housing", label: "ที่อยู่อาศัย" },
    { key: "familyInArmy", label: "ครอบครัวใน ทบ." },
    { key: "hasDependents", label: "ภาระอุปการะ" },
] as const;

type DemoKey = typeof DEMO_FIELDS[number]["key"];

function scoreToColor(score: number): string {
    if (score === 0) return "#e5e7eb";
    const clamped = Math.max(1, Math.min(5, score));
    const t = (clamped - 1) / 4;
    if (t >= 0.75) return "#10b981";
    if (t >= 0.55) return "#34d399";
    if (t >= 0.4) return "#fbbf24";
    if (t >= 0.25) return "#f97316";
    return "#ef4444";
}

function scoreToTextColor(score: number): string {
    if (score === 0) return "#9ca3af";
    const clamped = Math.max(1, Math.min(5, score));
    const t = (clamped - 1) / 4;
    return t >= 0.4 ? "#fff" : "#fff";
}

function HeatmapContent({ demoField, height = 400 }: { demoField: DemoKey; height?: number }) {
    const { filteredData } = useAppState();

    const { groups, matrix } = useMemo(() => {
        const groupMap: Record<string, number[][]> = {};
        for (const r of filteredData) {
            const key = (r.demographics[demoField] || "ไม่ระบุ").trim();
            if (!groupMap[key]) groupMap[key] = Array.from({ length: 29 }, () => []);
            r.factors.forEach((v, i) => { if (v > 0) groupMap[key][i].push(v); });
        }
        const groups = Object.keys(groupMap).sort();
        const matrix: number[][] = groups.map((g) =>
            groupMap[g].map((vals) => vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0)
        );
        return { groups, matrix };
    }, [filteredData, demoField]);

    if (groups.length === 0) return <p className="text-sm text-center py-8 text-[var(--color-text-secondary)]">ไม่มีข้อมูล</p>;

    const cellH = Math.max(24, Math.floor((height - 60) / 29));
    const cellW = Math.max(60, Math.floor(400 / groups.length));

    return (
        <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: height + 40 }}>
            <table className="border-collapse text-[10px]" style={{ minWidth: groups.length * cellW + 180 }}>
                <thead>
                    <tr>
                        <th className="p-1 text-left sticky left-0 bg-[var(--color-surface)] z-10 text-xs font-bold min-w-[160px]">ปัจจัย</th>
                        {groups.map((g) => (
                            <th key={g} className="p-1 text-center font-medium whitespace-nowrap" style={{ minWidth: cellW }}>
                                {g.length > 16 ? g.substring(0, 16) + "…" : g}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {FACTOR_LABELS.map((label, idx) => {
                        const groupName = Object.entries(FACTOR_GROUP_INDICES).find(([, indices]) => indices.includes(idx))?.[0] ?? "";
                        return (
                            <tr key={idx}>
                                <td className="p-1 sticky left-0 bg-[var(--color-surface)] z-10 whitespace-nowrap font-medium" style={{ height: cellH }}>
                                    <span className="text-[var(--color-text-light)] mr-1">{idx + 1}.</span>
                                    {label}
                                    <span className="ml-1 text-[8px] text-[var(--color-text-light)]">({groupName})</span>
                                </td>
                                {groups.map((g, gi) => {
                                    const score = matrix[gi]?.[idx] ?? 0;
                                    return (
                                        <td
                                            key={g}
                                            title={`${g} — ${label}: ${score > 0 ? score.toFixed(2) : "ไม่มีข้อมูล"}`}
                                            className="text-center font-bold transition-all"
                                            style={{
                                                background: scoreToColor(score),
                                                color: scoreToTextColor(score),
                                                height: cellH,
                                                minWidth: cellW,
                                            }}
                                        >
                                            {score > 0 ? score.toFixed(1) : "—"}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div className="mt-3 flex gap-3 flex-wrap text-xs text-[var(--color-text-secondary)] px-1">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block" style={{ background: "#10b981" }} /> ≥4.5</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block" style={{ background: "#34d399" }} /> 4.0–4.49</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block" style={{ background: "#fbbf24" }} /> 3.5–3.99</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block" style={{ background: "#f97316" }} /> 3.0–3.49</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block" style={{ background: "#ef4444" }} /> &lt;3.0</span>
            </div>
        </div>
    );
}

export default function FactorDemographicHeatmap() {
    const { filteredData } = useAppState();
    const [demoField, setDemoField] = useState<DemoKey>("rank");

    if (filteredData.length === 0) return null;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">Heatmap ปัจจัยรายข้อตามกลุ่ม</h3>
                    <ChartModal title="Heatmap ปัจจัยรายข้อตามกลุ่ม">
                        <HeatmapContent demoField={demoField} height={700} />
                    </ChartModal>
                </div>
                <div className="flex gap-1 flex-wrap">
                    {DEMO_FIELDS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setDemoField(f.key)}
                            className={`tab-btn text-xs ${demoField === f.key ? "active" : ""}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>
            <HeatmapContent demoField={demoField} height={400} />
        </motion.div>
    );
}
