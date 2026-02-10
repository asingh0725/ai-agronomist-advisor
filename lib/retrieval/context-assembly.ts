import { prisma } from "@/lib/prisma";
import type { SearchResult } from "./search";

export interface RetrievedChunk {
  id: string;
  content: string;
  similarity: number;
  source: {
    id: string;
    title: string;
    sourceType: string;
    institution?: string | null;
  };
}

export interface AssembledContext {
  chunks: RetrievedChunk[];
  totalChunks: number;
  totalTokens: number;
  relevanceThreshold: number;
}

const RELEVANCE_THRESHOLD = 0.5;
const MAX_TOKENS = 4000;
const CHARS_PER_TOKEN = 3;
const MAX_CHARS = MAX_TOKENS * CHARS_PER_TOKEN;
const MAX_CHUNKS_PER_SOURCE = 2;

const SOURCE_TYPE_PRIORITY: Record<string, number> = {
  GOVERNMENT: 4,
  UNIVERSITY_EXTENSION: 3,
  RESEARCH_PAPER: 2,
  MANUFACTURER: 1,
  RETAILER: 0,
};

/**
 * Assemble retrieved chunks into structured context for LLM consumption
 */
export async function assembleContext(
  textResults: SearchResult[],
  imageResults: SearchResult[]
): Promise<AssembledContext> {
  // Combine and deduplicate by ID
  const allResults = [...textResults, ...imageResults];
  const uniqueResults = deduplicateById(allResults);

  // Filter by relevance threshold
  const relevantResults = uniqueResults.filter(
    (r) => r.similarity >= RELEVANCE_THRESHOLD
  );

  // Fetch source metadata
  const chunks = await enrichWithSourceMetadata(relevantResults);

  // Prefer higher authority source types while preserving relevance
  chunks.sort((a, b) => {
    const authorityDelta =
      (SOURCE_TYPE_PRIORITY[b.source.sourceType] ?? 0) -
      (SOURCE_TYPE_PRIORITY[a.source.sourceType] ?? 0);

    if (authorityDelta !== 0) {
      return authorityDelta;
    }

    return b.similarity - a.similarity;
  });

  const sourceBalancedChunks = enforceSourceDiversity(
    chunks,
    MAX_CHUNKS_PER_SOURCE
  );

  // Truncate to fit within token limit
  const truncatedChunks = truncateToFit(sourceBalancedChunks, MAX_CHARS);

  const totalTokens = Math.ceil(
    truncatedChunks.reduce((sum, c) => sum + c.content.length, 0) /
      CHARS_PER_TOKEN
  );

  return {
    chunks: truncatedChunks,
    totalChunks: truncatedChunks.length,
    totalTokens,
    relevanceThreshold: RELEVANCE_THRESHOLD,
  };
}

function enforceSourceDiversity(
  chunks: RetrievedChunk[],
  maxPerSource: number
): RetrievedChunk[] {
  const sourceCounts = new Map<string, number>();
  const balanced: RetrievedChunk[] = [];

  for (const chunk of chunks) {
    const count = sourceCounts.get(chunk.source.id) || 0;
    if (count >= maxPerSource) {
      continue;
    }

    sourceCounts.set(chunk.source.id, count + 1);
    balanced.push(chunk);
  }

  return balanced;
}

/**
 * Remove duplicate chunks by ID
 */
function deduplicateById(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

/**
 * Enrich chunks with source metadata from database
 */
async function enrichWithSourceMetadata(
  results: SearchResult[]
): Promise<RetrievedChunk[]> {
  const sourceIds = Array.from(new Set(results.map((r) => r.sourceId)));

  const sources = await prisma.source.findMany({
    where: { id: { in: sourceIds } },
    select: {
      id: true,
      title: true,
      sourceType: true,
      institution: true,
    },
  });

  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  return results.map((r) => ({
    id: r.id,
    content: r.content,
    similarity: r.similarity,
    source: sourceMap.get(r.sourceId)!,
  }));
}

/**
 * Truncate chunks to fit within character limit
 */
function truncateToFit(
  chunks: RetrievedChunk[],
  maxChars: number
): RetrievedChunk[] {
  let currentChars = 0;
  const result: RetrievedChunk[] = [];

  for (const chunk of chunks) {
    const chunkLength = chunk.content.length;

    if (currentChars + chunkLength <= maxChars) {
      result.push(chunk);
      currentChars += chunkLength;
    } else {
      // Try to fit a truncated version
      const remainingChars = maxChars - currentChars;
      if (remainingChars > 200) {
        // Only include if we can fit at least 200 chars
        result.push({
          ...chunk,
          content: chunk.content.slice(0, remainingChars - 3) + "...",
        });
      }
      break;
    }
  }

  return result;
}
