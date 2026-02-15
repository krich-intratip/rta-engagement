"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Users, TrendingUp, Heart, Shield } from "lucide-react";
import { useAppState } from "@/lib/store";
import { useEffect, useRef } from "react";
import { interpretMean } from "@/types/survey";

function AnimatedCounter({ value, decimals = 0 }: { value: number; decimals?: number }) {
    const ref = useRef<HTMLSpanElement>(null);
    const motionVal = useMotionValue(0);
    const rounded = useTransform(motionVal, (v) => v.toFixed(decimals));

    useEffect(() => {
        const controls = animate(motionVal, value, { duration: 1.5, ease: "easeOut" });
        const unsub = rounded.on("change", (v) => {
            if (ref.current) ref.current.textContent = v;
        });
        return () => { controls.stop(); unsub(); };
    }, [value, motionVal, rounded]);

    return <span ref={ref}>0</span>;
}

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.15, duration: 0.5, ease: "easeOut" },
    }),
};

export default function HeroSection() {
    const { state } = useAppState();
    const result = state.analysisResult;

    if (!result || result.totalResponses === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 text-center"
            >
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center">
                    <Shield className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">ระบบวิเคราะห์ความผูกพันและความสุข</h2>
                <p className="text-[var(--color-text-secondary)] text-lg mb-1">กองทัพบก (Royal Thai Army)</p>
                <p className="text-sm text-[var(--color-text-light)]">
                    กรุณาอัปโหลดไฟล์ Excel หรือเชื่อมต่อ Google Sheets เพื่อเริ่มวิเคราะห์
                </p>
            </motion.div>
        );
    }

    const cards = [
        {
            icon: Users,
            label: "จำนวนผู้ตอบแบบสอบถาม",
            value: result.totalResponses,
            decimals: 0,
            gradient: "bg-gradient-primary",
            suffix: "คน",
        },
        {
            icon: TrendingUp,
            label: "คะแนนปัจจัยเฉลี่ย",
            value: result.overallFactorScore,
            decimals: 2,
            gradient: "bg-gradient-secondary",
            suffix: interpretMean(result.overallFactorScore),
        },
        {
            icon: Heart,
            label: "คะแนนความผูกพันเฉลี่ย",
            value: result.overallEngagementScore,
            decimals: 2,
            gradient: "bg-gradient-accent",
            suffix: interpretMean(result.overallEngagementScore),
        },
        {
            icon: Shield,
            label: "กลุ่มปัจจัยที่สูงสุด",
            value: 0,
            decimals: 0,
            gradient: "bg-gradient-lavender",
            suffix: "",
            textValue: result.factorStats.length > 0
                ? [...result.factorStats].sort((a, b) => b.mean - a.mean)[0]?.groupName || "-"
                : "-",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, i) => {
                const Icon = card.icon;
                return (
                    <motion.div
                        key={i}
                        custom={i}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        className="glass-card p-5 flex flex-col"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl ${card.gradient} flex items-center justify-center`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-[var(--color-text-secondary)]">{card.label}</span>
                        </div>
                        <div className="text-3xl font-bold text-[var(--color-text)]">
                            {card.textValue ? (
                                <span className="text-lg">{card.textValue}</span>
                            ) : (
                                <AnimatedCounter value={card.value} decimals={card.decimals} />
                            )}
                        </div>
                        {card.suffix && (
                            <span className="text-sm text-[var(--color-text-secondary)] mt-1">{card.suffix}</span>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}
