import type { SQSBatchItemFailure, SQSEvent, SQSHandler } from 'aws-lambda';
import { IngestionBatchMessageSchema } from '@crop-copilot/contracts';
import { getSourceRegistry } from '../ingestion/source-registry';

async function processBatch(body: string): Promise<void> {
  const payload = IngestionBatchMessageSchema.parse(JSON.parse(body));
  const registry = getSourceRegistry();

  const processedAt = new Date(payload.requestedAt);

  for (const source of payload.sources) {
    // Scrape/parse/embed/upsert execution is integrated in the next phase.
    registry.markSourceProcessed(source.sourceId, processedAt);
  }
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  const batchItemFailures: SQSBatchItemFailure[] = [];

  for (const record of event.Records) {
    try {
      await processBatch(record.body);
    } catch (error) {
      console.error('Failed to process ingestion batch', {
        messageId: record.messageId,
        error: (error as Error).message,
      });
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return {
    batchItemFailures,
  };
};
