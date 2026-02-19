"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppState } from "@/lib/store";
import {
    ENGAGEMENT_LABELS,
    ENGAGEMENT_GROUP_INDICES,
    EngagementGroup,
    interpretMean,
} from "@/types/survey";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { Heart, ChevronDown, ChevronUp } from "lucide-react";
import FilterPanel from "@/components/FilterPanel";

const GROUP_COLORS: Record<string, string> = {
    [EngagementGroup.AttitudeLoyalty]:    "#f59e0b",
    [EngagementGroup.WillingnessDedicate]: "#10b981",
    [EngagementGroup.OrganizationalTrust]: "#3B7DD8",
};

const SCORE_COLOR = (v: number) =>
    v >= 4.5 ? "#10b981" : v >= 4.0 ? "#34d399" : v >= 3.5 ? "#fbbf24" : v >= 3.0 ? "#f97316" : "#ef4444";

function ScoreBar({ score }: { score: number }) {
    const pct = Math.round((score / 5) * 100);
    return (
        <div className="flex items-center gap-2 flex-1">
            <div className="flex-1 h-2 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: SCORE_COLOR(score) }} />
            </div>
            <span className="text-xs font-bold w-8 text-right" style={{ color: SCORE_COLOR(score) }}>
                {score.toFixed(2)}
            </span>
        </div>
    );
}

