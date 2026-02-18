"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, Plus, Trash2, Save, RotateCcw, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { FACTOR_LABELS, ENGAGEMENT_LABELS } from "@/types/survey";

const STORAGE_KEY = "rta-survey-builder-v1";

interface QuestionConfig {
    id: string;
    label: string;
    enabled: boolean;
    group: string;
}

const DEFAULT_FACTOR_QUESTIONS: QuestionConfig[] = FACTOR_LABELS.map((label, i) => ({
    id: `f${i}`,
    label,
    enabled: true,
    group: ["ลักษณะงาน", "ลักษณะงาน", "ลักษณะงาน", "ลักษณะงาน",
        "สภาพแวดล้อม", "สภาพแวดล้อม", "สภาพแวดล้อม",
        "คุณภาพชีวิต", "คุณภาพชีวิต", "คุณภาพชีวิต",
        "เพื่อนร่วมงาน", "เพื่อนร่วมงาน", "เพื่อนร่วมงาน",
        "ผู้บังคับบัญชา", "ผู้บังคับบัญชา", "ผู้บังคับบัญชา", "ผู้บังคับบัญชา", "ผู้บังคับบัญชา",
        "นโยบาย", "นโยบาย", "นโยบาย", "นโยบาย",
        "ค่าตอบแทน", "ค่าตอบแทน", "ค่าตอบแทน",
        "ภาระงาน", "ภาระงาน",
        "ความก้าวหน้า", "ความก้าวหน้า"][i],
}));

