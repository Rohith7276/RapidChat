import { buildTimestampedContext, buildTimestampedContextFromSegments, chunkTranscriptSegments, normalizeTranscriptSegments } from "./transcript.js";
import { createEmbedding, createEmbeddings } from "./embeddingService.js";
import { extractTimestampQuery, formatSecondsToTimestamp } from "./timestamp.js";
import { deleteStreamKnowledgeBase, getStreamKnowledgeBase, saveStreamKnowledgeBase } from "./store.js";
import { chunkText } from "./chunkText.js";

const REBASE_OFFSET_THRESHOLD_SECONDS = Number(process.env.RAG_REBASE_OFFSET_THRESHOLD_SECONDS || 180);

function hasLikelyLeadingOffset(segments = []) {
    const earliestStart = (Array.isArray(segments) ? segments : [])
        .map((segment) => Number(segment?.start))
        .filter((start) => Number.isFinite(start) && start >= 0)
        .reduce((minStart, start) => Math.min(minStart, start), Number.POSITIVE_INFINITY);

    return Number.isFinite(earliestStart) && earliestStart >= REBASE_OFFSET_THRESHOLD_SECONDS;
}

export function cosineSimilarity(leftVector, rightVector) {
    // Cosine similarity measures how closely two vectors point in the same direction.
    const length = Math.min(leftVector.length, rightVector.length);
    let dotProduct = 0;
    let leftMagnitude = 0;
    let rightMagnitude = 0;

    for (let index = 0; index < length; index += 1) {
        const leftValue = Number(leftVector[index] || 0);
        const rightValue = Number(rightVector[index] || 0);

        dotProduct += leftValue * rightValue;
        leftMagnitude += leftValue * leftValue;
        rightMagnitude += rightValue * rightValue;
    }

    if (!leftMagnitude || !rightMagnitude) {
        return 0;
    }

    return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

export async function indexStreamKnowledgeBase({ streamId, text, transcriptSegments = [], chunks: providedChunks = [], metadata = {} }) {
    const normalizedTranscriptSegments = normalizeTranscriptSegments(transcriptSegments);

    const normalizedChunks = Array.isArray(providedChunks) && providedChunks.length
        ? providedChunks
        : chunkTranscriptSegments(
            normalizedTranscriptSegments.length ? normalizedTranscriptSegments : normalizeTranscriptSegments(text ? { content: text } : null)
        );

    const fallbackChunks = !normalizedChunks.length && text
        ? chunkText(text).map((chunk) => ({
            ...chunk,
            start: null,
            end: null,
            duration: 0,
            segmentCount: 1,
            segments: [],
        }))
        : normalizedChunks;

    if (!fallbackChunks.length) {
        throw new Error("No transcript chunks could be generated from the source content.");
    }

    const embeddings = await createEmbeddings(fallbackChunks.map((chunk) => chunk.text));

    const indexedChunks = fallbackChunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index],
    }));

    return saveStreamKnowledgeBase(streamId, {
        metadata,
        chunks: indexedChunks,
        transcriptSegments: normalizedTranscriptSegments.length ? normalizedTranscriptSegments : normalizedChunks.flatMap((chunk) => chunk.segments || []),
        sourceTextLength: String(text || "").length,
        chunkSize: indexedChunks[0]?.wordCount || 0,
    });
}

function normalizeTimestampSegments(transcriptSegments = []) {
    const readSegmentNumber = (segment, keys = []) => {
        for (const key of keys) {
            const rawValue = segment?.[key];
            if (rawValue === undefined || rawValue === null || rawValue === "") {
                continue;
            }

            const numericValue = Number(rawValue);
            if (Number.isFinite(numericValue)) {
                return numericValue;
            }
        }

        return null;
    };

    return (Array.isArray(transcriptSegments) ? transcriptSegments : [])
        .filter((segment) => segment && segment.text)
        .map((segment, index) => {
            const start = readSegmentNumber(segment, ["start", "offset", "from", "begin", "startTime", "startSeconds", "start_time"]);
            const end = readSegmentNumber(segment, ["end", "to", "finish", "endTime", "endSeconds", "end_time"]);
            const duration = readSegmentNumber(segment, ["duration", "length", "span"]);
            const normalizedStart = start ?? 0;
            const normalizedEnd = end ?? ((start ?? 0) + (duration ?? 0));

            return {
                ...segment,
                index: Number.isFinite(segment.index) ? segment.index : index,
                start: normalizedStart,
                end: normalizedEnd,
            };
        })
        .sort((leftSegment, rightSegment) => leftSegment.start - rightSegment.start);
}