function RatingBadge({ score }: { score: number }) {
    const color = score >= 4.5 ? "bg-emerald-500" : score >= 4.0 ? "bg-green-400" : score >= 3.5 ? "bg-yellow-400" : score >= 3.0 ? "bg-orange-400" : "bg-red-400";
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${color}`}>
            {interpretMean(score)}
        </span>
    );
}

export default function EngagementAnalysis() {
    const { filteredData } = useAppState();
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const itemMeans = useMemo(() =>
        Array.from({ length: 11 }, (_, i) => {
            const vals = filteredData.map((r) => r.engagement[i]).filter((v) => v > 0);
            return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        }),
        [filteredData]
    );

    const groupStats = useMemo(() =>
        Object.entries(ENGAGEMENT_GROUP_INDICES).map(([groupName, indices]) => {
            const vals = indices.map((i) => itemMeans[i]).filter((v) => v > 0);
            const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            return { groupName, mean: Math.round(mean * 100) / 100, indices };
        }),
        [itemMeans]
    );

    const overallMean = useMemo(() => {
        const all = itemMeans.filter((v) => v > 0);
        return all.length ? Math.round((all.reduce((a, b) => a + b, 0) / all.length) * 100) / 100 : 0;
    }, [itemMeans]);

    const radarData = groupStats.map((g) => ({
        label: g.groupName,
        ค่าเฉลี่ย: g.mean,
    }));

    const toggleGroup = (g: string) =>
        setExpandedGroups((prev) => ({ ...prev, [g]: !prev[g] }));
    const isExpanded = (g: string) => expandedGroups[g] !== false;

    if (filteredData.length === 0) {
        return (
            <div className="glass-card p-12 text-center">
                <p className="text-[var(--color-text-secondary)]">กรุณาโหลดข้อมูลก่อนเพื่อดูการวิเคราะห์ความสุขและความผูกพัน</p>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <FilterPanel />

            {/* Header KPI */}
            <div className="glass-card p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-[var(--color-text)]">
                            ส่วนที่ 3 — ความสุขและความผูกพันของบุคลากรที่มีต่อ ทบ.
                        </h2>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                            11 ข้อ · 3 กลุ่ม · {filteredData.length} คน
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-[var(--color-surface-alt)] text-center">
                        <p className="text-xs text-[var(--color-text-secondary)]">คะแนนเฉลี่ยรวม</p>
                        <p className="text-2xl font-extrabold" style={{ color: SCORE_COLOR(overallMean) }}>{overallMean.toFixed(2)}</p>
                        <RatingBadge score={overallMean} />
                    </div>
                    {groupStats.map((g) => (
                        <div key={g.groupName} className="p-3 rounded-xl bg-[var(--color-surface-alt)] text-center">
                            <p className="text-xs text-[var(--color-text-secondary)] leading-tight">{g.groupName}</p>
                            <p className="text-xl font-extrabold mt-1" style={{ color: GROUP_COLORS[g.groupName] ?? "#3B7DD8" }}>
                                {g.mean.toFixed(2)}
                            </p>
                            <RatingBadge score={g.mean} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Radar Chart */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-bold mb-3 text-[var(--color-text)]">โปรไฟล์คะแนนรายกลุ่ม (Radar Chart)</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="var(--color-border)" />
                            <PolarAngleAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} />
                            <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 8 }} tickCount={4} />
                            <Tooltip
                                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 11 }}
                                formatter={(v: unknown) => [(v as number).toFixed(2), "คะแนนเฉลี่ย"]}
                            />
                            <Radar dataKey="ค่าเฉลี่ย" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} strokeWidth={2} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bar Chart — Group Level */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-bold mb-3 text-[var(--color-text)]">คะแนนเฉลี่ยรายกลุ่มความผูกพัน</h3>
                <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={groupStats.map((g) => ({ name: g.groupName, mean: g.mean }))}
                            layout="vertical"
                            margin={{ left: 8, right: 50 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" />
                            <XAxis type="number" domain={[0, 5]} tickCount={6} fontSize={11} tick={{ fill: "var(--color-chart-text)" }} />
                            <YAxis type="category" dataKey="name" width={160} fontSize={10} tick={{ fill: "var(--color-chart-text)" }} />
                            <Tooltip
                                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 11 }}
                                formatter={(v: unknown) => [(v as number).toFixed(2), "คะแนนเฉลี่ย"]}
                            />
                            <Bar dataKey="mean" radius={[0, 4, 4, 0]}
                                label={{ position: "right", fontSize: 10, formatter: (v: unknown) => (v as number).toFixed(2) }}>
                                {groupStats.map((g) => (
                                    <Cell key={g.groupName} fill={GROUP_COLORS[g.groupName] ?? "#f59e0b"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Item-level by group — collapsible */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-[var(--color-text)] px-1">รายละเอียดรายข้อ จำแนกตามกลุ่มความผูกพัน</h3>
                {groupStats.map((group) => {
                    const expanded = isExpanded(group.groupName);
                    const color = GROUP_COLORS[group.groupName] ?? "#f59e0b";
                    const itemData = group.indices.map((i) => ({
                        idx: i,
                        label: ENGAGEMENT_LABELS[i],
                        mean: Math.round(itemMeans[i] * 100) / 100,
                    })).sort((a, b) => b.mean - a.mean);

                    return (
                        <div key={group.groupName} className="glass-card overflow-hidden">
                            <button
                                onClick={() => toggleGroup(group.groupName)}
                                className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-surface-alt)] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                                    <span className="text-sm font-bold text-[var(--color-text)]">{group.groupName}</span>
                                    <RatingBadge score={group.mean} />
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold" style={{ color: SCORE_COLOR(group.mean) }}>
                                        {group.mean.toFixed(2)} / 5.00
                                    </span>
                                    {expanded ? <ChevronUp className="w-4 h-4 text-[var(--color-text-secondary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />}
                                </div>
                            </button>

                            {expanded && (
                                <div className="border-t border-[var(--color-border)] p-4 space-y-3">
                                    {/* Mini bar chart */}
                                    <div style={{ height: `${Math.max(120, itemData.length * 32)}px` }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={itemData} layout="vertical" margin={{ left: 0, right: 50 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" />
                                                <XAxis type="number" domain={[0, 5]} tickCount={6} fontSize={10} tick={{ fill: "var(--color-chart-text)" }} />
                                                <YAxis type="category" dataKey="label" width={160} fontSize={9} tick={{ fill: "var(--color-chart-text)" }} />
                                                <Tooltip
                                                    contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 11 }}
                                                    formatter={(v: unknown) => [(v as number).toFixed(2), "คะแนนเฉลี่ย"]}
                                                />
                                                <Bar dataKey="mean" fill={color} radius={[0, 4, 4, 0]}
                                                    label={{ position: "right", fontSize: 9, formatter: (v: unknown) => (v as number).toFixed(2) }} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Score rows */}
                                    <div className="space-y-2">
                                        {itemData.map((item, qi) => (
                                            <div key={item.idx} className="flex items-center gap-3">
                                                <span className="text-[10px] text-[var(--color-text-secondary)] w-4 flex-shrink-0">{qi + 1}.</span>
                                                <span className="text-xs text-[var(--color-text)] w-44 flex-shrink-0 truncate" title={item.label}>{item.label}</span>
                                                <ScoreBar score={item.mean} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Overall item ranking */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-bold mb-3 text-[var(--color-text)]">Top ข้อที่ได้คะแนนสูงสุด / ต่ำสุด</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">🏆 คะแนนสูงสุด 3 อันดับ</p>
                        <div className="space-y-2">
                            {[...itemMeans.map((m, i) => ({ m, i }))].filter((x) => x.m > 0).sort((a, b) => b.m - a.m).slice(0, 3).map(({ m, i }, rank) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 w-4">{rank + 1}</span>
                                    <span className="text-xs text-[var(--color-text)] flex-1 truncate" title={ENGAGEMENT_LABELS[i]}>{ENGAGEMENT_LABELS[i]}</span>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{m.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-red-500 mb-2">⚠️ คะแนนต่ำสุด 3 อันดับ</p>
                        <div className="space-y-2">
                            {[...itemMeans.map((m, i) => ({ m, i }))].filter((x) => x.m > 0).sort((a, b) => a.m - b.m).slice(0, 3).map(({ m, i }, rank) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-red-500 w-4">{rank + 1}</span>
                                    <span className="text-xs text-[var(--color-text)] flex-1 truncate" title={ENGAGEMENT_LABELS[i]}>{ENGAGEMENT_LABELS[i]}</span>
                                    <span className="text-xs font-bold text-red-500">{m.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
