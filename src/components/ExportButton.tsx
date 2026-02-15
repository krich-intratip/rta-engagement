"use client";

import { useCallback, useState } from "react";
import { Download, Loader2 } from "lucide-react";

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

            // Collect all stylesheets
            const styleSheets = Array.from(document.styleSheets);
            let cssText = "";
            for (const sheet of styleSheets) {
                try {
                    const rules = Array.from(sheet.cssRules || []);
                    for (const rule of rules) {
                        cssText += rule.cssText + "\n";
                    }
                } catch {
                    // Cross-origin stylesheets - fetch them
                    if (sheet.href) {
                        try {
                            const res = await fetch(sheet.href);
                            const text = await res.text();
                            cssText += text + "\n";
                        } catch {
                            // Skip if can't fetch
                        }
                    }
                }
            }

            // Clone the content
            const clone = contentEl.cloneNode(true) as HTMLElement;

            // Convert all images to base64
            const images = clone.querySelectorAll("img");
            for (const img of Array.from(images)) {
                const src = img.getAttribute("src");
                if (src) {
                    try {
                        const originalImg = contentEl.querySelector(`img[src="${src}"]`) as HTMLImageElement;
                        if (originalImg && originalImg.complete) {
                            const canvas = document.createElement("canvas");
                            canvas.width = originalImg.naturalWidth;
                            canvas.height = originalImg.naturalHeight;
                            const ctx = canvas.getContext("2d");
                            if (ctx) {
                                ctx.drawImage(originalImg, 0, 0);
                                const dataUrl = canvas.toDataURL("image/png");
                                img.setAttribute("src", dataUrl);
                            }
                        }
                    } catch {
                        // Skip CORS images
                    }
                }
            }

            // Convert SVG charts to inline (they're already inline in recharts)
            // Capture computed styles for SVG elements
            const svgs = clone.querySelectorAll("svg");
            for (const svg of Array.from(svgs)) {
                svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            }

            // Get the HTML content
            const htmlContent = clone.innerHTML;

            // Build the self-contained HTML
            const exportHtml = `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RTA Analysis - ${tabName}</title>
    <style>
        /* Reset & Base */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --color-primary: #6C9BCF;
            --color-primary-dark: #4A7FB5;
            --color-primary-light: #A3C4E9;
            --color-secondary: #A8D8B9;
            --color-secondary-dark: #7BC09A;
            --color-accent: #F4B8C1;
            --color-accent-dark: #E8909E;
            --color-lavender: #C3B1E1;
            --color-lavender-dark: #A68FCC;
            --color-peach: #FDDCB5;
            --color-gold: #F5D76E;
            --color-surface: #FFFFFF;
            --color-surface-alt: #F8F9FC;
            --color-surface-glass: rgba(255, 255, 255, 0.7);
            --color-text: #2D3436;
            --color-text-secondary: #636E72;
            --color-text-light: #B2BEC3;
            --color-border: #E8ECF1;
            --color-danger: #E17055;
            --color-success: #00B894;
            --color-warning: #FDCB6E;
            --shadow-glass: 0 8px 32px rgba(108, 155, 207, 0.12);
            --shadow-card: 0 4px 16px rgba(0, 0, 0, 0.06);
            --shadow-hover: 0 8px 24px rgba(0, 0, 0, 0.1);
            --radius-lg: 1rem;
            --radius-xl: 1.5rem;
        }

        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap');

        body {
            font-family: 'Sarabun', sans-serif;
            color: var(--color-text);
            background: linear-gradient(135deg, #F8F9FC 0%, #EEF1F8 50%, #F0F4FA 100%);
            min-height: 100vh;
            padding: 24px;
            -webkit-font-smoothing: antialiased;
        }

        .glass-card {
            background: var(--color-surface-glass);
            backdrop-filter: blur(12px);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-glass);
            transition: all 0.3s ease;
        }
        .glass-card:hover {
            box-shadow: var(--shadow-hover);
            transform: translateY(-2px);
        }

        .solid-card {
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-card);
        }

        .bg-gradient-primary { background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); }
        .bg-gradient-secondary { background: linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-dark) 100%); }
        .bg-gradient-accent { background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%); }
        .bg-gradient-lavender { background: linear-gradient(135deg, var(--color-lavender) 0%, var(--color-lavender-dark) 100%); }

        /* Export header */
        .export-header {
            text-align: center;
            margin-bottom: 24px;
            padding: 20px;
            background: var(--color-surface);
            border-radius: var(--radius-lg);
            border: 1px solid var(--color-border);
        }
        .export-header h1 { font-size: 1.25rem; font-weight: 700; }
        .export-header p { font-size: 0.875rem; color: var(--color-text-secondary); margin-top: 4px; }
        .export-header .meta { font-size: 0.75rem; color: var(--color-text-light); margin-top: 8px; }

        /* Tailwind-like utilities used in the app */
        .space-y-5 > * + * { margin-top: 1.25rem; }
        .space-y-4 > * + * { margin-top: 1rem; }
        .space-y-3 > * + * { margin-top: 0.75rem; }
        .space-y-2 > * + * { margin-top: 0.5rem; }
        .gap-4 { gap: 1rem; }
        .gap-5 { gap: 1.25rem; }
        .gap-3 { gap: 0.75rem; }
        .gap-2 { gap: 0.5rem; }
        .p-5 { padding: 1.25rem; }
        .p-4 { padding: 1rem; }
        .p-3 { padding: 0.75rem; }
        .p-8 { padding: 2rem; }
        .p-12 { padding: 3rem; }
        .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
        .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mt-1 { margin-top: 0.25rem; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .text-center { text-align: center; }
        .text-xs { font-size: 0.75rem; line-height: 1rem; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
        .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
        .text-2xl { font-size: 1.5rem; line-height: 2rem; }
        .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
        .text-white { color: white; }
        .font-bold { font-weight: 700; }
        .font-medium { font-weight: 500; }
        .rounded-xl { border-radius: 0.75rem; }
        .rounded-2xl { border-radius: 1rem; }
        .rounded-full { border-radius: 9999px; }
        .flex { display: flex; }
        .inline-flex { display: inline-flex; }
        .grid { display: grid; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .flex-col { flex-direction: column; }
        .flex-shrink-0 { flex-shrink: 0; }
        .flex-1 { flex: 1; }
        .w-5 { width: 1.25rem; }
        .w-10 { width: 2.5rem; }
        .w-20 { width: 5rem; }
        .h-5 { height: 1.25rem; }
        .h-10 { height: 2.5rem; }
        .h-20 { height: 5rem; }
        .object-contain { object-fit: contain; }
        .overflow-auto { overflow: auto; }
        .overflow-x-auto { overflow-x: auto; }
        .shadow-md { box-shadow: 0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1); }
        .leading-relaxed { line-height: 1.625; }
        .whitespace-nowrap { white-space: nowrap; }
        .border { border-width: 1px; }
        .border-t { border-top-width: 1px; }
        .border-b { border-bottom-width: 1px; }

        @media (min-width: 768px) {
            .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (min-width: 1024px) {
            .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }

        /* Recharts overrides */
        .recharts-wrapper { max-width: 100%; }
        .recharts-surface { overflow: visible; }

        /* Table styles */
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--color-border); font-size: 0.875rem; }
        th { background: var(--color-surface-alt); font-weight: 600; }

        /* Print styles */
        @media print {
            body { background: white; padding: 0; }
            .glass-card { backdrop-filter: none; background: white; }
            .glass-card:hover { transform: none; box-shadow: var(--shadow-glass); }
        }

        /* Inline app CSS */
        ${cssText.replace(/<\/style>/g, "<\\/style>")}
    </style>
</head>
<body>
    <div class="export-header">
        <h1>RTA Engagement & Happiness Analysis</h1>
        <p>${tabName}</p>
        <div class="meta">Exported: ${new Date().toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" })} | © 2026 พล.ท.ดร.กริช อินทราทิพย์</div>
    </div>
    <div class="space-y-5">
        ${htmlContent}
    </div>
</body>
</html>`;

            // Download
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
