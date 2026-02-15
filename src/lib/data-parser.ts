import { SurveyResponse, Demographics, OpenEndedResponses } from "@/types/survey";
import * as XLSX from "xlsx";

// Column indices (0-based) in the CSV/Excel
const COL = {
    TIMESTAMP: 0,
    GENDER: 1,
    RANK: 2,
    UNIT: 3,
    AGE_GROUP: 4,
    MARITAL: 5,
    EDUCATION: 6,
    SERVICE_YEARS: 7,
    INCOME: 8,
    HOUSING: 9,
    FAMILY_ARMY: 10,
    FAMILY_ARMY_DETAIL: 11,
    DEPENDENTS: 12,
    DEPENDENTS_DETAIL: 13,
    // Factor items: columns 14-42 (29 items)
    FACTOR_START: 14,
    FACTOR_END: 42,
    // Engagement items: columns 43-53 (11 items)
    ENGAGEMENT_START: 43,
    ENGAGEMENT_END: 53,
    // Open-ended
    OPEN_POLICY_1: 54,
    OPEN_ENV_1: 55,
    OPEN_WELFARE_1: 56,
    OPEN_COMMENTS: 57,
    // Unit classification columns 58-64
    UNIT_CLASS_START: 58,
    // More open-ended
    OPEN_POLICY_2: 65,
    OPEN_ENV_2: 66,
    OPEN_WELFARE_2: 67,
};

/** Parse a Likert value from string */
function parseLikert(val: string | number | undefined): number {
    if (val === undefined || val === null || val === "") return 0;
    const n = typeof val === "number" ? val : parseInt(String(val).trim(), 10);
    return isNaN(n) ? 0 : Math.min(5, Math.max(0, n));
}

/** Parse a single row of data into a SurveyResponse */
function parseRow(row: (string | number)[]): SurveyResponse | null {
    // Skip header or empty rows
    if (!row || row.length < 54) return null;
    const ts = String(row[COL.TIMESTAMP] || "").trim();
    if (!ts || ts === "ประทับเวลา") return null;

    const demographics: Demographics = {
        gender: String(row[COL.GENDER] || ""),
        rank: String(row[COL.RANK] || ""),
        unit: String(row[COL.UNIT] || ""),
        ageGroup: String(row[COL.AGE_GROUP] || ""),
        maritalStatus: String(row[COL.MARITAL] || ""),
        education: String(row[COL.EDUCATION] || ""),
        serviceYears: String(row[COL.SERVICE_YEARS] || ""),
        income: String(row[COL.INCOME] || ""),
        housing: String(row[COL.HOUSING] || ""),
        familyInArmy: String(row[COL.FAMILY_ARMY] || ""),
        familyInArmyDetail: String(row[COL.FAMILY_ARMY_DETAIL] || ""),
        hasDependents: String(row[COL.DEPENDENTS] || ""),
        dependentsDetail: String(row[COL.DEPENDENTS_DETAIL] || ""),
    };

    const factors: number[] = [];
    for (let i = COL.FACTOR_START; i <= COL.FACTOR_END; i++) {
        factors.push(parseLikert(row[i]));
    }

    const engagement: number[] = [];
    for (let i = COL.ENGAGEMENT_START; i <= COL.ENGAGEMENT_END; i++) {
        engagement.push(parseLikert(row[i]));
    }

    const openEnded: OpenEndedResponses = {
        policyExpectation1: String(row[COL.OPEN_POLICY_1] || ""),
        environmentExpectation1: String(row[COL.OPEN_ENV_1] || ""),
        welfareExpectation1: String(row[COL.OPEN_WELFARE_1] || ""),
        additionalComments: String(row[COL.OPEN_COMMENTS] || ""),
        policyExpectation2: String(row[COL.OPEN_POLICY_2] || ""),
        environmentExpectation2: String(row[COL.OPEN_ENV_2] || ""),
        welfareExpectation2: String(row[COL.OPEN_WELFARE_2] || ""),
    };

    // Find unit classification
    let unitClass = "";
    const unitLabels = [
        "ส่วนบัญชาการ",
        "ส่วนฝึกศึกษาและหลักนิยม",
        "ส่วนภูมิภาค (มทบ.)",
        "ส่วนกำลังรบ",
        "ส่วนสนับสนุนการช่วยรบ",
        "ส่วนส่งกำลังบำรุง",
        "ส่วนพัฒนาประเทศ",
    ];
    for (let i = 0; i < unitLabels.length; i++) {
        const val = String(row[COL.UNIT_CLASS_START + i] || "").trim();
        if (val) {
            unitClass = val;
            break;
        }
    }

    return {
        timestamp: ts,
        demographics,
        factors,
        engagement,
        openEnded,
        unitClassification: unitClass || demographics.unit,
    };
}

/** Parse Excel file (File object from input) */
export async function parseExcelFile(file: File): Promise<SurveyResponse[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: "array" });
                const firstSheet = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheet];
                const rows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, {
                    header: 1,
                    defval: "",
                });

                const results: SurveyResponse[] = [];
                for (const row of rows) {
                    const parsed = parseRow(row as (string | number)[]);
                    if (parsed) results.push(parsed);
                }
                resolve(results);
            } catch (err) {
                reject(new Error(`ไม่สามารถอ่านไฟล์ Excel ได้: ${err}`));
            }
        };
        reader.onerror = () => reject(new Error("เกิดข้อผิดพลาดในการอ่านไฟล์"));
        reader.readAsArrayBuffer(file);
    });
}

/** Parse CSV text string */
export function parseCsvData(csvText: string): SurveyResponse[] {
    const workbook = XLSX.read(csvText, { type: "string" });
    const firstSheet = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheet];
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, {
        header: 1,
        defval: "",
    });

    const results: SurveyResponse[] = [];
    for (const row of rows) {
        const parsed = parseRow(row as (string | number)[]);
        if (parsed) results.push(parsed);
    }
    return results;
}
