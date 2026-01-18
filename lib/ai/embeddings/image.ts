import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// CLIP model for image embeddings
const CLIP_MODEL =
  "andreasjansson/clip-features:75b33f253f7714a281ad3e9b28f63e3232d583716ef6718f2e46641077ea040a";
const EMBEDDING_DIMENSIONS = 512;

// Pricing: ~$0.0002 per image (estimated)
const COST_PER_IMAGE = 0.0002;

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const RETRY_BACKOFF_FACTOR = 2;

export interface ImageEmbeddingResult {
  embedding: number[];
  model: string;
  dimensions: number;
}

export interface BatchImageEmbeddingResult {
  embeddings: number[][];
  total: number;
  succeeded: number;
  failed: number;
  estimatedCost: number;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate CLIP embedding for an image URL with retry logic
 */
export async function generateImageEmbedding(
  imageUrl: string,
  retries: number = MAX_RETRIES
): Promise<ImageEmbeddingResult> {
  if (!imageUrl || imageUrl.trim().length === 0) {
    throw new Error("Image URL cannot be empty");
  }

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const output = await replicate.run(CLIP_MODEL, {
        input: {
          inputs: imageUrl,
        },
      });

      // The output is an array of embeddings (one per input)
      const embedding = Array.isArray(output) ? output[0] : output;

      if (!Array.isArray(embedding)) {
        throw new Error("Unexpected output format from CLIP model");
      }

      return {
        embedding,
        model: CLIP_MODEL,
        dimensions: EMBEDDING_DIMENSIONS,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `Attempt ${attempt}/${retries} failed for image ${imageUrl}:`,
        lastError.message
      );

      // Don't retry if this is the last attempt
      if (attempt < retries) {
        const delayMs =
          INITIAL_RETRY_DELAY_MS * Math.pow(RETRY_BACKOFF_FACTOR, attempt - 1);
        console.log(`Retrying in ${delayMs}ms...`);
        await sleep(delayMs);
      }
    }
  }

  throw new Error(
    `Failed to generate image embedding after ${retries} attempts: ${lastError?.message}`
  );
}

/**
 * Generate CLIP embedding from base64 encoded image
 */
export async function generateImageEmbeddingFromBase64(
  base64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg",
  retries: number = MAX_RETRIES
): Promise<ImageEmbeddingResult> {
  if (!base64 || base64.trim().length === 0) {
    throw new Error("Base64 data cannot be empty");
  }

  // Create data URI from base64
  const dataUri = `data:${mediaType};base64,${base64}`;

  return generateImageEmbedding(dataUri, retries);
}

/**
 * Generate embeddings for multiple images with rate limiting and error handling
 *
 * @param imageUrls - Array of image URLs to process
 * @param concurrency - Number of concurrent requests (default: 3)
 * @param onProgress - Optional callback for progress updates
 */
export async function generateBatchImageEmbeddings(
  imageUrls: string[],
  concurrency: number = 3,
  onProgress?: (
    current: number,
    total: number,
    succeeded: number,
    failed: number
  ) => void
): Promise<BatchImageEmbeddingResult> {
  if (imageUrls.length === 0) {
    throw new Error("Image URLs array cannot be empty");
  }

  const embeddings: number[][] = [];
  let succeeded = 0;
  let failed = 0;

  // Process in batches with concurrency control
  for (let i = 0; i < imageUrls.length; i += concurrency) {
    const batch = imageUrls.slice(i, i + concurrency);

    const results = await Promise.allSettled(
      batch.map((url) => generateImageEmbedding(url))
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        embeddings.push(result.value.embedding);
        succeeded++;
      } else {
        console.error("Failed to generate embedding:", result.reason);
        failed++;
      }
    }

    if (onProgress) {
      onProgress(i + batch.length, imageUrls.length, succeeded, failed);
    }

    // Add delay between batches to respect rate limits
    if (i + concurrency < imageUrls.length) {
      await sleep(500); // 500ms delay between batches
    }
  }

  const estimatedCost = imageUrls.length * COST_PER_IMAGE;

  return {
    embeddings,
    total: imageUrls.length,
    succeeded,
    failed,
    estimatedCost,
  };
}

/**
 * Estimate the cost of generating image embeddings
 *
 * @param imageCount - Number of images to embed
 * @returns Estimated cost in USD
 */
export function estimateImageEmbeddingCost(imageCount: number): number {
  return imageCount * COST_PER_IMAGE;
}
