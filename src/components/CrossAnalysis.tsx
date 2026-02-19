"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useAppState } from "@/lib/store";
import {
    FACTOR_LABELS,
    FACTOR_GROUP_INDICES,
    ENGAGEMENT_GROUP_INDICES,
    FactorGroup,
    EngagementGroup,
} from "@/types/survey";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, ScatterChart, Scatter,
    ReferenceLine,
} from "recharts";
import { Link2 } from "lucide-react";
import FilterPanel from "@/components/FilterPanel";

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

function corrColor(r: number): string {
    const abs = Math.abs(r);
    if (abs >= 0.7) return r > 0 ? "#10b981" : "#ef4444";
    if (abs >= 0.5) return r > 0 ? "#34d399" : "#f97316";
    if (abs >= 0.3) return r > 0 ? "#fbbf24" : "#fbbf24";
    return "#94a3b8";
}

function corrLabel(r: number): string {
    const abs = Math.abs(r);
    const dir = r >= 0 ? "+" : "-";
    if (abs >= 0.7) return `${dir}สูงมาก`;
    if (abs >= 0.5) return `${dir}สูง`;
    if (abs >= 0.3) return `${dir}ปานกลาง`;
    if (abs >= 0.1) return `${dir}ต่ำ`;
    return "ไม่มี";
}

const FACTOR_GROUP_COLORS: Record<string, string> = {
    [FactorGroup.JobCharacteristics]:   "#3B7DD8",
    [FactorGroup.WorkEnvironment]:      "#2ECC71",
    [FactorGroup.QualityOfWorkLife]:    "#E74C8B",
    [FactorGroup.ColleagueRelations]:   "#9B59B6",
    [FactorGroup.SupervisorRelations]:  "#F39C12",
    [FactorGroup.PolicyAdmin]:          "#1ABC9C",
    [FactorGroup.BenefitsCompensation]: "#E74C3C",
    [FactorGroup.EvaluationCareer]:     "#F1C40F",
};

const ENG_GROUP_COLORS: Record<string, string> = {
    [EngagementGroup.AttitudeLoyalty]:    "#f59e0b",
    [EngagementGroup.WillingnessDedicate]: "#10b981",
    [EngagementGroup.OrganizationalTrust]: "#3B7DD8",
};

