"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useAppState } from "@/lib/store";
import { FACTOR_LABELS, ENGAGEMENT_LABELS } from "@/types/survey";
import { Users, AlertTriangle, TrendingUp, Minus } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

// Simple K-Means (k=3) on [factorMean, engMean] per respondent
function kMeans(points: number[][], k: number, iterations = 50): number[] {
    if (points.length === 0) return [];
    // Init centroids: pick k evenly spaced points
    let centroids = Array.from({ length: k }, (_, i) =>
        [...points[Math.floor((i * points.length) / k)]]
    );
    let assignments = new Array(points.length).fill(0);
    for (let iter = 0; iter < iterations; iter++) {
        // Assign
        const newAssign = points.map((p) => {
            let best = 0, bestDist = Infinity;
            centroids.forEach((c, ci) => {
                const d = p.reduce((s, v, j) => s + (v - c[j]) ** 2, 0);
                if (d < bestDist) { bestDist = d; best = ci; }
            });
            return best;
        });
        // Check convergence
        if (newAssign.every((a, i) => a === assignments[i])) break;
        assignments = newAssign;
        // Update centroids
        centroids = Array.from({ length: k }, (_, ci) => {
            const members = points.filter((_, i) => assignments[i] === ci);
            if (members.length === 0) return centroids[ci];
            return points[0].map((_, j) => members.reduce((s, p) => s + p[j], 0) / members.length);
        });
    }
    return assignments;
}

const CLUSTER_COLORS = ["#ef4444", "#f59e0b", "#10b981"];
const CLUSTER_LABELS = ["กลุ่มเสี่ยง", "กลุ่มกลาง", "กลุ่มแข็งแกร่ง"];
const CLUSTER_ICONS = [AlertTriangle, Minus, TrendingUp];
const CLUSTER_BG = [
    "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
    "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800",
    "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
];
const CLUSTER_TEXT = ["text-red-600 dark:text-red-400", "text-yellow-600 dark:text-yellow-400", "text-emerald-600 dark:text-emerald-400"];

