"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppState, ActiveTab } from "@/lib/store";
import {
    FileText, Download, Loader2, CheckSquare, Square,
    ChevronDown, ChevronUp, Printer,
} from "lucide-react";

interface ReportSection {
    id: string;
    label: string;
    description: string;
    tabKey: string;
}

const REPORT_SECTIONS: ReportSection[] = [
    { id: "overview",     label: "ภาพรวม (Overview)",              description: "KPI หลัก กราฟปัจจัย กราฟความผูกพัน ข้อมูลเชิงลึก",  tabKey: "overview" },
    { id: "factors2",     label: "วิเคราะห์ปัจจัย (ส่วนที่ 2)",     description: "Radar Chart Bar Chart รายกลุ่ม/รายข้อ Top/Bottom 5",   tabKey: "factors2" },
    { id: "engagement2",  label: "วิเคราะห์ความผูกพัน (ส่วนที่ 3)", description: "Radar Chart Bar Chart รายกลุ่ม/รายข้อ Top/Bottom 3",   tabKey: "engagement2" },
    { id: "crossanalysis",label: "Cross-Analysis (ส่วนที่ 2 × 3)",  description: "Scatter Plot Correlation Matrix Top/Bottom Predictors", tabKey: "crossanalysis" },
    { id: "compare",      label: "เปรียบเทียบรายกลุ่ม",             description: "Bar Chart เปรียบเทียบ 11 มิติประชากรศาสตร์",           tabKey: "compare" },
    { id: "cluster",      label: "Cluster Analysis",                description: "K-Means 3 กลุ่ม Radar Chart โปรไฟล์กลุ่ม",            tabKey: "cluster" },
    { id: "anomaly",      label: "Anomaly Detection",               description: "หน่วยงานที่คะแนนต่ำกว่าเกณฑ์ Z-score ≤ −1",           tabKey: "anomaly" },
    { id: "risk",         label: "Predictive Risk Score",           description: "ความเสี่ยงรายบุคคล กลุ่มเสี่ยงสูง/กลาง/ต่ำ",          tabKey: "risk" },
    { id: "executive",    label: "สรุปผู้บริหาร",                   description: "KPI จุดแข็ง/จุดอ่อน ข้อเสนอแนะเชิงกลยุทธ์",           tabKey: "executive" },
];

