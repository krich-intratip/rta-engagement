"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { useAppState, DemographicFilters, EMPTY_FILTERS } from "@/lib/store";

const FILTER_FIELDS: { key: keyof DemographicFilters; label: string }[] = [
    { key: "gender", label: "เพศ" },
    { key: "rank", label: "ชั้นยศ" },
    { key: "unit", label: "สังกัด" },
    { key: "ageGroup", label: "เจเนอเรชั่น" },
    { key: "maritalStatus", label: "สถานภาพสมรส" },
    { key: "education", label: "ระดับการศึกษา" },
    { key: "serviceYears", label: "อายุราชการ" },
    { key: "income", label: "รายได้ต่อเดือน" },
    { key: "housing", label: "ที่อยู่อาศัย" },
    { key: "familyInArmy", label: "ครอบครัวใน ทบ." },
    { key: "hasDependents", label: "ภาระอุปการะ" },
];

function getUniqueValues(data: { demographics: Record<string, string | undefined> }[], field: string): string[] {
    const set = new Set<string>();
    for (const r of data) {
        const v = r.demographics[field];
        if (v && v.trim()) set.add(v.trim());
    }
    return Array.from(set).sort();
}

function isFiltersEmpty(f: DemographicFilters): boolean {
    return Object.values(f).every((arr) => arr.length === 0);
}

function countActiveFilters(f: DemographicFilters): number {
    return Object.values(f).reduce((sum, arr) => sum + arr.length, 0);
}

export default function FilterPanel() {
    const { state, dispatch, filteredData } = useAppState();
    const [open, setOpen] = useState(false);
    const [expandedField, setExpandedField] = useState<string | null>(null);

    const filters = state.filters;
    const totalActive = countActiveFilters(filters);
    const isEmpty = isFiltersEmpty(filters);

    const uniqueValues = useMemo(() => {
        const result: Record<string, string[]> = {};
        for (const f of FILTER_FIELDS) {
            result[f.key] = getUniqueValues(state.surveyData as unknown as { demographics: Record<string, string | undefined> }[], f.key);
        }
        return result;
    }, [state.surveyData]);

    if (state.surveyData.length === 0) return null;

    function toggleValue(field: keyof DemographicFilters, value: string) {
        const current = filters[field];
        const next = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        dispatch({ type: "SET_FILTERS", payload: { ...filters, [field]: next } });
    }

    function resetFilters() {
        dispatch({ type: "RESET_FILTERS" });
    }

    return (
        <div className="glass-card overflow-hidden">
            {/* Header bar */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-primary-light)]/10 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[var(--color-primary)]" />
                    <span className="text-sm font-bold">กรองข้อมูล (Filter)</span>
                    {totalActive > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold">
                            {totalActive}
                        </span>
                    )}
                    {!isEmpty && (
                        <span className="text-xs text-[var(--color-text-secondary)]">
                            แสดง {filteredData.length.toLocaleString()} / {state.surveyData.length.toLocaleString()} คน
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!isEmpty && (
                        <button
                            onClick={(e) => { e.stopPropagation(); resetFilters(); }}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" /> รีเซ็ต
                        </button>
                    )}
                    {open ? <ChevronUp className="w-4 h-4 text-[var(--color-text-secondary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />}
                </div>
            </button>

            {/* Filter body */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 border-t border-[var(--color-border)]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-3">
                                {FILTER_FIELDS.map((field) => {
                                    const values = uniqueValues[field.key] ?? [];
                                    const selected = filters[field.key];
                                    const isExpanded = expandedField === field.key;
                                    const displayValues = isExpanded ? values : values.slice(0, 4);
                                    if (values.length === 0) return null;
                                    return (
                                        <div key={field.key} className="bg-[var(--color-surface-alt)] rounded-xl p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-bold text-[var(--color-text)]">{field.label}</p>
                                                {selected.length > 0 && (
                                                    <button
                                                        onClick={() => dispatch({ type: "SET_FILTERS", payload: { ...filters, [field.key]: [] } })}
                                                        className="text-[var(--color-text-light)] hover:text-red-500 transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {displayValues.map((val) => {
                                                    const active = selected.includes(val);
                                                    return (
                                                        <button
                                                            key={val}
                                                            onClick={() => toggleValue(field.key, val)}
                                                            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all border ${
                                                                active
                                                                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                                                                    : "bg-white/50 text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                                                            }`}
                                                        >
                                                            {val.length > 20 ? val.substring(0, 20) + "…" : val}
                                                        </button>
                                                    );
                                                })}
                                                {values.length > 4 && (
                                                    <button
                                                        onClick={() => setExpandedField(isExpanded ? null : field.key)}
                                                        className="px-2 py-0.5 rounded-full text-xs text-[var(--color-primary)] hover:underline"
                                                    >
                                                        {isExpanded ? "ย่อ" : `+${values.length - 4} เพิ่มเติม`}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
