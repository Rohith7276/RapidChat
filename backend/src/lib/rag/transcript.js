import { formatSecondsToTimestamp } from "./timestamp.js";

const DEFAULT_MIN_SECONDS = Number(process.env.RAG_MIN_CHUNK_SECONDS || 20);
const DEFAULT_MAX_SECONDS = Number(process.env.RAG_MAX_CHUNK_SECONDS || 600);
const DEFAULT_MIN_WORDS = Number(process.env.RAG_MIN_CHUNK_WORDS || 100);
const DEFAULT_MAX_WORDS = Number(process.env.RAG_MAX_CHUNK_WORDS || 1200);
const DEFAULT_MAX_GAP_SECONDS = Number(process.env.RAG_MAX_SEGMENT_GAP_SECONDS || 6);
const DEFAULT_REBASE_OFFSET_THRESHOLD_SECONDS = Number(process.env.RAG_REBASE_OFFSET_THRESHOLD_SECONDS || 180);

function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
}

function readNumber(source, keys) {
    for (const key of keys) {
        const value = source?.[key];
        if (value === undefined || value === null || value === "") {
            continue;
        }

        const numericValue = Number(value);
        if (!Number.isNaN(numericValue)) {
            return numericValue;
        }
    }

    return null;
}

function normalizeTranscriptEntry(entry) {
    if (!entry) {
        return null;
    }

    const text = cleanText(
        entry.text ?? entry.content ?? entry.transcript ?? entry.caption ?? entry.value ?? entry.snippet
    );

    if (!text) {
        return null;
    }

    const start = readNumber(entry, ["start", "offset", "from", "begin", "startTime", "startSeconds", "start_time"]);
    const end = readNumber(entry, ["end", "to", "finish", "endTime", "endSeconds", "end_time"]);
    const duration = readNumber(entry, ["duration", "length", "span"]);

    return {
        text,
        start: start ?? 0,
        end: end ?? ((start ?? 0) + (duration ?? 0)),
        raw: entry,
    };
}

export function normalizeTranscriptSegments(rawTranscript) {
    const transcriptSource = rawTranscript?.content ?? rawTranscript?.transcript ?? rawTranscript?.segments ?? rawTranscript?.items ?? rawTranscript;
    const entries = Array.isArray(transcriptSource) ? transcriptSource : [];

    const normalizedSegments = entries
        .map(normalizeTranscriptEntry)
        .filter(Boolean)
        .map((segment, index) => ({
            ...segment,
            index,
        }));

    const numericStarts = normalizedSegments
        .map((segment) => Number(segment.start))
        .filter((start) => Number.isFinite(start) && start >= 0);

    if (!numericStarts.length) {
        return normalizedSegments;
    }

    const earliestStart = Math.min(...numericStarts);
    if (earliestStart < DEFAULT_REBASE_OFFSET_THRESHOLD_SECONDS) {
        return normalizedSegments;
    }

    // Some providers return a consistent leading offset; rebase so transcript start aligns near 00:00.
    return normalizedSegments.map((segment) => {
        const rebasedStart = Math.max(0, Number(segment.start || 0) - earliestStart);
        const rebasedEnd = Math.max(rebasedStart, Number(segment.end || rebasedStart) - earliestStart);

        return {
            ...segment,
            start: rebasedStart,
            end: rebasedEnd,
        };
    });
}

function finalizeChunk(chunkSegments, index) {
    if (!chunkSegments.length) {
        return null;
    }

    const text = chunkSegments.map((segment) => segment.text).join(" ");
    const start = chunkSegments[0].start ?? 0;
    const end = chunkSegments[chunkSegments.length - 1].end ?? start;
    const wordCount = cleanText(text).split(" ").filter(Boolean).length;

    return {
        id: index,
        index,
        text: cleanText(text),
        start,
        end,
        duration: Math.max(0, end - start),
        wordCount,
        segmentCount: chunkSegments.length,
        segments: chunkSegments,
    };
}

