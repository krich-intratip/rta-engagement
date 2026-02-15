import {
    SurveyResponse,
    AnalysisResult,
    GroupStats,
    CorrelationResult,
    DemographicBreakdown,
    Insight,
    ItemStat,
    FactorGroup,
    EngagementGroup,
    FACTOR_GROUP_INDICES,
    ENGAGEMENT_GROUP_INDICES,
    FACTOR_LABELS,
    ENGAGEMENT_LABELS,
    interpretMean,
    interpretCorrelation,
} from "@/types/survey";
import {
    mean as ssMean,
    median as ssMedian,
    standardDeviation as ssSd,
    sampleCorrelation,
} from "simple-statistics";

// ============================================
// Core Statistical Functions
// ============================================

function safeStats(values: number[]): { mean: number; median: number; sd: number; min: number; max: number } {
    const filtered = values.filter((v) => v > 0);
    if (filtered.length === 0) return { mean: 0, median: 0, sd: 0, min: 0, max: 0 };
    return {
        mean: ssMean(filtered),
        median: ssMedian(filtered),
        sd: filtered.length > 1 ? ssSd(filtered) : 0,
        min: Math.min(...filtered),
        max: Math.max(...filtered),
    };
}

function calcDistribution(values: number[]): Record<number, number> {
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    values.filter((v) => v > 0).forEach((v) => {
        dist[v] = (dist[v] || 0) + 1;
    });
    return dist;
}

/** Get all values from a set of item indices */
function getGroupValues(data: SurveyResponse[], items: number[], source: "factors" | "engagement"): number[] {
    const vals: number[] = [];
    for (const resp of data) {
        const arr = source === "factors" ? resp.factors : resp.engagement;
        for (const idx of items) {
            if (arr[idx] > 0) vals.push(arr[idx]);
        }
    }
    return vals;
}

/** Get mean per respondent for a set of items */
function getRespondentMeans(data: SurveyResponse[], items: number[], source: "factors" | "engagement"): number[] {
    return data.map((resp) => {
        const arr = source === "factors" ? resp.factors : resp.engagement;
        const vals = items.map((i) => arr[i]).filter((v) => v > 0);
        return vals.length > 0 ? ssMean(vals) : 0;
    }).filter((v) => v > 0);
}

// ============================================
// Group-Level Analysis
// ============================================

function calculateGroupStats(
    data: SurveyResponse[],
    groupName: string,
    indices: number[],
    source: "factors" | "engagement"
): GroupStats {
    const values = getGroupValues(data, indices, source);
    const stats = safeStats(values);
    return {
        groupName,
        ...stats,
        count: data.length,
        distribution: calcDistribution(values),
        interpretation: interpretMean(stats.mean),
    };
}

// ============================================
// Item-Level Analysis
// ============================================

function calculateItemStats(data: SurveyResponse[]): ItemStat[] {
    const items: ItemStat[] = [];

    // Factor items
    for (let i = 0; i < 29; i++) {
        const vals = data.map((r) => r.factors[i]).filter((v) => v > 0);
        const stats = safeStats(vals);
        const group = Object.entries(FACTOR_GROUP_INDICES).find(([, indices]) =>
            indices.includes(i)
        );
        items.push({
            index: i,
            label: FACTOR_LABELS[i] || `ปัจจัย ${i + 1}`,
            group: group ? group[0] : "อื่นๆ",
            mean: stats.mean,
            sd: stats.sd,
        });
    }

    // Engagement items
    for (let i = 0; i < 11; i++) {
        const vals = data.map((r) => r.engagement[i]).filter((v) => v > 0);
        const stats = safeStats(vals);
        const group = Object.entries(ENGAGEMENT_GROUP_INDICES).find(([, indices]) =>
            indices.includes(i)
        );
        items.push({
            index: 29 + i,
            label: ENGAGEMENT_LABELS[i] || `ความผูกพัน ${i + 1}`,
            group: group ? group[0] : "อื่นๆ",
            mean: stats.mean,
            sd: stats.sd,
        });
    }

    return items;
}

// ============================================
// Correlation Analysis
// ============================================

