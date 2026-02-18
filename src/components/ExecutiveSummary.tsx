"use client";

import { useRef, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppState } from "@/lib/store";
import { interpretMean, FACTOR_LABELS, ENGAGEMENT_LABELS, SurveyResponse } from "@/types/survey";
import { Printer, Download, CheckCircle2, AlertTriangle, Lightbulb, FileText } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

const FACTOR_GROUPS: Record<string, number[]> = {
    "ลักษณะงาน": [0, 1, 2, 3], "สภาพแวดล้อม": [4, 5, 6], "คุณภาพชีวิต": [7, 8, 9],
    "เพื่อนร่วมงาน": [10, 11, 12], "ผู้บังคับบัญชา": [13, 14, 15, 16, 17],
    "นโยบายองค์กร": [18, 19, 20, 21], "ค่าตอบแทน": [22, 23, 24],
    "ภาระงานและการประเมิน": [25, 26], "ความก้าวหน้า": [27, 28],
};

const FACTOR_ACTIONS: Record<number, string> = {
    0: "จัดกิจกรรมเชิดชูเกียรติและยกย่องผลงานดีเด่นทุกไตรมาส เพื่อตอกย้ำความภาคภูมิใจในอาชีพทหาร",
    1: "มอบหมายภารกิจที่ท้าทายและหลากหลาย พร้อมกำหนดเป้าหมายที่ชัดเจนและวัดผลได้",
    2: "เปิดพื้นที่ให้กำลังพลเสนอแนวทางแก้ปัญหาใหม่ เช่น กล่องรับความคิดสร้างสรรค์หรือ Innovation Lab ระดับหน่วย",
    3: "จัดทำแผนพัฒนารายบุคคล (IDP) และสนับสนุนการฝึกอบรมอย่างน้อย 40 ชั่วโมงต่อปีต่อคน",
    4: "สำรวจและจัดหาอุปกรณ์ที่ขาดแคลนตามลำดับความสำคัญ พร้อมกำหนดรอบการบำรุงรักษาที่ชัดเจน",
    5: "ปรับปรุงพื้นที่ทำงานให้สะอาด ปลอดภัย และมีแสงสว่างเพียงพอตามมาตรฐาน 5ส",
    6: "อัปเกรดระบบ IT และจัดอบรมการใช้เทคโนโลยีใหม่ เพื่อลดภาระงานซ้ำซ้อนและเพิ่มประสิทธิภาพ",
    7: "จัดโปรแกรมส่งเสริมสุขภาพกาย-ใจ เช่น คลินิกสุขภาพ กิจกรรมออกกำลังกาย และการให้คำปรึกษาจิตวิทยา",
    8: "กำหนดนโยบาย Work-Life Balance ที่ชัดเจน จำกัดการทำงานล่วงเวลา และสนับสนุนวันลาพักผ่อนเต็มสิทธิ์",
    9: "ทบทวนมาตรการความปลอดภัยในการปฏิบัติงาน พร้อมซ้อมแผนฉุกเฉินอย่างสม่ำเสมอ",
    10: "จัดกิจกรรม Team Building และสร้างวัฒนธรรมการช่วยเหลือซึ่งกันและกันภายในหน่วย",
    11: "สร้างระบบพี่เลี้ยง (Mentoring) ให้กำลังพลรุ่นใหม่ได้รับคำแนะนำจากผู้มีประสบการณ์",
    12: "จัดเวทีแลกเปลี่ยนเรียนรู้และยกย่องผู้ที่ทำงานร่วมกันได้ดี เพื่อเสริมสร้างการยอมรับในทีม",
    13: "พัฒนาภาวะผู้นำผ่านหลักสูตร Leadership ที่เน้นการเป็นแบบอย่างและการสื่อสารที่มีประสิทธิภาพ",
    14: "จัดประชุมหน่วยสม่ำเสมอ เปิดโอกาสให้กำลังพลทุกระดับแสดงความเห็นและข้อเสนอแนะอย่างเป็นระบบ",
    15: "ฝึกอบรมผู้บังคับบัญชาด้านการโค้ชชิ่งและการแก้ปัญหาเชิงรุก เพื่อช่วยเหลือลูกน้องได้ทันท่วงที",
    16: "กำหนดขอบเขตความรับผิดชอบที่ชัดเจนทุกระดับ และส่งเสริมวัฒนธรรมรับผิดชอบร่วมกัน",
    17: "สร้างระบบยกย่องชมเชยที่โปร่งใสและสม่ำเสมอ ทั้งในรูปแบบทางการและไม่เป็นทางการ",
    18: "สื่อสารนโยบายผ่านหลายช่องทาง ทั้ง Briefing รายเดือนและสื่อดิจิทัลภายในหน่วย",
    19: "จัดทำ Policy Cascade ให้ผู้บังคับบัญชาทุกระดับถ่ายทอดนโยบายสู่การปฏิบัติได้ถูกต้อง",
    20: "เปิดช่องทาง Feedback ที่ปลอดภัย เช่น กล่องรับความเห็นออนไลน์หรือการประชุมแบบ Skip-level",
    21: "ทบทวนโครงสร้างองค์กรให้ลดขั้นตอนที่ไม่จำเป็น เพิ่มความคล่องตัวในการปฏิบัติงาน",
    22: "ศึกษาและเสนอปรับโครงสร้างเงินเดือนให้สอดคล้องกับภาระงานและค่าครองชีพที่เปลี่ยนแปลง",
    23: "ขยายสวัสดิการครอบครัว เช่น ทุนการศึกษาบุตร สถานรับเลี้ยงเด็ก และการดูแลผู้สูงอายุในครอบครัว",
    24: "สำรวจความต้องการสวัสดิการเพิ่มเติมและจัดลำดับความสำคัญตามความต้องการจริงของกำลังพล",
    25: "ทบทวนการกระจายภาระงานให้เหมาะสม ลดงานซ้ำซ้อน และใช้เทคโนโลยีช่วยลดงานเอกสาร",
    26: "ปรับปรุงเกณฑ์การประเมินผลให้โปร่งใส วัดผลได้จริง และสื่อสารให้กำลังพลเข้าใจก่อนต้นปีงบประมาณ",
    27: "จัดทำแผนพัฒนาความรู้ต่อเนื่อง (CPD) และสนับสนุนการศึกษาต่อในสาขาที่เกี่ยวข้องกับภารกิจ",
    28: "กำหนดเส้นทางความก้าวหน้าในอาชีพ (Career Path) ที่ชัดเจน โปร่งใส และเชื่อมโยงกับสมรรถนะที่วัดได้",
};

