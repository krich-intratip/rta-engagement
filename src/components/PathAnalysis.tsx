"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppState } from "@/lib/store";
import { FACTOR_GROUP_INDICES, ENGAGEMENT_GROUP_INDICES, FactorGroup, EngagementGroup } from "@/types/survey";
import { mean, olsRegression, computeIndirectEffects, pToSig, pToColorClass } from "@/lib/pathStats";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { GitMerge, Download, ChevronDown, ChevronUp, Info } from "lucide-react";
import FilterPanel from "@/components/FilterPanel";
import PathDiagram from "@/components/PathDiagram";

// ─── Model definition ─────────────────────────────────────────────────────────

const FACTOR_NODES = [
    { id: "F1", label: "ลักษณะงาน",     group: FactorGroup.JobCharacteristics,   short: "ลักษณะงาน" },
    { id: "F2", label: "สภาพแวดล้อม",   group: FactorGroup.WorkEnvironment,      short: "สภาพแวดล้อม" },
    { id: "F3", label: "คุณภาพชีวิต",   group: FactorGroup.QualityOfWorkLife,    short: "คุณภาพชีวิต" },
    { id: "F4", label: "เพื่อนร่วมงาน", group: FactorGroup.ColleagueRelations,   short: "เพื่อนร่วมงาน" },
    { id: "F5", label: "หัวหน้างาน",    group: FactorGroup.SupervisorRelations,  short: "หัวหน้างาน" },
    { id: "F6", label: "นโยบาย",        group: FactorGroup.PolicyAdmin,          short: "นโยบาย" },
    { id: "F7", label: "ค่าตอบแทน",     group: FactorGroup.BenefitsCompensation, short: "ค่าตอบแทน" },
    { id: "F8", label: "ความก้าวหน้า",  group: FactorGroup.EvaluationCareer,     short: "ความก้าวหน้า" },
];

const ENG_NODES = [
    { id: "E1", label: "ทัศนคติ/ภักดี", group: EngagementGroup.AttitudeLoyalty,     short: "ทัศนคติ" },
    { id: "E2", label: "ความทุ่มเท",    group: EngagementGroup.WillingnessDedicate, short: "ทุ่มเท" },
    { id: "E3", label: "ความเชื่อมั่น", group: EngagementGroup.OrganizationalTrust, short: "เชื่อมั่น" },
];

// Retention: engagement[3]="ตั้งใจทำงานจนเกษียณ", engagement[4]="ไม่คิดโอนย้าย/ลาออก"
const RETENTION_INDICES = [3, 4];

// ─── Coefficient table sub-component ─────────────────────────────────────────

