"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppState } from "@/lib/store";

const STOP_WORDS = new Set([
    "ที่", "และ", "ใน", "ของ", "การ", "ให้", "ได้", "มี", "เป็น", "จาก", "กับ", "ไม่", "ต้อง",
    "ควร", "อยาก", "อยู่", "ทำ", "มาก", "น้อย", "ดี", "ขึ้น", "ลง", "แต่", "หรือ", "เพื่อ",
    "โดย", "เมื่อ", "ซึ่ง", "นั้น", "นี้", "ก็", "จะ", "ยัง", "แล้ว", "อีก", "ทั้ง", "ทุก",
    "เช่น", "ตาม", "เพิ่ม", "ต่อ", "ไป", "มา", "ว่า", "ถ้า", "เพราะ", "เนื่องจาก", "รวม",
    "ทบ", "กองทัพบก", "กองทัพ", "หน่วย", "ราชการ", "ทหาร", "กำลังพล", "บุคลากร",
]);

const OPEN_ENDED_FIELDS = [
    { key: "policyExpectation1", label: "ความต้องการด้านนโยบาย (1)" },
    { key: "policyExpectation2", label: "ความต้องการด้านนโยบาย (2)" },
    { key: "environmentExpectation1", label: "ความต้องการด้านสภาพแวดล้อม (1)" },
    { key: "environmentExpectation2", label: "ความต้องการด้านสภาพแวดล้อม (2)" },
    { key: "welfareExpectation1", label: "ความต้องการด้านสวัสดิการ (1)" },
    { key: "welfareExpectation2", label: "ความต้องการด้านสวัสดิการ (2)" },
    { key: "additionalComments", label: "ความคิดเห็นเพิ่มเติม" },
    { key: "all", label: "ทั้งหมด" },
] as const;

type FieldKey = typeof OPEN_ENDED_FIELDS[number]["key"];

function tokenize(text: string): string[] {
    return text
        .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, " ")
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
}

function getFrequency(texts: string[]): { word: string; count: number }[] {
    const freq: Record<string, number> = {};
    for (const text of texts) {
        for (const word of tokenize(text)) {
            freq[word] = (freq[word] || 0) + 1;
        }
    }
    return Object.entries(freq)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 60);
}

const COLORS = [
    "#3B7DD8", "#9B59B6", "#2ECC71", "#E74C8B", "#F39C12",
    "#1ABC9C", "#E74C3C", "#3498DB", "#E67E22", "#16A085",
];

export default function TextAnalysis() {
    const { filteredData } = useAppState();
    const [selectedField, setSelectedField] = useState<FieldKey>("all");
    const [viewMode, setViewMode] = useState<"cloud" | "bar">("cloud");

    const texts = useMemo(() => {
        return filteredData
            .map((r) => {
                if (selectedField === "all") {
                    return Object.values(r.openEnded).join(" ");
                }
                return r.openEnded[selectedField as keyof typeof r.openEnded] || "";
            })
            .filter((t) => t.trim().length > 0);
    }, [filteredData, selectedField]);

    const freq = useMemo(() => getFrequency(texts), [texts]);
    const totalResponses = texts.length;
    const totalWords = freq.reduce((s, w) => s + w.count, 0);
    const maxCount = freq[0]?.count ?? 1;

    if (filteredData.length === 0) return null;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="text-base font-bold">วิเคราะห์ข้อความปลายเปิด (Text Analysis)</h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {totalResponses} ข้อความ · {totalWords} คำ (หลังกรอง stop words)
                    </p>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => setViewMode("cloud")} className={`tab-btn text-xs ${viewMode === "cloud" ? "active" : ""}`}>Word Cloud</button>
                    <button onClick={() => setViewMode("bar")} className={`tab-btn text-xs ${viewMode === "bar" ? "active" : ""}`}>Top Keywords</button>
                </div>
            </div>

            {/* Field selector */}
            <div className="flex gap-1 flex-wrap mb-4">
                {OPEN_ENDED_FIELDS.map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setSelectedField(f.key)}
                        className={`tab-btn text-xs ${selectedField === f.key ? "active" : ""}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {freq.length === 0 ? (
                <div className="text-center py-10 text-[var(--color-text-secondary)] text-sm">
                    ไม่มีข้อความในหัวข้อนี้
                </div>
            ) : viewMode === "cloud" ? (
                <div className="flex flex-wrap gap-2 justify-center items-center min-h-[200px] p-4 bg-[var(--color-surface-alt)] rounded-xl">
                    {freq.slice(0, 50).map((item, i) => {
                        const ratio = item.count / maxCount;
                        const fontSize = Math.max(11, Math.round(11 + ratio * 28));
                        const opacity = Math.max(0.5, ratio);
                        return (
                            <span
                                key={item.word}
                                title={`${item.word}: ${item.count} ครั้ง`}
                                className="cursor-default transition-transform hover:scale-110 font-medium"
                                style={{
                                    fontSize,
                                    color: COLORS[i % COLORS.length],
                                    opacity,
                                    lineHeight: 1.4,
                                }}
                            >
                                {item.word}
                            </span>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                    {freq.slice(0, 30).map((item, i) => (
                        <div key={item.word} className="flex items-center gap-2">
                            <span className="text-xs text-[var(--color-text-light)] w-5 text-right">{i + 1}</span>
                            <span className="text-xs font-medium w-28 truncate">{item.word}</span>
                            <div className="flex-1 h-5 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${(item.count / maxCount) * 100}%`,
                                        background: COLORS[i % COLORS.length],
                                    }}
                                />
                            </div>
                            <span className="text-xs font-bold w-8 text-right">{item.count}</span>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