const ENGAGEMENT_ACTIONS: Record<number, string> = {
    0: "จัดกิจกรรมปลูกฝังอุดมการณ์รักชาติผ่านประวัติศาสตร์ทหาร พิธีกรรม และการเยี่ยมชมสถานที่สำคัญ",
    1: "สร้างความภาคภูมิใจในสถาบันผ่านการเผยแพร่ผลงานและความสำเร็จของหน่วยสู่สาธารณะ",
    2: "สร้างบรรยากาศการทำงานที่เป็นมิตร ลดความเครียด และส่งเสริมความสัมพันธ์ที่ดีในทีม",
    3: "วางแผนเส้นทางอาชีพระยะยาวและสื่อสารให้กำลังพลเห็นอนาคตที่ชัดเจนในองค์กร",
    4: "แก้ไขปัจจัยที่ทำให้กำลังพลคิดโอนย้าย เช่น ภาระงาน ความสัมพันธ์กับผู้บังคับบัญชา และสวัสดิการ",
    5: "กำหนดเป้าหมายที่ท้าทายและให้รางวัลสำหรับผลงานโดดเด่น เพื่อกระตุ้นการทำงานเต็มศักยภาพ",
    6: "สร้างวัฒนธรรมองค์กรที่เน้นประโยชน์ส่วนรวมผ่านกิจกรรมจิตอาสาและโครงการเพื่อสังคม",
    7: "ยกย่องและให้รางวัลกำลังพลที่เต็มใจรับงานพิเศษ พร้อมกำหนดค่าตอบแทนที่เป็นธรรม",
    8: "สื่อสารทิศทางและวิสัยทัศน์องค์กรอย่างสม่ำเสมอ พร้อมแสดงให้เห็นว่างานของแต่ละคนมีส่วนสำคัญ",
    9: "จัดโปรแกรมพัฒนาทัศนคติเชิงบวก เช่น การฝึกสติ การจัดการความเครียด และการโค้ชชิ่งส่วนตัว",
    10: "จัดกิจกรรมเสริมสร้างความภาคภูมิใจในเอกลักษณ์และประเพณีทหาร เช่น วันสถาปนาหน่วยและพิธีกรรมสำคัญ",
};

interface ActionableInsight {
    title: string; score: number; context: string; action: string;
    priority: "สูง" | "กลาง" | "ต่ำ"; timeline: string; owner: string;
}

