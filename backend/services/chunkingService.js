// Chunking Engine - builds structural + text chunks on top of content extraction

/**
 * Step 1: Structural grouping
 * Group low-level layout blocks (headings, paragraphs, lists, tables, figures, captions)
 * into preliminary structural chunks.
 *
 * Expected block shape (from parser):
 * {
 *   id: string,
 *   type: 'heading' | 'paragraph' | 'list' | 'table' | 'figure' | 'caption',
 *   text: string,
 *   level?: 1 | 2 | 3,
 *   page?: number
 * }
 */
export function groupStructurally(blocks) {
  const chunks = [];
  let current = {
    blocks: [],
    headingPath: [],
    pages: new Set()
  };

  const pushCurrent = () => {
    if (current.blocks.length === 0) return;
    chunks.push({
      blocks: current.blocks,
      headingPath: [...current.headingPath],
      pages: new Set(current.pages)
    });
    current = { blocks: [], headingPath: [], pages: new Set() };
  };

  for (const block of blocks || []) {
    if (block.type === 'heading') {
      // new chunk at heading
      pushCurrent();
      // update heading path (up to 3 levels deep)
      if (block.level === 1) {
        current.headingPath = [block.text];
      } else if (block.level === 2) {
        current.headingPath = [current.headingPath[0], block.text].filter(Boolean);
      } else if (block.level === 3) {
        current.headingPath = [
          current.headingPath[0],
          current.headingPath[1],
          block.text
        ].filter(Boolean);
      } else {
        // fallback: treat as level 2 if no explicit level
        current.headingPath = [current.headingPath[0], block.text].filter(Boolean);
      }
      current.blocks.push(block);
      if (block.page != null) current.pages.add(block.page);
      continue;
    }

    if (["list", "table", "figure", "caption"].includes(block.type)) {
      // these become their own chunks but keep current heading path
      pushCurrent();
      const pages = new Set();
      if (block.page != null) pages.add(block.page);
      chunks.push({
        blocks: [block],
        headingPath: [...current.headingPath],
        pages
      });
      continue;
    }

    // paragraphs and other inline content: append to current
    current.blocks.push(block);
    if (block.page != null) current.pages.add(block.page);
  }

  pushCurrent();
  return chunks;
}

/**
 * Simple token estimation – keeps chunk metadata lightweight
 */
export function estimateTokens(text) {
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  // Rough heuristic: 1 token ≈ 0.75 words
  return Math.round(words / 0.75);
}

/**
 * Step 2: Flatten structural groups into text chunks ready for embedding / retrieval
 */
export function structuralChunksToTextChunks(structuralChunks) {
  return (structuralChunks || []).map((group, index) => {
    const text = (group.blocks || [])
      .map((b) => b.text || "")
      .filter(Boolean)
      .join("\n\n");

    return {
      chunkId: `chunk_${index + 1}`,
      pageRange: Array.from(group.pages || []).sort((a, b) => a - b),
      headingPath: group.headingPath || [],
      text,
      tokenCount: estimateTokens(text),
      blockIds: (group.blocks || []).map((b) => b.id).filter(Boolean)
    };
  });
}

/**
 * Step 3: Semantic similarity hook
 *
 * For now getEmbedding is a thin async stub you can wire to your
 * actual embedding provider (OpenAI, local models, etc.).
 */
export async function getEmbedding(text) {
  // TODO: replace with real embedding call
  // Example wiring (pseudo-code):
  //   return await generateEmbedding(text)
  return [];
}

