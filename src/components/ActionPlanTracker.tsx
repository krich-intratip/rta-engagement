"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardCheck, Plus, Trash2, CheckCircle2, Clock, AlertCircle, Edit3, Save, X } from "lucide-react";

type Priority = "สูง" | "กลาง" | "ต่ำ";
type Status = "รอดำเนินการ" | "กำลังดำเนินการ" | "เสร็จสิ้น";

interface ActionItem {
    id: string;
    title: string;
    description: string;
    owner: string;
    dueDate: string;
    priority: Priority;
    status: Status;
    createdAt: string;
    factor: string;
}

const STORAGE_KEY = "rta-action-plan-v1";

const STATUS_CONFIG: Record<Status, { color: string; bg: string; icon: typeof Clock }> = {
    "รอดำเนินการ": { color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-800", icon: Clock },
    "กำลังดำเนินการ": { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", icon: AlertCircle },
    "เสร็จสิ้น": { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: CheckCircle2 },
};

const PRIORITY_CONFIG: Record<Priority, { color: string; bg: string }> = {
    "สูง": { color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
    "กลาง": { color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
    "ต่ำ": { color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-800" },
};

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

const EMPTY_FORM: Omit<ActionItem, "id" | "createdAt"> = {
    title: "", description: "", owner: "", dueDate: "", priority: "กลาง", status: "รอดำเนินการ", factor: "",
};

export default function ActionPlanTracker() {
    const [items, setItems] = useState<ActionItem[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [filterStatus, setFilterStatus] = useState<Status | "ทั้งหมด">("ทั้งหมด");
    const [filterPriority, setFilterPriority] = useState<Priority | "ทั้งหมด">("ทั้งหมด");

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setItems(JSON.parse(raw));
        } catch { /* ignore */ }
    }, []);

    const save = useCallback((next: ActionItem[]) => {
        setItems(next);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    }, []);

    const handleSubmit = () => {
        if (!form.title.trim()) return;
        if (editId) {
            save(items.map((it) => it.id === editId ? { ...it, ...form } : it));
            setEditId(null);
        } else {
            save([...items, { ...form, id: newId(), createdAt: new Date().toISOString() }]);
        }
        setForm({ ...EMPTY_FORM });
        setShowForm(false);
    };

    const handleEdit = (item: ActionItem) => {
        setForm({ title: item.title, description: item.description, owner: item.owner, dueDate: item.dueDate, priority: item.priority, status: item.status, factor: item.factor });
        setEditId(item.id);
        setShowForm(true);
    };

    const handleDelete = (id: string) => save(items.filter((it) => it.id !== id));

    const handleStatusCycle = (item: ActionItem) => {
        const cycle: Status[] = ["รอดำเนินการ", "กำลังดำเนินการ", "เสร็จสิ้น"];
        const next = cycle[(cycle.indexOf(item.status) + 1) % 3];
        save(items.map((it) => it.id === item.id ? { ...it, status: next } : it));
    };

    const filtered = items.filter((it) =>
        (filterStatus === "ทั้งหมด" || it.status === filterStatus) &&
        (filterPriority === "ทั้งหมด" || it.priority === filterPriority)
    );

    const counts = { total: items.length, done: items.filter((i) => i.status === "เสร็จสิ้น").length, inprog: items.filter((i) => i.status === "กำลังดำเนินการ").length, pending: items.filter((i) => i.status === "รอดำเนินการ").length };
    const pct = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Header */}
            <div className="glass-card p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-[var(--color-primary)]" />
                        <div>
                            <h2 className="text-base font-bold text-[var(--color-text)]">Action Plan Tracker</h2>
                            <p className="text-xs text-[var(--color-text-secondary)]">ติดตามแผนปฏิบัติการและความก้าวหน้า</p>
                        </div>
                    </div>
                    <button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY_FORM }); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity">
                        <Plus className="w-3.5 h-3.5" /> เพิ่มแผนงาน
                    </button>
                </div>
            </div>

            {/* KPI Bar */}
            {counts.total > 0 && (
                <div className="glass-card p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--color-text-secondary)]">ความคืบหน้าโดยรวม</span>
                        <span className="font-bold text-[var(--color-text)]">{pct}% ({counts.done}/{counts.total})</span>
                    </div>
                    <div className="h-2 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        {[["รอดำเนินการ", counts.pending, "text-gray-500"], ["กำลังดำเนินการ", counts.inprog, "text-blue-500"], ["เสร็จสิ้น", counts.done, "text-emerald-500"]].map(([label, cnt, cls]) => (
                            <div key={label as string} className="bg-[var(--color-surface-alt)] rounded-lg p-2">
                                <p className={`text-lg font-black ${cls}`}>{cnt}</p>
                                <p className="text-[10px] text-[var(--color-text-secondary)]">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            {counts.total > 0 && (
                <div className="flex flex-wrap gap-2 text-xs">
                    <span className="text-[var(--color-text-secondary)] self-center">กรอง:</span>
                    {(["ทั้งหมด", "รอดำเนินการ", "กำลังดำเนินการ", "เสร็จสิ้น"] as const).map((s) => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={`px-2.5 py-1 rounded-full transition-all ${filterStatus === s ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]"}`}>
                            {s}
                        </button>
                    ))}
                    <span className="text-[var(--color-text-secondary)] self-center ml-2">ความเร่งด่วน:</span>
                    {(["ทั้งหมด", "สูง", "กลาง", "ต่ำ"] as const).map((p) => (
                        <button key={p} onClick={() => setFilterPriority(p)}
                            className={`px-2.5 py-1 rounded-full transition-all ${filterPriority === p ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]"}`}>
                            {p}
                        </button>
                    ))}
                </div>
            )}

            {/* Add/Edit Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="glass-card p-4 border border-[var(--color-primary)]/30 space-y-3 overflow-hidden">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-[var(--color-text)]">{editId ? "แก้ไขแผนงาน" : "เพิ่มแผนงานใหม่"}</h3>
                            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">ชื่อแผนงาน *</label>
                                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="เช่น จัดทำโปรแกรม Team Building ประจำไตรมาส"
                                    className="w-full px-3 py-2 text-sm bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-text-light)] focus:outline-none focus:border-[var(--color-primary)]" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">รายละเอียด</label>
                                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={2} placeholder="อธิบายรายละเอียดและขั้นตอนการดำเนินงาน"
                                    className="w-full px-3 py-2 text-sm bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-text-light)] focus:outline-none focus:border-[var(--color-primary)] resize-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">ผู้รับผิดชอบ</label>
                                <input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}
                                    placeholder="เช่น ฝ่ายกำลังพล"
                                    className="w-full px-3 py-2 text-sm bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-text-light)] focus:outline-none focus:border-[var(--color-primary)]" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">กำหนดเสร็จ</label>
                                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                                    className="w-full px-3 py-2 text-sm bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">ความเร่งด่วน</label>
                                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                                    className="w-full px-3 py-2 text-sm bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]">
                                    <option>สูง</option><option>กลาง</option><option>ต่ำ</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">สถานะ</label>
                                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                                    className="w-full px-3 py-2 text-sm bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]">
                                    <option>รอดำเนินการ</option><option>กำลังดำเนินการ</option><option>เสร็จสิ้น</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">ปัจจัย/ด้านที่เกี่ยวข้อง</label>
                                <input value={form.factor} onChange={(e) => setForm({ ...form, factor: e.target.value })}
                                    placeholder="เช่น Work-Life Balance, เงินเดือน, ผู้บังคับบัญชา"
                                    className="w-full px-3 py-2 text-sm bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-text-light)] focus:outline-none focus:border-[var(--color-primary)]" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setShowForm(false); setEditId(null); }}
                                className="px-4 py-1.5 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-alt)] rounded-lg hover:bg-[var(--color-border)] transition-colors">
                                ยกเลิก
                            </button>
                            <button onClick={handleSubmit} disabled={!form.title.trim()}
                                className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40">
                                <Save className="w-3.5 h-3.5" /> {editId ? "บันทึกการแก้ไข" : "เพิ่มแผนงาน"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Items */}
            {filtered.length === 0 ? (
                <div className="glass-card p-10 text-center">
                    <ClipboardCheck className="w-10 h-10 text-[var(--color-text-light)] mx-auto mb-3" />
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {items.length === 0 ? "ยังไม่มีแผนงาน — กดปุ่ม 'เพิ่มแผนงาน' เพื่อเริ่มต้น" : "ไม่พบแผนงานที่ตรงกับตัวกรอง"}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.sort((a, b) => {
                            const pOrder: Record<Priority, number> = { "สูง": 0, "กลาง": 1, "ต่ำ": 2 };
                            const sOrder: Record<Status, number> = { "กำลังดำเนินการ": 0, "รอดำเนินการ": 1, "เสร็จสิ้น": 2 };
                            return (sOrder[a.status] - sOrder[b.status]) || (pOrder[a.priority] - pOrder[b.priority]);
                        }).map((item) => {
                            const StatusIcon = STATUS_CONFIG[item.status].icon;
                            const isOverdue = item.dueDate && item.status !== "เสร็จสิ้น" && new Date(item.dueDate) < new Date();
                            return (
                                <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                                    className={`glass-card p-4 ${item.status === "เสร็จสิ้น" ? "opacity-60" : ""}`}>
                                    <div className="flex items-start gap-3">
                                        <button onClick={() => handleStatusCycle(item)} className="mt-0.5 flex-shrink-0" title="คลิกเพื่อเปลี่ยนสถานะ">
                                            <StatusIcon className={`w-5 h-5 ${STATUS_CONFIG[item.status].color}`} />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 flex-wrap">
                                                <p className={`text-sm font-semibold text-[var(--color-text)] ${item.status === "เสร็จสิ้น" ? "line-through" : ""}`}>
                                                    {item.title}
                                                </p>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_CONFIG[item.priority].bg} ${PRIORITY_CONFIG[item.priority].color}`}>
                                                        {item.priority}
                                                    </span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_CONFIG[item.status].bg} ${STATUS_CONFIG[item.status].color}`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </div>
                                            {item.description && (
                                                <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">{item.description}</p>
                                            )}
                                            <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-[var(--color-text-secondary)]">
                                                {item.owner && <span>👤 {item.owner}</span>}
                                                {item.dueDate && (
                                                    <span className={isOverdue ? "text-red-500 font-semibold" : ""}>
                                                        📅 {new Date(item.dueDate).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}
                                                        {isOverdue && " (เกินกำหนด!)"}
                                                    </span>
                                                )}
                                                {item.factor && <span>🎯 {item.factor}</span>}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            <div className="text-xs text-[var(--color-text-light)] text-center py-1">
                ข้อมูลแผนงานบันทึกในเบราว์เซอร์ (localStorage) — ไม่ส่งข้อมูลออกภายนอก
            </div>
        </motion.div>
    );
}
