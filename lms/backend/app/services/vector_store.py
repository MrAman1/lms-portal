"""
Local vector search pipeline. Uses ChromaDB (persisted on disk) with
sentence-transformers embeddings. One Chroma "collection" per chapter keeps
retrieval strictly scoped to that chapter's content, which is what makes the
RAG chatbot's "answer only from this chapter" guarantee enforceable.
"""
import re
from typing import List, Dict
import chromadb
from chromadb.utils import embedding_functions
from app.core.config import settings

_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
_embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name=settings.EMBEDDING_MODEL
)


def _collection_name(chapter_id: str) -> str:
    return f"chapter_{chapter_id.replace('-', '')}"


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 120) -> List[str]:
    """Simple sliding-window chunker on whitespace-normalized text."""
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
        if start < 0 or end >= len(text):
            break
    return [c for c in chunks if c.strip()]


def index_chapter(chapter_id: str, raw_text: str, sections: List[Dict]):
    """(Re)builds the vector index for a single chapter."""
    try:
        _client.delete_collection(_collection_name(chapter_id))
    except Exception:
        pass

    collection = _client.create_collection(
        name=_collection_name(chapter_id), embedding_function=_embedding_fn
    )

    documents, ids, metadatas = [], [], []
    idx = 0
    for sec in sections:
        section_text = sec.get("content_text", "")
        heading = sec.get("heading", "")
        for chunk in chunk_text(section_text):
            documents.append(chunk)
            ids.append(f"{chapter_id}-{idx}")
            metadatas.append({"heading": heading, "chapter_id": chapter_id})
            idx += 1

    # fallback: if no sections produced chunks, chunk the raw text directly
    if not documents and raw_text.strip():
        for chunk in chunk_text(raw_text):
            documents.append(chunk)
            ids.append(f"{chapter_id}-{idx}")
            metadatas.append({"heading": "General", "chapter_id": chapter_id})
            idx += 1

    if documents:
        collection.add(documents=documents, ids=ids, metadatas=metadatas)

    return len(documents)


def query_chapter(chapter_id: str, question: str, top_k: int = 4) -> List[Dict]:
    """Returns top-k relevant chunks: [{text, heading, score}]"""
    try:
        collection = _client.get_collection(
            name=_collection_name(chapter_id), embedding_function=_embedding_fn
        )
    except Exception:
        return []

    results = collection.query(query_texts=[question], n_results=top_k)
    hits = []
    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    dists = results.get("distances", [[]])[0] if results.get("distances") else [None] * len(docs)

    for doc, meta, dist in zip(docs, metas, dists):
        hits.append({"text": doc, "heading": meta.get("heading", ""), "score": dist})
    return hits


def delete_chapter_index(chapter_id: str):
    try:
        _client.delete_collection(_collection_name(chapter_id))
    except Exception:
        pass