function calculateCorrelations(data: SurveyResponse[]): CorrelationResult[] {
    const results: CorrelationResult[] = [];
    const factorGroups = Object.entries(FACTOR_GROUP_INDICES);
    const engGroups = Object.entries(ENGAGEMENT_GROUP_INDICES);

    for (const [fName, fIndices] of factorGroups) {
        for (const [eName, eIndices] of engGroups) {
            const fMeans = getRespondentMeans(data, fIndices, "factors");
            const eMeans = getRespondentMeans(data, eIndices, "engagement");

            // Need at least 3 pairs
            const minLen = Math.min(fMeans.length, eMeans.length);
            if (minLen < 3) continue;

            const fSlice = fMeans.slice(0, minLen);
            const eSlice = eMeans.slice(0, minLen);

            try {
                const r = sampleCorrelation(fSlice, eSlice);
                if (!isNaN(r)) {
                    results.push({
                        groupA: fName,
                        groupB: eName,
                        coefficient: Math.round(r * 1000) / 1000,
                        interpretation: interpretCorrelation(r),
                    });
                }
            } catch {
                // Skip if correlation can't be computed
            }
        }
    }
    return results;
}

// ============================================
// Demographic Breakdown
// ============================================

function calcDemographicBreakdown(data: SurveyResponse[]): DemographicBreakdown {
    function breakdownBy(field: keyof SurveyResponse["demographics"]) {
        const groups: Record<string, SurveyResponse[]> = {};
        for (const r of data) {
            const key = r.demographics[field] || "ไม่ระบุ";
            if (!groups[key]) groups[key] = [];
            groups[key].push(r);
        }

        const result: Record<string, { factorMean: number; engagementMean: number; count: number }> = {};
        for (const [key, responses] of Object.entries(groups)) {
            const factorVals = responses.flatMap((r) => r.factors.filter((v) => v > 0));
            const engVals = responses.flatMap((r) => r.engagement.filter((v) => v > 0));
            result[key] = {
                factorMean: factorVals.length > 0 ? ssMean(factorVals) : 0,
                engagementMean: engVals.length > 0 ? ssMean(engVals) : 0,
                count: responses.length,
            };
        }
        return result;
    }

    return {
        byGender: breakdownBy("gender"),
        byRank: breakdownBy("rank"),
        byAgeGroup: breakdownBy("ageGroup"),
        byUnit: breakdownBy("unit"),
    };
}

// ============================================
// Insights Generation (Expert-Level Deep Analysis)
// ============================================

