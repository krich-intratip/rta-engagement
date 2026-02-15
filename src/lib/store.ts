"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { SurveyResponse, AnalysisResult } from "@/types/survey";

export type DataSource = "file" | "google-sheet";
export type ActiveTab = "overview" | "factors" | "engagement" | "compare" | "raw";

interface AppState {
    surveyData: SurveyResponse[];
    analysisResult: AnalysisResult | null;
    dataSource: DataSource;
    isLoading: boolean;
    error: string | null;
    activeTab: ActiveTab;
    fileName: string | null;
}

type Action =
    | { type: "SET_DATA"; payload: { data: SurveyResponse[]; analysis: AnalysisResult; fileName?: string } }
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_ERROR"; payload: string | null }
    | { type: "SET_DATA_SOURCE"; payload: DataSource }
    | { type: "SET_TAB"; payload: ActiveTab }
    | { type: "CLEAR_DATA" };

const initialState: AppState = {
    surveyData: [],
    analysisResult: null,
    dataSource: "google-sheet",
    isLoading: false,
    error: null,
    activeTab: "overview",
    fileName: null,
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
            return { ...initialState, dataSource: state.dataSource, activeTab: state.activeTab };
        default:
            return state;
    }
}

const AppContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    return (
        <AppContext.Provider value= {{ state, dispatch }
}>
    { children }
    </AppContext.Provider>
  );
}

export function useAppState() {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppState must be used within AppProvider");
    return context;
}
