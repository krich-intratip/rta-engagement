"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useAppState } from "@/lib/store";
import { interpretMean, FACTOR_LABELS, ENGAGEMENT_LABELS } from "@/types/survey";
import { Printer, Download } from "lucide-react";

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
    const pct = Math.round((score / max) * 100);
    const color = score >= 4.5 ? "#10b981" : score >= 4.0 ? "#34d399" : score >= 3.5 ? "#fbbf24" : score >= 3.0 ? "#f97316" : "#ef4444";
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-xs font-bold w-8 text-right" style={{ color }}>{score.toFixed(2)}</span>
        </div>
    );
}

function RatingBadge({ score }: { score: number }) {
    const color = score >= 4.5 ? "bg-emerald-500" : score >= 4.0 ? "bg-green-400" : score >= 3.5 ? "bg-yellow-400" : score >= 3.0 ? "bg-orange-400" : "bg-red-400";
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold text-white ${color}`}>
            {interpretMean(score)}
        </span>
    );
}

export default function ExecutiveSummary() {
    const { state, filteredData } = useAppState();
    const result = state.analysisResult;
    const printRef = useRef<HTMLDivElement>(null);

    if (!result || filteredData.length === 0) return null;

    const n = filteredData.length;
    const totalN = state.surveyData.length;
    const isFiltered = n < totalN;

    // Recalculate means from filteredData
    const factorMeans = Array.from({ length: 29 }, (_, i) => {
        const vals = filteredData.map((r) => r.factors[i]).filter((v) => v > 0);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    });
    const engMeans = Array.from({ length: 11 }, (_, i) => {
        const vals = filteredData.map((r) => r.engagement[i]).filter((v) => v > 0);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    });
    const overallFactor = factorMeans.filter((v) => v > 0).reduce((a, b) => a + b, 0) / factorMeans.filter((v) => v > 0).length;
    const overallEng = engMeans.filter((v) => v > 0).reduce((a, b) => a + b, 0) / engMeans.filter((v) => v > 0).length;

    const top5Factors = [...factorMeans.map((m, i) => ({ label: FACTOR_LABELS[i], mean: m, idx: i }))]
        .sort((a, b) => b.mean - a.mean).slice(0, 5);
    const bottom5Factors = [...factorMeans.map((m, i) => ({ label: FACTOR_LABELS[i], mean: m, idx: i }))]
        .filter((f) => f.mean > 0).sort((a, b) => a.mean - b.mean).slice(0, 5);
    const top3Eng = [...engMeans.map((m, i) => ({ label: ENGAGEMENT_LABELS[i], mean: m, idx: i }))]
        .sort((a, b) => b.mean - a.mean).slice(0, 3);
    const bottom3Eng = [...engMeans.map((m, i) => ({ label: ENGAGEMENT_LABELS[i], mean: m, idx: i }))]
        .filter((e) => e.mean > 0).sort((a, b) => a.mean - b.mean).slice(0, 3);

    const topInsights = result.insights.filter((ins) => ins.type === "strength").slice(0, 3);
    const improvInsights = result.insights.filter((ins) => ins.type === "improvement").slice(0, 3);
    const recommendations = result.insights.filter((ins) => ins.type === "recommendation").slice(0, 3);

    const handlePrint = () => window.print();

    const handleExportHTML = () => {
        if (!printRef.current) return;
        const html = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>Executive Summary - RTA Engagement</title>
<style>
  body { font-family: 'Sarabun', sans-serif; margin: 0; padding: 20px; background: #fff; color: #1a1a2e; }
  .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  h1 { font-size: 20px; font-weight: 800; } h2 { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
  h3 { font-size: 13px; font-weight: 600; } p, li { font-size: 12px; line-height: 1.6; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; color: #fff; }
  .green { background: #10b981; } .yellow { background: #f59e0b; } .red { background: #ef4444; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { padding: 4px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; }
  th { font-weight: 700; background: #f1f5f9; }
  @media print { body { padding: 0; } }
</style></head><body>
${printRef.current.innerHTML}
</body></html>`;
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "executive-summary.html"; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h3 className="text-base font-bold">Executive Summary</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                        สรุปผลสำหรับผู้บริหาร{isFiltered ? ` (กรองแล้ว: ${n.toLocaleString()} / ${totalN.toLocaleString()} คน)` : ` (${n.toLocaleString()} คน)`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-primary-light)]/20 transition">
                        <Printer className="w-4 h-4" /> พิมพ์
                    </button>
                    <button onClick={handleExportHTML} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-gradient-primary text-white font-medium hover:shadow-md transition">
                        <Download className="w-4 h-4" /> Export HTML
                    </button>
                </div>
            </div>

            {/* Printable content */}
            <div ref={printRef} className="space-y-5 print:space-y-4">
                {/* Header */}
                <div className="glass-card p-6 text-center print:border print:border-gray-200">
                    <h1 className="text-xl font-extrabold mb-1">รายงานสรุปผลการสำรวจ</h1>
                    <h2 className="text-base font-bold text-[var(--color-primary-dark)] mb-1">ความสุขและความผูกพันของบุคลากร กองทัพบก</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">ประจำปีงบประมาณ ๒๕๖๙ · จำนวนผู้ตอบ {n.toLocaleString()} คน</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "ผู้ตอบแบบสอบถาม", value: n.toLocaleString(), unit: "คน", color: "text-[var(--color-primary)]" },
                        { label: "คะแนนปัจจัยเฉลี่ย", value: overallFactor.toFixed(2), unit: `/ 5.00 · ${interpretMean(overallFactor)}`, color: overallFactor >= 4 ? "text-emerald-600" : "text-yellow-600" },
                        { label: "คะแนนผูกพันเฉลี่ย", value: overallEng.toFixed(2), unit: `/ 5.00 · ${interpretMean(overallEng)}`, color: overallEng >= 4 ? "text-emerald-600" : "text-yellow-600" },
                        { label: "ปัจจัยสูงสุด", value: top5Factors[0]?.mean.toFixed(2) ?? "-", unit: top5Factors[0]?.label ?? "", color: "text-emerald-600" },
                    ].map((kpi, i) => (
                        <div key={i} className="glass-card p-4 text-center print:border print:border-gray-200">
                            <p className="text-xs text-[var(--color-text-secondary)] mb-1">{kpi.label}</p>
                            <p className={`text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
                            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{kpi.unit}</p>
                        </div>
                    ))}
                </div>

                {/* Factor & Engagement scores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="glass-card p-5 print:border print:border-gray-200">
                        <h3 className="text-sm font-bold mb-3 flex items-center justify-between">
                            ปัจจัย 5 อันดับสูงสุด <RatingBadge score={overallFactor} />
                        </h3>
                        <div className="space-y-2">
                            {top5Factors.map((f, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-xs mb-0.5">
                                        <span className="text-[var(--color-text-secondary)]">{i + 1}. {f.label}</span>
                                    </div>
                                    <ScoreBar score={f.mean} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="glass-card p-5 print:border print:border-gray-200">
                        <h3 className="text-sm font-bold mb-3 flex items-center justify-between">
                            ปัจจัย 5 อันดับต่ำสุด <span className="text-xs text-red-500 font-medium">ต้องปรับปรุง</span>
                        </h3>
                        <div className="space-y-2">
                            {bottom5Factors.map((f, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-xs mb-0.5">
                                        <span className="text-[var(--color-text-secondary)]">{i + 1}. {f.label}</span>
                                    </div>
                                    <ScoreBar score={f.mean} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="glass-card p-5 print:border print:border-gray-200">
                        <h3 className="text-sm font-bold mb-3 flex items-center justify-between">
                            ความผูกพัน 3 อันดับสูงสุด <RatingBadge score={overallEng} />
                        </h3>
                        <div className="space-y-2">
                            {top3Eng.map((e, i) => (
                                <div key={i}>
                                    <div className="text-xs text-[var(--color-text-secondary)] mb-0.5">{i + 1}. {e.label}</div>
                                    <ScoreBar score={e.mean} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="glass-card p-5 print:border print:border-gray-200">
                        <h3 className="text-sm font-bold mb-3 flex items-center justify-between">
                            ความผูกพัน 3 อันดับต่ำสุด <span className="text-xs text-red-500 font-medium">ต้องปรับปรุง</span>
                        </h3>
                        <div className="space-y-2">
                            {bottom3Eng.map((e, i) => (
                                <div key={i}>
                                    <div className="text-xs text-[var(--color-text-secondary)] mb-0.5">{i + 1}. {e.label}</div>
                                    <ScoreBar score={e.mean} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { title: "จุดแข็ง", items: topInsights, color: "border-emerald-400", badge: "bg-emerald-500" },
                        { title: "จุดที่ต้องปรับปรุง", items: improvInsights, color: "border-orange-400", badge: "bg-orange-500" },
                        { title: "ข้อเสนอแนะ", items: recommendations, color: "border-[var(--color-primary)]", badge: "bg-[var(--color-primary)]" },
                    ].map((section, i) => (
                        <div key={i} className={`glass-card p-4 border-l-4 ${section.color} print:border print:border-gray-200`}>
                            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${section.badge} inline-block`} />
                                {section.title}
                            </h3>
                            <div className="space-y-2">
                                {section.items.length > 0 ? section.items.map((ins, j) => (
                                    <div key={j} className="text-xs">
                                        <p className="font-semibold text-[var(--color-text)]">{ins.title.replace(/^[^\w\u0E00-\u0E7F]+/, "")}</p>
                                        <p className="text-[var(--color-text-secondary)] mt-0.5 line-clamp-3">{ins.description.split("\n")[0]}</p>
                                    </div>
                                )) : (
                                    <p className="text-xs text-[var(--color-text-secondary)]">ไม่มีข้อมูล</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-[var(--color-text-light)] py-2">
                    <p>จัดทำโดย RTA Engagement & Happiness Analysis System v2.0.0</p>
                    <p className="mt-0.5">© 2026 พล.ท.ดร.กริช อินทราทิพย์ — ข้อมูลทั้งหมดประมวลผลในเบราว์เซอร์ ไม่ส่งข้อมูลออกภายนอก</p>
                </div>
            </div>
        </motion.div>
    );
}
