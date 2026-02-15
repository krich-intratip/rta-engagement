import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";

export const metadata: Metadata = {
    title: "RTA Engagement & Happiness Analysis",
    description: "ระบบวิเคราะห์ความผูกพันและความสุขของกำลังพล กองทัพบก",
    icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="th">
            <body className="antialiased">
                <AppProvider>{children}</AppProvider>
            </body>
        </html>
    );
}