function generateStrengths(factorMeans: number[], engMeans: number[]): ActionableInsight[] {
    const insights: ActionableInsight[] = [];
    factorMeans.forEach((m, i) => {
        if (m >= 4.0 && insights.length < 4) {
            const group = Object.entries(FACTOR_GROUPS).find(([, idxs]) => idxs.includes(i))?.[0] ?? "ปัจจัย";
            insights.push({
                title: `ปัจจัย "${FACTOR_LABELS[i]}" อยู่ในระดับดี (${m.toFixed(2)}/5.00)`,
                score: m,
                context: `กลุ่ม${group} — คะแนน ${m.toFixed(2)} (${interpretMean(m)}) สะท้อนว่ากำลังพลรับรู้ด้านนี้ในเชิงบวกอย่างชัดเจน`,
                action: FACTOR_ACTIONS[i] ?? "รักษาและต่อยอดจุดแข็งนี้ต่อเนื่อง",
                priority: m >= 4.5 ? "สูง" : "กลาง",
                timeline: "ต่อเนื่อง",
                owner: "ผู้บังคับบัญชาระดับหน่วย",
            });
        }
    });
    engMeans.forEach((m, i) => {
        if (m >= 4.0 && insights.length < 5) {
            insights.push({
                title: `ความผูกพัน "${ENGAGEMENT_LABELS[i]}" อยู่ในระดับดี (${m.toFixed(2)}/5.00)`,
                score: m,
                context: `คะแนน ${m.toFixed(2)} (${interpretMean(m)}) — กำลังพลมีความผูกพันด้านนี้สูง เป็นรากฐานสำคัญของการรักษากำลังพลระยะยาว`,
                action: ENGAGEMENT_ACTIONS[i] ?? "รักษาระดับและขยายผลสู่กำลังพลกลุ่มอื่น",
                priority: "กลาง",
                timeline: "ต่อเนื่อง",
                owner: "ฝ่ายกำลังพลและผู้บังคับบัญชา",
            });
        }
    });
    return insights.sort((a, b) => b.score - a.score).slice(0, 5);
}

function generateImprovements(factorMeans: number[], engMeans: number[]): ActionableInsight[] {
    const insights: ActionableInsight[] = [];
    const bottomF = factorMeans.map((m, i) => ({ m, i })).filter((x) => x.m > 0 && x.m < 3.8).sort((a, b) => a.m - b.m);
    bottomF.slice(0, 4).forEach(({ m, i }) => {
        const group = Object.entries(FACTOR_GROUPS).find(([, idxs]) => idxs.includes(i))?.[0] ?? "ปัจจัย";
        insights.push({
            title: `ปัจจัย "${FACTOR_LABELS[i]}" ต้องปรับปรุง (${m.toFixed(2)}/5.00)`,
            score: m,
            context: `กลุ่ม${group} — คะแนน ${m.toFixed(2)} (${interpretMean(m)}) ต่ำกว่าเกณฑ์ที่ยอมรับได้ สะท้อนความไม่พึงพอใจที่อาจส่งผลต่อประสิทธิภาพการปฏิบัติงาน`,
            action: FACTOR_ACTIONS[i] ?? "วิเคราะห์สาเหตุเชิงลึกและจัดทำแผนปรับปรุงทันที",
            priority: m < 3.0 ? "สูง" : "กลาง",
            timeline: m < 3.0 ? "ภายใน 30 วัน" : "ภายใน 90 วัน",
            owner: "ผู้บังคับบัญชาและฝ่ายกำลังพล",
        });
    });
    const bottomE = engMeans.map((m, i) => ({ m, i })).filter((x) => x.m > 0 && x.m < 3.8).sort((a, b) => a.m - b.m);
    bottomE.slice(0, 2).forEach(({ m, i }) => {
        insights.push({
            title: `ความผูกพัน "${ENGAGEMENT_LABELS[i]}" ต้องเสริมสร้าง (${m.toFixed(2)}/5.00)`,
            score: m,
            context: `คะแนน ${m.toFixed(2)} (${interpretMean(m)}) — ความผูกพันด้านนี้ต่ำกว่าเกณฑ์ อาจนำไปสู่การโอนย้ายหรือลดประสิทธิภาพในระยะยาว`,
            action: ENGAGEMENT_ACTIONS[i] ?? "สำรวจเชิงลึกและจัดทำแผนเสริมสร้างความผูกพัน",
            priority: "สูง",
            timeline: "ภายใน 60 วัน",
            owner: "ผู้บังคับบัญชาระดับสูงและฝ่ายกำลังพล",
        });
    });
    if (insights.length === 0) {
        factorMeans.map((m, i) => ({ m, i })).filter((x) => x.m > 0).sort((a, b) => a.m - b.m).slice(0, 3).forEach(({ m, i }) => {
            insights.push({
                title: `ปัจจัย "${FACTOR_LABELS[i]}" มีโอกาสพัฒนา (${m.toFixed(2)}/5.00)`,
                score: m,
                context: `คะแนน ${m.toFixed(2)} (${interpretMean(m)}) — แม้อยู่ในเกณฑ์ยอมรับได้ แต่ยังมีช่องว่างสำหรับการพัฒนาสู่ความเป็นเลิศ`,
                action: FACTOR_ACTIONS[i] ?? "วางแผนพัฒนาต่อเนื่องเพื่อยกระดับคะแนน",
                priority: "ต่ำ",
                timeline: "ภายใน 6 เดือน",
                owner: "ผู้บังคับบัญชาระดับหน่วย",
            });
        });
    }
    return insights.slice(0, 5);
}

