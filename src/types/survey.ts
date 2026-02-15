// ==========================================
// RTA Engagement & Happiness Survey Types
// ==========================================

/** Likert scale value 1-5 */
export type LikertValue = 1 | 2 | 3 | 4 | 5;

/** Factor groups for Part 2 of the survey */
export enum FactorGroup {
    JobCharacteristics = "ลักษณะงาน",
    WorkEnvironment = "สภาพแวดล้อมในการทำงาน",
    QualityOfWorkLife = "คุณภาพชีวิตในการทำงาน",
    ColleagueRelations = "ความสัมพันธ์กับเพื่อนร่วมงาน",
    SupervisorRelations = "หัวหน้างาน",
    PolicyAdmin = "นโยบายและการบริหาร",
    BenefitsCompensation = "ผลประโยชน์และค่าตอบแทน",
    EvaluationCareer = "การประเมินผลและความก้าวหน้า",
}

/** Engagement groups for Part 3 */
export enum EngagementGroup {
    AttitudeLoyalty = "ทัศนคติและความภักดี",
    WillingnessDedicate = "ความเต็มใจทุ่มเท",
    OrganizationalTrust = "ความเชื่อมั่นในองค์การ",
}

/** Mapping of factor group → question indices (0-based within factors) */
export const FACTOR_GROUP_INDICES: Record<FactorGroup, number[]> = {
    [FactorGroup.JobCharacteristics]: [0, 1, 2, 3],
    [FactorGroup.WorkEnvironment]: [4, 5],
    [FactorGroup.QualityOfWorkLife]: [6, 7, 8, 9],
    [FactorGroup.ColleagueRelations]: [10, 11, 12],
    [FactorGroup.SupervisorRelations]: [13, 14, 15, 16, 17],
    [FactorGroup.PolicyAdmin]: [18, 19, 20, 21],
    [FactorGroup.BenefitsCompensation]: [22, 23, 24],
    [FactorGroup.EvaluationCareer]: [25, 26, 27, 28],
};

/** Mapping of engagement group → question indices (0-based within engagement) */
export const ENGAGEMENT_GROUP_INDICES: Record<EngagementGroup, number[]> = {
    [EngagementGroup.AttitudeLoyalty]: [0, 1, 2, 3, 4],
    [EngagementGroup.WillingnessDedicate]: [5, 6, 7],
    [EngagementGroup.OrganizationalTrust]: [8, 9, 10],
};

/** Short labels for each factor question */
export const FACTOR_LABELS: string[] = [
    "ภาคภูมิใจในงาน",
    "งานท้าทาย",
    "ใช้ความคิดสร้างสรรค์",
    "พัฒนาทักษะ",
    "อุปกรณ์เพียงพอ",
    "สภาพแวดล้อมเหมาะสม",
    "เทคโนโลยีสารสนเทศ",
    "ส่งเสริมคุณภาพชีวิต",
    "Work-Life Balance",
    "ความปลอดภัย",
    "ความร่วมมือเพื่อนร่วมงาน",
    "คำแนะนำเพื่อนร่วมงาน",
    "การยอมรับจากเพื่อนร่วมงาน",
    "หัวหน้าเป็นตัวอย่างที่ดี",
    "เปิดโอกาสแสดงความเห็น",
    "ช่วยแก้ปัญหา",
    "ร่วมรับผิดชอบ",
    "ยกย่องชมเชย",
    "นโยบายชัดเจน",
    "ถ่ายทอดนโยบาย",
    "เปิดโอกาสแสดงความเห็น (ผบ.)",
    "โครงสร้างองค์กรชัดเจน",
    "เงินเดือนเหมาะสม",
    "สวัสดิการครอบครัว",
    "สวัสดิการเพิ่มเติม",
    "ภาระงานเหมาะสม",
    "เกณฑ์ประเมินชัดเจน",
    "โอกาสพัฒนาความรู้",
    "ความก้าวหน้าอาชีพ",
];

