// ─── Path Analysis Statistical Engine ────────────────────────────────────────
// OLS Multiple Regression + t-test p-values for PLS-PM (composite-based SEM)

export interface OLSResult {
    betas: number[];    // standardized coefficients
    r2: number;
    se: number[];
    tStats: number[];
    pValues: number[];
}

// ── Basic stats ───────────────────────────────────────────────────────────────

export function mean(arr: number[]): number {
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

export function std(arr: number[], m?: number): number {
    const mu = m ?? mean(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - mu) ** 2, 0) / arr.length);
}

export function zscore(arr: number[]): number[] {
    const mu = mean(arr);
    const sigma = std(arr, mu);
    return sigma === 0 ? arr.map(() => 0) : arr.map((v) => (v - mu) / sigma);
}

// ── Matrix utilities ──────────────────────────────────────────────────────────

function transpose(m: number[][]): number[][] {
    return m[0].map((_, i) => m.map((row) => row[i]));
}

function matMul(A: number[][], B: number[][]): number[][] {
    const rows = A.length, cols = B[0].length, inner = B.length;
    return Array.from({ length: rows }, (_, i) =>
        Array.from({ length: cols }, (_, j) =>
            Array.from({ length: inner }, (__, k) => A[i][k] * B[k][j]).reduce((a, b) => a + b, 0)
        )
    );
}

function matVecMul(A: number[][], v: number[]): number[] {
    return A.map((row) => row.reduce((s, a, j) => s + a * v[j], 0));
}

function invertMatrix(m: number[][]): number[][] | null {
    const n = m.length;
    const aug = m.map((row, i) => [
        ...row,
        ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
    ]);
    for (let col = 0; col < n; col++) {
        let pivot = -1;
        for (let row = col; row < n; row++) {
            if (Math.abs(aug[row][col]) > 1e-10) { pivot = row; break; }
        }
        if (pivot === -1) return null;
        [aug[col], aug[pivot]] = [aug[pivot], aug[col]];
        const div = aug[col][col];
        aug[col] = aug[col].map((v) => v / div);
        for (let row = 0; row < n; row++) {
            if (row !== col) {
                const f = aug[row][col];
                aug[row] = aug[row].map((v, j) => v - f * aug[col][j]);
            }
        }
    }
    return aug.map((row) => row.slice(n));
}

// ── p-value from t-distribution ───────────────────────────────────────────────

function normalCDF(z: number): number {
    const a = [0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429];
    const p = 0.3275911;
    const sign = z < 0 ? -1 : 1;
    const x = Math.abs(z) / Math.sqrt(2);
    const t = 1 / (1 + p * x);
    const y = 1 - ((((a[4] * t + a[3]) * t + a[2]) * t + a[1]) * t + a[0]) * t * Math.exp(-x * x);
    return 0.5 * (1 + sign * y);
}

export function tToP(t: number, df: number): number {
    if (df <= 0) return 1;
    // For large df use normal approximation
    if (df > 200) return Math.min(1, 2 * (1 - normalCDF(Math.abs(t))));
    // Cornish-Fisher approximation for t → z
    const z = Math.abs(t) * (1 - 1 / (4 * df) + Math.pow(t, 2) / (96 * df * df));
    return Math.min(1, Math.max(0, 2 * (1 - normalCDF(z))));
}

export function pToSig(p: number): string {
    if (p < 0.001) return "***";
    if (p < 0.01) return "**";
    if (p < 0.05) return "*";
    if (p < 0.1) return "†";
    return "ns";
}

export function pToColorClass(p: number): string {
    if (p < 0.001) return "text-emerald-600 dark:text-emerald-400";
    if (p < 0.01) return "text-blue-600 dark:text-blue-400";
    if (p < 0.05) return "text-yellow-600 dark:text-yellow-500";
    if (p < 0.1) return "text-orange-500 dark:text-orange-400";
    return "text-gray-400";
}

// ── OLS Multiple Regression (standardized) ────────────────────────────────────

export function olsRegression(Y: number[], Xs: number[][]): OLSResult {
    const n = Y.length;
    const k = Xs.length;
    const empty: OLSResult = {
        betas: Xs.map(() => 0), r2: 0,
        se: Xs.map(() => 0), tStats: Xs.map(() => 0), pValues: Xs.map(() => 1),
    };
    if (n < k + 3) return empty;

    const yZ = zscore(Y);
    const xZ = Xs.map(zscore);

    // Design matrix [1, x1, x2, ...]
    const X: number[][] = Array.from({ length: n }, (_, i) => [1, ...xZ.map((x) => x[i])]);
    const Xt = transpose(X);
    const XtX = matMul(Xt, X);
    const XtXinv = invertMatrix(XtX);
    if (!XtXinv) return empty;

    const XtY = matVecMul(Xt, yZ);
    const coeffs = matVecMul(XtXinv, XtY);

    const yHat = X.map((row) => row.reduce((s, v, j) => s + v * coeffs[j], 0));
    const residuals = yZ.map((v, i) => v - yHat[i]);
    const sse = residuals.reduce((s, r) => s + r * r, 0);
    const sst = yZ.reduce((s, v) => s + v * v, 0);
    const r2 = Math.max(0, 1 - sse / sst);
    const mse = sse / Math.max(1, n - k - 1);

    const se = XtXinv.map((row, i) => Math.sqrt(Math.abs(row[i] * mse)));
    const betas = coeffs.slice(1);
    const seC = se.slice(1);
    const tStats = betas.map((b, i) => (seC[i] > 0 ? b / seC[i] : 0));
    const pValues = tStats.map((t) => tToP(Math.abs(t), n - k - 1));

    return { betas, r2, se: seC, tStats, pValues };
}

// ── Indirect effects (mediation) ──────────────────────────────────────────────

export interface IndirectEffect {
    factorIdx: number;
    factorLabel: string;
    indirect: number;   // sum of (β_FE × β_ER) across all mediators
    total: number;      // same as indirect in full mediation model
    byMediator: number[];
}

export function computeIndirectEffects(
    eq1: OLSResult[],   // [mediator_i] → OLSResult with betas[factorIdx]
    eq2: OLSResult,     // mediators → outcome
    factorLabels: string[]
): IndirectEffect[] {
    return factorLabels.map((label, fi) => {
        const byMediator = eq1.map((eq, ei) => eq.betas[fi] * eq2.betas[ei]);
        const indirect = byMediator.reduce((a, b) => a + b, 0);
        return {
            factorIdx: fi,
            factorLabel: label,
            indirect: Math.round(indirect * 10000) / 10000,
            total: Math.round(indirect * 10000) / 10000,
            byMediator,
        };
    });
}
