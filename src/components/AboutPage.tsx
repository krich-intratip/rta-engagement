"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
    BookOpen,
    Sparkles,
    Info,
    Upload,
    Globe,
    BarChart3,
    PieChart,
    GitCompare,
    Table2,
    Brain,
    Download,
    Shield,
    ExternalLink,
    Link,
    Maximize2,
    Moon,
    Sun,
    Filter,
    Users,
    GitMerge,
    AlertTriangle,
    TrendingUp,
    ClipboardCheck,
    Settings2,
    FileText,
    Heart,
    Link2,
} from "lucide-react";

type SubTab = "guide" | "features" | "about";

const subTabs: { id: SubTab; label: string; icon: React.ElementType }[] = [
    { id: "guide", label: "คู่มือการใช้งาน", icon: BookOpen },
    { id: "features", label: "Features", icon: Sparkles },
    { id: "about", label: "รายละเอียด", icon: Info },
];

function GuideContent() {
    const steps = [
        {
            icon: Upload,
            title: "1. โหลดข้อมูล",
            desc: "อัปโหลดไฟล์ Excel (.xlsx, .xls) หรือ CSV หรือเชื่อมต่อ Google Sheets โดยตรง หรือวาง URL ของ Google Sheets ที่ต้องการได้เลย",
        },
        {
            icon: BarChart3,
            title: "2. ดูภาพรวม (Overview)",
            desc: "หลังโหลดข้อมูลสำเร็จ ระบบจะแสดงสถิติสรุป ได้แก่ จำนวนผู้ตอบ คะแนนปัจจัยเฉลี่ย คะแนนความผูกพันเฉลี่ย กลุ่มปัจจัยสูงสุด พร้อมกราฟแท่งปัจจัย กราฟเรดาร์ความผูกพัน และข้อมูลเชิงลึก",
        },
        {
            icon: BarChart3,
            title: "3. วิเคราะห์ปัจจัย (Factors)",
            desc: "แสดงกราฟแท่งคะแนนเฉลี่ยของแต่ละกลุ่มปัจจัย และกราฟการกระจายตัวของคำตอบในแต่ละระดับ Likert Scale (1-5)",
        },
        {
            icon: PieChart,
            title: "4. วิเคราะห์ความผูกพัน (Engagement)",
            desc: "แสดงกราฟเรดาร์ของกลุ่มความผูกพัน ตาราง Correlation Heatmap ระหว่างปัจจัยกับความผูกพัน และข้อมูลเชิงลึกจากการวิเคราะห์",
        },
        {
            icon: GitCompare,
            title: "5. เปรียบเทียบ (Compare)",
            desc: "เปรียบเทียบคะแนนระหว่างกลุ่มประชากรศาสตร์ครบทั้ง 11 มิติ ได้แก่ เพศ ยศ เจเนอเรชั่น สังกัด สถานภาพสมรส การศึกษา อายุราชการ รายได้ ที่อยู่อาศัย ครอบครัวใน ทบ. และภาระอุปการะ พร้อมกราฟวงกลมแสดงสัดส่วน",
        },
        {
            icon: Table2,
            title: "6. ข้อมูลดิบ (Raw Data)",
            desc: "ดูข้อมูลดิบทั้งหมดในรูปแบบตาราง แสดงข้อมูลประชากรศาสตร์ครบทุก 11 หัวข้อ สามารถค้นหาข้ามทุก field และ Export CSV ที่มีข้อมูลครบถ้วนได้",
        },
        {
            icon: Download,
            title: "7. Export HTML",
            desc: "กดปุ่ม \"Export HTML\" ที่มุมขวาบนของแต่ละหน้า เพื่อดาวน์โหลดหน้าแดชบอร์ดเป็นภาพ HTML คุณภาพสูง",
        },
        {
            icon: Maximize2,
            title: "8. ขยายกราฟ",
            desc: "กดปุ่มขยายที่มุมขวาบนของแต่ละกราฟ เพื่อดูกราฟแบบเต็มจอ สะดวกในการนำเสนอ",
        },
        {
            icon: Moon,
            title: "9. สลับ Light/Dark Mode",
            desc: "กดปุ่ม Moon/Sun ที่ Sidebar ด้านซ้ายเพื่อสลับโหมดสีตามความต้องการ ระบบจะจำค่าที่เลือกไว้",
        },
        {
            icon: Filter,
            title: "10. กรองข้อมูล (Filter)",
            desc: "กดปุ่ม ‘กรองข้อมูล’ เพื่อเลือกกลุ่มประชากรศาสตร์ที่ต้องการวิเคราะห์ กราฟและตารางทั้งหมดจะอัปเดตตามกลุ่มที่เลือกทันที",
        },
        {
            icon: Brain,
            title: "11. วิเคราะห์ข้อความปลายเปิด (Text Analysis)",
            desc: "ดู Word Cloud และคำสำคัญจากคำตอบปลายเปิดทั้ง 7 หัวข้อ เพื่อเข้าใจความต้องการและความคิดเห็นของกำลังพล",
        },
        {
            icon: BookOpen,
            title: "12. สรุปผู้บริหาร (Executive Summary)",
            desc: "ดูรายงานสรุปผลแบบผู้บริหาร พร้อม KPI สำคัญ จุดแข็ง/จุดอ่อน และข้อเสนอแนะ Export เป็น HTML หรือพิมพ์ได้ทันที",
        },
        {
            icon: BarChart3,
            title: "13. วิเคราะห์ส่วนที่ 2 — ปัจจัยในงาน",
            desc: "เมนู 'ส่วนที่ 2 — ปัจจัย' แสดงผลเฉพาะ 29 ข้อ 8 กลุ่มปัจจัย พร้อม Radar Chart โปรไฟล์กลุ่ม Bar Chart รายกลุ่ม/รายข้อ และ Top 5 / Bottom 5 กดปุ่ม 'แสดง Distribution' เพื่อดูสัดส่วนคะแนน 1-5 รายข้อ กดปุ่ม 'Export CSV' เพื่อดาวน์โหลดข้อมูลรายข้อ",
        },
        {
            icon: Heart,
            title: "14. วิเคราะห์ส่วนที่ 3 — ความสุขและความผูกพัน",
            desc: "เมนู 'ส่วนที่ 3 — ความผูกพัน' แสดงผลเฉพาะ 11 ข้อ 3 กลุ่ม พร้อม Radar Chart Bar Chart รายกลุ่ม/รายข้อ และ Top 3 / Bottom 3 กดปุ่ม 'แสดง Distribution' เพื่อดูสัดส่วนคะแนน 1-5 รายข้อ กดปุ่ม 'Export CSV' เพื่อดาวน์โหลดข้อมูล",
        },
        {
            icon: Link2,
            title: "15. Cross-Analysis ส่วนที่ 2 × 3",
            desc: "เมนู 'ส่วนที่ 2 × 3 (Cross)' วิเคราะห์ความสัมพันธ์ระหว่างปัจจัยในงานกับความผูกพัน แสดง Scatter Plot รายบุคคล Correlation Matrix รายกลุ่ม (8×3) และ Top 10 / Bottom 10 ปัจจัยที่ส่งผลต่อความผูกพันมากที่สุด พร้อมบทตีความเชิงนโยบาย",
        },
        {
            icon: Users,
            title: "16. Cluster Analysis",
            desc: "เมนู 'Cluster Analysis' จัดกำลังพลเป็น 3 กลุ่มด้วย K-Means พร้อม Radar Chart เปรียบโปรไฟล์ระหว่างกลุ่ม ช่วยระบุกลุ่มที่ต้องการความช่วยเหลือเป็นพิเศษ",
        },
        {
            icon: AlertTriangle,
            title: "17. Anomaly Detection",
            desc: "เมนู 'Anomaly Detection' ตรวจจับหน่วยงานที่คะแนนต่ำกว่าค่าเฉลี่ยองค์กรอย่างมีนัยสำคัญ (Z-score) แสดงระดับความเสี่ยงและปัจจัยที่น่าเป็นห่วง",
        },
        {
            icon: ClipboardCheck,
            title: "18. Action Plan Tracker",
            desc: "เมนู 'Action Plan' บันทึกแผนปฏิบัติการ กำหนดผู้รับผิดชอบ due date ความเร่งด่วน ติดตามความคืบหน้า ข้อมูลบันทึกใน localStorage ไม่หายเมื่อปิดเบราว์เซอร์",
        },
    ];

    return (
        <div className="space-y-4">
            <div className="glass-card p-5">
                <h3 className="text-lg font-bold mb-2 text-[var(--color-primary-dark)]">วิธีใช้งานระบบ</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    ระบบวิเคราะห์ความผูกพันและความสุขของกำลังพล กองทัพบก ออกแบบมาเพื่อช่วยวิเคราะห์ข้อมูลแบบสอบถามอย่างครบวงจร
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {steps.map((step, i) => {
                    const Icon = step.icon;
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" as const }}
                            className="glass-card p-4 flex gap-3"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold mb-1">{step.title}</h4>
                                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{step.desc}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

function FeaturesContent() {
    const features = [
        {
            icon: Upload,
            title: "รองรับหลายแหล่งข้อมูล",
            desc: "อัปโหลดไฟล์ Excel/CSV, เชื่อมต่อ Google Sheets ที่ตั้งค่าไว้ หรือวาง URL ของ Google Sheets ใดก็ได้",
            gradient: "bg-gradient-primary",
        },
        {
            icon: Link,
            title: "ดึงข้อมูลจาก URL",
            desc: "วาง URL ของ Google Sheets ที่เป็น Public เพื่อดึงข้อมูลมาวิเคราะห์ได้ทันที",
            gradient: "bg-gradient-secondary",
        },
        {
            icon: Brain,
            title: "วิเคราะห์อัตโนมัติ",
            desc: "คำนวณสถิติ ค่าเฉลี่ย ส่วนเบี่ยงเบนมาตรฐาน Correlation และสร้าง Insights อัตโนมัติ",
            gradient: "bg-gradient-accent",
        },
        {
            icon: BarChart3,
            title: "กราฟแบบ Interactive",
            desc: "กราฟแท่ง เรดาร์ วงกลม Heatmap และกราฟเปรียบเทียบ พร้อม Tooltip และขยายเต็มจอได้",
            gradient: "bg-gradient-lavender",
        },
        {
            icon: GitCompare,
            title: "เปรียบเทียบกลุ่มประชากร 11 มิติ",
            desc: "เปรียบเทียบคะแนนปัจจัยและความผูกพันครบทุกมิติ: เพศ ยศ เจเนอเรชั่น สังกัด สถานภาพสมรส การศึกษา อายุราชการ รายได้ ที่อยู่อาศัย ครอบครัวใน ทบ. และภาระอุปการะ",
            gradient: "bg-gradient-lavender",
        },
        {
            icon: PieChart,
            title: "วิเคราะห์ข้อมูลประชากรศาสตร์ครบถ้วน",
            desc: "แสดงสัดส่วนและค่าเฉลี่ยตามกลุ่มประชากรศาสตร์ครบทั้ง 11 หัวข้อ (ข้อ 1.1–1.11) ในรูปแบบกราฟวงกลม",
            gradient: "bg-gradient-primary",
        },
        {
            icon: Table2,
            title: "ตารางข้อมูลดิบครบถ้วน",
            desc: "ดูและค้นหาข้อมูลดิบทั้งหมด แสดงข้อมูลประชากรศาสตร์ครบ 11 คอลัมน์ Export CSV ที่มีข้อมูลครบทุก field",
            gradient: "bg-gradient-secondary",
        },
        {
            icon: Download,
            title: "Export HTML",
            desc: "ส่งออกแดชบอร์ดเป็นภาพ HTML คุณภาพสูง เปิดดูได้แบบ standalone",
            gradient: "bg-gradient-accent",
        },
        {
            icon: Maximize2,
            title: "ขยายกราฟเต็มจอ",
            desc: "กดปุ่มขยายที่มุมขวาบนของแต่ละกราฟ เพื่อดูรายละเอียดแบบเต็มจอ",
            gradient: "bg-gradient-lavender",
        },
        {
            icon: Sun,
            title: "Light / Dark Mode",
            desc: "สลับโหมดสีระหว่าง Light และ Dark ได้ตามต้องการ ระบบจำค่าที่เลือกไว้",
            gradient: "bg-gradient-primary",
        },
        {
            icon: Globe,
            title: "Responsive Design",
            desc: "รองรับการใช้งานบนทุกอุปกรณ์ ทั้งคอมพิวเตอร์ แท็บเล็ต และมือถือ",
            gradient: "bg-gradient-lavender",
        },
        {
            icon: Shield,
            title: "ประมวลผลฝั่ง Client",
            desc: "ข้อมูลทั้งหมดปรมวลผลในเบราว์เซอร์ ไม่ส่งข้อมูลไปยังเซิร์ฟเวอร์ภายนอก",
            gradient: "bg-gradient-primary",
        },
        {
            icon: Filter,
            title: "กรองข้อมูลแบบ Dynamic",
            desc: "เลือกกลุ่มประชากรศาสตร์ที่ต้องการ กราฟและตารางทุกหน้าอัปเดตทันที รองรับการกรองพร้อมกันหลายเงื่อนไข",
            gradient: "bg-gradient-secondary",
        },
        {
            icon: Table2,
            title: "ตารางไขว้ (Cross-Tabulation)",
            desc: "วิเคราะห์ความสัมพันธ์ระหว่าง 2 ตัวแปร demographic พร้อมกัน เช่น ยศ × เจเนอเรชั่น แสดงค่าเฉลี่ยและจำนวนคนในแต่ละเซลล์",
            gradient: "bg-gradient-accent",
        },
        {
            icon: BarChart3,
            title: "Heatmap ปัจจัยรายข้อตามกลุ่ม",
            desc: "แสดงค่าเฉลี่ย 29 ข้อปัจจัยแยกตามกลุ่มประชากรศาสตร์ ใช้สีเพื่อระบุปัจจัยที่ต้องปรับปรุงเฉพาะกลุ่มได้ทันที",
            gradient: "bg-gradient-lavender",
        },
        {
            icon: Brain,
            title: "ทดสอบนัยสำคัญทางสถิติ",
            desc: "t-test (2 กลุ่ม) และ One-way ANOVA (≥ 3 กลุ่ม) แสดงค่า p-value และระดับนัยสำคัญ (* ** ***) ทุกมิติประชากร",
            gradient: "bg-gradient-primary",
        },
        {
            icon: BookOpen,
            title: "วิเคราะห์ข้อความปลายเปิด",
            desc: "Word Cloud และ Top Keywords จากคำตอบปลายเปิดทั้ง 7 หัวข้อ เข้าใจความต้องการของกำลังพลได้ทันที",
            gradient: "bg-gradient-secondary",
        },
        {
            icon: Download,
            title: "สรุปผู้บริหาร (Executive Summary)",
            desc: "รายงานสรุปผลแบบผู้บริหาร พร้อม KPI จุดแข็ง/จุดอ่อน และข้อเสนอแนะ Export HTML หรือพิมพ์ได้ทันที",
            gradient: "bg-gradient-accent",
        },
        {
            icon: Info,
            title: "Saved State",
            desc: "ระบบจำแหล่งข้อมูล แท็บที่เลือก และ filter ที่ตั้งไว้ใน localStorage เปิดเบราว์เซอร์ครั้งต่อไปไม่ต้องตั้งค่าใหม่",
            gradient: "bg-gradient-lavender",
        },
        {
            icon: Users,
            title: "Cluster Analysis (v2.1)",
            desc: "K-Means clustering จัดกำลังพลเป็น 3 กลุ่ม (เสี่ยง/กลาง/แข็งแกร่ง) พร้อม Radar Chart เปรียบโปรไฟล์ระหว่างกลุ่ม",
            gradient: "bg-gradient-primary",
        },
        {
            icon: GitMerge,
            title: "Correlation Matrix (v2.1)",
            desc: "Pearson r ความสัมพันธ์ระหว่างปัจจัย ความผูกพัน และภายในกลุ่ม พร้อม Heatmap แบบ Interactive และสรุปคู่ตัวแปรที่สัมพันธ์สูงสุด",
            gradient: "bg-gradient-secondary",
        },
        {
            icon: AlertTriangle,
            title: "Anomaly Detection (v2.1)",
            desc: "Z-score ตรวจจับหน่วยงานที่คะแนนต่ำกว่าค่าเฉลี่ยองค์กรเกิน 1 SD แสดงผลเป็น Bar Chart พร้อมระดับความเสี่ยง",
            gradient: "bg-gradient-accent",
        },
        {
            icon: FileText,
            title: "Radar Chart ใน Executive Summary (v2.1)",
            desc: "โปรไฟล์ปัจจัยและความผูกพันรายกลุ่มในรูป Radar Chart พร้อม Export PDF จริงด้วย jsPDF + html2canvas",
            gradient: "bg-gradient-lavender",
        },
        {
            icon: ClipboardCheck,
            title: "Action Plan Tracker (v2.1)",
            desc: "บันทึกแผนปฏิบัติการ กำหนดผู้รับผิดชอบ due date ความเร่งด่วน ติดตามความคืบหน้า บันทึกใน localStorage",
            gradient: "bg-gradient-primary",
        },
        {
            icon: Settings2,
            title: "Survey Builder (v2.1)",
            desc: "ปรับแต่งชื่อข้อคำถาม เปิด/ปิดใช้งานข้อคำถาม เพิ่ม/ลบข้อ และเรียงลำดับได้ภายในระบบ บันทึกใน localStorage",
            gradient: "bg-gradient-secondary",
        },
        {
            icon: TrendingUp,
            title: "Benchmark (v2.1 — Coming Soon)",
            desc: "เปรียบเทียบคะแนนรายปี Trend Line รายปัจจัย YoY Change ออกแบบ UI แล้ว จะเปิดใช้งานเต็มรูปแบบใน v2.2.0",
            gradient: "bg-gradient-accent",
        },
        {
            icon: BarChart3,
            title: "ส่วนที่ 2 — วิเคราะห์ปัจจัย (v2.1.2)",
            desc: "หน้าวิเคราะห์เฉพาะส่วนที่ 2 (29 ข้อ 8 กลุ่ม) Radar Chart โปรไฟล์กลุ่ม Bar Chart รายกลุ่ม/รายข้อ Top 5 / Bottom 5 พร้อม Filter",
            gradient: "bg-gradient-primary",
        },
        {
            icon: Heart,
            title: "ส่วนที่ 3 — วิเคราะห์ความผูกพัน (v2.1.2)",
            desc: "หน้าวิเคราะห์เฉพาะส่วนที่ 3 (11 ข้อ 3 กลุ่ม) Radar Chart โปรไฟล์กลุ่ม Bar Chart รายกลุ่ม/รายข้อ Top 3 / Bottom 3 พร้อม Filter",
            gradient: "bg-gradient-secondary",
        },
        {
            icon: Link2,
            title: "Cross-Analysis ส่วนที่ 2 × 3 (v2.1.3)",
            desc: "วิเคราะห์ความสัมพันธ์ระหว่างปัจจัยในงานกับความผูกพัน Scatter Plot รายบุคคล Correlation Matrix รายกลุ่ม Top/Bottom Predictors และบทตีความเชิงนโยบาย",
            gradient: "bg-gradient-primary",
        },
        {
            icon: BarChart3,
            title: "Likert Distribution + Export CSV (v2.1.3)",
            desc: "แสดงการกระจายคะแนน 1-5 รายข้อแบบ Stacked Bar ในหน้าส่วนที่ 2 และ 3 พร้อมปุ่ม Export CSV พร้อมค่าเฉลี่ยและการกระจายรายข้อ",
            gradient: "bg-gradient-accent",
        },
        {
            icon: Shield,
            title: "Bug Fixes (v2.1.4)",
            desc: "แก้ Rules of Hooks ใน ExecutiveSummary (ย้าย useMemo ขึ้นก่อน early return) แก้ groupIndices ผิดใน ClusterAnalysis แก้ require() ใน client component (FactorAnalysis/EngagementAnalysis) แก้ side effect ใน render body (scroll-to-top) และแก้ itemCorrs array alignment ใน CrossAnalysis",
            gradient: "bg-gradient-primary",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feat, i) => {
                const Icon = feat.icon;
                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.06, duration: 0.4, ease: "easeOut" as const }}
                        className="glass-card p-5 flex flex-col gap-3"
                    >
                        <div className={`w-10 h-10 rounded-xl ${feat.gradient} flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="text-sm font-bold">{feat.title}</h4>
                        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{feat.desc}</p>
                    </motion.div>
                );
            })}
        </div>
    );
}

function AboutContent() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 text-center"
            >
                <Image
                    src="/RTA.png"
                    alt="RTA Logo"
                    width={80}
                    height={80}
                    className="mx-auto mb-4 rounded-2xl object-contain"
                />
                <h2 className="text-xl font-bold mb-1">RTA Engagement & Happiness Analysis</h2>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    ระบบวิเคราะห์ความผูกพันและความสุขของกำลังพล กองทัพบก
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-light)]/30 text-sm font-medium text-[var(--color-primary-dark)]">
                    Version 2.1.4
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6 space-y-4"
            >
                <h3 className="text-lg font-bold text-[var(--color-primary-dark)]">ผู้พัฒนาโปรแกรม</h3>
                <div className="flex items-center gap-4">
                    <Image
                        src="/pkresearch.jpg"
                        alt="Developer"
                        width={64}
                        height={64}
                        className="rounded-xl object-cover"
                    />
                    <div>
                        <p className="font-bold">พล.ท.ดร.กริช อินทราทิพย์</p>
                        <a
                            href="https://krich-portfolio.pk-research.work"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors mt-1"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            krich-portfolio.pk-research.work
                        </a>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6 space-y-3"
            >
                <h3 className="text-lg font-bold text-[var(--color-primary-dark)]">ข้อมูลโปรแกรม</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-xl bg-[var(--color-surface-alt)]">
                        <p className="text-[var(--color-text-secondary)] text-xs">เวอร์ชั่น</p>
                        <p className="font-bold">2.1.4</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--color-surface-alt)]">
                        <p className="text-[var(--color-text-secondary)] text-xs">อัพเดทล่าสุด</p>
                        <p className="font-bold">19 กุมภาพันธ์ 2569 (v2.1.4)</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--color-surface-alt)]">
                        <p className="text-[var(--color-text-secondary)] text-xs">เทคโนโลยี</p>
                        <p className="font-bold">Next.js + React</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--color-surface-alt)]">
                        <p className="text-[var(--color-text-secondary)] text-xs">License</p>
                        <p className="font-bold">Proprietary</p>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center text-xs text-[var(--color-text-light)] py-4"
            >
                <p> 2026 สงวนลิขสิทธิ์ พล.ท.ดร.กริช อินทราทิพย์</p>
                <p className="mt-1">RTA Engagement &amp; Happiness Analysis System v2.1.4</p>
            </motion.div>
        </div>
    );
}

export default function AboutPage() {
    const [activeSubTab, setActiveSubTab] = useState<SubTab>("guide");

    return (
        <div className="space-y-5">
            {/* Sub-tab navigation */}
            <div className="glass-card p-2 flex gap-1 overflow-x-auto">
                {subTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeSubTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
                                ${isActive
                                    ? "bg-[var(--color-primary)] text-white shadow-md"
                                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)]/20 hover:text-[var(--color-primary-dark)]"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Sub-tab content */}
            <AnimatePresence mode="wait">
                {activeSubTab === "guide" && (
                    <motion.div key="guide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <GuideContent />
                    </motion.div>
                )}
                {activeSubTab === "features" && (
                    <motion.div key="features" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <FeaturesContent />
                    </motion.div>
                )}
                {activeSubTab === "about" && (
                    <motion.div key="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <AboutContent />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
