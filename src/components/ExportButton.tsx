"use client";

import { useCallback, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas-pro";

interface ExportButtonProps {
    tabName: string;
    contentId: string;
}

export default function ExportButton({ tabName, contentId }: ExportButtonProps) {
    const [exporting, setExporting] = useState(false);

    const handleExport = useCallback(async () => {
        setExporting(true);
        try {
            const contentEl = document.getElementById(contentId);
            if (!contentEl) {
                alert("ไม่พบเนื้อหาสำหรับ export");
                return;
            }

            // Capture the content as a canvas image
            const canvas = await html2canvas(contentEl, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: contentEl.scrollWidth,
                windowHeight: contentEl.scrollHeight,
            });

            const imageDataUrl = canvas.toDataURL("image/png");
            const dateStr = new Date().toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" });

            const exportHtml = `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RTA Analysis - ${tabName}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Sarabun', sans-serif;
            background: linear-gradient(135deg, #F8F9FC 0%, #EEF1F8 50%, #F0F4FA 100%);
            min-height: 100vh;
            padding: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .header {
            text-align: center;
            margin-bottom: 24px;
            padding: 20px 32px;
            background: white;
            border-radius: 16px;
            border: 1px solid #E8ECF1;
            box-shadow: 0 4px 16px rgba(0,0,0,0.06);
            max-width: 900px;
            width: 100%;
        }
        .header h1 { font-size: 1.25rem; font-weight: 700; color: #2D3436; }
        .header p { font-size: 0.875rem; color: #636E72; margin-top: 4px; }
        .header .meta { font-size: 0.75rem; color: #B2BEC3; margin-top: 8px; }
        .content {
            max-width: 1200px;
            width: 100%;
        }
        .content img {
            width: 100%;
            height: auto;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(108, 155, 207, 0.12);
        }
        @media print {
            body { background: white; padding: 0; }
            .content img { box-shadow: none; border-radius: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>RTA Engagement & Happiness Analysis</h1>
        <p>${tabName}</p>
        <div class="meta">Exported: ${dateStr} | © 2026 พล.ท.ดร.กริช อินทราทิพย์</div>
    </div>
    <div class="content">
        <img src="${imageDataUrl}" alt="Dashboard - ${tabName}" />
    </div>
</body>
</html>`;

            const blob = new Blob([exportHtml], { type: "text/html;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `rta-analysis-${tabName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export failed:", err);
            alert("เกิดข้อผิดพลาดในการ export");
        } finally {
            setExporting(false);
        }
    }, [tabName, contentId]);

    return (
        <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-all duration-200 shadow-md disabled:opacity-50"
        >
            {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Download className="w-4 h-4" />
            )}
            Export HTML
        </button>
    );
}
