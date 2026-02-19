"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppState } from "@/lib/store";
import {
    FACTOR_LABELS,
    FACTOR_GROUP_INDICES,
    ENGAGEMENT_GROUP_INDICES,
    FactorGroup,
} from "@/types/survey";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { ShieldAlert, TrendingDown, Minus, TrendingUp, Download } from "lucide-react";
import FilterPanel from "@/components/FilterPanel";

// Pearson correlation
function pearson(xs: number[], ys: number[]): number {
    const n = xs.length;
    if (n < 3) return 0;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
    const dx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0));
    const dy = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0));
    return dx && dy ? num / (dx * dy) : 0;
}

const RISK_CONFIG = {
    high:   { label: "เสี่ยงสูง",   color: "#ef4444", bg: "bg-red-50 dark:bg-red-950/20",     border: "border-red-300 dark:border-red-700",     text: "text-red-700 dark:text-red-400",     icon: TrendingDown },
    medium: { label: "เสี่ยงปานกลาง", color: "#f97316", bg: "bg-orange-50 dark:bg-orange-950/20", border: "border-orange-300 dark:border-orange-700", text: "text-orange-700 dark:text-orange-400", icon: Minus },
    low:    { label: "เสี่ยงต่ำ",    color: "#10b981", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-300 dark:border-emerald-700", text: "text-emerald-700 dark:text-emerald-400", icon: TrendingUp },
};

type RiskLevel = "high" | "medium" | "low";

function getRiskLevel(score: number): RiskLevel {
    if (score >= 0.6) return "high";
    if (score >= 0.35) return "medium";
    return "low";
}

const FACTOR_GROUP_NAMES = Object.keys(FACTOR_GROUP_INDICES);

export default function PredictiveRisk() {
    const { filteredData } = useAppState();
    const [view, setView] = useState<"summary" | "individual">("summary");
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 20;

    // 1. Compute per-person overall engagement score
    const personEngScores = useMemo(() =>
        filteredData.map((r) => {
            const vals = r.engagement.filter((v) => v > 0);
            return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        }),
        [filteredData]
    );

    // 2. Compute item-level correlations with engagement (weights)
    const itemWeights = useMemo(() => {
        return FACTOR_LABELS.map((_, i) => {
            const pairs = filteredData
                .map((r, j) => ({ x: r.factors[i], y: personEngScores[j] }))
                .filter((p) => p.x > 0 && p.y > 0);
            const xs = pairs.map((p) => p.x);
            const ys = pairs.map((p) => p.y);
            return Math.max(0, pearson(xs, ys)); // only positive correlations matter for risk
        });
    }, [filteredData, personEngScores]);

    // 3. Compute per-person risk score (weighted low-factor score)
    const personRisks = useMemo(() => {
        const totalWeight = itemWeights.reduce((a, b) => a + b, 0) || 1;
        return filteredData.map((r, idx) => {
            // Risk = weighted average of (5 - factor_score) for items with positive correlation
            let weightedRisk = 0;
            let usedWeight = 0;
            itemWeights.forEach((w, i) => {
                const v = r.factors[i];
                if (w > 0 && v > 0) {
                    weightedRisk += w * (5 - v); // invert: low score = high risk
                    usedWeight += w;
                }
            });
            const rawScore = usedWeight > 0 ? weightedRisk / (usedWeight * 4) : 0; // normalize to 0-1
            const engScore = personEngScores[idx];
            // Blend: 70% factor-based risk + 30% low engagement
            const engRisk = engScore > 0 ? (5 - engScore) / 4 : 0;
            const finalScore = rawScore * 0.7 + engRisk * 0.3;

            // Find weakest factor group
            let weakestGroup = "";
            let weakestScore = 5;
            FACTOR_GROUP_NAMES.forEach((g) => {
                const idxs = FACTOR_GROUP_INDICES[g as FactorGroup];
                const vals = idxs.map((i) => r.factors[i]).filter((v) => v > 0);
                if (vals.length) {
                    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                    if (avg < weakestScore) { weakestScore = avg; weakestGroup = g; }
                }
            });

            return {
                idx,
                riskScore: Math.round(finalScore * 1000) / 1000,
                riskLevel: getRiskLevel(finalScore),
                engScore: Math.round((engScore || 0) * 100) / 100,
                factorScore: Math.round((filteredData[idx].factors.filter((v) => v > 0).reduce((a, b) => a + b, 0) / (filteredData[idx].factors.filter((v) => v > 0).length || 1)) * 100) / 100,
                weakestGroup,
                weakestGroupScore: Math.round(weakestScore * 100) / 100,
                demographics: r.demographics,
            };
        }).sort((a, b) => b.riskScore - a.riskScore);
    }, [filteredData, itemWeights, personEngScores]);

    // 4. Summary stats
    const riskCounts = useMemo(() => ({
        high:   personRisks.filter((p) => p.riskLevel === "high").length,
        medium: personRisks.filter((p) => p.riskLevel === "medium").length,
        low:    personRisks.filter((p) => p.riskLevel === "low").length,
    }), [personRisks]);

    // 5. Risk by factor group (avg risk score of people with that weakest group)
    const groupRiskData = useMemo(() =>
        FACTOR_GROUP_NAMES.map((g) => {
            const members = personRisks.filter((p) => p.weakestGroup === g);
            const avg = members.length ? members.reduce((s, p) => s + p.riskScore, 0) / members.length : 0;
            return { group: g.length > 10 ? g.slice(0, 10) + "…" : g, fullGroup: g, avgRisk: Math.round(avg * 1000) / 1000, count: members.length };
        }).filter((g) => g.count > 0).sort((a, b) => b.avgRisk - a.avgRisk),
        [personRisks]
    );

    // 6. Top risk factor items
    const topRiskItems = useMemo(() =>
        FACTOR_LABELS.map((label, i) => {
            const vals = filteredData.map((r) => r.factors[i]).filter((v) => v > 0);
            const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            return { label, avg: Math.round(avg * 100) / 100, weight: itemWeights[i], idx: i };
        }).filter((x) => x.avg > 0).sort((a, b) => a.avg - b.avg).slice(0, 10),
        [filteredData, itemWeights]
    );

    function exportCSV() {
        const rows = ["ลำดับ,คะแนนความเสี่ยง,ระดับความเสี่ยง,คะแนนปัจจัย,คะแนนผูกพัน,กลุ่มอ่อนแอสุด,คะแนนกลุ่มอ่อนแอ,ยศ,สังกัด,เพศ,เจเนอเรชั่น"];
        personRisks.forEach((p, i) => {
            rows.push(`${i + 1},${p.riskScore},${RISK_CONFIG[p.riskLevel].label},${p.factorScore},${p.engScore},"${p.weakestGroup}",${p.weakestGroupScore},"${p.demographics.rank}","${p.demographics.unit}","${p.demographics.gender}","${p.demographics.ageGroup}"`);
        });
        const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "predictive_risk.csv"; a.click();
        URL.revokeObjectURL(url);
    }

    if (filteredData.length < 5) {
        return (
            <div className="glass-card p-8 text-center text-[var(--color-text-secondary)] text-sm">
                ต้องการข้อมูลอย่างน้อย 5 รายการเพื่อคำนวณ Predictive Risk Score
            </div>
        );
    }

    const pagedRisks = personRisks.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const totalPages = Math.ceil(personRisks.length / PAGE_SIZE);

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <FilterPanel />

            {/* Header */}
            <div className="glass-card p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-orange-500" />
                        <div>
                            <h2 className="text-base font-bold text-[var(--color-text)]">Predictive Risk Score — ความเสี่ยงรายบุคคล</h2>
                            <p className="text-xs text-[var(--color-text-secondary)]">
                                คำนวณจากปัจจัยที่มีสหสัมพันธ์สูงกับความผูกพัน (Weighted Factor Risk + Low Engagement) · {filteredData.length.toLocaleString()} คน
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-primary-light)]/20 transition"
                    >
                        <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                    {(["high", "medium", "low"] as RiskLevel[]).map((level) => {
                        const cfg = RISK_CONFIG[level];
                        const Icon = cfg.icon;
                        const count = riskCounts[level];
                        const pct = filteredData.length > 0 ? Math.round((count / filteredData.length) * 100) : 0;
                        return (
                            <div key={level} className={`rounded-xl p-3 border ${cfg.bg} ${cfg.border}`}>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Icon className={`w-4 h-4 ${cfg.text}`} />
                                    <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</span>
                                </div>
                                <p className={`text-2xl font-extrabold ${cfg.text}`}>{count.toLocaleString()}</p>
                                <p className="text-xs text-[var(--color-text-secondary)]">{pct}% ของทั้งหมด</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Risk by weakest group */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-bold mb-3 text-[var(--color-text)]">กลุ่มปัจจัยที่เป็นจุดอ่อนหลักของกำลังพลเสี่ยงสูง</h3>
                <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={groupRiskData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                            <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 10 }} />
                            <YAxis type="category" dataKey="group" tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} width={80} />
                            <Tooltip
                                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 11 }}
                                formatter={(v?: number, _?: string, props?: {payload?: {count?: number}}) => [`${((v ?? 0) * 100).toFixed(1)}% (${props?.payload?.count ?? 0} คน)`, "ค่าเฉลี่ยความเสี่ยง"]}
                                labelFormatter={(label) => groupRiskData.find((g) => g.group === label)?.fullGroup ?? label}
                            />
                            <ReferenceLine x={0.6} stroke="#ef4444" strokeDasharray="4 2" label={{ value: "เสี่ยงสูง", position: "top", fontSize: 9, fill: "#ef4444" }} />
                            <ReferenceLine x={0.35} stroke="#f97316" strokeDasharray="4 2" label={{ value: "ปานกลาง", position: "top", fontSize: 9, fill: "#f97316" }} />
                            <Bar dataKey="avgRisk" radius={[0, 4, 4, 0]}>
                                {groupRiskData.map((entry) => (
                                    <Cell key={entry.group} fill={RISK_CONFIG[getRiskLevel(entry.avgRisk)].color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top risk factor items */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-bold mb-3 text-[var(--color-text)]">10 ข้อปัจจัยที่มีคะแนนต่ำสุด (เรียงตามความสัมพันธ์กับความผูกพัน)</h3>
                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topRiskItems} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                            <XAxis type="number" domain={[0, 5]} tickCount={6} tick={{ fontSize: 10 }} />
                            <YAxis type="category" dataKey="label" tick={{ fontSize: 9, fill: "var(--color-text-secondary)" }} width={100} />
                            <Tooltip
                                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 11 }}
                                formatter={(v?: number, name?: string) => [(v ?? 0).toFixed(name === "avg" ? 2 : 3), name === "avg" ? "ค่าเฉลี่ย" : "น้ำหนัก (r)"]}
                            />
                            <ReferenceLine x={3.5} stroke="#f97316" strokeDasharray="4 2" label={{ value: "3.50", position: "top", fontSize: 9, fill: "#f97316" }} />
                            <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                                {topRiskItems.map((entry) => (
                                    <Cell key={entry.label} fill={entry.avg < 3.0 ? "#ef4444" : entry.avg < 3.5 ? "#f97316" : "#fbbf24"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* View toggle */}
            <div className="flex gap-2">
                {(["summary", "individual"] as const).map((v) => (
                    <button
                        key={v}
                        onClick={() => { setView(v); setPage(0); }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${view === v ? "bg-[var(--color-primary)] text-white" : "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)]/20"}`}
                    >
                        {v === "summary" ? "สรุปรายกลุ่ม" : "รายบุคคล"}
                    </button>
                ))}
            </div>

            {/* Summary view: risk distribution by demographic */}
            {view === "summary" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(["rank", "unit", "ageGroup", "gender"] as const).map((field) => {
                        const fieldLabel: Record<string, string> = { rank: "ชั้นยศ", unit: "สังกัด", ageGroup: "เจเนอเรชั่น", gender: "เพศ" };
                        const groups: Record<string, { high: number; medium: number; low: number; total: number }> = {};
                        personRisks.forEach((p) => {
                            const key = p.demographics[field] || "ไม่ระบุ";
                            if (!groups[key]) groups[key] = { high: 0, medium: 0, low: 0, total: 0 };
                            groups[key][p.riskLevel]++;
                            groups[key].total++;
                        });
                        const rows = Object.entries(groups).sort((a, b) => (b[1].high / b[1].total) - (a[1].high / a[1].total)).slice(0, 8);
                        return (
                            <div key={field} className="glass-card p-4">
                                <h4 className="text-xs font-bold mb-3 text-[var(--color-text)]">ความเสี่ยงตาม{fieldLabel[field]}</h4>
                                <div className="space-y-2">
                                    {rows.map(([key, counts]) => {
                                        const highPct = Math.round((counts.high / counts.total) * 100);
                                        const medPct = Math.round((counts.medium / counts.total) * 100);
                                        const lowPct = 100 - highPct - medPct;
                                        return (
                                            <div key={key}>
                                                <div className="flex justify-between text-xs mb-0.5">
                                                    <span className="text-[var(--color-text-secondary)] truncate max-w-[140px]">{key}</span>
                                                    <span className="text-[var(--color-text-secondary)]">{counts.total} คน · เสี่ยงสูง {highPct}%</span>
                                                </div>
                                                <div className="flex h-2 rounded-full overflow-hidden">
                                                    {highPct > 0 && <div style={{ width: `${highPct}%` }} className="bg-red-500" title={`เสี่ยงสูง ${highPct}%`} />}
                                                    {medPct > 0 && <div style={{ width: `${medPct}%` }} className="bg-orange-400" title={`ปานกลาง ${medPct}%`} />}
                                                    {lowPct > 0 && <div style={{ width: `${lowPct}%` }} className="bg-emerald-400" title={`เสี่ยงต่ำ ${lowPct}%`} />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Individual view: paginated table */}
            {view === "individual" && (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                                    <th className="text-left p-3 font-bold">#</th>
                                    <th className="text-left p-3 font-bold">ระดับความเสี่ยง</th>
                                    <th className="text-right p-3 font-bold">คะแนนเสี่ยง</th>
                                    <th className="text-right p-3 font-bold">ปัจจัย</th>
                                    <th className="text-right p-3 font-bold">ผูกพัน</th>
                                    <th className="text-left p-3 font-bold">กลุ่มอ่อนแอสุด</th>
                                    <th className="text-left p-3 font-bold">ยศ</th>
                                    <th className="text-left p-3 font-bold">สังกัด</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedRisks.map((p, i) => {
                                    const cfg = RISK_CONFIG[p.riskLevel];
                                    return (
                                        <tr key={p.idx} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]/50 transition-colors">
                                            <td className="p-3 text-[var(--color-text-secondary)]">{page * PAGE_SIZE + i + 1}</td>
                                            <td className="p-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right font-bold" style={{ color: cfg.color }}>{(p.riskScore * 100).toFixed(1)}%</td>
                                            <td className="p-3 text-right">{p.factorScore.toFixed(2)}</td>
                                            <td className="p-3 text-right">{p.engScore.toFixed(2)}</td>
                                            <td className="p-3 text-[var(--color-text-secondary)] max-w-[120px] truncate">{p.weakestGroup}</td>
                                            <td className="p-3 text-[var(--color-text-secondary)]">{p.demographics.rank}</td>
                                            <td className="p-3 text-[var(--color-text-secondary)] max-w-[100px] truncate">{p.demographics.unit}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between p-3 border-t border-[var(--color-border)]">
                            <span className="text-xs text-[var(--color-text-secondary)]">หน้า {page + 1} / {totalPages} · {personRisks.length.toLocaleString()} รายการ</span>
                            <div className="flex gap-1">
                                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1 rounded-lg text-xs border border-[var(--color-border)] disabled:opacity-40 hover:bg-[var(--color-surface-alt)] transition">← ก่อนหน้า</button>
                                <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page === totalPages - 1} className="px-3 py-1 rounded-lg text-xs border border-[var(--color-border)] disabled:opacity-40 hover:bg-[var(--color-surface-alt)] transition">ถัดไป →</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
