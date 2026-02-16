import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRunIngestionBatchHandler } from './run-ingestion-batch';
import { InMemorySourceRegistry } from '../ingestion/source-registry';

test('run-ingestion-batch publishes planned ingestion batch', async () => {
  const published: Array<{ sources: Array<{ sourceId: string }> }> = [];

  const handler = buildRunIngestionBatchHandler(
    {
      publishIngestionBatch: async (message) => {
        published.push(message as any);
      },
    },
    new InMemorySourceRegistry([
      {
        sourceId: 'source-a',
        url: 'https://example.com/a',
        priority: 'high',
        freshnessHours: 24,
        tags: [],
      },
    ])
  );

  await handler(
    {
      detail: {
        trigger: 'scheduled',
        maxSources: 5,
      },
    } as any,
    {} as any,
    () => undefined
  );

  assert.equal(published.length, 1);
  assert.equal(published[0].sources.length, 1);
  assert.equal(published[0].sources[0].sourceId, 'source-a');
});

test('run-ingestion-batch skips publish when no sources are due', async () => {
  const published: Array<{ sources: Array<{ sourceId: string }> }> = [];
  const registry = new InMemorySourceRegistry([
    {
      sourceId: 'source-a',
      url: 'https://example.com/a',
      priority: 'high',
      freshnessHours: 24,
      tags: [],
    },
  ]);
  registry.markSourceProcessed('source-a', new Date());

  const handler = buildRunIngestionBatchHandler(
    {
      publishIngestionBatch: async (message) => {
        published.push(message as any);
      },
    },
    registry
  );

  await handler(
    {
      detail: {
        trigger: 'scheduled',
        maxSources: 5,
      },
    } as any,
    {} as any,
    () => undefined
  );

  assert.equal(published.length, 0);
});