/** Map factor group name to specific project/activity recommendations */
const FACTOR_RECOMMENDATIONS: Record<string, string[]> = {
    "ลักษณะงาน": [
        "โครงการ Job Enrichment — ออกแบบงานให้มีความหลากหลายและท้าทายมากขึ้น เปิดโอกาสให้กำลังพลมีส่วนร่วมในภารกิจใหม่ๆ",
        "กิจกรรม Innovation Challenge — จัดประกวดนวัตกรรมหรือแนวคิดใหม่ในหน่วยงาน เพื่อกระตุ้นความคิดสร้างสรรค์",
        "โครงการ Skill Rotation — หมุนเวียนงานข้ามสายงานเพื่อเพิ่มทักษะและลดความจำเจ",
    ],
    "สภาพแวดล้อมในการทำงาน": [
        "โครงการปรับปรุงสถานที่ทำงาน — ปรับปรุงอาคาร สถานที่ ระบบแสงสว่าง ระบบระบายอากาศ ให้เหมาะสม",
        "กิจกรรม 5ส (สะสาง สะดวก สะอาด สุขลักษณะ สร้างนิสัย) — จัดกิจกรรมอย่างต่อเนื่องเพื่อรักษามาตรฐานสภาพแวดล้อม",
        "โครงการจัดหาอุปกรณ์และเครื่องมือที่ทันสมัย — สำรวจความต้องการอุปกรณ์และจัดสรรงบประมาณอย่างเหมาะสม",
    ],
    "คุณภาพชีวิตในการทำงาน": [
        "โครงการ Work-Life Balance — กำหนดนโยบายเวลาทำงานที่ยืดหยุ่น ลดการทำงานล่วงเวลาที่ไม่จำเป็น",
        "กิจกรรมส่งเสริมสุขภาพ — จัดโปรแกรมออกกำลังกาย ตรวจสุขภาพประจำปี และให้คำปรึกษาด้านสุขภาพจิต",
        "โครงการ Smart Technology — นำเทคโนโลยีสารสนเทศมาช่วยลดภาระงานเอกสารและเพิ่มประสิทธิภาพ",
    ],
    "ความสัมพันธ์กับเพื่อนร่วมงาน": [
        "กิจกรรม Team Building — จัดกิจกรรมสร้างความสัมพันธ์ระหว่างกำลังพลอย่างสม่ำเสมอ",
        "โครงการ Buddy System — จับคู่พี่เลี้ยงสำหรับกำลังพลใหม่เพื่อสร้างความผูกพันตั้งแต่เริ่มต้น",
        "กิจกรรมกีฬาและนันทนาการ — จัดการแข่งขันกีฬาภายในหน่วยเพื่อเสริมสร้างความสามัคคี",
    ],
    "หัวหน้างาน": [
        "โครงการพัฒนาภาวะผู้นำ (Leadership Development) — จัดอบรมทักษะการเป็นผู้นำที่ดี การสื่อสาร และการให้ Feedback",
        "กิจกรรม Open Door Policy — ส่งเสริมให้ผู้บังคับบัญชาเปิดโอกาสรับฟังความคิดเห็นอย่างสม่ำเสมอ",
        "โครงการ Coaching & Mentoring — ฝึกผู้บังคับบัญชาให้เป็น Coach ที่ดี ช่วยพัฒนาศักยภาพผู้ใต้บังคับบัญชา",
    ],
    "นโยบายและการบริหาร": [
        "โครงการสื่อสารนโยบายเชิงรุก — จัดทำช่องทางสื่อสารนโยบายที่ชัดเจน เช่น จดหมายข่าว การประชุมชี้แจง",
        "กิจกรรม Town Hall Meeting — จัดเวทีให้กำลังพลได้แสดงความคิดเห็นต่อนโยบายโดยตรง",
        "โครงการปรับปรุงโครงสร้างองค์กร — ทบทวนโครงสร้างและกระบวนการทำงานให้มีความชัดเจนและคล่องตัว",
    ],
    "ผลประโยชน์และค่าตอบแทน": [
        "โครงการสำรวจความต้องการสวัสดิการ — สำรวจความต้องการที่แท้จริงของกำลังพลเพื่อจัดสวัสดิการที่ตรงจุด",
        "กิจกรรมให้ความรู้ทางการเงิน (Financial Literacy) — จัดอบรมการวางแผนการเงิน การออม และการลงทุน",
        "โครงการสวัสดิการเพิ่มเติม — ทบทวนและเพิ่มสิทธิประโยชน์ด้านสุขภาพ การศึกษาบุตร และที่อยู่อาศัย",
    ],
    "การประเมินผลและความก้าวหน้า": [
        "โครงการ Transparent Evaluation — ปรับปรุงเกณฑ์การประเมินผลให้โปร่งใสและเป็นธรรม พร้อมชี้แจงให้กำลังพลทราบ",
        "โครงการ Career Path Planning — จัดทำแผนความก้าวหน้าในอาชีพที่ชัดเจนสำหรับทุกตำแหน่ง",
        "กิจกรรมพัฒนาความรู้ต่อเนื่อง (Continuous Learning) — สนับสนุนทุนการศึกษา การอบรม และการดูงาน",
    ],
};

