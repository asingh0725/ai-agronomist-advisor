import test from 'node:test';
import assert from 'node:assert/strict';
import { handler as createInputHandler } from './create-input';
import { handler as getJobStatusHandler } from './get-job-status';
import { handler as healthHandler } from './health';
import { setRecommendationStore } from '../lib/store';

function parseBody<T>(body: string | undefined): T {
  assert.ok(body, 'response body is missing');
  return JSON.parse(body) as T;
}

test('health handler returns 200', async () => {
  const response = await healthHandler({} as any, {} as any, () => undefined);
  assert.equal(response.statusCode, 200);
  const body = parseBody<{ status: string }>(response.body);
  assert.equal(body.status, 'ok');
});

test('create input returns 202 and job id, then get status returns queued', async () => {
  setRecommendationStore(null);

  const createRes = await createInputHandler(
    {
      body: JSON.stringify({
        idempotencyKey: 'ios-device-01:abc12345',
        type: 'PHOTO',
        imageUrl: 'https://example.com/image.jpg',
      }),
      headers: { 'x-user-id': '11111111-1111-1111-1111-111111111111' },
    } as any,
    {} as any,
    () => undefined
  );

  assert.equal(createRes.statusCode, 202);

  const accepted = parseBody<{ jobId: string; inputId: string }>(createRes.body);
  assert.ok(accepted.jobId);
  assert.ok(accepted.inputId);

  const statusRes = await getJobStatusHandler(
    {
      pathParameters: {
        jobId: accepted.jobId,
      },
      headers: {},
    } as any,
    {} as any,
    () => undefined
  );

  assert.equal(statusRes.statusCode, 200);
  const statusBody = parseBody<{ status: string }>(statusRes.body);
  assert.equal(statusBody.status, 'queued');
});

test('create input returns 400 for invalid body', async () => {
  setRecommendationStore(null);

  const response = await createInputHandler(
    {
      body: JSON.stringify({
        type: 'PHOTO',
      }),
      headers: {},
    } as any,
    {} as any,
    () => undefined
  );

  assert.equal(response.statusCode, 400);
  const body = parseBody<{ error: { code: string } }>(response.body);
  assert.equal(body.error.code, 'BAD_REQUEST');
});
