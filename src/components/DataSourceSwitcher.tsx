"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Upload, Globe, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useAppState } from "@/lib/store";
import { useCallback, useState, useRef } from "react";
import { parseExcelFile } from "@/lib/data-parser";
import { fetchGoogleSheetData } from "@/lib/data-fetcher";
import { analyzeData } from "@/lib/analysis";

export default function DataSourceSwitcher() {
    const { state, dispatch } = useAppState();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFileUpload = useCallback(
        async (file: File) => {
            dispatch({ type: "SET_LOADING", payload: true });
            try {
                const data = await parseExcelFile(file);
                if (data.length === 0) throw new Error("ไม่พบข้อมูลในไฟล์");
                const analysis = analyzeData(data);
                dispatch({ type: "SET_DATA", payload: { data, analysis, fileName: file.name } });
            } catch (err) {
                dispatch({ type: "SET_ERROR", payload: String(err) });
            }
        },
        [dispatch]
    );

    const handleGoogleFetch = useCallback(async () => {
        dispatch({ type: "SET_LOADING", payload: true });
        try {
            const data = await fetchGoogleSheetData();
            if (data.length === 0) throw new Error("ไม่พบข้อมูลใน Google Sheet");
            const analysis = analyzeData(data);
            dispatch({ type: "SET_DATA", payload: { data, analysis, fileName: "Google Sheets" } });
        } catch (err) {
            dispatch({ type: "SET_ERROR", payload: String(err) });
        }
    }, [dispatch]);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFileUpload(file);
        },
        [handleFileUpload]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
        },
        [handleFileUpload]
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
        >
            {/* Toggle */}
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={() => dispatch({ type: "SET_DATA_SOURCE", payload: "file" })}
                    className={`tab-btn ${state.dataSource === "file" ? "active" : ""}`}
                >
                    <Upload className="w-4 h-4 inline mr-1" /> อัปโหลดไฟล์
                </button>
                <button
                    onClick={() => dispatch({ type: "SET_DATA_SOURCE", payload: "google-sheet" })}
                    className={`tab-btn ${state.dataSource === "google-sheet" ? "active" : ""}`}
                >
                    <Globe className="w-4 h-4 inline mr-1" /> Google Sheets
                </button>
            </div>

            <AnimatePresence mode="wait">
                {state.dataSource === "file" ? (
                    <motion.div
                        key="file"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                    >
                        <div
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
                ${dragOver
                                    ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]/10"
                                    : "border-[var(--color-border)] hover:border-[var(--color-primary-light)]"
                                }`}
                        >
                            <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-[var(--color-primary)]" />
                            <p className="text-sm font-medium">ลากไฟล์มาวางที่นี่ หรือ คลิกเพื่อเลือกไฟล์</p>
                            <p className="text-xs text-[var(--color-text-light)] mt-1">รองรับ .xlsx, .xls, .csv</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileInput}
                                className="hidden"
                            />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="google"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="text-center"
                    >
                        <Globe className="w-10 h-10 mx-auto mb-3 text-[var(--color-secondary-dark)]" />
                        <p className="text-sm mb-3 text-[var(--color-text-secondary)]">
                            ดึงข้อมูลจาก Google Sheets แบบ Realtime
                        </p>
                        <button
                            onClick={handleGoogleFetch}
                            disabled={state.isLoading}
                            className="px-6 py-2.5 rounded-xl bg-gradient-secondary text-white font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {state.isLoading ? (
                                <Loader2 className="w-4 h-4 inline animate-spin mr-1" />
                            ) : null}
                            ดึงข้อมูล Google Sheets
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status messages */}
            <AnimatePresence>
                {state.isLoading && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 flex items-center gap-2 text-sm text-[var(--color-primary)]"
                    >
                        <Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลดข้อมูล...
                    </motion.div>
                )}
                {state.fileName && !state.isLoading && !state.error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 flex items-center gap-2 text-sm text-[var(--color-success)]"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        โหลดข้อมูลสำเร็จ: {state.fileName} ({state.surveyData.length} รายการ)
                    </motion.div>
                )}
                {state.error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 flex items-center gap-2 text-sm text-[var(--color-danger)]"
                    >
                        <AlertCircle className="w-4 h-4" />
                        {state.error}
                        <button onClick={() => dispatch({ type: "SET_ERROR", payload: null })}>
                            <X className="w-3 h-3" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