export default function CrossAnalysis() {
    const { filteredData } = useAppState();

    // Factor group means per person
    const personFactorGroups = useMemo(() =>
        filteredData.map((r) =>
            Object.entries(FACTOR_GROUP_INDICES).map(([, idxs]) => {
                const vals = idxs.map((i) => r.factors[i]).filter((v) => v > 0);
                return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            })
        ),
        [filteredData]
    );

    // Engagement group means per person
    const personEngGroups = useMemo(() =>
        filteredData.map((r) =>
            Object.entries(ENGAGEMENT_GROUP_INDICES).map(([, idxs]) => {
                const vals = idxs.map((i) => r.engagement[i]).filter((v) => v > 0);
                return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            })
        ),
        [filteredData]
    );

    // Overall engagement score per person
    const personEngOverall = useMemo(() =>
        filteredData.map((r) => {
            const vals = r.engagement.filter((v) => v > 0);
            return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        }),
        [filteredData]
    );

    const factorGroupNames = Object.keys(FACTOR_GROUP_INDICES);
    const engGroupNames = Object.keys(ENGAGEMENT_GROUP_INDICES);

    // Correlation matrix: factor group × engagement group
    const corrMatrix = useMemo(() =>
        factorGroupNames.map((_, fi) =>
            engGroupNames.map((_, ei) => {
                const xs = personFactorGroups.map((p) => p[fi]);
                const ys = personEngGroups.map((p) => p[ei]);
                return Math.round(pearson(xs, ys) * 1000) / 1000;
            })
        ),
        [personFactorGroups, personEngGroups, factorGroupNames, engGroupNames]
    );

    // Factor item × overall engagement correlation (top predictors)
    const itemCorrs = useMemo(() =>
        FACTOR_LABELS.map((label, i) => {
            const xs = filteredData.map((r) => r.factors[i]).filter((_, j) => personEngOverall[j] > 0);
            const ys = personEngOverall.filter((v) => v > 0);
            const minLen = Math.min(xs.length, ys.length);
            const r = pearson(xs.slice(0, minLen), ys.slice(0, minLen));
            // find group
            let group = "";
            Object.entries(FACTOR_GROUP_INDICES).forEach(([g, idxs]) => {
                if (idxs.includes(i)) group = g;
            });
            return { label, r: Math.round(r * 1000) / 1000, group, idx: i };
        }).sort((a, b) => b.r - a.r),
        [filteredData, personEngOverall]
    );

    // Scatter data: overall factor vs overall engagement
    const scatterData = useMemo(() =>
        filteredData.map((r) => {
            const fVals = r.factors.filter((v) => v > 0);
            const eVals = r.engagement.filter((v) => v > 0);
            return {
                x: fVals.length ? Math.round((fVals.reduce((a, b) => a + b, 0) / fVals.length) * 100) / 100 : 0,
                y: eVals.length ? Math.round((eVals.reduce((a, b) => a + b, 0) / eVals.length) * 100) / 100 : 0,
            };
        }).filter((p) => p.x > 0 && p.y > 0),
        [filteredData]
    );

    const overallCorr = useMemo(() => {
        const xs = scatterData.map((p) => p.x);
        const ys = scatterData.map((p) => p.y);
        return Math.round(pearson(xs, ys) * 1000) / 1000;
    }, [scatterData]);

    if (filteredData.length === 0) {
        return (
            <div className="glass-card p-12 text-center">
                <p className="text-[var(--color-text-secondary)]">กรุณาโหลดข้อมูลก่อนเพื่อดูการวิเคราะห์ความสัมพันธ์</p>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <FilterPanel />

            {/* Header */}
            <div className="glass-card p-5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center">
                        <Link2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-[var(--color-text)]">
                            Cross-Analysis — ส่วนที่ 2 × ส่วนที่ 3
                        </h2>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                            ความสัมพันธ์ระหว่างปัจจัยในงาน (29 ข้อ) กับความสุขและความผูกพัน (11 ข้อ) · {filteredData.length} คน
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-[var(--color-surface-alt)] text-center">
                        <p className="text-xs text-[var(--color-text-secondary)]">สหสัมพันธ์รวม (r)</p>
                        <p className="text-2xl font-extrabold" style={{ color: corrColor(overallCorr) }}>{overallCorr.toFixed(3)}</p>
                        <p className="text-xs font-medium" style={{ color: corrColor(overallCorr) }}>{corrLabel(overallCorr)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--color-surface-alt)] text-center">
                        <p className="text-xs text-[var(--color-text-secondary)]">ปัจจัยที่ส่งผลมากที่สุด</p>
                        <p className="text-sm font-bold text-violet-600 dark:text-violet-400 mt-1 truncate">{itemCorrs[0]?.label}</p>
                        <p className="text-lg font-extrabold text-violet-600 dark:text-violet-400">r = {itemCorrs[0]?.r.toFixed(3)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--color-surface-alt)] text-center col-span-2 md:col-span-1">
                        <p className="text-xs text-[var(--color-text-secondary)]">ปัจจัยที่ส่งผลน้อยที่สุด</p>
                        <p className="text-sm font-bold text-slate-500 mt-1 truncate">{itemCorrs[itemCorrs.length - 1]?.label}</p>
                        <p className="text-lg font-extrabold text-slate-500">r = {itemCorrs[itemCorrs.length - 1]?.r.toFixed(3)}</p>
                    </div>
                </div>
            </div>

            {/* Scatter Plot */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-bold mb-1 text-[var(--color-text)]">Scatter Plot — คะแนนเฉลี่ยปัจจัย vs ความผูกพัน (รายบุคคล)</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mb-3">แต่ละจุด = 1 คน · แกน X = คะแนนปัจจัยเฉลี่ย · แกน Y = คะแนนความผูกพันเฉลี่ย</p>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" />
                            <XAxis type="number" dataKey="x" domain={[1, 5]} tickCount={5} fontSize={10} tick={{ fill: "var(--color-chart-text)" }} label={{ value: "ปัจจัย", position: "insideBottom", offset: -2, fontSize: 10 }} />
                            <YAxis type="number" dataKey="y" domain={[1, 5]} tickCount={5} fontSize={10} tick={{ fill: "var(--color-chart-text)" }} label={{ value: "ผูกพัน", angle: -90, position: "insideLeft", fontSize: 10 }} />
                            <Tooltip
                                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 11 }}
                                formatter={(v: unknown, name?: string) => [(v as number).toFixed(2), name === "x" ? "ปัจจัย" : "ความผูกพัน"]}
                            />
                            <ReferenceLine x={3} stroke="var(--color-border)" strokeDasharray="4 2" />
                            <ReferenceLine y={3} stroke="var(--color-border)" strokeDasharray="4 2" />
                            <Scatter data={scatterData} fill="#7c3aed" fillOpacity={0.4} />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Correlation Matrix: Factor Group × Engagement Group */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-bold mb-3 text-[var(--color-text)]">Correlation Matrix — กลุ่มปัจจัย × กลุ่มความผูกพัน</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr>
                                <th className="text-left p-2 text-[var(--color-text-secondary)] font-medium w-44">กลุ่มปัจจัย (ส่วนที่ 2)</th>
                                {engGroupNames.map((eg) => (
                                    <th key={eg} className="p-2 text-center text-[var(--color-text-secondary)] font-medium min-w-[110px]">
                                        <span className="inline-block px-1.5 py-0.5 rounded-full text-white text-[9px]" style={{ background: ENG_GROUP_COLORS[eg] ?? "#94a3b8" }}>
                                            {eg}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {factorGroupNames.map((fg, fi) => (
                                <tr key={fg} className="border-t border-[var(--color-border)]">
                                    <td className="p-2 font-medium text-[var(--color-text)]">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: FACTOR_GROUP_COLORS[fg] ?? "#94a3b8" }} />
                                            <span className="truncate">{fg}</span>
                                        </div>
                                    </td>
                                    {corrMatrix[fi].map((r, ei) => (
                                        <td key={ei} className="p-2 text-center">
                                            <div className="inline-flex flex-col items-center gap-0.5">
                                                <span className="font-bold text-sm" style={{ color: corrColor(r) }}>{r.toFixed(3)}</span>
                                                <span className="text-[9px]" style={{ color: corrColor(r) }}>{corrLabel(r)}</span>
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-[var(--color-text-secondary)]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> r ≥ 0.7 สูงมาก</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> 0.5–0.7 สูง</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> 0.3–0.5 ปานกลาง</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> &lt; 0.3 ต่ำ/ไม่มี</span>
                </div>
            </div>

            {/* Top predictors bar chart */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-bold mb-1 text-[var(--color-text)]">ปัจจัยที่ส่งผลต่อความผูกพันมากที่สุด (Top 10)</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mb-3">สหสัมพันธ์ Pearson ระหว่างแต่ละข้อปัจจัย (ส่วนที่ 2) กับคะแนนความผูกพันรวม (ส่วนที่ 3)</p>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={itemCorrs.slice(0, 10).map((d) => ({ name: d.label, r: d.r, group: d.group }))}
                            layout="vertical"
                            margin={{ left: 8, right: 50 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" />
                            <XAxis type="number" domain={[-0.1, 1]} tickCount={6} fontSize={10} tick={{ fill: "var(--color-chart-text)" }} />
                            <YAxis type="category" dataKey="name" width={150} fontSize={9} tick={{ fill: "var(--color-chart-text)" }} />
                            <Tooltip
                                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 11 }}
                                formatter={(v: unknown) => [(v as number).toFixed(3), "r (Pearson)"]}
                            />
                            <Bar dataKey="r" radius={[0, 4, 4, 0]}
                                label={{ position: "right", fontSize: 9, formatter: (v: unknown) => (v as number).toFixed(3) }}>
                                {itemCorrs.slice(0, 10).map((d) => (
                                    <Cell key={d.idx} fill={FACTOR_GROUP_COLORS[d.group] ?? "#7c3aed"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom predictors */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-bold mb-1 text-[var(--color-text)]">ปัจจัยที่ส่งผลน้อยที่สุด (Bottom 10)</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={[...itemCorrs].reverse().slice(0, 10).map((d) => ({ name: d.label, r: d.r, group: d.group }))}
                            layout="vertical"
                            margin={{ left: 8, right: 50 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" />
                            <XAxis type="number" domain={[-0.1, 1]} tickCount={6} fontSize={10} tick={{ fill: "var(--color-chart-text)" }} />
                            <YAxis type="category" dataKey="name" width={150} fontSize={9} tick={{ fill: "var(--color-chart-text)" }} />
                            <Tooltip
                                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 11 }}
                                formatter={(v: unknown) => [(v as number).toFixed(3), "r (Pearson)"]}
                            />
                            <Bar dataKey="r" radius={[0, 4, 4, 0]}
                                label={{ position: "right", fontSize: 9, formatter: (v: unknown) => (v as number).toFixed(3) }}>
                                {[...itemCorrs].reverse().slice(0, 10).map((d) => (
                                    <Cell key={d.idx} fill={FACTOR_GROUP_COLORS[d.group] ?? "#94a3b8"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Interpretation */}
            <div className="glass-card p-5 space-y-3">
                <h3 className="text-sm font-bold text-[var(--color-text)]">การตีความผล</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                        <p className="text-xs font-bold text-violet-700 dark:text-violet-300 mb-1">🔗 สหสัมพันธ์รวม</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                            r = {overallCorr.toFixed(3)} หมายความว่าปัจจัยในงาน{overallCorr >= 0.5 ? "มีความสัมพันธ์สูง" : overallCorr >= 0.3 ? "มีความสัมพันธ์ปานกลาง" : "มีความสัมพันธ์ต่ำ"}
                            กับความสุขและความผูกพัน การพัฒนาปัจจัยในงาน{overallCorr >= 0.5 ? "จะส่งผลชัดเจน" : "อาจส่งผล"}ต่อความผูกพันของบุคลากร
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">🏆 ปัจจัยสำคัญที่ควรพัฒนา</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                            {itemCorrs.slice(0, 3).map((d) => d.label).join(", ")} เป็นปัจจัยที่มีความสัมพันธ์สูงสุดกับความผูกพัน
                            การลงทุนพัฒนาด้านเหล่านี้จะให้ผลตอบแทนสูงสุดในการเพิ่มความผูกพันของบุคลากร
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
