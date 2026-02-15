"use client";

import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import HeroSection from "@/components/HeroSection";
import DataSourceSwitcher from "@/components/DataSourceSwitcher";
import InsightsPanel from "@/components/InsightsPanel";
import RawDataTable from "@/components/RawDataTable";
import FactorBarChart from "@/components/charts/FactorBarChart";
import EngagementRadarChart from "@/components/charts/EngagementRadarChart";
import CorrelationHeatmap from "@/components/charts/CorrelationHeatmap";
import DemographicPieChart from "@/components/charts/DemographicPieChart";
import CompareGroupChart from "@/components/charts/CompareGroupChart";
import DistributionChart from "@/components/charts/DistributionChart";
import { useAppState } from "@/lib/store";

function TabContent() {
    const { state } = useAppState();
    const hasData = state.analysisResult && state.analysisResult.totalResponses > 0;

    return (
        <AnimatePresence mode="wait">
            {state.activeTab === "overview" && (
                <motion.div
                    key="overview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                >
                    <HeroSection />
                    <DataSourceSwitcher />
                    {hasData && (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <FactorBarChart />
                                <EngagementRadarChart />
                            </div>
                            <InsightsPanel />
                            <DemographicPieChart />
                        </>
                    )}
                </motion.div>
            )}

            {state.activeTab === "factors" && (
                <motion.div
                    key="factors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                >
                    {hasData ? (
                        <>
                            <FactorBarChart />
                            <DistributionChart />
                        </>
                    ) : (
                        <EmptyState label="กรุณาโหลดข้อมูลก่อนเพื่อดูการวิเคราะห์ปัจจัย" />
                    )}
                </motion.div>
            )}

            {state.activeTab === "engagement" && (
                <motion.div
                    key="engagement"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                >
                    {hasData ? (
                        <>
                            <EngagementRadarChart />
                            <CorrelationHeatmap />
                            <InsightsPanel />
                        </>
                    ) : (
                        <EmptyState label="กรุณาโหลดข้อมูลก่อนเพื่อดูการวิเคราะห์ความผูกพัน" />
                    )}
                </motion.div>
            )}

            {state.activeTab === "compare" && (
                <motion.div
                    key="compare"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                >
                    {hasData ? (
                        <>
                            <CompareGroupChart />
                            <DemographicPieChart />
                        </>
                    ) : (
                        <EmptyState label="กรุณาโหลดข้อมูลก่อนเพื่อเปรียบเทียบ" />
                    )}
                </motion.div>
            )}

            {state.activeTab === "raw" && (
                <motion.div
                    key="raw"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                >
                    {hasData ? (
                        <RawDataTable />
                    ) : (
                        <EmptyState label="กรุณาโหลดข้อมูลก่อนเพื่อดูข้อมูลดิบ" />
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="glass-card p-12 text-center">
            <p className="text-[var(--color-text-secondary)]">{label}</p>
        </div>
    );
}

export default function HomePage() {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">
                {/* Header for mobile */}
                <div className="md:hidden flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-base font-bold">RTA Analysis</h1>
                        <p className="text-xs text-[var(--color-text-secondary)]">Engagement & Happiness</p>
                    </div>
                </div>

                <TabContent />
            </main>
            <MobileNav />
        </div>
    );
}
