const streamKnowledgeBase = new Map();

export function saveStreamKnowledgeBase(streamId, payload) {
    streamKnowledgeBase.set(String(streamId), {
        ...payload,
        streamId: String(streamId),
        updatedAt: new Date().toISOString(),
    });

    return streamKnowledgeBase.get(String(streamId));
}

export function getStreamKnowledgeBase(streamId) {
    return streamKnowledgeBase.get(String(streamId)) || null;
}

export function deleteStreamKnowledgeBase(streamId) {
    return streamKnowledgeBase.delete(String(streamId));
}

export function hasStreamKnowledgeBase(streamId) {
    return streamKnowledgeBase.has(String(streamId));
}
