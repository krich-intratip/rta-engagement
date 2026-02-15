"use client";

import { motion } from "framer-motion";
import { useAppState } from "@/lib/store";

const getCorrelationColor = (r: number): string => {
    if (r >= 0.8) return "#00B894";
    if (r >= 0.6) return "#55EFC4";
    if (r >= 0.4) return "#A8D8B9";
    if (r >= 0.2) return "#FDDCB5";
    if (r >= 0) return "#F5D76E";
    if (r >= -0.2) return "#FDCB6E";
    if (r >= -0.4) return "#F4B8C1";
    if (r >= -0.6) return "#E8909E";
    return "#E17055";
};

export default function CorrelationHeatmap() {
    const { state } = useAppState();
    const result = state.analysisResult;
    if (!result || result.correlations.length === 0) return null;

    // Get unique group names
    const factorGroups = [...new Set(result.correlations.map((c) => c.groupA))];
    const engGroups = [...new Set(result.correlations.map((c) => c.groupB))];

    const getCoeff = (fGroup: string, eGroup: string): number => {
        const found = result.correlations.find(
            (c) => c.groupA === fGroup && c.groupB === eGroup
        );
        return found?.coefficient ?? 0;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 overflow-x-auto"
        >
            <h3 className="text-base font-bold mb-4">สหสัมพันธ์ระหว่างปัจจัยกับความผูกพัน</h3>
            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr>
                        <th className="p-2 text-left text-[var(--color-text-secondary)] min-w-[120px]">ปัจจัย ↓ / ความผูกพัน →</th>
                        {engGroups.map((eg) => (
                            <th key={eg} className="p-2 text-center text-[var(--color-text-secondary)] min-w-[100px]">{eg}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {factorGroups.map((fg) => (
                        <tr key={fg}>
                            <td className="p-2 font-medium text-[var(--color-text)]">{fg}</td>
                            {engGroups.map((eg) => {
                                const r = getCoeff(fg, eg);
                                return (
                                    <td key={eg} className="p-1">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: Math.random() * 0.3 }}
                                            className="rounded-lg p-2 text-center font-bold"
                                            style={{
                                                backgroundColor: getCorrelationColor(r),
                                                color: r >= 0.6 ? "white" : "var(--color-text)",
                                            }}
                                            title={`${fg} ↔ ${eg}: r = ${r.toFixed(3)}`}
                                        >
                                            {r.toFixed(2)}
                                        </motion.div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            {/* Legend */}
            <div className="flex items-center gap-1 mt-4 text-xs text-[var(--color-text-secondary)] justify-center">
                <span>-1.0</span>
                <div className="flex h-3">
                    {[-0.8, -0.4, 0, 0.4, 0.8].map((v) => (
                        <div key={v} className="w-6 h-full" style={{ backgroundColor: getCorrelationColor(v) }} />
                    ))}
                </div>
                <span>+1.0</span>
            </div>
        </motion.div>
    );
}