function generateRecommendations(factorMeans: number[], engMeans: number[]): ActionableInsight[] {
    const validF = factorMeans.filter((v) => v > 0);
    const validE = engMeans.filter((v) => v > 0);
    const overallFactor = validF.reduce((a, b) => a + b, 0) / validF.length;
    const overallEng = validE.reduce((a, b) => a + b, 0) / validE.length;

    const groupScores = Object.entries(FACTOR_GROUPS).map(([name, idxs]) => {
        const vals = idxs.map((i) => factorMeans[i]).filter((v) => v > 0);
        return { name, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0, idxs };
    }).filter((g) => g.avg > 0).sort((a, b) => a.avg - b.avg);

    const recs: ActionableInsight[] = [];
    const weakest = groupScores[0];
    const strongest = groupScores[groupScores.length - 1];

    if (weakest) {
        const worstIdx = weakest.idxs.reduce((best, i) => factorMeans[i] < factorMeans[best] ? i : best, weakest.idxs[0]);
        recs.push({
            title: `เร่งพัฒนากลุ่ม "${weakest.name}" ซึ่งเป็นจุดอ่อนหลัก (${weakest.avg.toFixed(2)}/5.00)`,
            score: weakest.avg,
            context: `กลุ่ม "${weakest.name}" มีคะแนนเฉลี่ยต่ำที่สุด ครอบคลุม ${weakest.idxs.length} ข้อ ได้แก่ ${weakest.idxs.map((i) => FACTOR_LABELS[i]).join(", ")}`,
            action: `จัดทำแผนปฏิบัติการเร่งด่วน: ${FACTOR_ACTIONS[worstIdx] ?? "วิเคราะห์สาเหตุและจัดทำแผนปรับปรุงทันที"} พร้อมกำหนดผู้รับผิดชอบและตัวชี้วัดที่ชัดเจน`,
            priority: "สูง",
            timeline: "ภายใน 30–60 วัน",
            owner: "ผู้บังคับบัญชาระดับสูงและฝ่ายที่เกี่ยวข้อง",
        });
    }

    if (strongest && strongest.avg >= 4.0) {
        recs.push({
            title: `ต่อยอดจุดแข็ง "${strongest.name}" สู่การเป็นต้นแบบ (${strongest.avg.toFixed(2)}/5.00)`,
            score: strongest.avg,
            context: `กลุ่ม "${strongest.name}" มีคะแนนสูงสุด สะท้อนว่าหน่วยมีความเข้มแข็งด้านนี้อย่างชัดเจน`,
            action: "จัดทำ Best Practice และเผยแพร่สู่หน่วยอื่น จัดเวทีแลกเปลี่ยนประสบการณ์ระหว่างหน่วย และบันทึกเป็นองค์ความรู้ขององค์กร",
            priority: "กลาง",
            timeline: "ภายใน 90 วัน",
            owner: "ฝ่ายกำลังพลและผู้บังคับบัญชา",
        });
    }

    if (overallEng < 3.8) {
        recs.push({
            title: `เสริมสร้างความผูกพันองค์กรอย่างเป็นระบบ (ปัจจุบัน ${overallEng.toFixed(2)}/5.00)`,
            score: overallEng,
            context: `คะแนนความผูกพันโดยรวม ${overallEng.toFixed(2)} (${interpretMean(overallEng)}) ยังต่ำกว่าเป้าหมาย 4.00 อาจส่งผลต่อการรักษากำลังพลและประสิทธิภาพในระยะยาว`,
            action: "จัดทำโปรแกรม Employee Engagement แบบครบวงจร: (1) Pulse Survey รายไตรมาส (2) Team Building ระดับหน่วย (3) กำหนด Engagement Champion ในแต่ละสังกัด (4) ติดตามผลด้วย Dashboard แบบ Real-time",
            priority: "สูง",
            timeline: "ภายใน 3–6 เดือน",
            owner: "ผู้บังคับบัญชาระดับสูงและฝ่ายกำลังพล",
        });
    } else {
        recs.push({
            title: `ยกระดับความผูกพันสู่ระดับ 'ดีมาก' อย่างยั่งยืน (ปัจจุบัน ${overallEng.toFixed(2)}/5.00)`,
            score: overallEng,
            context: `คะแนนความผูกพันโดยรวม ${overallEng.toFixed(2)} (${interpretMean(overallEng)}) อยู่ในเกณฑ์ดี แต่ยังมีโอกาสยกระดับสู่ความเป็นเลิศ (≥ 4.50)`,
            action: "ดำเนินโครงการ Excellence Program: (1) ระบุกำลังพลที่มีความผูกพันสูงเป็น Ambassador (2) จัดโปรแกรมพัฒนาพิเศษสำหรับกลุ่มที่มีศักยภาพ (3) สร้างวัฒนธรรมองค์กรที่ส่งเสริมความผูกพันระยะยาว",
            priority: "กลาง",
            timeline: "ภายใน 6 เดือน",
            owner: "ผู้บังคับบัญชาและฝ่ายกำลังพล",
        });
    }

    const gap = overallFactor - overallEng;
    if (gap > 0.3) {
        recs.push({
            title: `แปลงปัจจัยที่ดีให้เป็นความผูกพันที่สูงขึ้น (ช่องว่าง ${gap.toFixed(2)} คะแนน)`,
            score: overallFactor,
            context: `ปัจจัยด้านงาน (${overallFactor.toFixed(2)}) สูงกว่าความผูกพัน (${overallEng.toFixed(2)}) สะท้อนว่าสภาพแวดล้อมดี แต่ยังไม่แปลงเป็นความผูกพันได้เต็มที่`,
            action: "สร้างการเชื่อมโยงระหว่างปัจจัยที่ดีกับความรู้สึกผูกพัน: จัดกิจกรรมสร้างความหมายในงาน (Meaning at Work) สื่อสารให้กำลังพลเห็นคุณค่าของงานต่อภารกิจใหญ่ขององค์กร",
            priority: "กลาง",
            timeline: "ภายใน 3 เดือน",
            owner: "ผู้บังคับบัญชาและฝ่ายกำลังพล",
        });
    }

    recs.push({
        title: "จัดทำแผนติดตามผลและสำรวจซ้ำเพื่อวัดความก้าวหน้า",
        score: 0,
        context: "การสำรวจครั้งเดียวไม่เพียงพอ — ต้องมีการติดตามผลอย่างต่อเนื่องเพื่อยืนยันว่าการดำเนินการมีผลจริง",
        action: "กำหนดรอบการสำรวจ Pulse Survey ทุก 3 เดือน กำหนด KPI ด้านความผูกพันในแผนงานประจำปี และรายงานผลต่อผู้บังคับบัญชาระดับสูงทุกไตรมาส",
        priority: "กลาง",
        timeline: "ภายใน 30 วัน (เริ่มวางแผน)",
        owner: "ฝ่ายกำลังพลและผู้บังคับบัญชาระดับสูง",
    });

    return recs.slice(0, 5);
}

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
    const pct = Math.round((score / max) * 100);
    const color = score >= 4.5 ? "#10b981" : score >= 4.0 ? "#34d399" : score >= 3.5 ? "#fbbf24" : score >= 3.0 ? "#f97316" : "#ef4444";
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-xs font-bold w-8 text-right" style={{ color }}>{score.toFixed(2)}</span>
        </div>
    );
}