const DEFAULT_ENGAGEMENT_QUESTIONS: QuestionConfig[] = ENGAGEMENT_LABELS.map((label, i) => ({
    id: `e${i}`,
    label,
    enabled: true,
    group: ["ทัศนคติและความภักดี", "ทัศนคติและความภักดี", "ทัศนคติและความภักดี", "ทัศนคติและความภักดี", "ทัศนคติและความภักดี",
        "ความเต็มใจทุ่มเท", "ความเต็มใจทุ่มเท", "ความเต็มใจทุ่มเท",
        "ความเชื่อมั่นในองค์การ", "ความเชื่อมั่นในองค์การ", "ความเชื่อมั่นในองค์การ"][i],
}));

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export default function SurveyBuilder() {
    const [factorQs, setFactorQs] = useState<QuestionConfig[]>(DEFAULT_FACTOR_QUESTIONS);
    const [engQs, setEngQs] = useState<QuestionConfig[]>(DEFAULT_ENGAGEMENT_QUESTIONS);
    const [activeSection, setActiveSection] = useState<"factor" | "engagement">("factor");
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [saved, setSaved] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.factorQs) setFactorQs(parsed.factorQs);
                if (parsed.engQs) setEngQs(parsed.engQs);
            }
        } catch { /* ignore */ }
    }, []);

    const handleSave = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ factorQs, engQs }));
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch { /* ignore */ }
    }, [factorQs, engQs]);

    const handleReset = () => {
        setFactorQs(DEFAULT_FACTOR_QUESTIONS);
        setEngQs(DEFAULT_ENGAGEMENT_QUESTIONS);
        localStorage.removeItem(STORAGE_KEY);
    };

    const qs = activeSection === "factor" ? factorQs : engQs;
    const setQs = activeSection === "factor" ? setFactorQs : setEngQs;

    const toggleEnabled = (id: string) => setQs((prev) => prev.map((q) => q.id === id ? { ...q, enabled: !q.enabled } : q));

    const startEdit = (q: QuestionConfig) => { setEditingId(q.id); setEditValue(q.label); };
    const commitEdit = () => {
        if (editingId && editValue.trim()) {
            setQs((prev) => prev.map((q) => q.id === editingId ? { ...q, label: editValue.trim() } : q));
        }
        setEditingId(null);
    };

    const addQuestion = (group: string) => {
        const newQ: QuestionConfig = { id: newId(), label: "ข้อคำถามใหม่", enabled: true, group };
        setQs((prev) => [...prev, newQ]);
        setTimeout(() => { setEditingId(newQ.id); setEditValue(newQ.label); }, 50);
    };

    const deleteQuestion = (id: string) => setQs((prev) => prev.filter((q) => q.id !== id));

    const moveUp = (id: string) => {
        setQs((prev) => {
            const idx = prev.findIndex((q) => q.id === id);
            if (idx <= 0) return prev;
            const next = [...prev];
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            return next;
        });
    };

    const moveDown = (id: string) => {
        setQs((prev) => {
            const idx = prev.findIndex((q) => q.id === id);
            if (idx >= prev.length - 1) return prev;
            const next = [...prev];
            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
            return next;
        });
    };

    // Group questions
    const groups = Array.from(new Set(qs.map((q) => q.group)));
    const enabledCount = qs.filter((q) => q.enabled).length;

    const toggleGroup = (g: string) => setExpandedGroups((prev) => ({ ...prev, [g]: !prev[g] }));
    const isGroupExpanded = (g: string) => expandedGroups[g] !== false; // default expanded

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Header */}
            <div className="glass-card p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-[var(--color-primary)]" />
                        <div>
                            <h2 className="text-base font-bold text-[var(--color-text)]">Survey Builder</h2>
                            <p className="text-xs text-[var(--color-text-secondary)]">ปรับแต่งข้อคำถามและกลุ่มปัจจัยสำหรับการสำรวจ</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleReset}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-border)] transition-colors">
                            <RotateCcw className="w-3.5 h-3.5" /> รีเซ็ต
                        </button>
                        <button onClick={handleSave}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all ${saved ? "bg-emerald-500 text-white" : "bg-[var(--color-primary)] text-white hover:opacity-90"}`}>
                            <Save className="w-3.5 h-3.5" /> {saved ? "บันทึกแล้ว ✓" : "บันทึก"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Warning */}
            <div className="glass-card p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    <strong>หมายเหตุ:</strong> การแก้ไขข้อคำถามที่นี่จะมีผลต่อป้ายกำกับที่แสดงในการวิเคราะห์เท่านั้น
                    ไม่ได้เปลี่ยนแปลงข้อมูลดิบ การปิดใช้งานข้อคำถามจะซ่อนข้อนั้นจากการแสดงผล
                    การเปลี่ยนแปลงบันทึกใน localStorage ของเบราว์เซอร์
                </p>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-2">
                {([["factor", `ปัจจัย (${factorQs.filter((q) => q.enabled).length}/${factorQs.length})`],
                    ["engagement", `ความผูกพัน (${engQs.filter((q) => q.enabled).length}/${engQs.length})`]] as const).map(([sec, label]) => (
                    <button key={sec} onClick={() => setActiveSection(sec)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === sec ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"}`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Stats */}
            <div className="glass-card p-3 flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
                <span>ข้อคำถามทั้งหมด: <strong className="text-[var(--color-text)]">{qs.length}</strong></span>
                <span>เปิดใช้งาน: <strong className="text-emerald-600 dark:text-emerald-400">{enabledCount}</strong></span>
                <span>ปิดใช้งาน: <strong className="text-red-500">{qs.length - enabledCount}</strong></span>
                <span>กลุ่ม: <strong className="text-[var(--color-text)]">{groups.length}</strong></span>
            </div>

            {/* Questions by Group */}
            <div className="space-y-3">
                {groups.map((group) => {
                    const groupQs = qs.filter((q) => q.group === group);
                    const expanded = isGroupExpanded(group);
                    return (
                        <div key={group} className="glass-card overflow-hidden">
                            {/* Group Header */}
                            <button onClick={() => toggleGroup(group)}
                                className="w-full flex items-center justify-between p-3 hover:bg-[var(--color-surface-alt)] transition-colors">
                                <div className="flex items-center gap-2">
                                    <GripVertical className="w-4 h-4 text-[var(--color-text-light)]" />
                                    <span className="text-sm font-bold text-[var(--color-text)]">{group}</span>
                                    <span className="text-xs text-[var(--color-text-secondary)]">
                                        ({groupQs.filter((q) => q.enabled).length}/{groupQs.length} ข้อ)
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); addQuestion(group); }}
                                        className="p-1 rounded hover:bg-[var(--color-border)] text-[var(--color-primary)] transition-colors" title="เพิ่มข้อคำถาม">
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                    {expanded ? <ChevronUp className="w-4 h-4 text-[var(--color-text-secondary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />}
                                </div>
                            </button>

                            {/* Questions */}
                            <AnimatePresence>
                                {expanded && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                        <div className="border-t border-[var(--color-border)]">
                                            {groupQs.map((q, qi) => (
                                                <div key={q.id} className={`flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)] last:border-0 ${!q.enabled ? "opacity-50" : ""}`}>
                                                    {/* Enable toggle */}
                                                    <button onClick={() => toggleEnabled(q.id)}
                                                        className={`w-4 h-4 rounded border-2 flex-shrink-0 transition-colors ${q.enabled ? "bg-[var(--color-primary)] border-[var(--color-primary)]" : "border-[var(--color-border)]"}`}
                                                        title={q.enabled ? "ปิดใช้งาน" : "เปิดใช้งาน"}>
                                                        {q.enabled && <span className="block w-full h-full text-white text-[8px] flex items-center justify-center">✓</span>}
                                                    </button>

                                                    {/* Label / Edit */}
                                                    <div className="flex-1 min-w-0">
                                                        {editingId === q.id ? (
                                                            <input
                                                                autoFocus
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                onBlur={commitEdit}
                                                                onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingId(null); }}
                                                                className="w-full text-xs px-2 py-1 bg-[var(--color-surface-alt)] border border-[var(--color-primary)] rounded text-[var(--color-text)] focus:outline-none"
                                                            />
                                                        ) : (
                                                            <span className="text-xs text-[var(--color-text)] cursor-pointer hover:text-[var(--color-primary)] transition-colors" onClick={() => startEdit(q)}>
                                                                {q.label}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-0.5 flex-shrink-0">
                                                        <button onClick={() => moveUp(q.id)} disabled={qi === 0}
                                                            className="p-1 rounded hover:bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] disabled:opacity-30 transition-colors">
                                                            <ChevronUp className="w-3 h-3" />
                                                        </button>
                                                        <button onClick={() => moveDown(q.id)} disabled={qi === groupQs.length - 1}
                                                            className="p-1 rounded hover:bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] disabled:opacity-30 transition-colors">
                                                            <ChevronDown className="w-3 h-3" />
                                                        </button>
                                                        <button onClick={() => deleteQuestion(q.id)}
                                                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors">
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
