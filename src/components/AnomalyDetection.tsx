"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useAppState } from "@/lib/store";
import { FACTOR_LABELS, ENGAGEMENT_LABELS } from "@/types/survey";
import { AlertTriangle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from "recharts";

function mean(arr: number[]) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
function sd(arr: number[], m: number) { return arr.length < 2 ? 0 : Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length); }

export default function AnomalyDetection() {
    const { filteredData } = useAppState();

    const { unitStats, globalFactorMean, globalEngMean, globalFactorSD, globalEngSD, factorAnomalies, engAnomalies } = useMemo(() => {
        if (filteredData.length < 5) return { unitStats: [], globalFactorMean: 0, globalEngMean: 0, globalFactorSD: 0, globalEngSD: 0, factorAnomalies: [], engAnomalies: [] };

        // Global means
        const allFactorMeans = filteredData.map((r) => {
            const v = r.factors.filter((x) => x > 0);
            return v.length ? mean(v) : 0;
        }).filter((v) => v > 0);
        const allEngMeans = filteredData.map((r) => {
            const v = r.engagement.filter((x) => x > 0);
            return v.length ? mean(v) : 0;
        }).filter((v) => v > 0);

        const globalFactorMean = mean(allFactorMeans);
        const globalEngMean = mean(allEngMeans);
        const globalFactorSD = sd(allFactorMeans, globalFactorMean);
        const globalEngSD = sd(allEngMeans, globalEngMean);

        // Per-unit stats
        const unitMap: Record<string, typeof filteredData> = {};
        filteredData.forEach((r) => {
            const u = r.demographics.unit || "ไม่ระบุ";
            if (!unitMap[u]) unitMap[u] = [];
            unitMap[u].push(r);
        });

        const unitStats = Object.entries(unitMap)
            .filter(([, members]) => members.length >= 3)
            .map(([unit, members]) => {
                const fMeans = members.map((r) => { const v = r.factors.filter((x) => x > 0); return v.length ? mean(v) : 0; }).filter((v) => v > 0);
                const eMeans = members.map((r) => { const v = r.engagement.filter((x) => x > 0); return v.length ? mean(v) : 0; }).filter((v) => v > 0);
                const fMean = mean(fMeans);
                const eMean = mean(eMeans);
                const fZ = globalFactorSD > 0 ? (fMean - globalFactorMean) / globalFactorSD : 0;
                const eZ = globalEngSD > 0 ? (eMean - globalEngMean) / globalEngSD : 0;
                return { unit, count: members.length, fMean, eMean, fZ, eZ };
            })
            .sort((a, b) => a.fMean - b.fMean);

        // Per-factor anomalies (item-level)
        const factorAnomalies = Array.from({ length: 29 }, (_, fi) => {
            const vals = filteredData.map((r) => r.factors[fi]).filter((v) => v > 0);
            const m = mean(vals);
            const s = sd(vals, m);
            return { label: FACTOR_LABELS[fi], mean: m, sd: s, idx: fi };
        }).filter((f) => f.mean > 0).sort((a, b) => a.mean - b.mean).slice(0, 5);

        const engAnomalies = Array.from({ length: 11 }, (_, ei) => {
            const vals = filteredData.map((r) => r.engagement[ei]).filter((v) => v > 0);
            const m = mean(vals);
            const s = sd(vals, m);
            return { label: ENGAGEMENT_LABELS[ei], mean: m, sd: s, idx: ei };
        }).filter((e) => e.mean > 0).sort((a, b) => a.mean - b.mean).slice(0, 5);

        return { unitStats, globalFactorMean, globalEngMean, globalFactorSD, globalEngSD, factorAnomalies, engAnomalies };
    }, [filteredData]);

    if (filteredData.length < 5) {
        return (
            <div className="glass-card p-8 text-center text-[var(--color-text-secondary)] text-sm">
                ต้องการข้อมูลอย่างน้อย 5 รายการเพื่อตรวจจับความผิดปกติ
            </div>
        );
    }

    const anomalousUnits = unitStats.filter((u) => Math.abs(u.fZ) >= 1 || Math.abs(u.eZ) >= 1);
    const chartData = unitStats.slice(0, 20).map((u) => ({
        unit: u.unit.length > 10 ? u.unit.slice(0, 10) + "…" : u.unit,
        fullUnit: u.unit,
        fMean: Math.round(u.fMean * 100) / 100,
        eMean: Math.round(u.eMean * 100) / 100,
        fZ: u.fZ,
        count: u.count,
    }));

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Header */}
            <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <h2 className="text-base font-bold text-[var(--color-text)]">Anomaly Detection — ตรวจจับหน่วยที่ผิดปกติ</h2>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)]">
                    ระบุหน่วยงานที่มีคะแนนต่ำกว่าค่าเฉลี่ยองค์กรเกิน 1 SD (Z-score ≤ −1) ซึ่งต้องการความใส่ใจเป็นพิเศษ
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {[
                        ["ค่าเฉลี่ยปัจจัย (องค์กร)", globalFactorMean.toFixed(2), "text-[var(--color-primary)]"],
                        ["SD ปัจจัย", globalFactorSD.toFixed(2), "text-[var(--color-text-secondary)]"],
                        ["ค่าเฉลี่ยผูกพัน (องค์กร)", globalEngMean.toFixed(2), "text-[var(--color-primary)]"],
                        ["SD ผูกพัน", globalEngSD.toFixed(2), "text-[var(--color-text-secondary)]"],
                    ].map(([label, val, cls]) => (
                        <div key={label} className="bg-[var(--color-surface-alt)] rounded-lg p-2 text-center">
                            <p className={`text-base font-black ${cls}`}>{val}</p>
                            <p className="text-[10px] text-[var(--color-text-secondary)]">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Anomalous Units Alert */}
            {anomalousUnits.length > 0 && (
                <div className="glass-card p-4 border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10">
                    <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> หน่วยที่ต้องการความใส่ใจ ({anomalousUnits.length} หน่วย)
                    </h3>
                    <div className="space-y-2">
                        {anomalousUnits.sort((a, b) => (a.fZ + a.eZ) - (b.fZ + b.eZ)).map((u) => {
                            const severity = (Math.abs(u.fZ) >= 2 || Math.abs(u.eZ) >= 2) ? "วิกฤต" : "เฝ้าระวัง";
                            const sevColor = severity === "วิกฤต" ? "text-red-600 dark:text-red-400" : "text-orange-500";
                            return (
                                <div key={u.unit} className="flex items-center justify-between gap-3 text-xs flex-wrap">
                                    <div className="flex items-center gap-2">
                                        {u.fZ <= -1 ? <TrendingDown className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5 text-gray-400" />}
                                        <span className="font-medium text-[var(--color-text)]">{u.unit}</span>
                                        <span className="text-[var(--color-text-secondary)]">({u.count} นาย)</span>
                                        <span className={`font-bold ${sevColor}`}>[{severity}]</span>
                                    </div>
                                    <div className="flex gap-3 text-[var(--color-text-secondary)]">
                                        <span>ปัจจัย: <strong className={u.fZ <= -1 ? "text-red-500" : "text-[var(--color-text)]"}>{u.fMean.toFixed(2)}</strong> (Z={u.fZ.toFixed(2)})</span>
                                        <span>ผูกพัน: <strong className={u.eZ <= -1 ? "text-red-500" : "text-[var(--color-text)]"}>{u.eMean.toFixed(2)}</strong> (Z={u.eZ.toFixed(2)})</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Bar Chart — Unit Factor Means */}
            {chartData.length > 0 && (
                <div className="glass-card p-4">
                    <h3 className="text-sm font-bold mb-3 text-[var(--color-text)]">คะแนนปัจจัยเฉลี่ยรายหน่วย (สูงสุด 20 หน่วย)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 40 }}>
                                <XAxis dataKey="unit" tick={{ fontSize: 9, fill: "var(--color-text-secondary)" }} angle={-35} textAnchor="end" interval={0} />
                                <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} />
                                <Tooltip
                                    contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 11 }}
                                    formatter={(v: unknown, name: unknown) => [(v as number).toFixed(2), name === "fMean" ? "ปัจจัยเฉลี่ย" : "ผูกพันเฉลี่ย"]}
                                    labelFormatter={(label: unknown, payload) => {
                                        const item = chartData.find((d) => d.unit === label);
                                        return `${item?.fullUnit ?? label} (${payload?.[0]?.payload?.count ?? 0} นาย)`;
                                    }}
                                />
                                <ReferenceLine y={globalFactorMean} stroke="var(--color-primary)" strokeDasharray="4 2" label={{ value: `μ=${globalFactorMean.toFixed(2)}`, position: "right", fontSize: 9, fill: "var(--color-primary)" }} />
                                <ReferenceLine y={globalFactorMean - globalFactorSD} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "μ−1SD", position: "right", fontSize: 9, fill: "#ef4444" }} />
                                <Bar dataKey="fMean" radius={[3, 3, 0, 0]}>
                                    {chartData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fZ <= -2 ? "#ef4444" : entry.fZ <= -1 ? "#f97316" : entry.fZ >= 1 ? "#10b981" : "var(--color-primary)"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-[10px]">
                        {[["วิกฤต (Z≤−2)", "#ef4444"], ["เฝ้าระวัง (Z≤−1)", "#f97316"], ["ปกติ", "var(--color-primary)"], ["ดีเยี่ยม (Z≥1)", "#10b981"]].map(([label, color]) => (
                            <div key={label} className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded inline-block" style={{ background: color }} />
                                <span className="text-[var(--color-text-secondary)]">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bottom factor/engagement items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-4">
                    <h3 className="text-sm font-bold mb-3 text-[var(--color-text)] flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-500" /> ปัจจัย 5 อันดับต่ำสุด
                    </h3>
                    <div className="space-y-2">
                        {factorAnomalies.map((f, i) => (
                            <div key={i} className="text-xs">
                                <div className="flex justify-between mb-0.5">
                                    <span className="text-[var(--color-text)]">{f.label}</span>
                                    <span className="font-bold text-red-500">{f.mean.toFixed(2)} ±{f.sd.toFixed(2)}</span>
                                </div>
                                <div className="h-1.5 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${(f.mean / 5) * 100}%`, background: f.mean < 3 ? "#ef4444" : f.mean < 3.5 ? "#f97316" : "#fbbf24" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="glass-card p-4">
                    <h3 className="text-sm font-bold mb-3 text-[var(--color-text)] flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-orange-500" /> ความผูกพัน 5 อันดับต่ำสุด
                    </h3>
                    <div className="space-y-2">
                        {engAnomalies.map((e, i) => (
                            <div key={i} className="text-xs">
                                <div className="flex justify-between mb-0.5">
                                    <span className="text-[var(--color-text)]">{e.label}</span>
                                    <span className="font-bold text-orange-500">{e.mean.toFixed(2)} ±{e.sd.toFixed(2)}</span>
                                </div>
                                <div className="h-1.5 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${(e.mean / 5) * 100}%`, background: e.mean < 3 ? "#ef4444" : e.mean < 3.5 ? "#f97316" : "#fbbf24" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="glass-card p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    <strong className="text-amber-700 dark:text-amber-400">หมายเหตุ:</strong> การวิเคราะห์นี้ใช้ Z-score เปรียบเทียบค่าเฉลี่ยของแต่ละหน่วยกับค่าเฉลี่ยองค์กร
                    หน่วยที่มี Z ≤ −1 (ต่ำกว่าค่าเฉลี่ย 1 SD) ถือว่าต้องเฝ้าระวัง และ Z ≤ −2 ถือว่าวิกฤต
                    ต้องการสมาชิกอย่างน้อย 3 นายต่อหน่วยจึงจะแสดงผล
                </p>
            </div>
        </motion.div>
    );
}
