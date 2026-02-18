"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAppState } from "@/lib/store";
import { SurveyResponse } from "@/types/survey";
import ChartModal from "@/components/ChartModal";
import { Maximize2 } from "lucide-react";

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

interface CellData {
    count: number;
    factorMean: number;
    engagementMean: number;
}

function buildCrossTab(
    data: SurveyResponse[],
    rowField: DemoKey,
    colField: DemoKey
): { rows: string[]; cols: string[]; cells: Record<string, Record<string, CellData>> } {
    const rowSet = new Set<string>();
    const colSet = new Set<string>();
    const cells: Record<string, Record<string, { factors: number[]; engagement: number[] }>> = {};

    for (const r of data) {
        const rowVal = r.demographics[rowField] || "ไม่ระบุ";
        const colVal = r.demographics[colField] || "ไม่ระบุ";
        rowSet.add(rowVal);
        colSet.add(colVal);
        if (!cells[rowVal]) cells[rowVal] = {};
        if (!cells[rowVal][colVal]) cells[rowVal][colVal] = { factors: [], engagement: [] };
        const fVals = r.factors.filter((v) => v > 0);
        const eVals = r.engagement.filter((v) => v > 0);
        if (fVals.length) cells[rowVal][colVal].factors.push(fVals.reduce((a, b) => a + b, 0) / fVals.length);
        if (eVals.length) cells[rowVal][colVal].engagement.push(eVals.reduce((a, b) => a + b, 0) / eVals.length);
    }

    const rows = Array.from(rowSet).sort();
    const cols = Array.from(colSet).sort();
    const result: Record<string, Record<string, CellData>> = {};
    for (const row of rows) {
        result[row] = {};
        for (const col of cols) {
            const raw = cells[row]?.[col];
            if (!raw) { result[row][col] = { count: 0, factorMean: 0, engagementMean: 0 }; continue; }
            result[row][col] = {
                count: raw.factors.length,
                factorMean: raw.factors.length ? raw.factors.reduce((a, b) => a + b, 0) / raw.factors.length : 0,
                engagementMean: raw.engagement.length ? raw.engagement.reduce((a, b) => a + b, 0) / raw.engagement.length : 0,
            };
        }
    }
    return { rows, cols, cells: result };
}

function colorForScore(score: number): string {
    if (score === 0) return "bg-[var(--color-surface-alt)] text-[var(--color-text-light)]";
    if (score >= 4.5) return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300";
    if (score >= 4.0) return "bg-green-400/20 text-green-700 dark:text-green-300";
    if (score >= 3.5) return "bg-yellow-300/20 text-yellow-700 dark:text-yellow-300";
    if (score >= 3.0) return "bg-orange-300/20 text-orange-700 dark:text-orange-300";
    return "bg-red-300/20 text-red-700 dark:text-red-300";
}

type MetricKey = "factorMean" | "engagementMean" | "count";