function buildTimestampMetadataContext(transcriptSegments, seconds, options = {}) {
    const targetSeconds = Number(seconds);
    if (Number.isNaN(targetSeconds)) {
        return { segments: [], context: "" };
    }

    const normalizedSegments = normalizeTimestampSegments(transcriptSegments);
    if (!normalizedSegments.length) {
        return { segments: [], context: "" };
    }

    const neighborCount = Math.max(0, Number(options.neighborCount ?? 1));
    const exactIndex = normalizedSegments.findIndex((segment) => segment.start <= targetSeconds && segment.end >= targetSeconds);

    const matchedIndex = exactIndex >= 0
        ? exactIndex
        : normalizedSegments.reduce((bestIndex, segment, index) => {
            const bestSegment = normalizedSegments[bestIndex];
            const currentDistance = Math.min(Math.abs(segment.start - targetSeconds), Math.abs(segment.end - targetSeconds));
            const bestDistance = Math.min(Math.abs(bestSegment.start - targetSeconds), Math.abs(bestSegment.end - targetSeconds));

            return currentDistance < bestDistance ? index : bestIndex;
        }, 0);

    const windowStartIndex = Math.max(0, matchedIndex - neighborCount);
    const windowEndIndex = Math.min(normalizedSegments.length, matchedIndex + neighborCount + 1);
    const selectedSegments = normalizedSegments.slice(windowStartIndex, windowEndIndex);

    if (!selectedSegments.length) {
        return { segments: [], context: "" };
    }

    const matchedSegment = normalizedSegments[matchedIndex];
    const windowStart = selectedSegments[0].start ?? 0;
    const windowEnd = selectedSegments[selectedSegments.length - 1].end ?? windowStart;

    return {
        segments: selectedSegments,
        context: [
            `Requested timestamp metadata window: [${formatSecondsToTimestamp(windowStart)} - ${formatSecondsToTimestamp(windowEnd)}]`,
            buildTimestampedContextFromSegments(selectedSegments),
        ].join("\n\n"),
        matchedTimestamp: matchedSegment?.start ?? selectedSegments[0]?.start ?? null,
        matchedSeconds: matchedSegment?.start ?? selectedSegments[0]?.start ?? null,
        windowStart,
        windowEnd,
        retrievalSource: "metadata",
    };
}

export async function retrieveRelevantChunks({ streamId, question, topK = 4 }) {
    const knowledgeBase = getStreamKnowledgeBase(streamId);

    if (!knowledgeBase?.chunks?.length) {
        return [];
    }

    const questionEmbedding = await createEmbedding(question);

    // Score every chunk against the question and keep only the top matches.
    return knowledgeBase.chunks
        .map((chunk) => ({
            ...chunk,
            score: cosineSimilarity(questionEmbedding, chunk.embedding),
        }))
        .sort((leftChunk, rightChunk) => rightChunk.score - leftChunk.score)
        .slice(0, Math.max(1, Number(topK || 4)));
}

export function retrieveChunksByTimestamp({ streamId, seconds, topK = 3 }) {
    const knowledgeBase = getStreamKnowledgeBase(streamId);

    if (!knowledgeBase?.chunks?.length) {
        return [];
    }

    const targetSeconds = Number(seconds);
    if (Number.isNaN(targetSeconds)) {
        return [];
    }

    const timedChunks = knowledgeBase.chunks
        .map((chunk) => {
            const hasStart = chunk?.start !== undefined && chunk?.start !== null && chunk?.start !== "";
            const hasEnd = chunk?.end !== undefined && chunk?.end !== null && chunk?.end !== "";
            const parsedStart = hasStart ? Number(chunk.start) : Number.NaN;
            const parsedEnd = hasEnd ? Number(chunk.end) : Number.NaN;

            if (!Number.isFinite(parsedStart) && !Number.isFinite(parsedEnd)) {
                return null;
            }

            const normalizedStart = Number.isFinite(parsedStart) ? parsedStart : parsedEnd;
            const normalizedEnd = Number.isFinite(parsedEnd) ? parsedEnd : normalizedStart;

            return {
                ...chunk,
                start: normalizedStart,
                end: normalizedEnd,
            };
        })
        .filter(Boolean);

    if (!timedChunks.length) {
        return [];
    }

    const exactMatches = timedChunks.filter((chunk) => {
        const chunkStart = Number(chunk.start ?? 0);
        const chunkEnd = Number(chunk.end ?? chunkStart);
        return chunkStart <= targetSeconds && chunkEnd >= targetSeconds;
    });

    if (exactMatches.length) {
        return exactMatches.slice(0, Math.max(1, Number(topK || 1)));
    }

    return timedChunks
        .map((chunk) => ({
            ...chunk,
            distance: Math.min(
                Math.abs(Number(chunk.start ?? 0) - targetSeconds),
                Math.abs(Number(chunk.end ?? 0) - targetSeconds)
            ),
        }))
        .sort((leftChunk, rightChunk) => leftChunk.distance - rightChunk.distance)
        .slice(0, Math.max(1, Number(topK || 1)));
}