export default function ClusterAnalysis() {
    const { filteredData } = useAppState();

    const { assignments, clusterStats, radarData } = useMemo(() => {
        if (filteredData.length < 3) return { assignments: [], clusterStats: [], radarData: [] };

        const points = filteredData.map((r) => {
            const fVals = r.factors.filter((v) => v > 0);
            const eVals = r.engagement.filter((v) => v > 0);
            const fMean = fVals.length ? fVals.reduce((a, b) => a + b, 0) / fVals.length : 0;
            const eMean = eVals.length ? eVals.reduce((a, b) => a + b, 0) / eVals.length : 0;
            return [fMean, eMean];
        });

        const rawAssign = kMeans(points, 3);

        // Sort clusters by combined score (low→high) so cluster 0 = risk, 2 = strong
        const clusterMeans = [0, 1, 2].map((ci) => {
            const pts = points.filter((_, i) => rawAssign[i] === ci);
            if (pts.length === 0) return { f: 0, e: 0 };
            return {
                f: pts.reduce((s, p) => s + p[0], 0) / pts.length,
                e: pts.reduce((s, p) => s + p[1], 0) / pts.length,
            };
        });
        const sortedClusters = [0, 1, 2].sort((a, b) => (clusterMeans[a].f + clusterMeans[a].e) - (clusterMeans[b].f + clusterMeans[b].e));
        const remapCluster = new Array(3);
        sortedClusters.forEach((orig, newIdx) => { remapCluster[orig] = newIdx; });
        const assignments = rawAssign.map((a) => remapCluster[a]);

        // Per-cluster stats
        const clusterStats = [0, 1, 2].map((ci) => {
            const members = filteredData.filter((_, i) => assignments[i] === ci);
            if (members.length === 0) return { count: 0, factorMean: 0, engMean: 0, topFactors: [], bottomFactors: [], units: {} as Record<string, number> };
            const factorMeans = Array.from({ length: 29 }, (_, fi) => {
                const vals = members.map((r) => r.factors[fi]).filter((v) => v > 0);
                return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            });
            const engMeans = Array.from({ length: 11 }, (_, ei) => {
                const vals = members.map((r) => r.engagement[ei]).filter((v) => v > 0);
                return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            });
            const fValid = factorMeans.filter((v) => v > 0);
            const eValid = engMeans.filter((v) => v > 0);
            const topFactors = factorMeans.map((m, i) => ({ label: FACTOR_LABELS[i], m })).filter((x) => x.m > 0).sort((a, b) => b.m - a.m).slice(0, 3);
            const bottomFactors = factorMeans.map((m, i) => ({ label: FACTOR_LABELS[i], m })).filter((x) => x.m > 0).sort((a, b) => a.m - b.m).slice(0, 3);
            const units: Record<string, number> = {};
            members.forEach((r) => { units[r.demographics.unit] = (units[r.demographics.unit] || 0) + 1; });
            return {
                count: members.length,
                factorMean: fValid.reduce((a, b) => a + b, 0) / fValid.length,
                engMean: eValid.reduce((a, b) => a + b, 0) / eValid.length,
                topFactors, bottomFactors, units,
            };
        });

        // Radar data: group-level means per cluster
        const groupLabels = ["ลักษณะงาน", "สภาพแวดล้อม", "คุณภาพชีวิต", "เพื่อนร่วมงาน", "ผู้บังคับบัญชา", "นโยบาย", "ค่าตอบแทน", "ความก้าวหน้า"];
        const groupIndices = [[0,1,2,3],[4,5,6],[7,8,9],[10,11,12],[13,14,15,16,17],[18,19,20,21],[22,23,24],[25,26,27,28]];
        const radarData = groupLabels.map((label, gi) => {
            const entry: Record<string, number | string> = { label };
            [0, 1, 2].forEach((ci) => {
                const members = filteredData.filter((_, i) => assignments[i] === ci);
                if (members.length === 0) { entry[`c${ci}`] = 0; return; }
                const vals = groupIndices[gi].flatMap((fi) => members.map((r) => r.factors[fi]).filter((v) => v > 0));
                entry[`c${ci}`] = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : 0;
            });
            return entry;
        });

        return { assignments, clusterStats, radarData };
    }, [filteredData]);

    if (filteredData.length < 3) {
        return (
            <div className="glass-card p-8 text-center text-[var(--color-text-secondary)] text-sm">
                ต้องการข้อมูลอย่างน้อย 3 รายการเพื่อวิเคราะห์กลุ่ม
            </div>
        );
    }

    const total = filteredData.length;

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Header */}
            <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5 text-[var(--color-primary)]" />
                    <h2 className="text-base font-bold text-[var(--color-text)]">การวิเคราะห์กลุ่ม (Cluster Analysis)</h2>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)]">
                    จัดกลุ่มกำลังพล {total.toLocaleString()} นาย ด้วย K-Means (k=3) บนพื้นฐานคะแนนปัจจัยและความผูกพัน
                </p>
            </div>

            {/* Cluster Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0, 1, 2].map((ci) => {
                    const stat = clusterStats[ci];
                    const Icon = CLUSTER_ICONS[ci];
                    const pct = total > 0 ? Math.round((stat.count / total) * 100) : 0;
                    const topUnits = Object.entries(stat.units).sort((a, b) => b[1] - a[1]).slice(0, 3);
                    return (
                        <div key={ci} className={`glass-card p-4 border ${CLUSTER_BG[ci]} space-y-3`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Icon className={`w-4 h-4 ${CLUSTER_TEXT[ci]}`} />
                                    <span className={`text-sm font-bold ${CLUSTER_TEXT[ci]}`}>{CLUSTER_LABELS[ci]}</span>
                                </div>
                                <span className={`text-2xl font-black ${CLUSTER_TEXT[ci]}`}>{pct}%</span>
                            </div>
                            <p className="text-xs text-[var(--color-text-secondary)]">{stat.count.toLocaleString()} นาย จาก {total.toLocaleString()} นาย</p>

                            <div className="grid grid-cols-2 gap-2 text-center">
                                <div className="bg-[var(--color-surface-alt)] rounded-lg p-2">
                                    <p className="text-[10px] text-[var(--color-text-secondary)]">ปัจจัยเฉลี่ย</p>
                                    <p className="text-base font-black" style={{ color: CLUSTER_COLORS[ci] }}>{stat.factorMean.toFixed(2)}</p>
                                </div>
                                <div className="bg-[var(--color-surface-alt)] rounded-lg p-2">
                                    <p className="text-[10px] text-[var(--color-text-secondary)]">ผูกพันเฉลี่ย</p>
                                    <p className="text-base font-black" style={{ color: CLUSTER_COLORS[ci] }}>{stat.engMean.toFixed(2)}</p>
                                </div>
                            </div>

                            {stat.topFactors.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase mb-1">จุดแข็ง</p>
                                    {stat.topFactors.map((f, i) => (
                                        <div key={i} className="flex justify-between text-xs py-0.5">
                                            <span className="text-[var(--color-text)] truncate">{f.label}</span>
                                            <span className="font-bold ml-2" style={{ color: CLUSTER_COLORS[ci] }}>{f.m.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {ci === 0 && stat.bottomFactors.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-semibold text-red-500 uppercase mb-1">ต้องปรับปรุงเร่งด่วน</p>
                                    {stat.bottomFactors.map((f, i) => (
                                        <div key={i} className="flex justify-between text-xs py-0.5">
                                            <span className="text-[var(--color-text)] truncate">{f.label}</span>
                                            <span className="font-bold text-red-500 ml-2">{f.m.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {topUnits.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase mb-1">หน่วยหลัก</p>
                                    {topUnits.map(([unit, cnt], i) => (
                                        <div key={i} className="flex justify-between text-xs py-0.5">
                                            <span className="text-[var(--color-text)] truncate">{unit}</span>
                                            <span className="text-[var(--color-text-secondary)] ml-2">{cnt} นาย</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Radar Comparison */}
            <div className="glass-card p-4">
                <h3 className="text-sm font-bold mb-3 text-[var(--color-text)]">เปรียบเทียบโปรไฟล์ปัจจัยระหว่างกลุ่ม</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="var(--color-border)" />
                            <PolarAngleAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} />
                            <Tooltip
                                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                                formatter={(v: unknown, name: unknown) => [(v as number).toFixed(2), CLUSTER_LABELS[parseInt((name as string).replace("c", ""))]]}
                            />
                            {[0, 1, 2].map((ci) => (
                                <Radar key={ci} name={`c${ci}`} dataKey={`c${ci}`} stroke={CLUSTER_COLORS[ci]} fill={CLUSTER_COLORS[ci]} fillOpacity={0.15} strokeWidth={2} />
                            ))}
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-2">
                    {[0, 1, 2].map((ci) => (
                        <div key={ci} className="flex items-center gap-1.5 text-xs">
                            <span className="w-3 h-3 rounded-full inline-block" style={{ background: CLUSTER_COLORS[ci] }} />
                            <span className="text-[var(--color-text-secondary)]">{CLUSTER_LABELS[ci]} ({clusterStats[ci]?.count ?? 0} นาย)</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Interpretation */}
            <div className="glass-card p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">หมายเหตุ</p>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    การวิเคราะห์กลุ่มใช้อัลกอริทึม K-Means บนข้อมูลคะแนนปัจจัยและความผูกพันของแต่ละบุคคล
                    กลุ่มถูกจัดเรียงจากคะแนนรวมต่ำ→สูง โดย <strong>กลุ่มเสี่ยง</strong> คือกลุ่มที่ต้องการความใส่ใจเป็นพิเศษ
                    ผลลัพธ์อาจเปลี่ยนแปลงตามการกรองข้อมูล
                </p>
            </div>
        </motion.div>
    );
}
