import { SurveyResponse } from "@/types/survey";
import { parseCsvData } from "./data-parser";

const GOOGLE_SHEET_ID = "1KTWOcanJWywnUNpdibHu80fZ8GrmZa1NN2AoZ_eX_Hs";
const SHEET_GID = "69191273";

/** Build the CSV export URL for a public Google Sheet */
export function buildGoogleSheetCsvUrl(
    sheetId: string = GOOGLE_SHEET_ID,
    gid: string = SHEET_GID
): string {
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

/** Fetch data from a public Google Sheet and parse it */
export async function fetchGoogleSheetData(
    url?: string
): Promise<SurveyResponse[]> {
    const csvUrl = url || buildGoogleSheetCsvUrl();

    // Use a CORS proxy for client-side fetching
    // Try direct first, fallback to allorigins proxy
    let csvText: string;
    try {
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error("Direct fetch failed");
        csvText = await response.text();
    } catch {
        // Fallback: use allorigins as CORS proxy
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(csvUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(
                `ไม่สามารถดึงข้อมูลจาก Google Sheets ได้ (HTTP ${response.status})`
            );
        }
        csvText = await response.text();
    }

    if (!csvText || csvText.trim().length === 0) {
        throw new Error("ไม่พบข้อมูลใน Google Sheet");
    }

    return parseCsvData(csvText);
}