export function retrieveTimestampContext({ streamId, seconds }) {
    const knowledgeBase = getStreamKnowledgeBase(streamId);

    if (!knowledgeBase) {
        return { segments: [], context: "" };
    }

    const transcriptSegments = Array.isArray(knowledgeBase.transcriptSegments) ? knowledgeBase.transcriptSegments : [];



    // Support a range query when seconds is an object with start/end
    let startSeconds = null;
    let endSeconds = null;
    if (seconds && typeof seconds === "object") {
        startSeconds = Number(seconds.secondsStart ?? seconds.start ?? seconds.startSeconds ?? null);
        endSeconds = Number(seconds.secondsEnd ?? seconds.end ?? seconds.endSeconds ?? null);
        if (Number.isNaN(startSeconds)) startSeconds = null;
        if (Number.isNaN(endSeconds)) endSeconds = null;
    } else {
        startSeconds = Number(seconds);
        endSeconds = Number(seconds);
    }

    if (startSeconds == null) {
        return { segments: [], context: "" };
    }

    // If it's a range, select overlapping segments
    if (endSeconds != null && endSeconds !== startSeconds) {
        const selectedSegments = (Array.isArray(transcriptSegments) ? transcriptSegments : []).filter((segment) => {
            const segStart = Number(segment.start ?? 0);
            const segEnd = Number(segment.end ?? segStart);
            return segEnd >= startSeconds && segStart <= endSeconds;
        });

        if (selectedSegments.length) {
            const windowStart = Math.max(0, startSeconds - 5);
            const windowEnd = endSeconds + 5;
            return {
                segments: selectedSegments,
                context: [`Requested timestamp window: [${formatSecondsToTimestamp(windowStart)} - ${formatSecondsToTimestamp(windowEnd)}]`, buildTimestampedContextFromSegments(selectedSegments)].join("\n\n"),
                matchedTimestamp: selectedSegments[0]?.start ?? null,
                matchedSeconds: selectedSegments[0]?.start ?? null,
                windowStart,
                windowEnd,
                retrievalSource: "metadata-range",
            };
        }

        return {
            segments: [],
            chunks: [],
            context: "",
            matchedTimestamp: null,
            matchedSeconds: null,
            windowStart: startSeconds,
            windowEnd: endSeconds,
            retrievalSource: "unavailable",
        };
    }

    // Single-second behavior remains: find segments around the second
    const metadataContext = buildTimestampMetadataContext(transcriptSegments, startSeconds, {
        neighborCount: 1,
    });

    if (metadataContext.segments.length) {
        return metadataContext;
    }

    const chunks = retrieveChunksByTimestamp({ streamId, seconds: startSeconds, topK: 3 });
    if (!chunks.length) {
        return {
            segments: [],
            chunks: [],
            context: "",
            matchedTimestamp: null,
            matchedSeconds: null,
            windowStart: startSeconds,
            windowEnd: startSeconds,
            retrievalSource: "unavailable",
        };
    }

    const windowStart = Math.max(0, startSeconds - 300);
    const windowEnd = startSeconds + 300;
    return {
        segments: [],
        chunks,
        context: [`Requested timestamp chunk window: [${formatSecondsToTimestamp(windowStart)} - ${formatSecondsToTimestamp(windowEnd)}]`, buildTimestampedContext(chunks)].join("\n\n"),
        matchedTimestamp: chunks[0]?.start ?? null,
        matchedSeconds: chunks[0]?.start ?? null,
        windowStart,
        windowEnd,
        retrievalSource: "chunk",
    };
}

