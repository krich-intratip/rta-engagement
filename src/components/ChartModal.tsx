"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2 } from "lucide-react";
import { useState, ReactNode } from "react";

interface ChartModalProps {
    children: ReactNode;
    title: string;
}

export function ChartExpandButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="p-1.5 rounded-lg text-[var(--color-text-light)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]/20 transition-all"
            title="ขยายกราฟ"
        >
            <Maximize2 className="w-4 h-4" />
        </button>
    );
}

export default function ChartModal({ children, title }: ChartModalProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <ChartExpandButton onClick={() => setOpen(true)} />
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
                        onClick={() => setOpen(false)}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-[95vw] max-h-[90vh] overflow-auto bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)]"
                        >
                            {/* Header */}
                            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                                <h3 className="text-base font-bold text-[var(--color-text)]">{title}</h3>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {children}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