function CrossTabContent({ data, rowField, colField, metric }: {
    data: SurveyResponse[];
    rowField: DemoKey;
    colField: DemoKey;
    metric: MetricKey;
}) {
    const { rows, cols, cells } = useMemo(() => buildCrossTab(data, rowField, colField), [data, rowField, colField]);
    const rowLabel = DEMO_FIELDS.find((f) => f.key === rowField)?.label ?? rowField;
    const colLabel = DEMO_FIELDS.find((f) => f.key === colField)?.label ?? colField;

    if (rows.length === 0 || cols.length === 0) return <p className="text-sm text-center py-8 text-[var(--color-text-secondary)]">ไม่มีข้อมูล</p>;

    return (
        <div className="overflow-x-auto">
            <table className="text-xs border-collapse w-full min-w-[400px]">
                <thead>
                    <tr>
                        <th className="p-2 text-left bg-[var(--color-surface-alt)] rounded-tl-lg sticky left-0 z-10">
                            <span className="text-[var(--color-text-secondary)]">{rowLabel}</span>
                            <span className="text-[var(--color-text-light)]"> / </span>
                            <span className="text-[var(--color-primary)]">{colLabel}</span>
                        </th>
                        {cols.map((col) => (
                            <th key={col} className="p-2 text-center bg-[var(--color-surface-alt)] font-medium whitespace-nowrap max-w-[100px] truncate">
                                {col}
                            </th>
                        ))}
                        <th className="p-2 text-center bg-[var(--color-surface-alt)] font-bold">รวม</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const rowTotal = cols.reduce((s, col) => s + (cells[row]?.[col]?.count ?? 0), 0);
                        const rowFactorMean = (() => {
                            const vals = cols.map((col) => cells[row]?.[col]).filter((c) => c && c.count > 0);
                            if (!vals.length) return 0;
                            return vals.reduce((s, c) => s + (c!.factorMean * c!.count), 0) / vals.reduce((s, c) => s + c!.count, 0);
                        })();
                        const rowEngMean = (() => {
                            const vals = cols.map((col) => cells[row]?.[col]).filter((c) => c && c.count > 0);
                            if (!vals.length) return 0;
                            return vals.reduce((s, c) => s + (c!.engagementMean * c!.count), 0) / vals.reduce((s, c) => s + c!.count, 0);
                        })();
                        const rowSummary = metric === "count" ? rowTotal : metric === "factorMean" ? rowFactorMean : rowEngMean;

                        return (
                            <tr key={row} className="border-b border-[var(--color-border)]">
                                <td className="p-2 font-medium sticky left-0 bg-[var(--color-surface)] z-10 whitespace-nowrap">{row}</td>
                                {cols.map((col) => {
                                    const cell = cells[row]?.[col];
                                    const val = cell ? cell[metric] : 0;
                                    const display = metric === "count" ? (val || "-") : val > 0 ? val.toFixed(2) : "-";
                                    return (
                                        <td key={col} className={`p-2 text-center font-medium rounded ${colorForScore(metric === "count" ? 0 : (val as number))}`}>
                                            {display}
                                            {metric !== "count" && cell && cell.count > 0 && (
                                                <div className="text-[10px] text-[var(--color-text-light)] font-normal">({cell.count})</div>
                                            )}
                                        </td>
                                    );
                                })}
                                <td className={`p-2 text-center font-bold ${colorForScore(metric === "count" ? 0 : rowSummary)}`}>
                                    {metric === "count" ? rowTotal : rowSummary > 0 ? rowSummary.toFixed(2) : "-"}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div className="mt-3 flex gap-3 flex-wrap text-xs text-[var(--color-text-secondary)]">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/20 inline-block" /> ≥4.5 มากที่สุด</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400/20 inline-block" /> 4.0–4.49 มาก</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-300/20 inline-block" /> 3.5–3.99 ค่อนข้างมาก</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-300/20 inline-block" /> 3.0–3.49 ปานกลาง</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-300/20 inline-block" /> &lt;3.0 ต้องปรับปรุง</span>
            </div>
        </div>
    );
}

export default function CrossTabulation() {
    const { filteredData } = useAppState();
    const [rowField, setRowField] = useState<DemoKey>("rank");
    const [colField, setColField] = useState<DemoKey>("ageGroup");
    const [metric, setMetric] = useState<MetricKey>("factorMean");

    if (filteredData.length === 0) return null;

    const metrics: { key: MetricKey; label: string }[] = [
        { key: "factorMean", label: "ค่าเฉลี่ยปัจจัย" },
        { key: "engagementMean", label: "ค่าเฉลี่ยผูกพัน" },
        { key: "count", label: "จำนวนคน" },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">ตารางไขว้ (Cross-Tabulation)</h3>
                    <ChartModal title="ตารางไขว้ (Cross-Tabulation)">
                        <CrossTabContent data={filteredData} rowField={rowField} colField={colField} metric={metric} />
                    </ChartModal>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-[var(--color-text-secondary)]">แถว:</label>
                    <select
                        value={rowField}
                        onChange={(e) => setRowField(e.target.value as DemoKey)}
                        className="text-xs px-2 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
                    >
                        {DEMO_FIELDS.filter((f) => f.key !== colField).map((f) => (
                            <option key={f.key} value={f.key}>{f.label}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-[var(--color-text-secondary)]">คอลัมน์:</label>
                    <select
                        value={colField}
                        onChange={(e) => setColField(e.target.value as DemoKey)}
                        className="text-xs px-2 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
                    >
                        {DEMO_FIELDS.filter((f) => f.key !== rowField).map((f) => (
                            <option key={f.key} value={f.key}>{f.label}</option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-1">
                    {metrics.map((m) => (
                        <button
                            key={m.key}
                            onClick={() => setMetric(m.key)}
                            className={`tab-btn text-xs ${metric === m.key ? "active" : ""}`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            <CrossTabContent data={filteredData} rowField={rowField} colField={colField} metric={metric} />
        </motion.div>
    );
}