export async function getStreamContextForQuestion({ streamId, question, topK = 4, textFallback = "", transcriptChunksFallback = [], transcriptSegmentsFallback = [] }) {
    let knowledgeBase = getStreamKnowledgeBase(streamId);

    if (knowledgeBase?.chunks?.length && hasLikelyLeadingOffset(knowledgeBase?.transcriptSegments || [])) {
        knowledgeBase = await indexStreamKnowledgeBase({
            streamId,
            text: textFallback,
            transcriptSegments: transcriptSegmentsFallback.length ? transcriptSegmentsFallback : knowledgeBase.transcriptSegments,
            chunks: transcriptChunksFallback.length ? transcriptChunksFallback : knowledgeBase.chunks,
            metadata: {
                ...(knowledgeBase.metadata || {}),
                source: "rehydrated-rebased-transcript-segments",
            },
        });
    }

    if (knowledgeBase?.chunks?.length && (!knowledgeBase?.transcriptSegments?.length) && transcriptSegmentsFallback.length) {
        knowledgeBase = await indexStreamKnowledgeBase({
            streamId,
            text: textFallback,
            transcriptSegments: transcriptSegmentsFallback,
            chunks: transcriptChunksFallback,
            metadata: {
                ...(knowledgeBase.metadata || {}),
                source: "rehydrated-with-transcript-segments",
            },
        });
    }

    if (!knowledgeBase?.chunks?.length && transcriptSegmentsFallback.length) {
        knowledgeBase = await indexStreamKnowledgeBase({
            streamId,
            transcriptSegments: transcriptSegmentsFallback,
            metadata: { source: "persisted-transcript-segments" },
        });
    }

    if (!knowledgeBase?.chunks?.length && transcriptChunksFallback.length) {
        knowledgeBase = await indexStreamKnowledgeBase({
            streamId,
            chunks: transcriptChunksFallback,
            metadata: { source: "persisted-transcript-chunks" },
        });
    }

    if (!knowledgeBase?.chunks?.length && textFallback) {
        knowledgeBase = await indexStreamKnowledgeBase({
            streamId,
            text: textFallback,
            metadata: { source: "fallback" },
        });
    }

    if (!knowledgeBase?.chunks?.length) {
        return {
            streamId,
            chunks: [],
        };
    }

    const timestampQuery = extractTimestampQuery(question);
    if (timestampQuery) {
        // Build seconds param for single or range queries
        let secondsParam = null;
        let responseSeconds = null;
        if (timestampQuery.secondsStart != null && timestampQuery.secondsEnd != null) {
            secondsParam = { secondsStart: timestampQuery.secondsStart, secondsEnd: timestampQuery.secondsEnd };
            responseSeconds = { start: timestampQuery.secondsStart, end: timestampQuery.secondsEnd };
        } else {
            secondsParam = timestampQuery.seconds ?? null;
            responseSeconds = timestampQuery.seconds ?? null;
        }

        const timestampContext = retrieveTimestampContext({ streamId, seconds: secondsParam });

        if (!timestampContext.context) {
            return {
                streamId,
                retrievalMode: "timestamp",
                retrievalSource: "unavailable",
                timestamp: timestampQuery.timestamp,
                seconds: responseSeconds,
                chunks: [],
                context: "",
                matchedTimestamp: null,
                matchedSeconds: null,
            };
        }

        return {
            streamId,
            retrievalMode: "timestamp",
            retrievalSource: timestampContext.retrievalSource || "metadata",
            timestamp: timestampQuery.timestamp,
            seconds: responseSeconds,
            chunks: timestampContext.segments.length ? timestampContext.segments : timestampContext.chunks || [],
            context: timestampContext.context,
            matchedTimestamp: timestampContext.matchedTimestamp != null ? formatSecondsToTimestamp(timestampContext.matchedTimestamp) : timestampQuery.timestamp,
            matchedSeconds: timestampContext.matchedSeconds ?? responseSeconds,
        };
    }

    const chunks = await retrieveRelevantChunks({ streamId, question, topK });
    return {
        streamId,
        retrievalMode: "semantic",
        chunks,
        context: buildTimestampedContext(chunks),
        primaryTimestamp: chunks[0]?.start != null ? formatSecondsToTimestamp(chunks[0].start) : null,
        primarySeconds: chunks[0]?.start ?? null,
    };
}

export function clearStreamContext(streamId) {
    return deleteStreamKnowledgeBase(streamId);
}
