import { buildTimestampedContext, buildTimestampedContextFromSegments, chunkTranscriptSegments, normalizeTranscriptSegments, selectTranscriptSegmentsAroundTimestamp } from "./transcript.js";
import { createEmbedding, createEmbeddings } from "./embeddingService.js";
import { extractTimestampQuery, formatSecondsToTimestamp } from "./timestamp.js";
import { deleteStreamKnowledgeBase, getStreamKnowledgeBase, saveStreamKnowledgeBase } from "./store.js";
import { chunkText } from "./chunkText.js";

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
    const normalizedChunks = Array.isArray(providedChunks) && providedChunks.length
        ? providedChunks
        : chunkTranscriptSegments(
            transcriptSegments.length ? transcriptSegments : normalizeTranscriptSegments(text ? { content: text } : null)
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
        transcriptSegments: transcriptSegments.length ? transcriptSegments : normalizedChunks.flatMap((chunk) => chunk.segments || []),
        sourceTextLength: String(text || "").length,
        chunkSize: indexedChunks[0]?.wordCount || 0,
    });
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

    const exactMatches = knowledgeBase.chunks.filter((chunk) => {
        const chunkStart = Number(chunk.start ?? 0);
        const chunkEnd = Number(chunk.end ?? chunkStart);
        return chunkStart <= targetSeconds && chunkEnd >= targetSeconds;
    });

    if (exactMatches.length) {
        return exactMatches.slice(0, Math.max(1, Number(topK || 1)));
    }

    return knowledgeBase.chunks
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
    const selectedSegments = selectTranscriptSegmentsAroundTimestamp(transcriptSegments, seconds, {
        maxWindowSeconds: 600,
    });

    if (selectedSegments.length) {
        const windowStart = Math.max(0, Number(seconds) - 300);
        const windowEnd = Number(seconds) + 300;
        return {
            segments: selectedSegments,
            context: [`Requested timestamp window: [${formatSecondsToTimestamp(windowStart)} - ${formatSecondsToTimestamp(windowEnd)}]`, buildTimestampedContextFromSegments(selectedSegments)].join("\n\n"),
            matchedTimestamp: selectedSegments.find((segment) => segment.start <= seconds && segment.end >= seconds)?.start ?? selectedSegments[0]?.start ?? null,
            matchedSeconds: selectedSegments.find((segment) => segment.start <= seconds && segment.end >= seconds)?.start ?? selectedSegments[0]?.start ?? null,
            windowStart,
            windowEnd,
        };
    }

    const chunks = retrieveChunksByTimestamp({ streamId, seconds, topK: 3 });
    const windowStart = Math.max(0, Number(seconds) - 300);
    const windowEnd = Number(seconds) + 300;
    return {
        segments: [],
        chunks,
        context: [`Requested timestamp window: [${formatSecondsToTimestamp(windowStart)} - ${formatSecondsToTimestamp(windowEnd)}]`, buildTimestampedContext(chunks)].join("\n\n"),
        matchedTimestamp: chunks[0]?.start ?? null,
        matchedSeconds: chunks[0]?.start ?? null,
        windowStart,
        windowEnd,
    };
}

export async function getStreamContextForQuestion({ streamId, question, topK = 4, textFallback = "", transcriptChunksFallback = [] }) {
    let knowledgeBase = getStreamKnowledgeBase(streamId);

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
        const timestampContext = retrieveTimestampContext({ streamId, seconds: timestampQuery.seconds });
        return {
            streamId,
            retrievalMode: "timestamp",
            timestamp: timestampQuery.timestamp,
            seconds: timestampQuery.seconds,
            chunks: timestampContext.segments.length ? timestampContext.segments : timestampContext.chunks || [],
            context: timestampContext.context,
            matchedTimestamp: timestampContext.matchedTimestamp != null ? formatSecondsToTimestamp(timestampContext.matchedTimestamp) : timestampQuery.timestamp,
            matchedSeconds: timestampContext.matchedSeconds ?? timestampQuery.seconds,
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
