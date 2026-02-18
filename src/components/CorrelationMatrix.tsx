"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppState } from "@/lib/store";
import { FACTOR_LABELS, ENGAGEMENT_LABELS } from "@/types/survey";
import { GitMerge } from "lucide-react";

function pearson(xs: number[], ys: number[]): number {
    const n = xs.length;
    if (n < 3) return 0;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
    const dx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0));
    const dy = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0));
    return dx * dy === 0 ? 0 : num / (dx * dy);
}

function rColor(r: number): string {
    const abs = Math.abs(r);
    if (r > 0) {
        if (abs >= 0.7) return "#047857";
        if (abs >= 0.5) return "#10b981";
        if (abs >= 0.3) return "#6ee7b7";
        return "#d1fae5";
    } else {
        if (abs >= 0.7) return "#b91c1c";
        if (abs >= 0.5) return "#ef4444";
        if (abs >= 0.3) return "#fca5a5";
        return "#fee2e2";
    }
}

function rTextColor(r: number): string {
    const abs = Math.abs(r);
    return abs >= 0.5 ? "#fff" : "var(--color-text)";
}

const FACTOR_SHORT = FACTOR_LABELS.map((l) => l.length > 8 ? l.slice(0, 8) + "…" : l);
const ENG_SHORT = ENGAGEMENT_LABELS.map((l) => l.length > 8 ? l.slice(0, 8) + "…" : l);

