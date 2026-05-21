const DEFAULT_CHUNK_SIZE = Number(process.env.RAG_CHUNK_SIZE || 180);
const DEFAULT_CHUNK_OVERLAP = Number(process.env.RAG_CHUNK_OVERLAP || 40);

export function chunkText(text, options = {}) {
    const chunkSize = Math.max(1, Number(options.chunkSize || DEFAULT_CHUNK_SIZE));
    const chunkOverlap = Math.max(0, Number(options.chunkOverlap || DEFAULT_CHUNK_OVERLAP));
    const stepSize = Math.max(1, chunkSize - chunkOverlap);

    const normalizedText = String(text || "")
        .replace(/\s+/g, " ")
        .trim();

    if (!normalizedText) {
        return [];
    }

    const words = normalizedText.split(" ");
    const chunks = [];

    // Break the document into overlapping word windows so nearby facts stay together.
    for (let start = 0, index = 0; start < words.length; start += stepSize, index += 1) {
        const chunkWords = words.slice(start, start + chunkSize);

        if (!chunkWords.length) {
            continue;
        }

        chunks.push({
            id: index,
            text: chunkWords.join(" "),
            index,
            wordCount: chunkWords.length,
        });
    }

    return chunks;
}
