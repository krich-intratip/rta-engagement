"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Upload, Lock, Info } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

// Placeholder data to demonstrate the UI
const DEMO_DATA = [
    { year: "2565", factor: 3.72, engagement: 3.65 },
    { year: "2566", factor: 3.81, engagement: 3.74 },
    { year: "2567", factor: 3.95, engagement: 3.88 },
    { year: "2568 (ปัจจุบัน)", factor: null, engagement: null },
];

const DEMO_FACTOR_TREND = [
    { label: "ภาคภูมิใจในงาน", y2565: 3.9, y2566: 4.0, y2567: 4.1 },
    { label: "Work-Life Balance", y2565: 3.2, y2566: 3.4, y2567: 3.5 },
    { label: "เงินเดือนเหมาะสม", y2565: 3.1, y2566: 3.0, y2567: 3.2 },
    { label: "ความก้าวหน้าอาชีพ", y2565: 3.4, y2566: 3.5, y2567: 3.6 },
    { label: "ผู้บังคับบัญชา", y2565: 3.8, y2566: 3.9, y2567: 4.0 },
];

export default function BenchmarkView() {
    const [showUpload, setShowUpload] = useState(false);

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Header */}
            <div className="glass-card p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-[var(--color-text)]">Benchmark — เปรียบเทียบแนวโน้มรายปี</h2>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                    <Lock className="w-2.5 h-2.5" /> Coming Soon
                                </span>
                            </div>
                            <p className="text-xs text-[var(--color-text-secondary)]">วิเคราะห์แนวโน้มคะแนนปัจจัยและความผูกพันเทียบกับปีก่อนหน้า</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowUpload(!showUpload)}
                        disabled
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] rounded-lg opacity-50 cursor-not-allowed">
                        <Upload className="w-3.5 h-3.5" /> โหลดข้อมูลปีก่อน
                    </button>
                </div>
            </div>

            {/* Coming Soon Banner */}
            <div className="glass-card p-5 border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1">ฟีเจอร์นี้อยู่ระหว่างการพัฒนา</p>
                        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                            ฟีเจอร์ Benchmark จะรองรับการโหลดข้อมูลสำรวจจากหลายปีเพื่อเปรียบเทียบแนวโน้ม
                            แสดง trend line รายปัจจัย และระบุว่าด้านใดดีขึ้นหรือแย่ลง
                            ด้านล่างเป็นตัวอย่าง UI ที่จะใช้งานได้เมื่อเปิดใช้งานเต็มรูปแบบ
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-[var(--color-text-secondary)]">
                            <li>✅ โหลดข้อมูลหลายปีพร้อมกัน (Excel/CSV)</li>
                            <li>✅ Trend line รายปัจจัยและความผูกพัน</li>
                            <li>✅ เปรียบเทียบ YoY (Year-over-Year) change</li>
                            <li>✅ ระบุปัจจัยที่ดีขึ้น/แย่ลงมากที่สุด</li>
                            <li>⏳ กำหนดเปิดใช้งาน: ในเวอร์ชั่นถัดไป</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Demo: Overall Trend */}
            <div className="glass-card p-4 relative">
                <div className="absolute inset-0 bg-[var(--color-surface)]/60 backdrop-blur-[2px] rounded-xl z-10 flex items-center justify-center">
                    <div className="text-center">
                        <Lock className="w-8 h-8 text-[var(--color-text-light)] mx-auto mb-2" />
                        <p className="text-sm font-semibold text-[var(--color-text-secondary)]">ตัวอย่าง UI (ยังไม่เปิดใช้งาน)</p>
                    </div>
                </div>
                <h3 className="text-sm font-bold mb-3 text-[var(--color-text)]">แนวโน้มคะแนนรวมรายปี</h3>
                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={DEMO_DATA}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} />
                            <YAxis domain={[3, 5]} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} />
                            <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <ReferenceLine y={4.0} stroke="#10b981" strokeDasharray="4 2" label={{ value: "เป้าหมาย 4.00", fontSize: 9, fill: "#10b981" }} />
                            <Line type="monotone" dataKey="factor" name="ปัจจัย" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                            <Line type="monotone" dataKey="engagement" name="ความผูกพัน" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Demo: Factor Trend Table */}
            <div className="glass-card p-4 relative">
                <div className="absolute inset-0 bg-[var(--color-surface)]/60 backdrop-blur-[2px] rounded-xl z-10 flex items-center justify-center">
                    <div className="text-center">
                        <Lock className="w-8 h-8 text-[var(--color-text-light)] mx-auto mb-2" />
                        <p className="text-sm font-semibold text-[var(--color-text-secondary)]">ตัวอย่าง UI (ยังไม่เปิดใช้งาน)</p>
                    </div>
                </div>
                <h3 className="text-sm font-bold mb-3 text-[var(--color-text)]">แนวโน้มรายปัจจัย (ตัวอย่าง 5 ปัจจัย)</h3>
                <div className="overflow-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-[var(--color-border)]">
                                <th className="text-left py-2 pr-4 text-[var(--color-text-secondary)] font-medium">ปัจจัย</th>
                                <th className="text-center py-2 px-3 text-[var(--color-text-secondary)] font-medium">2565</th>
                                <th className="text-center py-2 px-3 text-[var(--color-text-secondary)] font-medium">2566</th>
                                <th className="text-center py-2 px-3 text-[var(--color-text-secondary)] font-medium">2567</th>
                                <th className="text-center py-2 px-3 text-[var(--color-text-secondary)] font-medium">เปลี่ยนแปลง</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DEMO_FACTOR_TREND.map((row, i) => {
                                const change = row.y2567 - row.y2565;
                                return (
                                    <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                                        <td className="py-2 pr-4 text-[var(--color-text)]">{row.label}</td>
                                        <td className="text-center py-2 px-3 text-[var(--color-text-secondary)]">{row.y2565.toFixed(2)}</td>
                                        <td className="text-center py-2 px-3 text-[var(--color-text-secondary)]">{row.y2566.toFixed(2)}</td>
                                        <td className="text-center py-2 px-3 font-semibold text-[var(--color-text)]">{row.y2567.toFixed(2)}</td>
                                        <td className={`text-center py-2 px-3 font-bold ${change > 0 ? "text-emerald-500" : change < 0 ? "text-red-500" : "text-gray-400"}`}>
                                            {change > 0 ? "+" : ""}{change.toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}
