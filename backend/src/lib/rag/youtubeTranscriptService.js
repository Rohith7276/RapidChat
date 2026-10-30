import { Supadata } from "@supadata/js";
import { YoutubeTranscript } from "youtube-transcript";
import { chunkTranscriptSegments, normalizeTranscriptSegments } from "./transcript.js";

const supadata = new Supadata({
    apiKey: process.env.youtube,
});

export function extractYouTubeId(urlOrId) {
    if (!urlOrId || typeof urlOrId !== "string") return null;
    const trimmed = urlOrId.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

    try {
        const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
        if (parsed.hostname === "youtu.be") {
            const id = parsed.pathname.slice(1).split("?")[0].split("/")[0];
            if (id && id.length === 11) return id;
        }
        if (parsed.hostname.includes("youtube.com")) {
            const v = parsed.searchParams.get("v");
            if (v && v.length === 11) return v;
            const pathParts = parsed.pathname.split("/").filter(Boolean);
            if (["embed", "v", "live", "shorts"].includes(pathParts[0]) && pathParts[1]?.length === 11) {
                return pathParts[1];
            }
        }
    } catch {
        // Fall back to regex
    }

    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/);
    return match ? match[1] : null;
}

export function getCanonicalYouTubeUrl(urlOrId) {
    const videoId = extractYouTubeId(urlOrId);
    if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
    }
    const trimmed = String(urlOrId || "").trim();
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

async function waitForTranscriptResult(transcriptResult) {
    if (!transcriptResult?.jobId) {
        return transcriptResult;
    }

    for (let attempt = 0; attempt < 12; attempt += 1) {
        try {
            const jobResult = await supadata.transcript.getJobStatus(transcriptResult.jobId);
            if (jobResult?.status === "failed") {
                throw new Error(jobResult.error || "YouTube transcript generation failed");
            }
            if (jobResult?.status === "completed" || jobResult?.status === "done" || jobResult?.content || jobResult?.transcript || jobResult?.segments) {
                return jobResult;
            }
        } catch (pollErr) {
            console.warn("Poll job status error:", pollErr?.message);
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    return transcriptResult;
}

export function buildTranscriptPayload(rawTranscript) {
    const normalizedSegments = normalizeTranscriptSegments(rawTranscript);
    const transcriptChunks = chunkTranscriptSegments(normalizedSegments);
    const transcriptText = transcriptChunks.map((chunk) => chunk.text).join(" ");

    return {
        transcriptText,
        transcriptSegments: normalizedSegments,
        transcriptChunks,
    };
}

export async function fetchYouTubeTranscriptData(urlOrId) {
    const videoId = extractYouTubeId(urlOrId);
    const canonicalUrl = getCanonicalYouTubeUrl(urlOrId);

    let rawTranscript = null;
    let source = "none";

    // 1. Try SupaData using the canonical full URL
    if (process.env.youtube) {
        try {
            const transcriptResult = await supadata.transcript({
                url: canonicalUrl,
                text: false,
                mode: "auto",
            });
            const resolved = await waitForTranscriptResult(transcriptResult);
            if (resolved && (resolved.content?.length || resolved.transcript?.length || resolved.segments?.length)) {
                rawTranscript = resolved;
                source = "supadata";
            }
        } catch (supaErr) {
            console.warn("SupaData transcript fetch failed:", supaErr?.message || supaErr);
        }
    }

    // 2. Fallback to YoutubeTranscript using videoId
    if (!rawTranscript && videoId) {
        try {
            const ytResult = await YoutubeTranscript.fetchTranscript(videoId);
            if (Array.isArray(ytResult) && ytResult.length > 0) {
                rawTranscript = ytResult;
                source = "youtube-transcript";
            }
        } catch (ytErr) {
            console.warn("YoutubeTranscript fallback failed:", ytErr?.message || ytErr);
        }
    }

    // 3. Fallback to youtube-transcript-plus if available
    if (!rawTranscript && videoId) {
        try {
            const ytPlusModule = await import("youtube-transcript-plus");
            const YoutubeTranscriptPlus = ytPlusModule.YoutubeTranscript || ytPlusModule.default?.YoutubeTranscript;
            if (YoutubeTranscriptPlus?.fetchTranscript) {
                const plusResult = await YoutubeTranscriptPlus.fetchTranscript(videoId);
                if (Array.isArray(plusResult) && plusResult.length > 0) {
                    rawTranscript = plusResult;
                    source = "youtube-transcript-plus";
                }
            }
        } catch (plusErr) {
            // ignore
        }
    }

    if (rawTranscript) {
        const payload = buildTranscriptPayload(rawTranscript);
        return {
            ...payload,
            source,
            videoId,
            canonicalUrl,
        };
    }

    return {
        transcriptText: "",
        transcriptSegments: [],
        transcriptChunks: [],
        source: "failed",
        videoId,
        canonicalUrl,
    };
}

