"use client";

import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import HeroSection from "@/components/HeroSection";
import DataSourceSwitcher from "@/components/DataSourceSwitcher";
import InsightsPanel from "@/components/InsightsPanel";
import RawDataTable from "@/components/RawDataTable";
import FilterPanel from "@/components/FilterPanel";
import CrossTabulation from "@/components/CrossTabulation";
import StatisticalSignificance from "@/components/StatisticalSignificance";
import TextAnalysis from "@/components/TextAnalysis";
import ExecutiveSummary from "@/components/ExecutiveSummary";
import FactorBarChart from "@/components/charts/FactorBarChart";
import EngagementRadarChart from "@/components/charts/EngagementRadarChart";
import CorrelationHeatmap from "@/components/charts/CorrelationHeatmap";
import DemographicPieChart from "@/components/charts/DemographicPieChart";
import CompareGroupChart from "@/components/charts/CompareGroupChart";
import DistributionChart from "@/components/charts/DistributionChart";
import FactorDemographicHeatmap from "@/components/charts/FactorDemographicHeatmap";
import AboutPage from "@/components/AboutPage";
import ExportButton from "@/components/ExportButton";
import { useAppState } from "@/lib/store";
import Image from "next/image";

const TAB_NAMES: Record<string, string> = {
    overview: "ภาพรวม",
    factors: "ปัจจัย",
    engagement: "ความผูกพัน",
    compare: "เปรียบเทียบ",
    raw: "ข้อมูลดิบ",
    text: "วิเคราะห์ข้อความ",
    executive: "สรุปผู้บริหาร",
    about: "เกี่ยวกับ",
};

function TabHeader({ tabKey }: { tabKey: string }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--color-text)]">{TAB_NAMES[tabKey]}</h2>
            {tabKey !== "about" && (
                <ExportButton tabName={TAB_NAMES[tabKey]} contentId={`tab-content-${tabKey}`} />
            )}
        </div>
    );
}

function TabContent() {
    const { state } = useAppState();
    const hasData = state.analysisResult && state.analysisResult.totalResponses > 0;

    return (
        <AnimatePresence mode="wait">
            {state.activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <TabHeader tabKey="overview" />
                    <div id="tab-content-overview" className="space-y-5">
                        <HeroSection />
                        <DataSourceSwitcher />
                        {hasData && (
                            <>
                                <FilterPanel />
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    <FactorBarChart />
                                    <EngagementRadarChart />
                                </div>
                                <InsightsPanel />
                                <DemographicPieChart />
                            </>
                        )}
                    </div>
                </motion.div>
            )}

            {state.activeTab === "factors" && (
                <motion.div key="factors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <TabHeader tabKey="factors" />
                    <div id="tab-content-factors" className="space-y-5">
                        {hasData ? (
                            <>
                                <FilterPanel />
                                <FactorBarChart />
                                <DistributionChart />
                                <FactorDemographicHeatmap />
                            </>
                        ) : (
                            <EmptyState label="กรุณาโหลดข้อมูลก่อนเพื่อดูการวิเคราะห์ปัจจัย" />
                        )}
                    </div>
                </motion.div>
            )}

            {state.activeTab === "engagement" && (
                <motion.div key="engagement" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <TabHeader tabKey="engagement" />
                    <div id="tab-content-engagement" className="space-y-5">
                        {hasData ? (
                            <>
                                <FilterPanel />
                                <EngagementRadarChart />
                                <CorrelationHeatmap />
                                <StatisticalSignificance />
                                <InsightsPanel />
                            </>
                        ) : (
                            <EmptyState label="กรุณาโหลดข้อมูลก่อนเพื่อดูการวิเคราะห์ความผูกพัน" />
                        )}
                    </div>
                </motion.div>
            )}

            {state.activeTab === "compare" && (
                <motion.div key="compare" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <TabHeader tabKey="compare" />
                    <div id="tab-content-compare" className="space-y-5">
                        {hasData ? (
                            <>
                                <FilterPanel />
                                <CompareGroupChart />
                                <DemographicPieChart />
                                <CrossTabulation />
                                <StatisticalSignificance />
                            </>
                        ) : (
                            <EmptyState label="กรุณาโหลดข้อมูลก่อนเพื่อเปรียบเทียบ" />
                        )}
                    </div>
                </motion.div>
            )}

            {state.activeTab === "raw" && (
                <motion.div key="raw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <TabHeader tabKey="raw" />
                    <div id="tab-content-raw" className="space-y-5">
                        {hasData ? (
                            <>
                                <FilterPanel />
                                <RawDataTable />
                            </>
                        ) : (
                            <EmptyState label="กรุณาโหลดข้อมูลก่อนเพื่อดูข้อมูลดิบ" />
                        )}
                    </div>
                </motion.div>
            )}

            {state.activeTab === "text" && (
                <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <TabHeader tabKey="text" />
                    <div id="tab-content-text" className="space-y-5">
                        {hasData ? (
                            <>
                                <FilterPanel />
                                <TextAnalysis />
                            </>
                        ) : (
                            <EmptyState label="กรุณาโหลดข้อมูลก่อนเพื่อวิเคราะห์ข้อความ" />
                        )}
                    </div>
                </motion.div>
            )}

            {state.activeTab === "executive" && (
                <motion.div key="executive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <TabHeader tabKey="executive" />
                    <div id="tab-content-executive" className="space-y-5">
                        {hasData ? (
                            <>
                                <FilterPanel />
                                <ExecutiveSummary />
                            </>
                        ) : (
                            <EmptyState label="กรุณาโหลดข้อมูลก่อนเพื่อดูสรุปผู้บริหาร" />
                        )}
                    </div>
                </motion.div>
            )}

            {state.activeTab === "about" && (
                <motion.div key="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <AboutPage />
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
                    <Image
                        src="/RTA.png"
                        alt="RTA Logo"
                        width={36}
                        height={36}
                        className="rounded-xl object-contain"
                    />
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
