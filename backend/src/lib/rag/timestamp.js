const TIMESTAMP_PATTERN = /(?<!\d)(?:(?<hours>\d{1,2}):)?(?<minutes>[0-5]?\d):(?<seconds>[0-5]\d)(?!\d)/g;

export function parseTimestampToSeconds(timestamp) {
    const value = String(timestamp || "").trim();
    if (!value) {
        return null;
    }

    const parts = value.split(":").map((part) => Number(part));
    if (parts.some((part) => Number.isNaN(part))) {
        return null;
    }

    if (parts.length === 3) {
        const [hours, minutes, seconds] = parts;
        return (hours * 3600) + (minutes * 60) + seconds;
    }

    if (parts.length === 2) {
        const [minutes, seconds] = parts;
        return (minutes * 60) + seconds;
    }

    return null;
}

export function formatSecondsToTimestamp(totalSeconds) {
    const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    const paddedMinutes = String(minutes).padStart(2, "0");
    const paddedSeconds = String(seconds).padStart(2, "0");

    if (!hours) {
        return `${paddedMinutes}:${paddedSeconds}`;
    }

    return `${String(hours).padStart(2, "0")}:${paddedMinutes}:${paddedSeconds}`;
}

export function findTimestampMatches(text) {
    const matches = [];
    const input = String(text || "");

    for (const match of input.matchAll(TIMESTAMP_PATTERN)) {
        const timestamp = match[0];
        const seconds = parseTimestampToSeconds(timestamp);

        if (seconds == null) {
            continue;
        }

        matches.push({
            timestamp,
            seconds,
            index: match.index ?? 0,
        });
    }

    return matches;
}

export function extractTimestampQuery(text) {
    const matches = findTimestampMatches(text);

    if (!matches.length) {
        return null;
    }

    return matches[0];
}

export function isTimestampQuestion(text) {
    return Boolean(extractTimestampQuery(text));
}
