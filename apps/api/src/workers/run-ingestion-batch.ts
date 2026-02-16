import type { EventBridgeHandler } from 'aws-lambda';
import {
  IngestionScheduleTriggerSchema,
  type IngestionScheduleTrigger,
} from '@crop-copilot/contracts';
import { buildIngestionBatchMessage } from '../ingestion/orchestrator';
import {
  getSourceRegistry,
  type SourceRegistry,
} from '../ingestion/source-registry';
import {
  getIngestionQueue,
  type IngestionQueue,
} from '../queue/ingestion-queue';

interface ScheduledIngestionEvent {
  trigger?: 'scheduled' | 'manual';
  maxSources?: number;
}

export function buildRunIngestionBatchHandler(
  queue: IngestionQueue = getIngestionQueue(),
  registry: SourceRegistry = getSourceRegistry()
): EventBridgeHandler<'crop-copilot.ingestion.scheduled', ScheduledIngestionEvent, void> {
  return async (event) => {
    const now = new Date();

    const trigger: IngestionScheduleTrigger = IngestionScheduleTriggerSchema.parse({
      trigger: event.detail?.trigger ?? 'scheduled',
      maxSources: event.detail?.maxSources ?? 50,
      scheduledAt: now.toISOString(),
    });

    const batch = buildIngestionBatchMessage(trigger, registry, now);
    if (!batch) {
      return;
    }

    await queue.publishIngestionBatch(batch);
  };
}

export const handler = buildRunIngestionBatchHandler();
