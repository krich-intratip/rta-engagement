"use client";

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from "react";
import { SurveyResponse, AnalysisResult } from "@/types/survey";

export type DataSource = "file" | "google-sheet";
export type ActiveTab = "overview" | "factors" | "engagement" | "compare" | "raw" | "text" | "executive" | "cluster" | "correlation" | "actionplan" | "anomaly" | "surveybuilder" | "benchmark" | "about" | "factors2" | "engagement2";

export interface DemographicFilters {
    gender: string[];
    rank: string[];
    unit: string[];
    ageGroup: string[];
    maritalStatus: string[];
    education: string[];
    serviceYears: string[];
    income: string[];
    housing: string[];
    familyInArmy: string[];
    hasDependents: string[];
}

export const EMPTY_FILTERS: DemographicFilters = {
    gender: [], rank: [], unit: [], ageGroup: [], maritalStatus: [],
    education: [], serviceYears: [], income: [], housing: [],
    familyInArmy: [], hasDependents: [],
};

interface AppState {
    surveyData: SurveyResponse[];
    analysisResult: AnalysisResult | null;
    dataSource: DataSource;
    isLoading: boolean;
    error: string | null;
    activeTab: ActiveTab;
    fileName: string | null;
    filters: DemographicFilters;
}

type Action =
    | { type: "SET_DATA"; payload: { data: SurveyResponse[]; analysis: AnalysisResult; fileName?: string } }
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_ERROR"; payload: string | null }
    | { type: "SET_DATA_SOURCE"; payload: DataSource }
    | { type: "SET_TAB"; payload: ActiveTab }
    | { type: "CLEAR_DATA" }
    | { type: "SET_FILTERS"; payload: DemographicFilters }
    | { type: "RESET_FILTERS" };

const STORAGE_KEY = "rta-engagement-state-v2";

function loadSavedState(): Partial<AppState> {
    if (typeof window === "undefined") return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return {
            dataSource: parsed.dataSource ?? "google-sheet",
            activeTab: parsed.activeTab ?? "overview",
            filters: parsed.filters ?? EMPTY_FILTERS,
        };
    } catch {
        return {};
    }
}

const saved = loadSavedState();

const initialState: AppState = {
    surveyData: [],
    analysisResult: null,
    dataSource: saved.dataSource ?? "google-sheet",
    isLoading: false,
    error: null,
    activeTab: saved.activeTab ?? "overview",
    fileName: null,
    filters: saved.filters ?? EMPTY_FILTERS,
};

function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case "SET_DATA":
            return {
                ...state,
                surveyData: action.payload.data,
                analysisResult: action.payload.analysis,
                fileName: action.payload.fileName || null,
                isLoading: false,
                error: null,
                filters: EMPTY_FILTERS,
            };
        case "SET_LOADING":
            return { ...state, isLoading: action.payload, error: null };
        case "SET_ERROR":
            return { ...state, error: action.payload, isLoading: false };
        case "SET_DATA_SOURCE":
            return { ...state, dataSource: action.payload };
        case "SET_TAB":
            return { ...state, activeTab: action.payload };
        case "CLEAR_DATA":
            return { ...initialState, dataSource: state.dataSource, activeTab: state.activeTab, filters: EMPTY_FILTERS };
        case "SET_FILTERS":
            return { ...state, filters: action.payload };
        case "RESET_FILTERS":
            return { ...state, filters: EMPTY_FILTERS };
        default:
            return state;
    }
}

const AppContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
    filteredData: SurveyResponse[];
} | null>(null);

/** Apply demographic filters to raw survey data */
export function applyFilters(data: SurveyResponse[], filters: DemographicFilters): SurveyResponse[] {
    return data.filter((r) => {
        const d = r.demographics;
        if (filters.gender.length && !filters.gender.includes(d.gender)) return false;
        if (filters.rank.length && !filters.rank.includes(d.rank)) return false;
        if (filters.unit.length && !filters.unit.includes(d.unit)) return false;
        if (filters.ageGroup.length && !filters.ageGroup.includes(d.ageGroup)) return false;
        if (filters.maritalStatus.length && !filters.maritalStatus.includes(d.maritalStatus)) return false;
        if (filters.education.length && !filters.education.includes(d.education)) return false;
        if (filters.serviceYears.length && !filters.serviceYears.includes(d.serviceYears)) return false;
        if (filters.income.length && !filters.income.includes(d.income)) return false;
        if (filters.housing.length && !filters.housing.includes(d.housing)) return false;
        if (filters.familyInArmy.length && !filters.familyInArmy.includes(d.familyInArmy)) return false;
        if (filters.hasDependents.length && !filters.hasDependents.includes(d.hasDependents)) return false;
        return true;
    });
}

export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const filteredData = applyFilters(state.surveyData, state.filters);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                dataSource: state.dataSource,
                activeTab: state.activeTab,
                filters: state.filters,
            }));
        } catch { /* ignore */ }
    }, [state.dataSource, state.activeTab, state.filters]);

    return (
        <AppContext.Provider value={{ state, dispatch, filteredData }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppState() {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppState must be used within AppProvider");
    return context;
}