function RatingBadge({ score }: { score: number }) {
    const color = score >= 4.5 ? "bg-emerald-500" : score >= 4.0 ? "bg-green-400" : score >= 3.5 ? "bg-yellow-400" : score >= 3.0 ? "bg-orange-400" : "bg-red-400";
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold text-white ${color}`}>
            {interpretMean(score)}
        </span>
    );
}

function PriorityBadge({ priority }: { priority: "สูง" | "กลาง" | "ต่ำ" }) {
    const cls = priority === "สูง" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        : priority === "กลาง" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>ความเร่งด่วน: {priority}</span>;
}

function InsightCard({ insight, color }: { insight: ActionableInsight; color: string }) {
    return (
        <div className={`glass-card p-4 border-l-4 ${color} space-y-2.5 print:border print:border-gray-200`}>
            <p className="text-sm font-bold text-[var(--color-text)] leading-snug">{insight.title}</p>
            <div className="flex flex-wrap gap-1.5">
                <PriorityBadge priority={insight.priority} />
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]">
                    ⏱ {insight.timeline}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]">
                    👤 {insight.owner}
                </span>
            </div>
            <div>
                <p className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-0.5">บริบท</p>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{insight.context}</p>
            </div>
            <div className="bg-[var(--color-primary-light)]/10 rounded-lg p-2.5">
                <p className="text-[11px] font-semibold text-[var(--color-primary-dark)] uppercase tracking-wide mb-0.5">แนวทางปฏิบัติ</p>
                <p className="text-xs text-[var(--color-text)] leading-relaxed">{insight.action}</p>
            </div>
        </div>
    );
}

export default function ExecutiveSummary() {
    const { state, filteredData } = useAppState();
    const result = state.analysisResult;
    const printRef = useRef<HTMLDivElement>(null);

    if (!result || filteredData.length === 0) return null;

    const n = filteredData.length;
    const totalN = state.surveyData.length;
    const isFiltered = n < totalN;

    const factorMeans = useMemo(() => Array.from({ length: 29 }, (_, i) => {
        const vals = filteredData.map((r) => r.factors[i]).filter((v) => v > 0);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }), [filteredData]);

    const engMeans = useMemo(() => Array.from({ length: 11 }, (_, i) => {
        const vals = filteredData.map((r) => r.engagement[i]).filter((v) => v > 0);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }), [filteredData]);

    const overallFactor = factorMeans.filter((v) => v > 0).reduce((a, b) => a + b, 0) / factorMeans.filter((v) => v > 0).length;
    const overallEng = engMeans.filter((v) => v > 0).reduce((a, b) => a + b, 0) / engMeans.filter((v) => v > 0).length;

    const top5Factors = [...factorMeans.map((m, i) => ({ label: FACTOR_LABELS[i], mean: m, idx: i }))]
        .sort((a, b) => b.mean - a.mean).slice(0, 5);
    const bottom5Factors = [...factorMeans.map((m, i) => ({ label: FACTOR_LABELS[i], mean: m, idx: i }))]
        .filter((f) => f.mean > 0).sort((a, b) => a.mean - b.mean).slice(0, 5);
    const top3Eng = [...engMeans.map((m, i) => ({ label: ENGAGEMENT_LABELS[i], mean: m, idx: i }))]
        .sort((a, b) => b.mean - a.mean).slice(0, 3);
    const bottom3Eng = [...engMeans.map((m, i) => ({ label: ENGAGEMENT_LABELS[i], mean: m, idx: i }))]
        .filter((e) => e.mean > 0).sort((a, b) => a.mean - b.mean).slice(0, 3);

    const strengths = useMemo(() => generateStrengths(factorMeans, engMeans), [factorMeans, engMeans]);
    const improvements = useMemo(() => generateImprovements(factorMeans, engMeans), [factorMeans, engMeans]);
    const recommendations = useMemo(() => generateRecommendations(factorMeans, engMeans), [factorMeans, engMeans]);

    const [exporting, setExporting] = useState(false);

    const handlePrint = () => window.print();

    const handleExportPDF = async () => {
        if (!printRef.current || exporting) return;
        setExporting(true);
        try {
            const html2canvas = (await import("html2canvas-pro")).default;
            const { jsPDF } = await import("jspdf");
            const canvas = await html2canvas(printRef.current, { scale: 1.5, useCORS: true, backgroundColor: "#ffffff" });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const imgW = pageW - 20;
            const imgH = (canvas.height * imgW) / canvas.width;
            let y = 10;
            let remaining = imgH;
            while (remaining > 0) {
                const sliceH = Math.min(remaining, pageH - 20);
                pdf.addImage(imgData, "PNG", 10, y, imgW, imgH, undefined, "FAST", 0);
                remaining -= sliceH;
                if (remaining > 0) { pdf.addPage(); y = 10 - (imgH - remaining); }
                else break;
            }
            pdf.save("executive-summary-rta.pdf");
        } catch (e) {
            console.error("PDF export failed", e);
        } finally {
            setExporting(false);
        }
    };

    const handleExportHTML = () => {
        if (!printRef.current) return;
        const html = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>Executive Summary - RTA Engagement</title>
<style>
  body { font-family: 'Sarabun', sans-serif; margin: 0; padding: 20px; background: #fff; color: #1a1a2e; }
  .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  h1 { font-size: 20px; font-weight: 800; } h2 { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
  h3 { font-size: 13px; font-weight: 600; } p, li { font-size: 12px; line-height: 1.6; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; color: #fff; }
  .green { background: #10b981; } .yellow { background: #f59e0b; } .red { background: #ef4444; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { padding: 4px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; }
  th { font-weight: 700; background: #f1f5f9; }
  @media print { body { padding: 0; } }
</style></head><body>
${printRef.current.innerHTML}
</body></html>`;
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "executive-summary.html"; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h3 className="text-base font-bold">Executive Summary</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                        สรุปผลสำหรับผู้บริหาร{isFiltered ? ` (กรองแล้ว: ${n.toLocaleString()} / ${totalN.toLocaleString()} คน)` : ` (${n.toLocaleString()} คน)`}
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-primary-light)]/20 transition">
                        <Printer className="w-4 h-4" /> พิมพ์
                    </button>
                    <button onClick={handleExportHTML} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-primary-light)]/20 transition">
                        <FileText className="w-4 h-4" /> HTML
                    </button>
                    <button onClick={handleExportPDF} disabled={exporting} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-gradient-primary text-white font-medium hover:shadow-md transition disabled:opacity-60">
                        <Download className="w-4 h-4" /> {exporting ? "กำลัง Export…" : "Export PDF"}
                    </button>
                </div>
            </div>

            {/* Printable content */}
            <div ref={printRef} className="space-y-5 print:space-y-4">
                {/* Header */}
                <div className="glass-card p-6 text-center print:border print:border-gray-200">
                    <h1 className="text-xl font-extrabold mb-1">รายงานสรุปผลการสำรวจ</h1>
                    <h2 className="text-base font-bold text-[var(--color-primary-dark)] mb-1">ความสุขและความผูกพันของบุคลากร กองทัพบก</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">ประจำปีงบประมาณ ๒๕๖๙ · จำนวนผู้ตอบ {n.toLocaleString()} คน</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "ผู้ตอบแบบสอบถาม", value: n.toLocaleString(), unit: "คน", color: "text-[var(--color-primary)]" },
                        { label: "คะแนนปัจจัยเฉลี่ย", value: overallFactor.toFixed(2), unit: `/ 5.00 · ${interpretMean(overallFactor)}`, color: overallFactor >= 4 ? "text-emerald-600" : "text-yellow-600" },
                        { label: "คะแนนผูกพันเฉลี่ย", value: overallEng.toFixed(2), unit: `/ 5.00 · ${interpretMean(overallEng)}`, color: overallEng >= 4 ? "text-emerald-600" : "text-yellow-600" },
                        { label: "ปัจจัยสูงสุด", value: top5Factors[0]?.mean.toFixed(2) ?? "-", unit: top5Factors[0]?.label ?? "", color: "text-emerald-600" },
                    ].map((kpi, i) => (
                        <div key={i} className="glass-card p-4 text-center print:border print:border-gray-200">
                            <p className="text-xs text-[var(--color-text-secondary)] mb-1">{kpi.label}</p>
                            <p className={`text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
                            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{kpi.unit}</p>
                        </div>
                    ))}
                </div>

                {/* Radar Chart — Factor Group Profile */}
                {(() => {
                    const groupLabels = ["ลักษณะงาน", "สภาพแวดล้อม", "คุณภาพชีวิต", "เพื่อนร่วมงาน", "ผู้บังคับบัญชา", "นโยบาย", "ค่าตอบแทน", "ความก้าวหน้า"];
                    const groupIndices = [[0,1,2,3],[4,5,6],[7,8,9],[10,11,12],[13,14,15,16,17],[18,19,20,21],[22,23,24],[25,26,27,28]];
                    const radarData = groupLabels.map((label, gi) => {
                        const vals = groupIndices[gi].map((i) => factorMeans[i]).filter((v) => v > 0);
                        const avg = vals.length ? Math.round((vals.reduce((a,b)=>a+b,0)/vals.length)*100)/100 : 0;
                        const eVals = engMeans.filter((v) => v > 0);
                        const eAvg = eVals.length ? Math.round((eVals.reduce((a,b)=>a+b,0)/eVals.length)*100)/100 : 0;
                        return { label, ปัจจัย: avg, ความผูกพัน: gi === 0 ? eAvg : undefined };
                    });
                    const engRadar = [{ label: "ทัศนคติ", ค่า: engMeans.slice(0,5).filter(v=>v>0).reduce((a,b)=>a+b,0)/(engMeans.slice(0,5).filter(v=>v>0).length||1) },
                        { label: "ทุ่มเท", ค่า: engMeans.slice(5,8).filter(v=>v>0).reduce((a,b)=>a+b,0)/(engMeans.slice(5,8).filter(v=>v>0).length||1) },
                        { label: "เชื่อมั่น", ค่า: engMeans.slice(8,11).filter(v=>v>0).reduce((a,b)=>a+b,0)/(engMeans.slice(8,11).filter(v=>v>0).length||1) }];
                    const factorRadar = groupLabels.map((label, gi) => {
                        const vals = groupIndices[gi].map((i) => factorMeans[i]).filter((v) => v > 0);
                        return { label, ค่า: vals.length ? Math.round((vals.reduce((a,b)=>a+b,0)/vals.length)*100)/100 : 0 };
                    });
                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="glass-card p-4 print:border print:border-gray-200">
                                <h3 className="text-sm font-bold mb-2 text-[var(--color-text)]">โปรไฟล์ปัจจัยรายกลุ่ม</h3>
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={factorRadar}>
                                            <PolarGrid stroke="var(--color-border)" />
                                            <PolarAngleAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--color-text-secondary)" }} />
                                            <PolarRadiusAxis domain={[0,5]} tick={{ fontSize: 8 }} tickCount={4} />
                                            <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 11 }} formatter={(v:unknown)=>[(v as number).toFixed(2),"คะแนน"]} />
                                            <Radar dataKey="ค่า" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.25} strokeWidth={2} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="glass-card p-4 print:border print:border-gray-200">
                                <h3 className="text-sm font-bold mb-2 text-[var(--color-text)]">โปรไฟล์ความผูกพันรายกลุ่ม</h3>
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={engRadar}>
                                            <PolarGrid stroke="var(--color-border)" />
                                            <PolarAngleAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} />
                                            <PolarRadiusAxis domain={[0,5]} tick={{ fontSize: 8 }} tickCount={4} />
                                            <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 11 }} formatter={(v:unknown)=>[(v as number).toFixed(2),"คะแนน"]} />
                                            <Radar dataKey="ค่า" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} strokeWidth={2} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Factor & Engagement scores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="glass-card p-5 print:border print:border-gray-200">
                        <h3 className="text-sm font-bold mb-3 flex items-center justify-between">
                            ปัจจัย 5 อันดับสูงสุด <RatingBadge score={overallFactor} />
                        </h3>
                        <div className="space-y-2">
                            {top5Factors.map((f, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-xs mb-0.5">
                                        <span className="text-[var(--color-text-secondary)]">{i + 1}. {f.label}</span>
                                    </div>
                                    <ScoreBar score={f.mean} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="glass-card p-5 print:border print:border-gray-200">
                        <h3 className="text-sm font-bold mb-3 flex items-center justify-between">
                            ปัจจัย 5 อันดับต่ำสุด <span className="text-xs text-red-500 font-medium">ต้องปรับปรุง</span>
                        </h3>
                        <div className="space-y-2">
                            {bottom5Factors.map((f, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-xs mb-0.5">
                                        <span className="text-[var(--color-text-secondary)]">{i + 1}. {f.label}</span>
                                    </div>
                                    <ScoreBar score={f.mean} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="glass-card p-5 print:border print:border-gray-200">
                        <h3 className="text-sm font-bold mb-3 flex items-center justify-between">
                            ความผูกพัน 3 อันดับสูงสุด <RatingBadge score={overallEng} />
                        </h3>
                        <div className="space-y-2">
                            {top3Eng.map((e, i) => (
                                <div key={i}>
                                    <div className="text-xs text-[var(--color-text-secondary)] mb-0.5">{i + 1}. {e.label}</div>
                                    <ScoreBar score={e.mean} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="glass-card p-5 print:border print:border-gray-200">
                        <h3 className="text-sm font-bold mb-3 flex items-center justify-between">
                            ความผูกพัน 3 อันดับต่ำสุด <span className="text-xs text-red-500 font-medium">ต้องปรับปรุง</span>
                        </h3>
                        <div className="space-y-2">
                            {bottom3Eng.map((e, i) => (
                                <div key={i}>
                                    <div className="text-xs text-[var(--color-text-secondary)] mb-0.5">{i + 1}. {e.label}</div>
                                    <ScoreBar score={e.mean} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Strengths */}
                <div>
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> จุดแข็ง — สิ่งที่ดำเนินการได้ดีและควรรักษาไว้
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {strengths.length > 0 ? strengths.map((ins, i) => (
                            <InsightCard key={i} insight={ins} color="border-emerald-400" />
                        )) : <p className="text-xs text-[var(--color-text-secondary)]">ไม่มีข้อมูลจุดแข็งที่ชัดเจน</p>}
                    </div>
                </div>

                {/* Improvements */}
                <div>
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-orange-600 dark:text-orange-400">
                        <AlertTriangle className="w-4 h-4" /> จุดที่ต้องปรับปรุง — ประเด็นที่ต้องดำเนินการเร่งด่วน
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {improvements.length > 0 ? improvements.map((ins, i) => (
                            <InsightCard key={i} insight={ins} color="border-orange-400" />
                        )) : <p className="text-xs text-[var(--color-text-secondary)]">ไม่มีจุดที่ต้องปรับปรุงเร่งด่วน</p>}
                    </div>
                </div>

                {/* Recommendations */}
                <div>
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-[var(--color-primary-dark)]">
                        <Lightbulb className="w-4 h-4" /> ข้อเสนอแนะเชิงกลยุทธ์ — แผนปฏิบัติการที่นำไปใช้ได้ทันที
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {recommendations.map((ins, i) => (
                            <InsightCard key={i} insight={ins} color="border-[var(--color-primary)]" />
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-[var(--color-text-light)] py-2">
                    <p>จัดทำโดย RTA Engagement & Happiness Analysis System v2.1.0</p>
                    <p className="mt-0.5">© 2026 พล.ท.ดร.กริช อินทราทิพย์ — ข้อมูลทั้งหมดประมวลผลในเบราว์เซอร์ ไม่ส่งข้อมูลออกภายนอก</p>
                </div>
            </div>
        </motion.div>
    );
}