function generateInsights(
    factorStats: GroupStats[],
    engagementStats: GroupStats[],
    itemStats: ItemStat[],
    correlations: CorrelationResult[],
    demographics: DemographicBreakdown
): Insight[] {
    const insights: Insight[] = [];
    const sorted = [...factorStats].sort((a, b) => b.mean - a.mean);
    const engMeans = engagementStats.map((s) => s.mean);
    const overallEng = engMeans.length > 0 ? ssMean(engMeans) : 0;
    const overallFactor = sorted.length > 0 ? ssMean(sorted.map((s) => s.mean)) : 0;

    // ─── 1. DEEP ANALYSIS: Overall Summary ───
    if (sorted.length > 0 && engMeans.length > 0) {
        const factorLevel = interpretMean(overallFactor);
        const engLevel = interpretMean(overallEng);
        const gap = overallFactor - overallEng;
        let gapAnalysis = "";
        if (Math.abs(gap) > 0.3) {
            gapAnalysis = gap > 0
                ? `\n\nข้อสังเกต: คะแนนปัจจัยสูงกว่าความผูกพัน ${Math.abs(gap).toFixed(2)} คะแนน สะท้อนว่าแม้กำลังพลจะรับรู้ปัจจัยด้านต่างๆ ในระดับที่ดี แต่ยังไม่ได้แปรเปลี่ยนเป็นความผูกพันเท่าที่ควร อาจเกิดจากปัจจัยเชิงจิตวิทยาหรือวัฒนธรรมองค์กรที่ต้องศึกษาเพิ่มเติม`
                : `\n\nข้อสังเกต: คะแนนความผูกพันสูงกว่าปัจจัย ${Math.abs(gap).toFixed(2)} คะแนน สะท้อนว่ากำลังพลมีความผูกพันต่อองค์กรสูงแม้ปัจจัยบางด้านยังไม่เอื้ออำนวย แสดงถึงอุดมการณ์และจิตวิญญาณทหารที่เข้มแข็ง แต่หากปัจจัยไม่ได้รับการปรับปรุง อาจส่งผลกระทบต่อความผูกพันในระยะยาว`;
        }
        insights.push({
            type: "analysis",
            title: "📋 สรุปภาพรวมเชิงวิเคราะห์",
            description: `จากการวิเคราะห์ข้อมูลกำลังพลทั้งหมด พบว่าคะแนนปัจจัยโดยรวมอยู่ที่ ${overallFactor.toFixed(2)} (ระดับ "${factorLevel}") และคะแนนความผูกพันโดยรวมอยู่ที่ ${overallEng.toFixed(2)} (ระดับ "${engLevel}")\n\nปัจจัยที่เป็นจุดแข็งขององค์กรคือ "${sorted[0].groupName}" (${sorted[0].mean.toFixed(2)}) ขณะที่ปัจจัยที่ต้องเร่งพัฒนาคือ "${sorted[sorted.length - 1].groupName}" (${sorted[sorted.length - 1].mean.toFixed(2)}) ซึ่งมีช่องว่างระหว่างจุดแข็งและจุดอ่อนถึง ${(sorted[0].mean - sorted[sorted.length - 1].mean).toFixed(2)} คะแนน${gapAnalysis}`,
            icon: "clipboard",
        });
    }

    // ─── 2. DEEP ANALYSIS: Strength ───
    if (sorted.length > 0) {
        const best = sorted[0];
        const bestCorrs = correlations
            .filter((c) => c.groupA === best.groupName)
            .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
        const corrText = bestCorrs.length > 0
            ? `\n\nความสัมพันธ์กับความผูกพัน: ปัจจัยนี้มีสหสัมพันธ์สูงสุดกับ "${bestCorrs[0].groupB}" (r=${bestCorrs[0].coefficient.toFixed(3)}, ${bestCorrs[0].interpretation}) ${bestCorrs.length > 1 ? `และ "${bestCorrs[1].groupB}" (r=${bestCorrs[1].coefficient.toFixed(3)})` : ""} หมายความว่าการรักษาจุดแข็งด้านนี้จะช่วยเสริมสร้างความผูกพันได้โดยตรง`
            : "";
        const sdText = best.sd < 0.7
            ? "ค่าเบี่ยงเบนมาตรฐานต่ำ (SD=" + best.sd.toFixed(2) + ") แสดงว่ากำลังพลส่วนใหญ่มีความเห็นสอดคล้องกันในทิศทางบวก"
            : "อย่างไรก็ตาม ค่าเบี่ยงเบนมาตรฐานค่อนข้างสูง (SD=" + best.sd.toFixed(2) + ") แสดงว่ายังมีกำลังพลบางส่วนที่ให้คะแนนต่ำ ควรศึกษาเพิ่มเติมว่ากลุ่มใดที่ยังไม่พึงพอใจ";

        insights.push({
            type: "strength",
            title: `✅ จุดแข็งองค์กร: ${best.groupName}`,
            description: `ปัจจัยด้าน "${best.groupName}" มีคะแนนเฉลี่ยสูงสุดที่ ${best.mean.toFixed(2)} (ระดับ "${best.interpretation}") จากผู้ตอบ ${best.count} คน\n\n${sdText}${corrText}\n\nข้อเสนอแนะ: ควรรักษาและต่อยอดจุดแข็งนี้ โดยนำแนวปฏิบัติที่ดี (Best Practice) มาเป็นต้นแบบให้กับด้านอื่นๆ`,
            icon: "trophy",
        });
    }

    // ─── 3. DEEP ANALYSIS: Weakness ───
    if (sorted.length > 1) {
        const worst = sorted[sorted.length - 1];
        const worstCorrs = correlations
            .filter((c) => c.groupA === worst.groupName)
            .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
        const corrText = worstCorrs.length > 0
            ? `\n\nผลกระทบต่อความผูกพัน: ปัจจัยนี้มีสหสัมพันธ์กับ "${worstCorrs[0].groupB}" (r=${worstCorrs[0].coefficient.toFixed(3)}, ${worstCorrs[0].interpretation}) ซึ่งหมายความว่าหากปรับปรุงปัจจัยนี้ได้ จะส่งผลให้ความผูกพันด้าน "${worstCorrs[0].groupB}" เพิ่มขึ้นตามไปด้วย`
            : "";
        const urgency = worst.mean < 2.51
            ? "⚠️ ระดับความเร่งด่วน: สูงมาก — คะแนนอยู่ในระดับ \"น้อย\" หรือต่ำกว่า ต้องดำเนินการแก้ไขโดยเร็ว"
            : worst.mean < 3.51
                ? "⚡ ระดับความเร่งด่วน: ปานกลาง — คะแนนอยู่ในระดับ \"ปานกลาง\" ควรวางแผนปรับปรุงภายใน 3-6 เดือน"
                : "📌 ระดับความเร่งด่วน: ต่ำ — คะแนนอยู่ในระดับ \"มาก\" แต่ยังเป็นจุดที่ต่ำที่สุดเมื่อเทียบกับด้านอื่น ควรติดตามอย่างต่อเนื่อง";

        // Find worst individual items in this group
        const worstItems = itemStats
            .filter((it) => it.group === worst.groupName && it.mean > 0)
            .sort((a, b) => a.mean - b.mean)
            .slice(0, 3);
        const worstItemsText = worstItems.length > 0
            ? `\n\nข้อที่ได้คะแนนต่ำสุดในกลุ่มนี้:\n${worstItems.map((it, i) => `  ${i + 1}. "${it.label}" (${it.mean.toFixed(2)}, SD=${it.sd.toFixed(2)})`).join("\n")}`
            : "";

        insights.push({
            type: "improvement",
            title: `🔴 จุดที่ต้องเร่งพัฒนา: ${worst.groupName}`,
            description: `ปัจจัยด้าน "${worst.groupName}" มีคะแนนเฉลี่ยต่ำสุดที่ ${worst.mean.toFixed(2)} (ระดับ "${worst.interpretation}") ต่ำกว่าค่าเฉลี่ยรวม ${(overallFactor - worst.mean).toFixed(2)} คะแนน\n\n${urgency}${worstItemsText}${corrText}`,
            icon: "alert-triangle",
        });
    }

    // ─── 4. DEEP ANALYSIS: Engagement Dimensions ───
    if (engagementStats.length > 0) {
        const engSorted = [...engagementStats].sort((a, b) => b.mean - a.mean);
        const bestEng = engSorted[0];
        const worstEng = engSorted[engSorted.length - 1];

        let engDescription = `คะแนนความผูกพันโดยรวม ${overallEng.toFixed(2)} (ระดับ "${interpretMean(overallEng)}")\n\nรายละเอียดแต่ละมิติ:\n`;
        engDescription += engSorted.map((s) => `• ${s.groupName}: ${s.mean.toFixed(2)} (${s.interpretation})`).join("\n");

        if (engSorted.length > 1) {
            engDescription += `\n\nมิติที่แข็งแกร่งที่สุดคือ "${bestEng.groupName}" สะท้อนว่ากำลังพล${bestEng.groupName === "ทัศนคติและความภักดี" ? "มีทัศนคติที่ดีและความภักดีต่อกองทัพบกในระดับสูง" : bestEng.groupName === "ความเต็มใจทุ่มเท" ? "มีความเต็มใจที่จะทุ่มเทเพื่อภารกิจขององค์กร" : "มีความเชื่อมั่นในทิศทางและการบริหารขององค์กร"}`;
            if (worstEng.mean < bestEng.mean - 0.2) {
                engDescription += `\n\nมิติที่ควรเสริมสร้างคือ "${worstEng.groupName}" (${worstEng.mean.toFixed(2)}) ${worstEng.groupName === "ทัศนคติและความภักดี" ? "ควรจัดกิจกรรมเสริมสร้างอุดมการณ์และความภาคภูมิใจในการรับราชการทหาร" : worstEng.groupName === "ความเต็มใจทุ่มเท" ? "ควรสร้างแรงจูงใจและการยอมรับผลงานเพื่อกระตุ้นความทุ่มเท" : "ควรสื่อสารวิสัยทัศน์และทิศทางองค์กรให้ชัดเจนเพื่อเสริมความเชื่อมั่น"}`;
            }
        }

        insights.push({
            type: "analysis",
            title: "💜 วิเคราะห์มิติความผูกพัน",
            description: engDescription,
            icon: "heart",
        });
    }

    // ─── 5. DEEP ANALYSIS: Key Correlations ───
    if (correlations.length > 0) {
        const sortedCorr = [...correlations].sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
        const topCorrs = sortedCorr.slice(0, 3);

        let corrDescription = "ปัจจัยที่มีอิทธิพลต่อความผูกพันมากที่สุด (จากค่าสหสัมพันธ์):\n\n";
        corrDescription += topCorrs.map((c, i) => {
            const strength = Math.abs(c.coefficient) >= 0.6 ? "แข็งแกร่ง" : Math.abs(c.coefficient) >= 0.4 ? "ปานกลาง" : "อ่อน";
            return `${i + 1}. "${c.groupA}" → "${c.groupB}" (r=${c.coefficient.toFixed(3)})\n   ความสัมพันธ์${strength}: ${c.coefficient > 0 ? "เมื่อปัจจัยนี้เพิ่มขึ้น ความผูกพันด้านนี้จะเพิ่มขึ้นตาม" : "ปัจจัยนี้มีความสัมพันธ์ผกผันกับความผูกพัน"}`;
        }).join("\n\n");

        corrDescription += "\n\nนัยสำคัญ: ควรให้ความสำคัญกับการพัฒนาปัจจัยที่มีสหสัมพันธ์สูงเป็นลำดับแรก เนื่องจากจะส่งผลกระทบต่อความผูกพันมากที่สุด";

        insights.push({
            type: "analysis",
            title: "🔗 วิเคราะห์ความสัมพันธ์เชิงสาเหตุ",
            description: corrDescription,
            icon: "link",
        });
    }

    // ─── 6. DEEP ANALYSIS: Top & Bottom Items ───
    const sortedItems = [...itemStats].sort((a, b) => b.mean - a.mean);
    const nonZeroItems = sortedItems.filter((it) => it.mean > 0);
    if (nonZeroItems.length >= 5) {
        const top5 = nonZeroItems.slice(0, 5);
        insights.push({
            type: "strength",
            title: "⭐ ข้อที่ได้คะแนนสูงสุด 5 อันดับ",
            description: top5
                .map((it, i) => `${i + 1}. "${it.label}" — ${it.mean.toFixed(2)} (${interpretMean(it.mean)}, กลุ่ม: ${it.group})`)
                .join("\n")
                + "\n\nข้อเหล่านี้เป็นจุดแข็งที่ควรรักษาไว้ และนำมาเป็นตัวอย่างแนวปฏิบัติที่ดีให้กับด้านอื่นๆ",
            icon: "star",
        });

        const bottom5 = nonZeroItems.slice(-5).reverse();
        insights.push({
            type: "improvement",
            title: "🎯 ข้อที่ต้องปรับปรุงเร่งด่วน 5 อันดับ",
            description: bottom5
                .map((it, i) => `${i + 1}. "${it.label}" — ${it.mean.toFixed(2)} (${interpretMean(it.mean)}, กลุ่ม: ${it.group})`)
                .join("\n")
                + "\n\nข้อเหล่านี้เป็นจุดที่กำลังพลให้คะแนนต่ำที่สุด ควรนำมาวิเคราะห์สาเหตุเชิงลึกและจัดทำแผนปรับปรุงเป็นการเฉพาะ",
            icon: "target",
        });
    }

    // ─── 7. DEEP ANALYSIS: Demographic Gaps ───
    const demoFields: { key: keyof DemographicBreakdown; label: string }[] = [
        { key: "byGender", label: "เพศ" },
        { key: "byAgeGroup", label: "กลุ่มอายุ (เจเนอเรชั่น)" },
        { key: "byRank", label: "ชั้นยศ" },
    ];

    for (const field of demoFields) {
        const breakdown = demographics[field.key];
        const entries = Object.entries(breakdown).filter(([, v]) => v.count >= 3);
        if (entries.length < 2) continue;

        const avgFactor = ssMean(entries.map(([, v]) => v.factorMean));
        const avgEng = ssMean(entries.map(([, v]) => v.engagementMean));

        // Find groups significantly below average
        const lowGroups = entries.filter(([, v]) =>
            v.factorMean < avgFactor - 0.3 || v.engagementMean < avgEng - 0.3
        );

        if (lowGroups.length > 0) {
            let desc = `จากการเปรียบเทียบตาม${field.label} พบกลุ่มที่มีคะแนนต่ำกว่าค่าเฉลี่ยอย่างมีนัยสำคัญ:\n\n`;
            desc += lowGroups.map(([name, v]) => {
                const fGap = avgFactor - v.factorMean;
                const eGap = avgEng - v.engagementMean;
                let detail = `• "${name}" (${v.count} คน)`;
                if (fGap > 0.3) detail += `\n  ปัจจัย: ${v.factorMean.toFixed(2)} (ต่ำกว่าค่าเฉลี่ย ${fGap.toFixed(2)})`;
                if (eGap > 0.3) detail += `\n  ความผูกพัน: ${v.engagementMean.toFixed(2)} (ต่ำกว่าค่าเฉลี่ย ${eGap.toFixed(2)})`;
                return detail;
            }).join("\n\n");
            desc += `\n\nข้อเสนอแนะ: ควรจัดกิจกรรมหรือมาตรการเฉพาะกลุ่มเพื่อยกระดับความพึงพอใจและความผูกพันของกลุ่มที่มีคะแนนต่ำ`;

            insights.push({
                type: "analysis",
                title: `📊 วิเคราะห์ช่องว่างตาม${field.label}`,
                description: desc,
                icon: "bar-chart",
            });
        }
    }

    // ─── 8. RECOMMENDATIONS: Specific Projects ───
    // Recommend for the 2 weakest factor groups
    const weakestGroups = sorted.slice(-2).reverse();
    for (const group of weakestGroups) {
        const recs = FACTOR_RECOMMENDATIONS[group.groupName];
        if (!recs) continue;

        // Find the strongest correlation for this factor
        const relatedCorrs = correlations
            .filter((c) => c.groupA === group.groupName)
            .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
        const corrNote = relatedCorrs.length > 0
            ? `\n\nหมายเหตุ: ปัจจัยนี้มีสหสัมพันธ์กับ "${relatedCorrs[0].groupB}" (r=${relatedCorrs[0].coefficient.toFixed(3)}) ดังนั้นการปรับปรุงจะส่งผลเชิงบวกต่อความผูกพันด้านนี้โดยตรง`
            : "";

        insights.push({
            type: "recommendation",
            title: `💡 แนะนำโครงการ: พัฒนาด้าน "${group.groupName}"`,
            description: `จากข้อมูลพบว่าปัจจัยด้าน "${group.groupName}" ได้คะแนน ${group.mean.toFixed(2)} (${group.interpretation}) ซึ่งเป็นจุดที่ต้องพัฒนา แนะนำให้ดำเนินการดังนี้:\n\n${recs.map((r, i) => `${i + 1}. ${r}`).join("\n\n")}${corrNote}`,
            icon: "lightbulb",
        });
    }

    // ─── 9. RECOMMENDATION: Engagement Boosting Activities ───
    if (engagementStats.length > 0) {
        const engSorted = [...engagementStats].sort((a, b) => a.mean - b.mean);
        const weakestEng = engSorted[0];

        let engRecs = "";
        if (weakestEng.groupName === "ทัศนคติและความภักดี") {
            engRecs = "1. โครงการเสริมสร้างอุดมการณ์ — จัดกิจกรรมศึกษาประวัติศาสตร์ทหาร เยี่ยมชมพิพิธภัณฑ์ และพบปะทหารผ่านศึก\n\n2. กิจกรรม Pride Campaign — สร้างความภาคภูมิใจผ่านการเล่าเรื่องความสำเร็จของหน่วย\n\n3. โครงการ RTA Ambassador — คัดเลือกกำลังพลตัวอย่างเป็นทูตสร้างแรงบันดาลใจ";
        } else if (weakestEng.groupName === "ความเต็มใจทุ่มเท") {
            engRecs = "1. โครงการ Recognition & Reward — จัดระบบยกย่องชมเชยกำลังพลที่ทุ่มเทอย่างเป็นรูปธรรม\n\n2. กิจกรรม Mission Ownership — ให้กำลังพลมีส่วนร่วมในการกำหนดเป้าหมายและวางแผนภารกิจ\n\n3. โครงการ Volunteer Corps — จัดกิจกรรมจิตอาสาเพื่อสร้างความรู้สึกมีคุณค่าและทุ่มเทเพื่อส่วนรวม";
        } else {
            engRecs = "1. โครงการสื่อสารวิสัยทัศน์ — จัดเวทีชี้แจงทิศทางองค์กรอย่างสม่ำเสมอ ให้กำลังพลเข้าใจเป้าหมายร่วม\n\n2. กิจกรรม Transparency Forum — เปิดเผยข้อมูลผลการดำเนินงานและแผนอนาคตอย่างโปร่งใส\n\n3. โครงการ Trust Building — สร้างความเชื่อมั่นผ่านการปฏิบัติตามสัญญาและนโยบายอย่างสม่ำเสมอ";
        }

        insights.push({
            type: "recommendation",
            title: `💡 แนะนำกิจกรรม: เสริมสร้าง "${weakestEng.groupName}"`,
            description: `มิติความผูกพันด้าน "${weakestEng.groupName}" ได้คะแนน ${weakestEng.mean.toFixed(2)} (${weakestEng.interpretation}) ซึ่งเป็นมิติที่ต่ำที่สุด แนะนำกิจกรรมเสริมสร้างดังนี้:\n\n${engRecs}`,
            icon: "lightbulb",
        });
    }

    // ─── 10. RECOMMENDATION: Quick Wins ───
    if (nonZeroItems.length >= 5) {
        // Items that are close to the next level (e.g., 3.4 → could reach 3.51 "มาก")
        const quickWins = nonZeroItems.filter((it) => {
            const gap = Math.ceil(it.mean * 2) / 2 - it.mean; // distance to next 0.5
            return gap > 0 && gap <= 0.3 && it.mean < 4.51;
        }).sort((a, b) => a.mean - b.mean).slice(0, 3);

        if (quickWins.length > 0) {
            insights.push({
                type: "recommendation",
                title: "🚀 Quick Wins — ข้อที่ปรับปรุงได้เร็ว",
                description: `ข้อต่อไปนี้มีคะแนนใกล้เกณฑ์ระดับถัดไป หากปรับปรุงเพียงเล็กน้อยจะยกระดับได้ทันที:\n\n${quickWins.map((it, i) => {
                    const nextLevel = it.mean < 2.51 ? 2.51 : it.mean < 3.51 ? 3.51 : 4.51;
                    const needed = nextLevel - it.mean;
                    return `${i + 1}. "${it.label}" (${it.mean.toFixed(2)}) — ต้องการเพิ่มอีกเพียง ${needed.toFixed(2)} คะแนน เพื่อขึ้นระดับ "${interpretMean(nextLevel)}"`;
                }).join("\n\n")}\n\nข้อเสนอแนะ: เริ่มจากข้อเหล่านี้เพื่อสร้างผลลัพธ์ที่เห็นได้เร็ว (Quick Wins) ซึ่งจะช่วยสร้างแรงจูงใจในการปรับปรุงด้านอื่นๆ ต่อไป`,
                icon: "zap",
            });
        }
    }

    return insights;
}