// Cosine similarity between two embedding vectors
export function cosineSim(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || !a.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

/**
 * Step 4: Split very large chunks by token budget
 *
 * Given a single text chunk that exceeds maxTokens, split it into
 * multiple smaller chunks on sentence/paragraph-ish boundaries.
 */
export function splitLongChunk(chunk, { maxTokens = 400 } = {}) {
  if (!chunk || !chunk.text) return [chunk];
  if (chunk.tokenCount <= maxTokens) return [chunk];

  const sentences = chunk.text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const result = [];
  let buffer = [];

  const flush = (index) => {
    if (!buffer.length) return;
    const text = buffer.join(' ');
    result.push({
      ...chunk,
      chunkId: `${chunk.chunkId}_${index}`,
      text,
      tokenCount: estimateTokens(text)
    });
    buffer = [];
  };

  let idx = 1;
  for (const sentence of sentences) {
    buffer.push(sentence);
    const text = buffer.join(' ');
    if (estimateTokens(text) >= maxTokens) {
      flush(idx++);
    }
  }
  flush(idx);
  return result;
}

/**
 * Step 5: Ensure all chunks fall within token window
 *
 * Applies splitLongChunk to any oversize chunks.
 */
export function splitLargeChunks(chunks, { maxTokens = 400 } = {}) {
  const safeChunks = Array.isArray(chunks) ? chunks : [];
  const result = [];
  for (const chunk of safeChunks) {
    if (!chunk || typeof chunk.text !== 'string') continue;
    if ((chunk.tokenCount || 0) > maxTokens) {
      result.push(...splitLongChunk(chunk, { maxTokens }));
    } else {
      result.push(chunk);
    }
  }
  return result;
}

/**
 * Step 6: Semantic merge of very small, related chunks
 *
 * For now this uses a simple heuristic on token length and
 * (once getEmbedding is wired) cosine similarity between neighbours.
 */
export async function semanticMergeChunks(
  chunks,
  { minTokens = 80, similarityThreshold = 0.75 } = {}
) {
  const safeChunks = Array.isArray(chunks) ? chunks : [];
  if (safeChunks.length === 0) return [];

  // Pre-compute embeddings when available
  const withEmbeddings = [];
  for (const chunk of safeChunks) {
    const embedding = await getEmbedding(chunk.text || '');
    withEmbeddings.push({ ...chunk, embedding });
  }

  const merged = [];
  let current = { ...withEmbeddings[0] };

  const pushCurrent = () => {
    if (!current) return;
    const { embedding, ...rest } = current;
    merged.push(rest);
  };

  for (let i = 1; i < withEmbeddings.length; i++) {
    const next = withEmbeddings[i];
    const currentTokens = current.tokenCount || estimateTokens(current.text || '');
    const nextTokens = next.tokenCount || estimateTokens(next.text || '');

    let shouldMerge = false;
    if (currentTokens < minTokens || nextTokens < minTokens) {
      shouldMerge = true;
    }

    if (Array.isArray(current.embedding) && Array.isArray(next.embedding)) {
      const sim = cosineSim(current.embedding, next.embedding);
      if (sim >= similarityThreshold) {
        shouldMerge = true;
      }
    }

    if (shouldMerge) {
      const combinedText = [current.text || '', next.text || ''].filter(Boolean).join('\n\n');
      const combinedPages = new Set([...(current.pageRange || []), ...(next.pageRange || [])]);
      const combinedHeadingPath = current.headingPath && current.headingPath.length
        ? current.headingPath
        : next.headingPath || [];

      current = {
        ...current,
        text: combinedText,
        tokenCount: estimateTokens(combinedText),
        pageRange: Array.from(combinedPages).sort((a, b) => a - b),
        headingPath: combinedHeadingPath,
        blockIds: [...(current.blockIds || []), ...(next.blockIds || [])]
      };
    } else {
      pushCurrent();
      current = { ...next };
    }
  }

  pushCurrent();
  return merged;
}

/**
 * High-level helper: full chunking pipeline from raw blocks
 *
 * 1. groupStructurally(blocks)
 * 2. structuralChunksToTextChunks
 * 3. splitLargeChunks
 * 4. semanticMergeChunks
 */
export async function chunkDocument(
  blocks,
  { minTokens = 80, maxTokens = 400, similarityThreshold = 0.75 } = {}
) {
  const structural = groupStructurally(blocks || []);
  let textChunks = structuralChunksToTextChunks(structural);
  textChunks = splitLargeChunks(textChunks, { maxTokens });
  const merged = await semanticMergeChunks(textChunks, { minTokens, similarityThreshold });
  return merged;
}
