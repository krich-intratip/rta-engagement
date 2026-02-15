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
// Insights Generation
// ============================================

function generateInsights(
    factorStats: GroupStats[],
    engagementStats: GroupStats[],
    itemStats: ItemStat[]
): Insight[] {
    const insights: Insight[] = [];

    // Best factor group
    const sorted = [...factorStats].sort((a, b) => b.mean - a.mean);
    if (sorted.length > 0) {
        insights.push({
            type: "strength",
            title: `จุดแข็ง: ${sorted[0].groupName}`,
            description: `ปัจจัยด้าน "${sorted[0].groupName}" มีคะแนนเฉลี่ยสูงสุด (${sorted[0].mean.toFixed(2)}) อยู่ในระดับ "${sorted[0].interpretation}"`,
            icon: "trophy",
        });
    }

    // Worst factor group
    if (sorted.length > 1) {
        const worst = sorted[sorted.length - 1];
        insights.push({
            type: "improvement",
            title: `ควรพัฒนา: ${worst.groupName}`,
            description: `ปัจจัยด้าน "${worst.groupName}" มีคะแนนเฉลี่ยต่ำสุด (${worst.mean.toFixed(2)}) อยู่ในระดับ "${worst.interpretation}"`,
            icon: "alert-triangle",
        });
    }

    // Overall engagement score
    const engAll = engagementStats.flatMap(() => []);
    const engMeans = engagementStats.map((s) => s.mean);
    if (engMeans.length > 0) {
        const overallEng = ssMean(engMeans);
        insights.push({
            type: "info",
            title: "ภาพรวมความผูกพัน",
            description: `คะแนนความผูกพันโดยรวม ${overallEng.toFixed(2)} อยู่ในระดับ "${interpretMean(overallEng)}"`,
            icon: "heart",
        });
    }

    // Top 3 items
    const sortedItems = [...itemStats].sort((a, b) => b.mean - a.mean);
    if (sortedItems.length >= 3) {
        insights.push({
            type: "strength",
            title: "ข้อที่ได้คะแนนสูงสุด",
            description: sortedItems
                .slice(0, 3)
                .map((it, i) => `${i + 1}. ${it.label} (${it.mean.toFixed(2)})`)
                .join("\n"),
            icon: "star",
        });
    }

    // Bottom 3 items
    const nonZeroItems = sortedItems.filter((it) => it.mean > 0);
    if (nonZeroItems.length >= 3) {
        const bottom3 = nonZeroItems.slice(-3).reverse();
        insights.push({
            type: "improvement",
            title: "ข้อที่ควรปรับปรุง",
            description: bottom3
                .map((it, i) => `${i + 1}. ${it.label} (${it.mean.toFixed(2)})`)
                .join("\n"),
            icon: "target",
        });
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
    const insights = generateInsights(factorStats, engagementStats, itemStats);

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
