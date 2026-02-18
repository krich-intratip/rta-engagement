"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppState } from "@/lib/store";
import { SurveyResponse } from "@/types/survey";

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

function mean(arr: number[]): number {
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function variance(arr: number[]): number {
    if (arr.length < 2) return 0;
    const m = mean(arr);
    return arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
}

/** Welch's t-test for two independent samples, returns p-value approximation */
function welchTTest(a: number[], b: number[]): { t: number; df: number; p: number } {
    if (a.length < 2 || b.length < 2) return { t: 0, df: 0, p: 1 };
    const mA = mean(a), mB = mean(b);
    const vA = variance(a), vB = variance(b);
    const nA = a.length, nB = b.length;
    const se = Math.sqrt(vA / nA + vB / nB);
    if (se === 0) return { t: 0, df: 0, p: 1 };
    const t = (mA - mB) / se;
    const df = (vA / nA + vB / nB) ** 2 / ((vA / nA) ** 2 / (nA - 1) + (vB / nB) ** 2 / (nB - 1));
    const p = tDistPValue(Math.abs(t), df);
    return { t, df, p };
}

/** One-way ANOVA F-test, returns p-value approximation */
function oneWayAnova(groups: number[][]): { F: number; dfBetween: number; dfWithin: number; p: number } {
    const k = groups.length;
    const allVals = groups.flat();
    const N = allVals.length;
    if (N < k + 1 || k < 2) return { F: 0, dfBetween: k - 1, dfWithin: N - k, p: 1 };
    const grandMean = mean(allVals);
    const ssBetween = groups.reduce((s, g) => s + g.length * (mean(g) - grandMean) ** 2, 0);
    const ssWithin = groups.reduce((s, g) => {
        const gm = mean(g);
        return s + g.reduce((ss, v) => ss + (v - gm) ** 2, 0);
    }, 0);
    const dfB = k - 1, dfW = N - k;
    if (dfW === 0 || ssWithin === 0) return { F: 0, dfBetween: dfB, dfWithin: dfW, p: 1 };
    const F = (ssBetween / dfB) / (ssWithin / dfW);
    const p = fDistPValue(F, dfB, dfW);
    return { F, dfBetween: dfB, dfWithin: dfW, p };
}

/** Approximate p-value from t-distribution using regularized incomplete beta */
function tDistPValue(t: number, df: number): number {
    const x = df / (df + t * t);
    return incompleteBeta(df / 2, 0.5, x);
}

/** Approximate p-value from F-distribution */
function fDistPValue(F: number, d1: number, d2: number): number {
    const x = d2 / (d2 + d1 * F);
    return incompleteBeta(d2 / 2, d1 / 2, x);
}

/** Regularized incomplete beta function approximation (continued fraction) */
function incompleteBeta(a: number, b: number, x: number): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const lbeta = lgamma(a) + lgamma(b) - lgamma(a + b);
    const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a;
    return front * betaCF(a, b, x);
}

function betaCF(a: number, b: number, x: number): number {
    const MAXIT = 100, EPS = 3e-7;
    let c = 1, d = 1 - (a + b) * x / (a + 1);
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= MAXIT; m++) {
        const m2 = 2 * m;
        let aa = m * (b - m) * x / ((a + m2 - 1) * (a + m2));
        d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30;
        c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30;
        d = 1 / d; h *= d * c;
        aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1));
        d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30;
        c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30;
        d = 1 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1) < EPS) break;
    }
    return h;
}

function lgamma(x: number): number {
    const c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
        -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x, tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (const ci of c) { y += 1; ser += ci / y; }
    return -tmp + Math.log(2.5066282746310005 * ser / x);
}

function pLabel(p: number): { label: string; color: string } {
    if (p < 0.001) return { label: "p < 0.001 ***", color: "text-emerald-600 dark:text-emerald-400" };
    if (p < 0.01) return { label: `p = ${p.toFixed(3)} **`, color: "text-green-600 dark:text-green-400" };
    if (p < 0.05) return { label: `p = ${p.toFixed(3)} *`, color: "text-yellow-600 dark:text-yellow-400" };
    return { label: `p = ${p.toFixed(3)} ns`, color: "text-[var(--color-text-secondary)]" };
}

interface TestResult {
    field: string;
    label: string;
    groups: number;
    metric: string;
    stat: string;
    p: number;
    significant: boolean;
    groupDetails: { name: string; n: number; mean: number; sd: number }[];
}