export default function ReportBuilder() {
    const { state, dispatch } = useAppState();
    const [selected, setSelected] = useState<Set<string>>(
        new Set(["overview", "factors2", "engagement2", "executive"])
    );
    const [open, setOpen] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState("");

    const hasData = state.analysisResult && state.surveyData.length > 0;

    function toggleSection(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }

    function selectAll() { setSelected(new Set(REPORT_SECTIONS.map((s) => s.id))); }
    function clearAll() { setSelected(new Set()); }

    const handleGeneratePDF = useCallback(async () => {
        if (!hasData || selected.size === 0 || generating) return;
        setGenerating(true);
        setProgress(0);

        const sections = REPORT_SECTIONS.filter((s) => selected.has(s.id));
        const totalSteps = sections.length + 2;
        let step = 0;

        const advance = (label: string) => {
            step++;
            setProgress(Math.round((step / totalSteps) * 100));
            setProgressLabel(label);
        };

        try {
            const html2canvas = (await import("html2canvas-pro")).default;
            const { jsPDF } = await import("jspdf");

            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const contentW = pageW - margin * 2;
            const contentH = pageH - margin * 2;

            // Cover page
            advance("สร้างหน้าปก...");
            pdf.setFillColor(26, 26, 46);
            pdf.rect(0, 0, pageW, pageH, "F");
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(20);
            pdf.setFont("helvetica", "bold");
            pdf.text("RTA Engagement & Happiness", pageW / 2, 60, { align: "center" });
            pdf.text("Analysis Report", pageW / 2, 72, { align: "center" });
            pdf.setFontSize(12);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(180, 180, 200);
            pdf.text(`จำนวนผู้ตอบ: ${state.surveyData.length.toLocaleString()} คน`, pageW / 2, 90, { align: "center" });
            pdf.text(`วันที่สร้างรายงาน: ${new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}`, pageW / 2, 100, { align: "center" });
            pdf.setFontSize(10);
            pdf.setTextColor(120, 120, 140);
            const sectionNames = sections.map((s) => s.label).join(" · ");
            const lines = pdf.splitTextToSize(`ประกอบด้วย: ${sectionNames}`, contentW);
            pdf.text(lines, pageW / 2, 120, { align: "center" });
            pdf.setTextColor(80, 80, 100);
            pdf.text("v2.1.7 · RTA Engagement Analysis System", pageW / 2, pageH - 15, { align: "center" });

            // Capture each section
            for (const section of sections) {
                advance(`กำลังสร้าง: ${section.label}...`);

                // Navigate to tab
                dispatch({ type: "SET_TAB", payload: section.tabKey as ActiveTab });
                // Wait for render
                await new Promise((r) => setTimeout(r, 800));

                const contentEl = document.getElementById(`tab-content-${section.tabKey}`);
                if (!contentEl) continue;

                const canvas = await html2canvas(contentEl, {
                    scale: 1.5,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    logging: false,
                });

                const imgData = canvas.toDataURL("image/png");
                const totalImgH = (canvas.height * contentW) / canvas.width;
                const numPages = Math.ceil(totalImgH / contentH);

                // Section header page
                pdf.addPage();
                pdf.setFillColor(240, 245, 255);
                pdf.rect(0, 0, pageW, 30, "F");
                pdf.setTextColor(30, 60, 120);
                pdf.setFontSize(14);
                pdf.setFont("helvetica", "bold");
                pdf.text(section.label, margin, 20);
                pdf.setFontSize(9);
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(100, 100, 120);
                pdf.text(section.description, margin, 27);

                // Content pages
                for (let page = 0; page < numPages; page++) {
                    if (page > 0) pdf.addPage();
                    const yOffset = (page === 0 ? 32 : margin) - page * contentH;
                    const availH = page === 0 ? contentH - 22 : contentH;
                    pdf.addImage(imgData, "PNG", margin, page === 0 ? 32 : margin, contentW, totalImgH, undefined, "FAST");
                    void yOffset; void availH;
                }
            }

            advance("บันทึกไฟล์...");
            pdf.save(`rta-report-${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (e) {
            console.error("Report generation failed", e);
        } finally {
            setGenerating(false);
            setProgress(0);
            setProgressLabel("");
        }
    }, [hasData, selected, generating, state.surveyData.length, dispatch]);

    if (!hasData) return null;

    const orderedSelected = REPORT_SECTIONS.filter((s) => selected.has(s.id));

    return (
        <div className="glass-card overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-primary-light)]/10 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                    <span className="text-sm font-bold">Report Builder</span>
                    {selected.size > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold">
                            {selected.size} sections
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleGeneratePDF(); }}
                        disabled={generating || selected.size === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--color-primary)] text-white hover:shadow-md transition disabled:opacity-50"
                    >
                        {generating
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {progress}%</>
                            : <><Download className="w-3.5 h-3.5" /> Export PDF</>
                        }
                    </button>
                    {open ? <ChevronUp className="w-4 h-4 text-[var(--color-text-secondary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />}
                </div>
            </button>

            {/* Progress bar */}
            {generating && (
                <div className="px-4 pb-2">
                    <div className="h-1.5 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                    <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">{progressLabel}</p>
                </div>
            )}

            {/* Section selector */}
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
                            {/* Controls */}
                            <div className="flex items-center justify-between mt-3 mb-2">
                                <p className="text-xs text-[var(--color-text-secondary)]">เลือก section ที่ต้องการรวมใน PDF</p>
                                <div className="flex gap-2">
                                    <button onClick={selectAll} className="text-xs text-[var(--color-primary)] hover:underline">เลือกทั้งหมด</button>
                                    <span className="text-[var(--color-border)]">·</span>
                                    <button onClick={clearAll} className="text-xs text-[var(--color-text-secondary)] hover:underline">ล้าง</button>
                                </div>
                            </div>

                            {/* Section list */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {REPORT_SECTIONS.map((section) => {
                                    const isSelected = selected.has(section.id);
                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => toggleSection(section.id)}
                                            className={`flex items-start gap-2.5 p-3 rounded-xl text-left transition-all border ${
                                                isSelected
                                                    ? "bg-[var(--color-primary-light)]/15 border-[var(--color-primary-light)]/50"
                                                    : "bg-[var(--color-surface-alt)] border-transparent hover:border-[var(--color-border)]"
                                            }`}
                                        >
                                            {isSelected
                                                ? <CheckSquare className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                                                : <Square className="w-4 h-4 text-[var(--color-text-light)] flex-shrink-0 mt-0.5" />
                                            }
                                            <div>
                                                <p className={`text-xs font-bold ${isSelected ? "text-[var(--color-primary-dark)]" : "text-[var(--color-text)]"}`}>
                                                    {section.label}
                                                </p>
                                                <p className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed mt-0.5">
                                                    {section.description}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Order preview */}
                            {orderedSelected.length > 0 && (
                                <div className="mt-3 p-3 bg-[var(--color-surface-alt)] rounded-xl">
                                    <p className="text-[10px] font-bold text-[var(--color-text-secondary)] mb-1.5">ลำดับใน PDF:</p>
                                    <div className="flex flex-wrap gap-1">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-[var(--color-primary-light)]/20 text-[var(--color-primary-dark)] font-medium">
                                            หน้าปก
                                        </span>
                                        {orderedSelected.map((s, i) => (
                                            <span key={s.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                                                {i + 2}. {s.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Print hint */}
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[var(--color-text-light)]">
                                <Printer className="w-3 h-3" />
                                <span>หรือใช้ Ctrl+P เพื่อพิมพ์หน้าปัจจุบัน</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