export function chunkTranscriptSegments(segments, options = {}) {
    const minSeconds = Math.max(1, Number(options.minSeconds || DEFAULT_MIN_SECONDS));
    const maxSeconds = Math.max(minSeconds, Number(options.maxSeconds || DEFAULT_MAX_SECONDS));
    const minWords = Math.max(1, Number(options.minWords || DEFAULT_MIN_WORDS));
    const maxWords = Math.max(minWords, Number(options.maxWords || DEFAULT_MAX_WORDS));
    const maxGapSeconds = Math.max(0, Number(options.maxGapSeconds || DEFAULT_MAX_GAP_SECONDS));

    const normalizedSegments = Array.isArray(segments) ? segments : [];
    const chunks = [];
    let currentSegments = [];

    const currentChunkStats = () => {
        if (!currentSegments.length) {
            return { duration: 0, wordCount: 0 };
        }

        const start = currentSegments[0].start ?? 0;
        const end = currentSegments[currentSegments.length - 1].end ?? start;
        const duration = Math.max(0, end - start);
        const wordCount = cleanText(currentSegments.map((segment) => segment.text).join(" ")).split(" ").filter(Boolean).length;

        return { duration, wordCount };
    };

    const flushCurrentChunk = () => {
        const chunk = finalizeChunk(currentSegments, chunks.length);
        if (chunk) {
            chunks.push(chunk);
        }
        currentSegments = [];
    };

    for (const segment of normalizedSegments) {
        if (!segment?.text) {
            continue;
        }

        if (!currentSegments.length) {
            currentSegments.push(segment);
            continue;
        }

        const previousSegment = currentSegments[currentSegments.length - 1];
        const gap = segment.start != null && previousSegment.end != null ? segment.start - previousSegment.end : 0;
        const stats = currentChunkStats();

        const shouldStartNewChunk =
            (gap > maxGapSeconds && (stats.duration >= minSeconds || stats.wordCount >= minWords)) ||
            stats.duration >= maxSeconds ||
            stats.wordCount >= maxWords;

        if (shouldStartNewChunk) {
            flushCurrentChunk();
        }

        currentSegments.push(segment);
    }

    flushCurrentChunk();

    return chunks;
}

export function buildTimestampedContext(chunks = []) {
    return chunks
        .map((chunk, index) => {
            const hasTiming = Number.isFinite(chunk.start) || Number.isFinite(chunk.end);

            if (!hasTiming) {
                return `Chunk ${index + 1}\n${chunk.text}`;
            }

            const start = chunk.start ?? 0;
            const end = chunk.end ?? start;
            return `[${formatSecondsToTimestamp(start)} - ${formatSecondsToTimestamp(end)}]\n${chunk.text}`;
        })
        .join("\n\n");
}

export function selectTranscriptSegmentsAroundTimestamp(segments = [], seconds, options = {}) {
    const targetSeconds = Number(seconds);
    if (Number.isNaN(targetSeconds)) {
        return [];
    }

    const maxWindowSeconds = Math.max(5, Number(options.maxWindowSeconds || 600));
    const normalizedSegments = Array.isArray(segments)
        ? segments
            .filter((segment) => segment && segment.text)
            .map((segment, index) => ({
                ...segment,
                index: Number.isFinite(segment.index) ? segment.index : index,
                start: Number.isFinite(Number(segment.start)) ? Number(segment.start) : 0,
                end: Number.isFinite(Number(segment.end)) ? Number(segment.end) : Number(segment.start) || 0,
            }))
            .sort((left, right) => left.start - right.start)
        : [];

    if (!normalizedSegments.length) {
        return [];
    }

    const halfWindow = Math.floor(maxWindowSeconds / 2);
    const windowStart = Math.max(0, targetSeconds - halfWindow);
    const windowEnd = targetSeconds + halfWindow;

    const selectedSegments = normalizedSegments.filter((segment) => segment.end >= windowStart && segment.start <= windowEnd);

    if (selectedSegments.length) {
        return selectedSegments;
    }

    const nearestIndex = normalizedSegments.reduce((bestIndex, segment, index) => {
        const bestSegment = normalizedSegments[bestIndex];
        const currentDistance = Math.min(Math.abs(segment.start - targetSeconds), Math.abs(segment.end - targetSeconds));
        const bestDistance = Math.min(Math.abs(bestSegment.start - targetSeconds), Math.abs(bestSegment.end - targetSeconds));
        return currentDistance < bestDistance ? index : bestIndex;
    }, 0);

    const nearestSegment = normalizedSegments[nearestIndex];
    return nearestSegment ? [nearestSegment] : [];
}

export function buildTimestampedContextFromSegments(segments = []) {
    return segments
        .map((segment) => {
            const start = Number.isFinite(Number(segment.start)) ? Number(segment.start) : 0;
            const end = Number.isFinite(Number(segment.end)) ? Number(segment.end) : start;
            return `[${formatSecondsToTimestamp(start)} - ${formatSecondsToTimestamp(end)}]\n${segment.text}`;
        })
        .join("\n\n");
}