/** Short labels for each engagement question */
export const ENGAGEMENT_LABELS: string[] = [
    "อุดมการณ์รักชาติ",
    "ภูมิใจทำงานใน ทบ.",
    "มีความสุขในการทำงาน",
    "ตั้งใจทำงานจนเกษียณ",
    "ไม่คิดโอนย้าย/ลาออก",
    "พร้อมทำงานเต็มความสามารถ",
    "มุ่งมั่นเพื่อประโยชน์ส่วนรวม",
    "เต็มใจงานพิเศษ",
    "เชื่อมั่นทิศทางองค์การ",
    "ทัศนคติบวก",
    "ภาคภูมิใจแบบธรรมเนียมทหาร",
];

/** A single survey response */
export interface SurveyResponse {
    timestamp: string;
    demographics: Demographics;
    factors: number[];        // 29 items, values 1-5
    engagement: number[];     // 11 items, values 1-5
    openEnded: OpenEndedResponses;
    unitClassification: string;
}

export interface Demographics {
    gender: string;
    rank: string;
    unit: string;
    ageGroup: string;
    maritalStatus: string;
    education: string;
    serviceYears: string;
    income: string;
    housing: string;
    familyInArmy: string;
    familyInArmyDetail: string;
    hasDependents: string;
    dependentsDetail: string;
}

export interface OpenEndedResponses {
    policyExpectation1: string;
    environmentExpectation1: string;
    welfareExpectation1: string;
    additionalComments: string;
    policyExpectation2: string;
    environmentExpectation2: string;
    welfareExpectation2: string;
}

/** Stats for a single group */
export interface GroupStats {
    groupName: string;
    mean: number;
    median: number;
    sd: number;
    min: number;
    max: number;
    count: number;
    distribution: Record<number, number>; // value → count
    interpretation: string;
}

/** Correlation result between two variables */
export interface CorrelationResult {
    groupA: string;
    groupB: string;
    coefficient: number;
    interpretation: string;
}

/** Full analysis result */
export interface AnalysisResult {
    totalResponses: number;
    factorStats: GroupStats[];
    engagementStats: GroupStats[];
    overallFactorScore: number;
    overallEngagementScore: number;
    correlations: CorrelationResult[];
    demographicBreakdown: DemographicBreakdown;
    insights: Insight[];
    itemStats: ItemStat[];
}

export interface ItemStat {
    index: number;
    label: string;
    group: string;
    mean: number;
    sd: number;
}

export interface DemographicBreakdown {
    byGender: Record<string, { factorMean: number; engagementMean: number; count: number }>;
    byRank: Record<string, { factorMean: number; engagementMean: number; count: number }>;
    byAgeGroup: Record<string, { factorMean: number; engagementMean: number; count: number }>;
    byUnit: Record<string, { factorMean: number; engagementMean: number; count: number }>;
}

export interface Insight {
    type: "strength" | "improvement" | "info";
    title: string;
    description: string;
    icon: string;
}

/** Interpretation levels */
export function interpretMean(mean: number): string {
    if (mean >= 4.51) return "มากที่สุด";
    if (mean >= 3.51) return "มาก";
    if (mean >= 2.51) return "ปานกลาง";
    if (mean >= 1.51) return "น้อย";
    return "น้อยที่สุด";
}

export function interpretCorrelation(r: number): string {
    const abs = Math.abs(r);
    const direction = r >= 0 ? "ทางบวก" : "ทางลบ";
    if (abs >= 0.8) return `สหสัมพันธ์${direction}สูงมาก`;
    if (abs >= 0.6) return `สหสัมพันธ์${direction}สูง`;
    if (abs >= 0.4) return `สหสัมพันธ์${direction}ปานกลาง`;
    if (abs >= 0.2) return `สหสัมพันธ์${direction}ต่ำ`;
    return "ไม่มีสหสัมพันธ์";
}