// ============================================
// Main Analysis Function
// ============================================

export function analyzeData(data: SurveyResponse[]): AnalysisResult {
    if (!data || data.length === 0) {
        return {
            totalResponses: 0,
            factorStats: [],
            engagementStats: [],
            overallFactorScore: 0,
            overallEngagementScore: 0,
            correlations: [],
            demographicBreakdown: { byGender: {}, byRank: {}, byAgeGroup: {}, byUnit: {} },
            insights: [],
            itemStats: [],
        };
    }

    // Factor group stats
    const factorStats: GroupStats[] = Object.entries(FACTOR_GROUP_INDICES).map(
        ([name, indices]) => calculateGroupStats(data, name, indices, "factors")
    );

    // Engagement group stats
    const engagementStats: GroupStats[] = Object.entries(ENGAGEMENT_GROUP_INDICES).map(
        ([name, indices]) => calculateGroupStats(data, name, indices, "engagement")
    );

    // Overall scores
    const allFactorVals = data.flatMap((r) => r.factors.filter((v) => v > 0));
    const allEngVals = data.flatMap((r) => r.engagement.filter((v) => v > 0));
    const overallFactorScore = allFactorVals.length > 0 ? ssMean(allFactorVals) : 0;
    const overallEngagementScore = allEngVals.length > 0 ? ssMean(allEngVals) : 0;

    // Correlations
    const correlations = calculateCorrelations(data);

    // Demographics
    const demographicBreakdown = calcDemographicBreakdown(data);

    // Item stats
    const itemStats = calculateItemStats(data);

    // Insights
    const insights = generateInsights(factorStats, engagementStats, itemStats, correlations, demographicBreakdown);

    return {
        totalResponses: data.length,
        factorStats,
        engagementStats,
        overallFactorScore: Math.round(overallFactorScore * 100) / 100,
        overallEngagementScore: Math.round(overallEngagementScore * 100) / 100,
        correlations,
        demographicBreakdown,
        insights,
        itemStats,
    };
}
