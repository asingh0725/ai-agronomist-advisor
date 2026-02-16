import test from 'node:test';
import assert from 'node:assert/strict';
import { NoopRecommendationQueue } from './recommendation-queue';

test('NoopRecommendationQueue accepts publish without throwing', async () => {
  const queue = new NoopRecommendationQueue();
  await queue.publishRecommendationJob({
    messageType: 'recommendation.job.requested',
    messageVersion: '1',
    requestedAt: '2026-02-16T12:00:00.000Z',
    userId: '11111111-1111-4111-8111-111111111111',
    inputId: 'd3d62e25-5a03-4691-aa42-6de8ce6f0b5b',
    jobId: 'f412cbaf-2f60-414b-9804-715f5c3b89ef',
  });

  assert.equal(true, true);
});
