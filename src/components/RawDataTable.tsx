"use client";

import { motion } from "framer-motion";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppState } from "@/lib/store";
import { useState, useMemo } from "react";

const PAGE_SIZE = 20;

export default function RawDataTable() {
    const { state } = useAppState();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);

    const filtered = useMemo(() => {
        if (!search.trim()) return state.surveyData;
        const q = search.toLowerCase();
        return state.surveyData.filter(
            (r) =>
                r.demographics.gender.toLowerCase().includes(q) ||
                r.demographics.rank.toLowerCase().includes(q) ||
                r.demographics.unit.toLowerCase().includes(q) ||
                r.demographics.ageGroup.toLowerCase().includes(q) ||
                r.unitClassification.toLowerCase().includes(q)
        );
    }, [state.surveyData, search]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const handleExportCsv = () => {
        const headers = [
            "ลำดับ", "เพศ", "ชั้นยศ", "สังกัด", "เจเนอเรชั่น", "สถานภาพ",
            "การศึกษา", "อายุราชการ", "รายได้", "ที่อยู่",
            ...Array.from({ length: 29 }, (_, i) => `ปัจจัย_${i + 1}`),
            ...Array.from({ length: 11 }, (_, i) => `ผูกพัน_${i + 1}`),
        ];
        const rows = state.surveyData.map((r, idx) => [
            idx + 1,
            r.demographics.gender,
            r.demographics.rank,
            r.demographics.unit,
            r.demographics.ageGroup,
            r.demographics.maritalStatus,
            r.demographics.education,
            r.demographics.serviceYears,
            r.demographics.income,
            r.demographics.housing,
            ...r.factors,
            ...r.engagement,
        ]);
        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "rta-engagement-data.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    if (state.surveyData.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5"
        >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-base font-bold">ข้อมูลดิบ ({filtered.length} รายการ)</h3>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-light)]" />
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                            className="pl-9 pr-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] w-48"
                        />
                    </div>
                    <button
                        onClick={handleExportCsv}
                        className="flex items-center gap-1 px-3 py-2 text-sm rounded-xl bg-gradient-primary text-white font-medium hover:shadow-md transition"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse min-w-[700px]">
                    <thead>
                        <tr className="border-b border-[var(--color-border)]">
                            <th className="p-2 text-left">#</th>
                            <th className="p-2 text-left">เพศ</th>
                            <th className="p-2 text-left">ชั้นยศ</th>
                            <th className="p-2 text-left">สังกัด</th>
                            <th className="p-2 text-left">เจเนอเรชั่น</th>
                            <th className="p-2 text-center">ค่าเฉลี่ยปัจจัย</th>
                            <th className="p-2 text-center">ค่าเฉลี่ยผูกพัน</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paged.map((r, i) => {
                            const factorVals = r.factors.filter((v) => v > 0);
                            const engVals = r.engagement.filter((v) => v > 0);
                            const fMean = factorVals.length > 0 ? factorVals.reduce((a, b) => a + b, 0) / factorVals.length : 0;
                            const eMean = engVals.length > 0 ? engVals.reduce((a, b) => a + b, 0) / engVals.length : 0;
                            return (
                                <tr key={i} className="border-b border-[var(--color-border)] hover:bg-[var(--color-primary-light)]/5">
                                    <td className="p-2">{page * PAGE_SIZE + i + 1}</td>
                                    <td className="p-2">{r.demographics.gender}</td>
                                    <td className="p-2">{r.demographics.rank}</td>
                                    <td className="p-2 max-w-[150px] truncate">{r.unitClassification || r.demographics.unit}</td>
                                    <td className="p-2">{r.demographics.ageGroup}</td>
                                    <td className="p-2 text-center font-medium">{fMean.toFixed(2)}</td>
                                    <td className="p-2 text-center font-medium">{eMean.toFixed(2)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="p-1.5 rounded-lg hover:bg-[var(--color-primary-light)]/20 disabled:opacity-30"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-[var(--color-text-secondary)]">
                        หน้า {page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                        className="p-1.5 rounded-lg hover:bg-[var(--color-primary-light)]/20 disabled:opacity-30"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </motion.div>
    );
}