export default function CorrelationMatrix() {
    const { filteredData } = useAppState();
    const [mode, setMode] = useState<"factor-eng" | "factor-factor" | "eng-eng">("factor-eng");
    const [hoveredCell, setHoveredCell] = useState<{ r: number; label: string } | null>(null);

    const { matrix, rowLabels, colLabels, topPairs } = useMemo(() => {
        if (filteredData.length < 5) return { matrix: [], rowLabels: [], colLabels: [], topPairs: [] };

        const factorCols = Array.from({ length: 29 }, (_, i) =>
            filteredData.map((r) => r.factors[i])
        );
        const engCols = Array.from({ length: 11 }, (_, i) =>
            filteredData.map((r) => r.engagement[i])
        );

        let rowCols: number[][], colCols: number[][], rowLabels: string[], colLabels: string[];

        if (mode === "factor-eng") {
            rowCols = engCols; rowLabels = ENGAGEMENT_LABELS;
            colCols = factorCols; colLabels = FACTOR_LABELS;
        } else if (mode === "factor-factor") {
            rowCols = factorCols; rowLabels = FACTOR_LABELS;
            colCols = factorCols; colLabels = FACTOR_LABELS;
        } else {
            rowCols = engCols; rowLabels = ENGAGEMENT_LABELS;
            colCols = engCols; colLabels = ENGAGEMENT_LABELS;
        }

        const matrix = rowCols.map((rc) => colCols.map((cc) => pearson(rc, cc)));

        // Top positive pairs (factor-eng mode)
        const topPairs: { factor: string; eng: string; r: number }[] = [];
        if (mode === "factor-eng") {
            matrix.forEach((row, ei) => {
                row.forEach((r, fi) => {
                    topPairs.push({ eng: ENGAGEMENT_LABELS[ei], factor: FACTOR_LABELS[fi], r });
                });
            });
            topPairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
        }

        return { matrix, rowLabels, colLabels, topPairs: topPairs.slice(0, 5) };
    }, [filteredData, mode]);

    if (filteredData.length < 5) {
        return (
            <div className="glass-card p-8 text-center text-[var(--color-text-secondary)] text-sm">
                ต้องการข้อมูลอย่างน้อย 5 รายการเพื่อคำนวณสหสัมพันธ์
            </div>
        );
    }

    const cellSize = mode === "factor-factor" ? 18 : mode === "eng-eng" ? 28 : 22;

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Header */}
            <div className="glass-card p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <GitMerge className="w-5 h-5 text-[var(--color-primary)]" />
                        <div>
                            <h2 className="text-base font-bold text-[var(--color-text)]">Correlation Matrix</h2>
                            <p className="text-xs text-[var(--color-text-secondary)]">Pearson r — ความสัมพันธ์ระหว่างตัวแปร</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {([["factor-eng", "ปัจจัย × ผูกพัน"], ["factor-factor", "ปัจจัย × ปัจจัย"], ["eng-eng", "ผูกพัน × ผูกพัน"]] as const).map(([m, label]) => (
                            <button key={m} onClick={() => setMode(m)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${mode === m ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Hovered cell info */}
            {hoveredCell && (
                <div className="glass-card px-4 py-2 text-xs text-[var(--color-text)]">
                    <span className="font-semibold">{hoveredCell.label}</span>
                    {" — "}r = <span className="font-bold">{hoveredCell.r.toFixed(3)}</span>
                    {" "}({Math.abs(hoveredCell.r) >= 0.7 ? "สหสัมพันธ์สูงมาก" : Math.abs(hoveredCell.r) >= 0.5 ? "สหสัมพันธ์สูง" : Math.abs(hoveredCell.r) >= 0.3 ? "สหสัมพันธ์ปานกลาง" : "สหสัมพันธ์ต่ำ"}{hoveredCell.r < 0 ? " (ทางลบ)" : " (ทางบวก)"})
                </div>
            )}

            {/* Matrix */}
            <div className="glass-card p-4 overflow-auto">
                <div className="inline-block min-w-full">
                    <table className="border-collapse" style={{ fontSize: 10 }}>
                        <thead>
                            <tr>
                                <th className="w-28 pr-2 text-right text-[var(--color-text-secondary)]" style={{ fontSize: 9 }}>
                                    {mode === "factor-eng" ? "ความผูกพัน \\ ปัจจัย" : mode === "factor-factor" ? "ปัจจัย" : "ความผูกพัน"}
                                </th>
                                {colLabels.map((label, ci) => (
                                    <th key={ci} className="text-center font-medium text-[var(--color-text-secondary)]"
                                        style={{ width: cellSize, height: 70, verticalAlign: "bottom", paddingBottom: 4 }}>
                                        <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 9, lineHeight: 1.2, maxHeight: 64, overflow: "hidden" }}>
                                            {label}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.map((row, ri) => (
                                <tr key={ri}>
                                    <td className="pr-2 text-right text-[var(--color-text-secondary)] whitespace-nowrap" style={{ fontSize: 9, maxWidth: 112 }}>
                                        <span className="block truncate">{rowLabels[ri]}</span>
                                    </td>
                                    {row.map((r, ci) => (
                                        <td key={ci}
                                            style={{ width: cellSize, height: cellSize, background: rColor(r), cursor: "pointer" }}
                                            className="transition-all hover:opacity-80"
                                            onMouseEnter={() => setHoveredCell({ r, label: `${rowLabels[ri]} × ${colLabels[ci]}` })}
                                            onMouseLeave={() => setHoveredCell(null)}
                                            title={`${rowLabels[ri]} × ${colLabels[ci]}: r=${r.toFixed(3)}`}
                                        >
                                            {cellSize >= 22 && (
                                                <span style={{ display: "block", textAlign: "center", fontSize: 8, fontWeight: 700, color: rTextColor(r), lineHeight: `${cellSize}px` }}>
                                                    {r.toFixed(2)}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Color legend */}
            <div className="glass-card p-3 flex flex-wrap items-center gap-3 text-xs">
                <span className="text-[var(--color-text-secondary)] font-medium">ระดับสหสัมพันธ์:</span>
                {[["≥0.7 สูงมาก", "#047857"], ["0.5–0.7 สูง", "#10b981"], ["0.3–0.5 ปานกลาง", "#6ee7b7"], ["<0.3 ต่ำ", "#d1fae5"],
                    ["<-0.3 ต่ำ (ลบ)", "#fca5a5"], ["-0.5 ถึง -0.3 ปานกลาง (ลบ)", "#ef4444"], ["≤-0.7 สูงมาก (ลบ)", "#b91c1c"]].map(([label, color]) => (
                    <div key={label} className="flex items-center gap-1">
                        <span className="w-4 h-4 rounded inline-block" style={{ background: color }} />
                        <span className="text-[var(--color-text-secondary)]">{label}</span>
                    </div>
                ))}
            </div>

            {/* Top pairs */}
            {mode === "factor-eng" && topPairs.length > 0 && (
                <div className="glass-card p-4">
                    <h3 className="text-sm font-bold mb-3 text-[var(--color-text)]">คู่ตัวแปรที่มีความสัมพันธ์สูงสุด (Factor → Engagement)</h3>
                    <div className="space-y-2">
                        {topPairs.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 text-xs">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
                                    style={{ background: rColor(p.r) }}>{i + 1}</span>
                                <span className="text-[var(--color-text)] flex-1">{p.factor} → {p.eng}</span>
                                <span className="font-bold" style={{ color: rColor(p.r) }}>r = {p.r.toFixed(3)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
