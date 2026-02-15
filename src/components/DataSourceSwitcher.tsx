"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Upload, Globe, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, X, Link } from "lucide-react";
import { useAppState } from "@/lib/store";
import { useCallback, useState, useRef } from "react";
import { parseExcelFile } from "@/lib/data-parser";
import { fetchGoogleSheetData, buildGoogleSheetCsvUrl } from "@/lib/data-fetcher";
import { analyzeData } from "@/lib/analysis";

function parseGoogleSheetUrl(url: string): { sheetId: string; gid: string } | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) return null;
    const sheetId = match[1];
    const gidMatch = url.match(/[#&?]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : "0";
    return { sheetId, gid };
}

export default function DataSourceSwitcher() {
    const { state, dispatch } = useAppState();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [customUrl, setCustomUrl] = useState("");

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
            dispatch({ type: "SET_DATA", payload: { data, analysis, fileName: "Google Sheets (Default)" } });
        } catch (err) {
            dispatch({ type: "SET_ERROR", payload: String(err) });
        }
    }, [dispatch]);

    const handleCustomUrlFetch = useCallback(async () => {
        if (!customUrl.trim()) return;
        const parsed = parseGoogleSheetUrl(customUrl.trim());
        if (!parsed) {
            dispatch({ type: "SET_ERROR", payload: "URL ไม่ถูกต้อง กรุณาใส่ลิงค์ Google Sheets ที่ถูกต้อง" });
            return;
        }
        dispatch({ type: "SET_LOADING", payload: true });
        try {
            const csvUrl = buildGoogleSheetCsvUrl(parsed.sheetId, parsed.gid);
            const data = await fetchGoogleSheetData(csvUrl);
            if (data.length === 0) throw new Error("ไม่พบข้อมูลใน Google Sheet");
            const analysis = analyzeData(data);
            dispatch({ type: "SET_DATA", payload: { data, analysis, fileName: `Google Sheets (Custom)` } });
        } catch (err) {
            dispatch({ type: "SET_ERROR", payload: String(err) });
        }
    }, [customUrl, dispatch]);

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
                        className="space-y-4"
                    >
                        {/* Default Google Sheet */}
                        <div className="text-center">
                            <Globe className="w-10 h-10 mx-auto mb-3 text-[var(--color-secondary-dark)]" />
                            <p className="text-sm mb-3 text-[var(--color-text-secondary)]">
                                ดึงข้อมูลจาก Google Sheets ที่ตั้งค่าไว้ในระบบ
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
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-[var(--color-border)]" />
                            <span className="text-xs text-[var(--color-text-light)]">หรือ</span>
                            <div className="flex-1 h-px bg-[var(--color-border)]" />
                        </div>

                        {/* Custom URL input */}
                        <div>
                            <p className="text-sm font-medium mb-2 text-[var(--color-text-secondary)]">
                                <Link className="w-4 h-4 inline mr-1" />
                                ใส่ลิงค์ Google Sheets ของคุณ
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={customUrl}
                                    onChange={(e) => setCustomUrl(e.target.value)}
                                    placeholder="https://docs.google.com/spreadsheets/d/..."
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-light)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                                    onKeyDown={(e) => e.key === "Enter" && handleCustomUrlFetch()}
                                />
                                <button
                                    onClick={handleCustomUrlFetch}
                                    disabled={state.isLoading || !customUrl.trim()}
                                    className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-all disabled:opacity-50"
                                >
                                    {state.isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        "ดึงข้อมูล"
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-[var(--color-text-light)] mt-1.5">
                                * Google Sheet ต้องเป็น Public (แชร์แบบ Anyone with the link)
                            </p>
                        </div>
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