function runTests(data: SurveyResponse[], metric: "factor" | "engagement"): TestResult[] {
    const results: TestResult[] = [];
    for (const field of DEMO_FIELDS) {
        const groupMap: Record<string, number[]> = {};
        for (const r of data) {
            const key = (r.demographics[field.key] || "ไม่ระบุ").trim();
            const vals = metric === "factor"
                ? r.factors.filter((v) => v > 0)
                : r.engagement.filter((v) => v > 0);
            if (!vals.length) continue;
            const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
            if (!groupMap[key]) groupMap[key] = [];
            groupMap[key].push(avg);
        }
        const groups = Object.entries(groupMap).filter(([, v]) => v.length >= 3);
        if (groups.length < 2) continue;

        const groupDetails = groups.map(([name, vals]) => ({
            name,
            n: vals.length,
            mean: mean(vals),
            sd: Math.sqrt(variance(vals)),
        })).sort((a, b) => b.mean - a.mean);

        let stat = "", p = 1;
        if (groups.length === 2) {
            const res = welchTTest(groups[0][1], groups[1][1]);
            stat = `t = ${res.t.toFixed(3)}, df = ${res.df.toFixed(1)}`;
            p = res.p;
        } else {
            const res = oneWayAnova(groups.map(([, v]) => v));
            stat = `F(${res.dfBetween}, ${res.dfWithin}) = ${res.F.toFixed(3)}`;
            p = res.p;
        }

        results.push({
            field: field.key,
            label: field.label,
            groups: groups.length,
            metric: metric === "factor" ? "ปัจจัย" : "ความผูกพัน",
            stat,
            p,
            significant: p < 0.05,
            groupDetails,
        });
    }
    return results.sort((a, b) => a.p - b.p);
}

export default function StatisticalSignificance() {
    const { filteredData } = useAppState();
    const [metric, setMetric] = useState<"factor" | "engagement">("factor");
    const [expanded, setExpanded] = useState<string | null>(null);

    const results = useMemo(() => runTests(filteredData, metric), [filteredData, metric]);

    if (filteredData.length === 0) return null;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="text-base font-bold">การทดสอบนัยสำคัญทางสถิติ</h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        t-test (2 กลุ่ม) / One-way ANOVA (≥3 กลุ่ม) — * p&lt;0.05, ** p&lt;0.01, *** p&lt;0.001
                    </p>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => setMetric("factor")} className={`tab-btn text-xs ${metric === "factor" ? "active" : ""}`}>ปัจจัย</button>
                    <button onClick={() => setMetric("engagement")} className={`tab-btn text-xs ${metric === "engagement" ? "active" : ""}`}>ความผูกพัน</button>
                </div>
            </div>

            <div className="space-y-2">
                {results.map((r) => {
                    const { label: pLbl, color } = pLabel(r.p);
                    const isExpanded = expanded === r.field;
                    return (
                        <div key={r.field} className={`rounded-xl border transition-all ${r.significant ? "border-[var(--color-primary-light)]" : "border-[var(--color-border)]"}`}>
                            <button
                                onClick={() => setExpanded(isExpanded ? null : r.field)}
                                className="w-full flex items-center justify-between p-3 text-left"
                            >
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-sm font-bold">{r.label}</span>
                                    <span className="text-xs text-[var(--color-text-secondary)]">{r.groups} กลุ่ม</span>
                                    <span className="text-xs font-mono text-[var(--color-text-secondary)]">{r.stat}</span>
                                    <span className={`text-xs font-bold ${color}`}>{pLbl}</span>
                                    {r.significant && (
                                        <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold">
                                            มีนัยสำคัญ
                                        </span>
                                    )}
                                </div>
                                <span className="text-[var(--color-text-light)] text-xs ml-2">{isExpanded ? "▲" : "▼"}</span>
                            </button>
                            {isExpanded && (
                                <div className="px-3 pb-3 border-t border-[var(--color-border)]">
                                    <div className="mt-2 overflow-x-auto">
                                        <table className="text-xs w-full">
                                            <thead>
                                                <tr className="border-b border-[var(--color-border)]">
                                                    <th className="p-1.5 text-left">กลุ่ม</th>
                                                    <th className="p-1.5 text-center">n</th>
                                                    <th className="p-1.5 text-center">ค่าเฉลี่ย</th>
                                                    <th className="p-1.5 text-center">SD</th>
                                                    <th className="p-1.5 text-left">แถบ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {r.groupDetails.map((g) => (
                                                    <tr key={g.name} className="border-b border-[var(--color-border)]/50">
                                                        <td className="p-1.5 font-medium">{g.name}</td>
                                                        <td className="p-1.5 text-center text-[var(--color-text-secondary)]">{g.n}</td>
                                                        <td className="p-1.5 text-center font-bold">{g.mean.toFixed(3)}</td>
                                                        <td className="p-1.5 text-center text-[var(--color-text-secondary)]">±{g.sd.toFixed(3)}</td>
                                                        <td className="p-1.5">
                                                            <div className="flex items-center gap-1">
                                                                <div className="h-2 rounded-full bg-[var(--color-primary)]" style={{ width: `${((g.mean - 1) / 4) * 100}%`, minWidth: 4, maxWidth: 120 }} />
                                                                <span className="text-[10px] text-[var(--color-text-light)]">{g.mean.toFixed(2)}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                {results.length === 0 && (
                    <p className="text-sm text-center py-6 text-[var(--color-text-secondary)]">ข้อมูลไม่เพียงพอสำหรับการทดสอบ (ต้องการอย่างน้อย 2 กลุ่ม กลุ่มละ ≥3 คน)</p>
                )}
            </div>
        </motion.div>
    );
}
