"use client";

import { useState } from "react";
import { pToSig } from "@/lib/pathStats";

export interface PathNodeDef {
    id: string;
    short: string;
    label: string;
}

export interface DiagramEq1Result {
    betas: number[];
    pValues: number[];
}

export interface DiagramEq2Result {
    betas: number[];
    pValues: number[];
}

interface PathDiagramProps {
    factorNodes: PathNodeDef[];
    engNodes: PathNodeDef[];
    eq1: DiagramEq1Result[];
    eq2: DiagramEq2Result;
}

function bStroke(b: number, p: number): string {
    if (p >= 0.1) return "#9ca3af";
    if (b > 0) return b > 0.25 ? "#10b981" : "#6ee7b7";
    return b < -0.25 ? "#ef4444" : "#fca5a5";
}

function bWidth(b: number, p: number): number {
    if (p >= 0.1) return 0.7;
    return Math.max(1, Math.min(5, Math.abs(b) * 10));
}

export default function PathDiagram({ factorNodes, engNodes, eq1, eq2 }: PathDiagramProps) {
    const [hovered, setHovered] = useState<string | null>(null);

    const W = 680; const H = 420;
    const fX = 72; const eX = 330; const rX = 570;
    const fYs = factorNodes.map((_, i) => 36 + i * 46);
    const eYs = engNodes.map((_, i) => 110 + i * 100);
    const rY = 210;

    return (
        <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl mx-auto" style={{ minWidth: 460 }}>

                {/* Factor → Engagement paths */}
                {factorNodes.map((fN, fi) =>
                    engNodes.map((eN, ei) => {
                        const b = eq1[ei].betas[fi];
                        const p = eq1[ei].pValues[fi];
                        const pid = `${fN.id}-${eN.id}`;
                        const isH = hovered === pid;
                        const x1 = fX + 58; const y1 = fYs[fi];
                        const x2 = eX - 50; const y2 = eYs[ei];
                        const mx = (x1 + x2) / 2;
                        return (
                            <g key={pid} style={{ cursor: "pointer" }}
                                onMouseEnter={() => setHovered(pid)}
                                onMouseLeave={() => setHovered(null)}>
                                <path
                                    d={`M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
                                    fill="none"
                                    stroke={bStroke(b, p)}
                                    strokeWidth={isH ? bWidth(b, p) + 2 : bWidth(b, p)}
                                    strokeOpacity={isH ? 1 : p >= 0.1 ? 0.18 : 0.5}
                                    style={{ transition: "all 0.12s" }}
                                />
                                {isH && (
                                    <text x={mx} y={(y1 + y2) / 2 - 6}
                                        textAnchor="middle" fontSize={9}
                                        fill={bStroke(b, p)} fontWeight="bold">
                                        β={b.toFixed(3)}{pToSig(p)}
                                    </text>
                                )}
                            </g>
                        );
                    })
                )}

                {/* Engagement → Retention paths */}
                {engNodes.map((eN, ei) => {
                    const b = eq2.betas[ei];
                    const p = eq2.pValues[ei];
                    const pid = `${eN.id}-R`;
                    const isH = hovered === pid;
                    const x1 = eX + 52; const y1 = eYs[ei];
                    const x2 = rX - 54; const y2 = rY;
                    const mx = (x1 + x2) / 2;
                    return (
                        <g key={pid} style={{ cursor: "pointer" }}
                            onMouseEnter={() => setHovered(pid)}
                            onMouseLeave={() => setHovered(null)}>
                            <path
                                d={`M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
                                fill="none"
                                stroke={bStroke(b, p)}
                                strokeWidth={isH ? bWidth(b, p) + 2 : bWidth(b, p)}
                                strokeOpacity={isH ? 1 : p >= 0.1 ? 0.3 : 0.8}
                                style={{ transition: "all 0.12s" }}
                            />
                            {isH && (
                                <text x={mx} y={(y1 + y2) / 2 - 6}
                                    textAnchor="middle" fontSize={9}
                                    fill={bStroke(b, p)} fontWeight="bold">
                                    β={b.toFixed(3)}{pToSig(p)}
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* Factor nodes */}
                {factorNodes.map((fN, fi) => (
                    <g key={fN.id}>
                        <rect x={fX - 58} y={fYs[fi] - 13} width={116} height={26} rx={5}
                            fill="var(--color-primary-light)" fillOpacity={0.18}
                            stroke="var(--color-primary)" strokeWidth={1} />
                        <text x={fX} y={fYs[fi] + 5} textAnchor="middle"
                            fontSize={9} fill="var(--color-text)" fontWeight="500">
                            {fN.short}
                        </text>
                    </g>
                ))}

                {/* Engagement nodes */}
                {engNodes.map((eN, ei) => (
                    <g key={eN.id}>
                        <rect x={eX - 52} y={eYs[ei] - 20} width={104} height={40} rx={8}
                            fill="var(--color-secondary-dark)" fillOpacity={0.12}
                            stroke="var(--color-secondary-dark)" strokeWidth={1.5} />
                        <text x={eX} y={eYs[ei] - 4} textAnchor="middle"
                            fontSize={9} fill="var(--color-text)" fontWeight="600">
                            {eN.short}
                        </text>
                        <text x={eX} y={eYs[ei] + 11} textAnchor="middle"
                            fontSize={8} fill="var(--color-text-secondary)">
                            {eN.label}
                        </text>
                    </g>
                ))}

                {/* Retention node */}
                <rect x={rX - 54} y={rY - 30} width={108} height={60} rx={10}
                    fill="var(--color-primary)" fillOpacity={0.12}
                    stroke="var(--color-primary)" strokeWidth={2} />
                <text x={rX} y={rY - 8} textAnchor="middle"
                    fontSize={10} fill="var(--color-text)" fontWeight="700">ความตั้งใจ</text>
                <text x={rX} y={rY + 8} textAnchor="middle"
                    fontSize={10} fill="var(--color-text)" fontWeight="700">อยู่ต่อ</text>
                <text x={rX} y={rY + 22} textAnchor="middle"
                    fontSize={8} fill="var(--color-text-secondary)">(Retention)</text>

                {/* Column labels */}
                <text x={fX} y={H - 8} textAnchor="middle" fontSize={8} fill="var(--color-text-light)">ปัจจัยในงาน (8)</text>
                <text x={eX} y={H - 8} textAnchor="middle" fontSize={8} fill="var(--color-text-light)">ความผูกพัน (3)</text>
                <text x={rX} y={H - 8} textAnchor="middle" fontSize={8} fill="var(--color-text-light)">ผลลัพธ์</text>
            </svg>
            <p className="text-[10px] text-center text-[var(--color-text-secondary)] mt-1">
                hover บนเส้นเพื่อดูค่า β ·{" "}
                <span className="text-emerald-500 font-bold">■</span> บวก ·{" "}
                <span className="text-red-400 font-bold">■</span> ลบ ·{" "}
                เส้นจาง = ไม่มีนัยสำคัญ (p ≥ 0.10)
            </p>
        </div>
    );
}
