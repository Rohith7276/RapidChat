import { pipeline } from "@xenova/transformers";

const DEFAULT_EMBEDDING_MODEL = process.env.RAG_EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2";

let embeddingPipelinePromise = null;

async function getEmbeddingPipeline() {
    if (!embeddingPipelinePromise) {
        // Load the embedding model once and reuse it for every later request.
        embeddingPipelinePromise = pipeline("feature-extraction", DEFAULT_EMBEDDING_MODEL);
    }

    return embeddingPipelinePromise;
}

export async function createEmbedding(text) {
    const embeddingPipeline = await getEmbeddingPipeline();
    // Convert text into a normalized vector so similarity search can compare meaning.
    const output = await embeddingPipeline(String(text || ""), {
        pooling: "mean",
        normalize: true,
    });

    return Array.from(output.data || output);
}

export async function createEmbeddings(textList = []) {
    const embeddings = [];

    for (const text of textList) {
        embeddings.push(await createEmbedding(text));
    }

    return embeddings;
}
