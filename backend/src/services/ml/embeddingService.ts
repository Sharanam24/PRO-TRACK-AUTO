/**
 * Embedding Service — 384-dimensional sentence embeddings via all-MiniLM-L6-v2.
 * Requirements: 14.1–14.7, 19.5
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pipeline: any = null;
let _ready = false;

/**
 * Initialises the embedding model singleton.
 * Call once at server startup (non-blocking). (Requirement 14.1)
 */
export async function initEmbeddingModel(): Promise<void> {
    try {
        // Dynamic import to avoid hard crash when package is not installed
        const { pipeline } = await import('@xenova/transformers');
        _pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        _ready = true;
        console.log('[EmbeddingService] Model ready.');
    } catch (err) {
        console.error('[EmbeddingService] Model unavailable:', (err as Error).message);
        _ready = false;
    }
}

/** Returns true once the model has been successfully loaded. (Requirement 14.4) */
export function isReady(): boolean {
    return _ready;
}

/**
 * L2-normalises a vector in-place and returns it.
 */
function l2Normalize(v: number[]): number[] {
    const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
    if (norm === 0) return v;
    return v.map((x) => x / norm);
}

/**
 * Mean-pool the token embeddings produced by the pipeline.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function meanPool(output: any, inputLength: number): number[] {
    // output.data is a flat Float32Array of shape [1, seq_len, hidden_size]
    const hidden = 384;
    const result = new Array<number>(hidden).fill(0);
    for (let t = 0; t < inputLength; t++) {
        for (let h = 0; h < hidden; h++) {
            result[h] += output.data[t * hidden + h];
        }
    }
    return result.map((x) => x / inputLength);
}

/**
 * Embeds text into a 384-element float array.
 * Returns [] if the model is not ready. (Requirement 14.2)
 */
export async function embed(text: string): Promise<number[]> {
    if (!_ready || !_pipeline) return [];

    try {
        const output = await _pipeline(text, { pooling: 'mean', normalize: true });
        // If the pipeline already returns normalised mean-pooled output, use it directly
        if (output?.data) {
            const arr = Array.from(output.data as Float32Array) as number[];
            return l2Normalize(arr);
        }
        // Fallback: manual mean-pool + normalise
        const seqLen = output[0]?.length ?? 1;
        return l2Normalize(meanPool(output, seqLen));
    } catch (err) {
        console.error('[EmbeddingService] embed error:', err);
        return [];
    }
}

/**
 * Encodes a list of texts into a matrix of 384-element float arrays.
 * Returns [] for each text that fails. Never throws.
 */
export async function encodeBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => embed(t)));
}

/**
 * Cosine similarity between two vectors.
 * Returns 0 if either vector is empty. (Requirement 14.3)
 * Range: [-1, 1]. Symmetric and identity properties hold (Requirements 14.6, 14.7).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length === 0 || b.length === 0) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;
    const len = Math.min(a.length, b.length);

    for (let i = 0; i < len; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    if (denom === 0) return 0;
    return dot / denom;
}
