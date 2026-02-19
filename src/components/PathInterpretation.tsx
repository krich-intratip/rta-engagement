"use client";

import { useMemo } from "react";
import { TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { OLSResult, IndirectEffect, pToSig } from "@/lib/pathStats";

interface FactorNode { id: string; label: string; short: string }
interface EngNode    { id: string; label: string; short: string }

export interface PathInterpretationProps {
    factorNodes: FactorNode[];
    engNodes: EngNode[];
    eq1: (OLSResult & { engNode: EngNode })[];
    eq2: OLSResult;
    effects: IndirectEffect[];
    n: number;
}

function r2Level(r2: number) {
    if (r2 >= 0.67) return { label: "สูงมาก", color: "text-emerald-600 dark:text-emerald-400" };
    if (r2 >= 0.33) return { label: "ปานกลาง", color: "text-blue-600 dark:text-blue-400" };
    if (r2 >= 0.19) return { label: "ต่ำ-ปานกลาง", color: "text-yellow-600 dark:text-yellow-500" };
    return { label: "ต่ำ", color: "text-orange-500" };
}

function betaLevel(b: number) {
    const a = Math.abs(b);
    if (a >= 0.35) return "แข็งแกร่งมาก";
    if (a >= 0.20) return "ปานกลาง";
    if (a >= 0.10) return "อ่อน";
    return "เล็กน้อย";
}

function sigThai(p: number) {
    const s = pToSig(p);
    if (s === "***") return "มีนัยสำคัญสูงมาก (p<0.001)";
    if (s === "**")  return "มีนัยสำคัญสูง (p<0.01)";
    if (s === "*")   return "มีนัยสำคัญ (p<0.05)";
    if (s === "†")   return "มีนัยสำคัญเล็กน้อย (p<0.10)";
    return "ไม่มีนัยสำคัญ (p≥0.10)";
}

export default function PathInterpretation({ factorNodes, engNodes, eq1, eq2, effects, n }: PathInterpretationProps) {
    // ── Significant paths ──────────────────────────────────────────────────────
    const sigPaths = useMemo(() => {
        const paths: { from: string; to: string; beta: number; p: number }[] = [];
        engNodes.forEach((eng, ei) => {
            factorNodes.forEach((fac, fi) => {
                if (eq1[ei].pValues[fi] < 0.1)
                    paths.push({ from: fac.label, to: eng.label, beta: eq1[ei].betas[fi], p: eq1[ei].pValues[fi] });
            });
        });
        engNodes.forEach((eng, ei) => {
            if (eq2.pValues[ei] < 0.1)
                paths.push({ from: eng.label, to: "ความตั้งใจอยู่ต่อ", beta: eq2.betas[ei], p: eq2.pValues[ei] });
        });
        return paths.sort((a, b) => Math.abs(b.beta) - Math.abs(a.beta));
    }, [eq1, eq2, factorNodes, engNodes]);

    // ── Policy recommendations ─────────────────────────────────────────────────
    const recs = useMemo(() => {
        const list: { priority: "high" | "medium" | "low"; title: string; detail: string; icon: "up" | "warn" | "check" }[] = [];

        const topFactor = [...effects].sort((a, b) => Math.abs(b.total) - Math.abs(a.total))[0];
        if (topFactor && Math.abs(topFactor.total) > 0.001) {
            list.push({
                priority: "high",
                title: `เร่งพัฒนา "${topFactor.factorLabel}" เป็นลำดับแรก`,
                detail: `มีผลทางอ้อมต่อการคงอยู่สูงสุด (β = ${topFactor.total >= 0 ? "+" : ""}${topFactor.total.toFixed(3)}) — การปรับปรุงด้านนี้จะส่งผลต่อความผูกพันและลดการโอนย้ายได้มากที่สุด`,
                icon: "up",
            });
        }

        const topEngIdx = eq2.betas.reduce((best, b, i) => Math.abs(b) > Math.abs(eq2.betas[best]) ? i : best, 0);
        if (eq2.pValues[topEngIdx] < 0.1) {
            list.push({
                priority: "high",
                title: `เสริมสร้าง "${engNodes[topEngIdx]?.label}" เพื่อรักษากำลังพล`,
                detail: `ความผูกพันด้านนี้มีผลโดยตรงต่อความตั้งใจอยู่ต่อสูงสุด (β = ${eq2.betas[topEngIdx] >= 0 ? "+" : ""}${eq2.betas[topEngIdx].toFixed(3)}, ${pToSig(eq2.pValues[topEngIdx])}) — ควรออกแบบกิจกรรมและนโยบายที่เสริมสร้างความผูกพันด้านนี้โดยตรง`,
                icon: "up",
            });
        }

        const negPaths: string[] = [];
        engNodes.forEach((eng, ei) => {
            factorNodes.forEach((fac, fi) => {
                if (eq1[ei].betas[fi] < -0.10 && eq1[ei].pValues[fi] < 0.1)
                    negPaths.push(`${fac.label} → ${eng.label}`);
            });
        });
        if (negPaths.length > 0) {
            list.push({
                priority: "high",
                title: "แก้ไขปัจจัยที่ส่งผลเชิงลบต่อความผูกพัน",
                detail: `พบเส้นทางที่มีผลเชิงลบ: ${negPaths.join(", ")} — ปัจจัยเหล่านี้กำลังบั่นทอนความผูกพัน ควรตรวจสอบและแก้ไขเร่งด่วน`,
                icon: "warn",
            });
        }

        if (eq2.r2 < 0.33) {
            list.push({
                priority: "medium",
                title: "ศึกษาปัจจัยเพิ่มเติมนอกโมเดล",
                detail: `R² ของ Retention = ${(eq2.r2 * 100).toFixed(1)}% บ่งชี้ว่ายังมีปัจจัยอื่นที่ส่งผลต่อการคงอยู่ เช่น ค่าตอบแทนรวม โอกาสก้าวหน้า ปัจจัยครอบครัว ควรศึกษาเพิ่มเติม`,
                icon: "check",
            });
        }

        const noSigFactors = factorNodes.filter((_, fi) => engNodes.every((_, ei) => eq1[ei].pValues[fi] >= 0.1));
        if (noSigFactors.length > 0) {
            list.push({
                priority: "low",
                title: `ทบทวนการวัด "${noSigFactors.map((f) => f.label).join(", ")}"`,
                detail: `ปัจจัยเหล่านี้ไม่มีเส้นทางที่มีนัยสำคัญต่อความผูกพันใดเลย อาจเป็นเพราะการวัดยังไม่ครอบคลุม หรือส่งผลผ่านกลไกอื่น ควรทบทวนข้อคำถาม`,
                icon: "check",
            });
        }

        return list;
    }, [effects, eq1, eq2, factorNodes, engNodes]);

    const iconMap = {
        up: <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />,
        warn: <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />,
        check: <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />,
    };
    const priorityStyle = {
        high: "border-l-4 border-red-400 bg-red-50 dark:bg-red-900/10",
        medium: "border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10",
        low: "border-l-4 border-blue-300 bg-blue-50 dark:bg-blue-900/10",
    };
    const priorityLabel = { high: "เร่งด่วน", medium: "ควรดำเนินการ", low: "พิจารณาเพิ่มเติม" };
    const priorityColor = { high: "text-red-600 dark:text-red-400", medium: "text-yellow-600 dark:text-yellow-500", low: "text-blue-600 dark:text-blue-400" };

    const topEffects = [...effects].sort((a, b) => Math.abs(b.total) - Math.abs(a.total)).slice(0, 3).filter((e) => Math.abs(e.total) > 0.001);

    return (
        <div className="space-y-6 text-sm">

            {/* ── 1. R² ── */}
            <section className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
                    1. อำนาจในการอธิบายของโมเดล (R²)
                </h4>
                <div className="space-y-2">
                    {engNodes.map((eng, ei) => {
                        const r2 = eq1[ei].r2; const lv = r2Level(r2);
                        return (
                            <div key={eng.id} className="p-3 rounded-xl bg-[var(--color-surface-alt)] text-xs">
                                <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                                    <span className="font-semibold">{eng.label}</span>
                                    <span className={`font-bold ${lv.color}`}>R² = {(r2 * 100).toFixed(1)}% ({lv.label})</span>
                                </div>
                                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                                    ปัจจัยในงาน 8 กลุ่มอธิบายความแปรปรวนของ <strong>{eng.label}</strong> ได้ <strong className={lv.color}>{(r2 * 100).toFixed(1)}%</strong>
                                    {r2 >= 0.33 ? " — โมเดลมีอำนาจอธิบายดี ปัจจัยในงานมีบทบาทสำคัญต่อความผูกพันด้านนี้"
                                        : r2 >= 0.19 ? " — อยู่ในระดับต่ำ-ปานกลาง อาจมีตัวแปรอื่นนอกโมเดลที่ส่งผลด้วย"
                                            : " — อยู่ในระดับต่ำ ยังมีปัจจัยอื่นที่ส่งผลต่อความผูกพันด้านนี้อย่างมีนัยสำคัญ"}
                                </p>
                            </div>
                        );
                    })}
                    <div className="p-3 rounded-xl bg-[var(--color-primary-light)]/10 border border-[var(--color-primary)]/20 text-xs">
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                            <span className="font-semibold">ความตั้งใจอยู่ต่อ (Retention)</span>
                            <span className={`font-bold ${r2Level(eq2.r2).color}`}>R² = {(eq2.r2 * 100).toFixed(1)}% ({r2Level(eq2.r2).label})</span>
                        </div>
                        <p className="text-[var(--color-text-secondary)] leading-relaxed">
                            ความผูกพัน 3 กลุ่มอธิบายความตั้งใจอยู่ต่อได้ <strong className={r2Level(eq2.r2).color}>{(eq2.r2 * 100).toFixed(1)}%</strong>
                            {eq2.r2 >= 0.33
                                ? " — โมเดลมีอำนาจทำนายสูง ความผูกพันเป็นตัวกลางสำคัญระหว่างปัจจัยในงานกับการคงอยู่ของกำลังพล"
                                : " — ความผูกพันมีส่วนอธิบายการคงอยู่ แต่ยังมีปัจจัยอื่น เช่น ค่าตอบแทน โอกาสก้าวหน้า หรือปัจจัยส่วนตัว ที่ต้องพิจารณาเพิ่มเติม"}
                        </p>
                    </div>
                </div>
            </section>

            {/* ── 2. Significant Paths ── */}
            <section className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
                    2. เส้นทางที่มีนัยสำคัญทางสถิติ (p &lt; 0.10)
                </h4>
                {sigPaths.length === 0 ? (
                    <p className="text-xs text-[var(--color-text-secondary)] italic p-3 bg-[var(--color-surface-alt)] rounded-xl">ไม่พบเส้นทางที่มีนัยสำคัญ — ตรวจสอบขนาดตัวอย่างหรือ filter ที่ใช้</p>
                ) : (
                    <div className="space-y-2">
                        {sigPaths.map((path, i) => (
                            <div key={i} className={`p-3 rounded-xl text-xs border-l-4 ${path.beta >= 0 ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" : "border-red-400 bg-red-50 dark:bg-red-900/10"}`}>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-bold">{path.from}</span>
                                    <span className="text-[var(--color-text-secondary)]">→</span>
                                    <span className="font-bold">{path.to}</span>
                                    <span className={`ml-auto font-mono font-bold ${path.beta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                                        β = {path.beta >= 0 ? "+" : ""}{path.beta.toFixed(3)}
                                    </span>
                                </div>
                                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                                    {path.beta >= 0 ? "ส่งผลเชิงบวก" : "ส่งผลเชิงลบ"}ต่อ <strong>{path.to}</strong> ในระดับ<strong>{betaLevel(path.beta)}</strong> · {sigThai(path.p)}
                                    {" — "}{path.beta >= 0
                                        ? `เมื่อ ${path.from} เพิ่มขึ้น 1 SD, ${path.to} จะเพิ่มขึ้น ${Math.abs(path.beta).toFixed(3)} SD`
                                        : `เมื่อ ${path.from} เพิ่มขึ้น 1 SD, ${path.to} จะลดลง ${Math.abs(path.beta).toFixed(3)} SD`}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── 3. Indirect Effects ── */}
            {topEffects.length > 0 && (
                <section className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
                        3. ผลทางอ้อม — ปัจจัยที่มีอิทธิพลสูงสุดต่อการคงอยู่ (ผ่านความผูกพัน)
                    </h4>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                        เส้นทาง: <strong>ปัจจัย → ความผูกพัน → ความตั้งใจอยู่ต่อ</strong> · คำนวณจาก β(F→E) × β(E→R)
                    </p>
                    <div className="space-y-2">
                        {topEffects.map((eff, rank) => {
                            const domIdx = eff.byMediator.reduce((best, v, i) => Math.abs(v) > Math.abs(eff.byMediator[best]) ? i : best, 0);
                            return (
                                <div key={eff.factorLabel} className="p-3 rounded-xl bg-[var(--color-surface-alt)] text-xs">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${rank === 0 ? "bg-amber-500" : rank === 1 ? "bg-slate-400" : "bg-amber-700"}`}>{rank + 1}</span>
                                        <span className="font-bold">{eff.factorLabel}</span>
                                        <span className={`ml-auto font-mono font-bold ${eff.total >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                                            β = {eff.total >= 0 ? "+" : ""}{eff.total.toFixed(4)}
                                        </span>
                                    </div>
                                    <p className="text-[var(--color-text-secondary)] leading-relaxed">
                                        ส่งผลทางอ้อมต่อความตั้งใจอยู่ต่อผ่านตัวกลางหลักคือ <strong>{engNodes[domIdx]?.label}</strong>{" "}
                                        (β = {eff.byMediator[domIdx] >= 0 ? "+" : ""}{eff.byMediator[domIdx].toFixed(4)}) ·{" "}
                                        รวมผลทางอ้อม β = {eff.total >= 0 ? "+" : ""}{eff.total.toFixed(4)} —{" "}
                                        {Math.abs(eff.total) >= 0.15 ? "อิทธิพลทางอ้อมสูง ควรให้ความสำคัญในการพัฒนา"
                                            : Math.abs(eff.total) >= 0.05 ? "อิทธิพลทางอ้อมปานกลาง"
                                                : "อิทธิพลทางอ้อมเล็กน้อย"}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── 4. Policy Recommendations ── */}
            <section className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
                    4. ข้อเสนอแนะเชิงนโยบาย (Policy Recommendations)
                </h4>
                <div className="space-y-2">
                    {recs.map((rec, i) => (
                        <div key={i} className={`p-3 rounded-xl text-xs ${priorityStyle[rec.priority]}`}>
                            <div className="flex items-start gap-2">
                                <span className={priorityColor[rec.priority]}>{iconMap[rec.icon]}</span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="font-bold text-[var(--color-text)]">{rec.title}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColor[rec.priority]} bg-white/50 dark:bg-black/20`}>{priorityLabel[rec.priority]}</span>
                                    </div>
                                    <p className="text-[var(--color-text-secondary)] leading-relaxed">{rec.detail}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── 5. How to Read ── */}
            <section className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
                    5. วิธีอ่านผลการวิเคราะห์ Path Model
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {[
                        ["β (Beta Standardized)", "ค่าสัมประสิทธิ์มาตรฐาน บอกว่าตัวแปรต้นเพิ่ม 1 SD จะทำให้ตัวแปรตามเปลี่ยนกี่ SD เปรียบเทียบข้ามตัวแปรได้โดยตรง"],
                        ["R² (R-squared)", "สัดส่วนความแปรปรวนที่โมเดลอธิบายได้ R²=0.33 หมายถึงอธิบายได้ 33% ยิ่งสูงยิ่งดี (เกณฑ์: ต่ำ<0.19, ปานกลาง 0.19-0.33, สูง>0.33)"],
                        ["p-value", "ความน่าจะเป็นที่ผลจะเกิดขึ้นโดยบังเอิญ p<0.05 ถือว่ามีนัยสำคัญ *** สูงสุด ns ไม่มีนัยสำคัญ"],
                        ["Indirect Effect", "ผลที่ส่งผ่านตัวกลาง (ความผูกพัน) = β(ปัจจัย→ความผูกพัน) × β(ความผูกพัน→Retention)"],
                        ["Total Effect", "ผลรวมทั้งหมดของปัจจัยต่อ Retention ผ่านทุกเส้นทาง (ในโมเดลนี้ = Indirect เพราะไม่มี Direct path)"],
                        ["Composite Score", "คะแนนรวมของแต่ละกลุ่ม = ค่าเฉลี่ยของข้อคำถามในกลุ่มนั้น ใช้แทน Latent Variable ใน PLS-PM"],
                    ].map(([term, def]) => (
                        <div key={term} className="p-3 rounded-xl bg-[var(--color-surface-alt)]">
                            <p className="font-bold text-[var(--color-text)] mb-1">{term}</p>
                            <p className="text-[var(--color-text-secondary)] leading-relaxed">{def}</p>
                        </div>
                    ))}
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-surface-alt)] text-xs">
                    <p className="font-bold text-[var(--color-text)] mb-2">ข้อจำกัดของโมเดล</p>
                    <ul className="text-[var(--color-text-secondary)] space-y-1 list-disc list-inside leading-relaxed">
                        <li>ใช้ OLS Regression แทน Full SEM — ไม่ได้คำนึงถึง measurement error ของ composite scores</li>
                        <li>ไม่มี Direct path จากปัจจัยสู่ Retention — โมเดลสมมติว่าความผูกพันเป็นตัวกลางทั้งหมด (Full Mediation)</li>
                        <li>Multicollinearity อาจส่งผลต่อค่า β หากปัจจัยมีความสัมพันธ์สูงกัน ควรตรวจสอบ VIF เพิ่มเติม</li>
                        <li>ผลการวิเคราะห์เป็น Cross-sectional ไม่สามารถสรุปความเป็นเหตุเป็นผลได้โดยตรง</li>
                        <li>n = {n} คน — ควรมีอย่างน้อย 10 เท่าของจำนวนตัวแปรในโมเดล (แนะนำ n ≥ 110)</li>
                    </ul>
                </div>
            </section>
        </div>
    );
}