function CoeffTable({ rows }: {
    rows: { label: string; beta: number; se: number; t: number; p: number }[];
}) {
    return (
        <div className="overflow-x-auto border-t border-[var(--color-border)]">
            <table className="w-full text-xs">
                <thead>
                    <tr className="bg-[var(--color-surface-alt)]">
                        <th className="text-left p-2 font-bold text-[var(--color-text-secondary)]">ตัวทำนาย</th>
                        <th className="text-right p-2 font-bold text-[var(--color-text-secondary)]">β (std)</th>
                        <th className="text-right p-2 font-bold text-[var(--color-text-secondary)]">SE</th>
                        <th className="text-right p-2 font-bold text-[var(--color-text-secondary)]">t</th>
                        <th className="text-right p-2 font-bold text-[var(--color-text-secondary)]">p</th>
                        <th className="text-center p-2 font-bold text-[var(--color-text-secondary)]">sig</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r.label} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]/50 transition-colors">
                            <td className="p-2 text-[var(--color-text-secondary)]">{r.label}</td>
                            <td className={`p-2 text-right font-mono font-bold ${r.beta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                                {r.beta >= 0 ? "+" : ""}{r.beta.toFixed(4)}
                            </td>
                            <td className="p-2 text-right font-mono text-[var(--color-text-secondary)]">{r.se.toFixed(4)}</td>
                            <td className="p-2 text-right font-mono text-[var(--color-text-secondary)]">{r.t.toFixed(3)}</td>
                            <td className={`p-2 text-right font-mono ${pToColorClass(r.p)}`}>
                                {r.p < 0.001 ? "<0.001" : r.p.toFixed(3)}
                            </td>
                            <td className={`p-2 text-center font-bold ${pToColorClass(r.p)}`}>{pToSig(r.p)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PathAnalysis() {
    const { filteredData } = useAppState();
    const [showEffects, setShowEffects] = useState<"total" | "indirect">("total");
    const [openEq, setOpenEq] = useState<number | null>(0);
    const [openEq2, setOpenEq2] = useState(true);
    const [openIndirect, setOpenIndirect] = useState(false);

    // ── Composite scores per person ───────────────────────────────────────────
    const composites = useMemo(() => {
        if (filteredData.length < 10) return null;
        const factorScores = FACTOR_NODES.map(({ group }) => {
            const idxs = FACTOR_GROUP_INDICES[group];
            return filteredData.map((r) => {
                const v = idxs.map((i) => r.factors[i]).filter((x) => x > 0);
                return v.length ? mean(v) : 0;
            });
        });
        const engScores = ENG_NODES.map(({ group }) => {
            const idxs = ENGAGEMENT_GROUP_INDICES[group];
            return filteredData.map((r) => {
                const v = idxs.map((i) => r.engagement[i]).filter((x) => x > 0);
                return v.length ? mean(v) : 0;
            });
        });
        const retentionScores = filteredData.map((r) => {
            const v = RETENTION_INDICES.map((i) => r.engagement[i]).filter((x) => x > 0);
            return v.length ? mean(v) : 0;
        });
        return { factorScores, engScores, retentionScores };
    }, [filteredData]);

    // ── Equations ─────────────────────────────────────────────────────────────
    const eq1 = useMemo(() => {
        if (!composites) return null;
        return ENG_NODES.map((eng, ei) => ({
            engNode: eng,
            ...olsRegression(composites.engScores[ei], composites.factorScores),
        }));
    }, [composites]);

    const eq2 = useMemo(() => {
        if (!composites) return null;
        return olsRegression(composites.retentionScores, composites.engScores);
    }, [composites]);

    // ── Indirect effects ──────────────────────────────────────────────────────
    const effects = useMemo(() => {
        if (!eq1 || !eq2) return null;
        return computeIndirectEffects(eq1, eq2, FACTOR_NODES.map((f) => f.label));
    }, [eq1, eq2]);

    // ── Export CSV ────────────────────────────────────────────────────────────
    function exportCSV() {
        if (!eq1 || !eq2 || !effects) return;
        const rows = ["ตัวแปร,เส้นทาง,β (std),SE,t,p,sig"];
        ENG_NODES.forEach((eng, ei) => {
            FACTOR_NODES.forEach((fac, fi) => {
                const { betas, se, tStats, pValues } = eq1[ei];
                rows.push(`"${fac.label} → ${eng.label}","Factor→Engagement",${betas[fi].toFixed(4)},${se[fi].toFixed(4)},${tStats[fi].toFixed(3)},${pValues[fi].toFixed(4)},${pToSig(pValues[fi])}`);
            });
        });
        ENG_NODES.forEach((eng, ei) => {
            rows.push(`"${eng.label} → ความตั้งใจอยู่ต่อ","Engagement→Retention",${eq2.betas[ei].toFixed(4)},${eq2.se[ei].toFixed(4)},${eq2.tStats[ei].toFixed(3)},${eq2.pValues[ei].toFixed(4)},${pToSig(eq2.pValues[ei])}`);
        });
        rows.push("", "Indirect Effects (Factor → Engagement → Retention)");
        rows.push("ปัจจัย,via ทัศนคติ,via ทุ่มเท,via เชื่อมั่น,รวม (Total)");
        effects.forEach(({ factorLabel, byMediator, total }) => {
            rows.push(`"${factorLabel}",${byMediator.map((v) => v.toFixed(4)).join(",")},${total.toFixed(4)}`);
        });
        const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "path_analysis.csv"; a.click();
        URL.revokeObjectURL(url);
    }

    // ── Guards ────────────────────────────────────────────────────────────────
    if (filteredData.length < 10) return (
        <div className="glass-card p-8 text-center text-[var(--color-text-secondary)] text-sm">
            ต้องการข้อมูลอย่างน้อย 10 รายการเพื่อวิเคราะห์ Path Model
        </div>
    );
    if (!eq1 || !eq2 || !effects) return (
        <div className="glass-card p-8 text-center text-sm">กำลังคำนวณ...</div>
    );

    const effectData = [...effects]
        .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
        .map(({ factorLabel, indirect, total }) => ({
            label: FACTOR_NODES.find((f) => f.label === factorLabel)?.short ?? factorLabel,
            indirect,
            total,
        }));

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <FilterPanel />

            {/* ── Header ── */}
            <div className="glass-card p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-start gap-2">
                        <GitMerge className="w-5 h-5 text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
                        <div>
                            <h2 className="text-base font-bold text-[var(--color-text)]">
                                Path Analysis — PLS-PM (Composite SEM)
                            </h2>
                            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                                8 กลุ่มปัจจัย → 3 กลุ่มความผูกพัน → ความตั้งใจอยู่ต่อ · n = {filteredData.length.toLocaleString()} คน
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {[
                                    ["*** p<0.001", "text-emerald-600 dark:text-emerald-400", "bg-emerald-50 dark:bg-emerald-900/20"],
                                    ["** p<0.01",   "text-blue-600 dark:text-blue-400",       "bg-blue-50 dark:bg-blue-900/20"],
                                    ["* p<0.05",    "text-yellow-600 dark:text-yellow-500",   "bg-yellow-50 dark:bg-yellow-900/20"],
                                    ["† p<0.10",    "text-orange-500 dark:text-orange-400",   "bg-orange-50 dark:bg-orange-900/20"],
                                    ["ns",          "text-gray-400",                          "bg-gray-100 dark:bg-gray-800"],
                                ].map(([lbl, tc, bg]) => (
                                    <span key={lbl} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tc} ${bg}`}>{lbl}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button onClick={exportCSV}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-primary-light)]/20 transition">
                        <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                </div>
                <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-[var(--color-surface-alt)] text-xs text-[var(--color-text-secondary)]">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[var(--color-primary)]" />
                    <span>
                        <strong>วิธีการ:</strong> OLS Multiple Regression (standardized β) · composite score = ค่าเฉลี่ยรายกลุ่ม ·
                        ตัวแปรทั้งหมด z-standardized ก่อนคำนวณ ·
                        Retention Intent = mean(ตั้งใจทำงานจนเกษียณ, ไม่คิดโอนย้าย/ลาออก)
                    </span>
                </div>
            </div>

            {/* ── Path Diagram ── */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-bold mb-3 text-[var(--color-text)]">
                    Path Diagram (Interactive — hover เพื่อดูค่า β)
                </h3>
                <PathDiagram
                    factorNodes={FACTOR_NODES}
                    engNodes={ENG_NODES}
                    eq1={eq1}
                    eq2={eq2}
                />
            </div>

            {/* ── R² Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ENG_NODES.map((eng, ei) => (
                    <div key={eng.id} className="glass-card p-4 text-center">
                        <p className="text-xs text-[var(--color-text-secondary)] mb-1">{eng.label}</p>
                        <p className="text-2xl font-extrabold text-[var(--color-primary)]">
                            {(eq1[ei].r2 * 100).toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-[var(--color-text-secondary)]">R² (8 ปัจจัย → ความผูกพัน)</p>
                    </div>
                ))}
                <div className="glass-card p-4 text-center border-2 border-[var(--color-primary)]/30">
                    <p className="text-xs text-[var(--color-text-secondary)] mb-1">ความตั้งใจอยู่ต่อ</p>
                    <p className="text-2xl font-extrabold text-[var(--color-primary)]">
                        {(eq2.r2 * 100).toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-[var(--color-text-secondary)]">R² (3 ความผูกพัน → Retention)</p>
                </div>
            </div>

            {/* ── Indirect Effects Chart ── */}
            <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div>
                        <h3 className="text-sm font-bold text-[var(--color-text)]">
                            ผลต่อความตั้งใจอยู่ต่อ (ผ่านความผูกพัน)
                        </h3>
                        <p className="text-[10px] text-[var(--color-text-secondary)]">β standardized · เรียงจากมากไปน้อย</p>
                    </div>
                    <div className="flex gap-1">
                        {(["total", "indirect"] as const).map((v) => (
                            <button key={v} onClick={() => setShowEffects(v)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${showEffects === v
                                    ? "bg-[var(--color-primary)] text-white"
                                    : "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)]/20"
                                }`}>
                                {v === "total" ? "Total Effect" : "Indirect Effect"}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={effectData} layout="vertical" margin={{ left: 8, right: 55, top: 4, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                            <XAxis type="number" tickFormatter={(v) => v.toFixed(2)} tick={{ fontSize: 10 }} />
                            <YAxis type="category" dataKey="label"
                                tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} width={85} />
                            <Tooltip
                                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 11 }}
                                formatter={(v?: number) => [(v ?? 0).toFixed(4), showEffects === "total" ? "Total Effect (β)" : "Indirect Effect (β)"]}
                            />
                            <ReferenceLine x={0} stroke="var(--color-border)" />
                            <Bar dataKey={showEffects} radius={[0, 4, 4, 0]}
                                label={{ position: "right", fontSize: 9, formatter: (v: unknown) => typeof v === "number" ? v.toFixed(3) : "" }}>
                                {effectData.map((e) => (
                                    <Cell key={e.label}
                                        fill={e[showEffects] >= 0 ? "var(--color-primary)" : "#ef4444"}
                                        opacity={Math.abs(e[showEffects]) < 0.005 ? 0.3 : 1}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Equation 1: Factors → Engagement ── */}
            <div className="glass-card overflow-hidden">
                <p className="px-4 pt-4 pb-1 text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">
                    Equation 1 — ปัจจัยในงาน → ความผูกพัน
                </p>
                <div className="divide-y divide-[var(--color-border)]">
                    {ENG_NODES.map((eng, ei) => (
                        <div key={eng.id}>
                            <button
                                onClick={() => setOpenEq(openEq === ei ? null : ei)}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--color-primary-light)]/10 transition-colors text-left">
                                <span className="text-sm font-semibold text-[var(--color-text)]">
                                    Eq.{ei + 1}: ปัจจัยในงาน → <strong>{eng.label}</strong>
                                    <span className="ml-3 text-xs font-normal text-[var(--color-text-secondary)]">
                                        R² = <strong className="text-[var(--color-primary)]">{(eq1[ei].r2 * 100).toFixed(1)}%</strong>
                                    </span>
                                </span>
                                {openEq === ei
                                    ? <ChevronUp className="w-4 h-4 text-[var(--color-text-secondary)]" />
                                    : <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />}
                            </button>
                            {openEq === ei && (
                                <CoeffTable rows={FACTOR_NODES.map((fac, fi) => ({
                                    label: fac.label,
                                    beta: eq1[ei].betas[fi],
                                    se: eq1[ei].se[fi],
                                    t: eq1[ei].tStats[fi],
                                    p: eq1[ei].pValues[fi],
                                }))} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Equation 2: Engagement → Retention ── */}
            <div className="glass-card overflow-hidden">
                <button
                    onClick={() => setOpenEq2(!openEq2)}
                    className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-primary-light)]/10 transition-colors text-left">
                    <span className="text-sm font-semibold text-[var(--color-text)]">
                        Equation 2: ความผูกพัน → ความตั้งใจอยู่ต่อ
                        <span className="ml-3 text-xs font-normal text-[var(--color-text-secondary)]">
                            R² = <strong className="text-[var(--color-primary)]">{(eq2.r2 * 100).toFixed(1)}%</strong>
                        </span>
                    </span>
                    {openEq2
                        ? <ChevronUp className="w-4 h-4 text-[var(--color-text-secondary)]" />
                        : <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />}
                </button>
                {openEq2 && (
                    <CoeffTable rows={ENG_NODES.map((eng, ei) => ({
                        label: eng.label,
                        beta: eq2.betas[ei],
                        se: eq2.se[ei],
                        t: eq2.tStats[ei],
                        p: eq2.pValues[ei],
                    }))} />
                )}
            </div>

            {/* ── Indirect Effects Table ── */}
            <div className="glass-card overflow-hidden">
                <button
                    onClick={() => setOpenIndirect(!openIndirect)}
                    className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-primary-light)]/10 transition-colors text-left">
                    <span className="text-sm font-semibold text-[var(--color-text)]">
                        Indirect Effects — Factor → Engagement → Retention
                    </span>
                    {openIndirect
                        ? <ChevronUp className="w-4 h-4 text-[var(--color-text-secondary)]" />
                        : <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />}
                </button>
                {openIndirect && (
                    <div className="overflow-x-auto border-t border-[var(--color-border)]">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-[var(--color-surface-alt)]">
                                    <th className="text-left p-2 font-bold text-[var(--color-text-secondary)]">ปัจจัย</th>
                                    {ENG_NODES.map((e) => (
                                        <th key={e.id} className="text-right p-2 font-bold text-[var(--color-text-secondary)]">
                                            via {e.short}
                                        </th>
                                    ))}
                                    <th className="text-right p-2 font-bold text-[var(--color-primary)]">รวม (β)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {effects
                                    .slice()
                                    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
                                    .map(({ factorLabel, byMediator, total }) => (
                                        <tr key={factorLabel} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]/50">
                                            <td className="p-2 text-[var(--color-text-secondary)]">{factorLabel}</td>
                                            {byMediator.map((v, i) => (
                                                <td key={i} className={`p-2 text-right font-mono ${v >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                                                    {v >= 0 ? "+" : ""}{v.toFixed(4)}
                                                </td>
                                            ))}
                                            <td className={`p-2 text-right font-mono font-bold ${total >= 0 ? "text-[var(--color-primary)]" : "text-red-500"}`}>
                                                {total >= 0 ? "+" : ""}{total.toFixed(4)}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
