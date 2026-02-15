import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
    title: "RTA Engagement & Happiness Analysis",
    description: "ระบบวิเคราะห์ความผูกพันและความสุขของกำลังพล กองทัพบก",
    icons: { icon: "/pkresearch.jpg" },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="th">
            <body className="antialiased">
                <ThemeProvider>
                    <AppProvider>{children}</AppProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
