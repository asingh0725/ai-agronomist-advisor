import test from 'node:test';
import assert from 'node:assert/strict';
import { handler as createInputHandler } from './create-input';
import { handler as getJobStatusHandler } from './get-job-status';
import { handler as healthHandler } from './health';
import type { RecommendationStore } from '../lib/store';
import { setRecommendationStore } from '../lib/store';

interface HandlerResponse {
  statusCode: number;
  body?: string;
}

function asHandlerResponse(response: unknown): HandlerResponse {
  assert.ok(response && typeof response === 'object', 'handler did not return an object');
  assert.ok('statusCode' in response, 'handler response is missing statusCode');
  return response as HandlerResponse;
}

function parseBody<T>(body: string | undefined): T {
  assert.ok(body, 'response body is missing');
  return JSON.parse(body) as T;
}

test('health handler returns 200', async () => {
  const response = asHandlerResponse(
    await healthHandler({} as any, {} as any, () => undefined)
  );
  assert.equal(response.statusCode, 200);
  const body = parseBody<{ status: string }>(response.body);
  assert.equal(body.status, 'ok');
});

test('create input returns 202 and job id, then get status returns queued', async () => {
  setRecommendationStore(null);

  const createRes = asHandlerResponse(
    await createInputHandler(
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
    )
  );

  assert.equal(createRes.statusCode, 202);

  const accepted = parseBody<{ jobId: string; inputId: string }>(createRes.body);
  assert.ok(accepted.jobId);
  assert.ok(accepted.inputId);

  const statusRes = asHandlerResponse(
    await getJobStatusHandler(
      {
        pathParameters: {
          jobId: accepted.jobId,
        },
        headers: {},
      } as any,
      {} as any,
      () => undefined
    )
  );

  assert.equal(statusRes.statusCode, 200);
  const statusBody = parseBody<{ status: string }>(statusRes.body);
  assert.equal(statusBody.status, 'queued');
});

test('create input returns 400 for invalid body', async () => {
  setRecommendationStore(null);

  const response = asHandlerResponse(
    await createInputHandler(
      {
        body: JSON.stringify({
          type: 'PHOTO',
        }),
        headers: {},
      } as any,
      {} as any,
      () => undefined
    )
  );

  assert.equal(response.statusCode, 400);
  const body = parseBody<{ error: { code: string } }>(response.body);
  assert.equal(body.error.code, 'BAD_REQUEST');
});

test('create input returns same job for idempotent retry by same user', async () => {
  setRecommendationStore(null);

  const event = {
    body: JSON.stringify({
      idempotencyKey: 'ios-device-02:retrykey1',
      type: 'PHOTO',
      imageUrl: 'https://example.com/image.jpg',
    }),
    headers: { 'x-user-id': '33333333-3333-3333-3333-333333333333' },
  } as any;

  const firstResponse = asHandlerResponse(
    await createInputHandler(event, {} as any, () => undefined)
  );
  const secondResponse = asHandlerResponse(
    await createInputHandler(event, {} as any, () => undefined)
  );

  assert.equal(firstResponse.statusCode, 202);
  assert.equal(secondResponse.statusCode, 202);

  const firstBody = parseBody<{ jobId: string; inputId: string }>(firstResponse.body);
  const secondBody = parseBody<{ jobId: string; inputId: string }>(secondResponse.body);

  assert.equal(firstBody.jobId, secondBody.jobId);
  assert.equal(firstBody.inputId, secondBody.inputId);
});

test('create input idempotency key is scoped by user', async () => {
  setRecommendationStore(null);

  const body = JSON.stringify({
    idempotencyKey: 'ios-device-03:scopekey',
    type: 'PHOTO',
    imageUrl: 'https://example.com/image.jpg',
  });

  const firstResponse = asHandlerResponse(
    await createInputHandler(
      {
        body,
        headers: { 'x-user-id': '44444444-4444-4444-4444-444444444444' },
      } as any,
      {} as any,
      () => undefined
    )
  );
  const secondResponse = asHandlerResponse(
    await createInputHandler(
      {
        body,
        headers: { 'x-user-id': '55555555-5555-5555-5555-555555555555' },
      } as any,
      {} as any,
      () => undefined
    )
  );

  const first = parseBody<{ jobId: string; inputId: string }>(firstResponse.body);
  const second = parseBody<{ jobId: string; inputId: string }>(secondResponse.body);

  assert.notEqual(first.jobId, second.jobId);
  assert.notEqual(first.inputId, second.inputId);
});

test('create input returns 500 when store enqueue fails', async () => {
  const failingStore: RecommendationStore = {
    enqueueInput() {
      throw new Error('persistence unavailable');
    },
    getJobStatus() {
      return null;
    },
  };
  setRecommendationStore(failingStore);

  const response = asHandlerResponse(
    await createInputHandler(
      {
        body: JSON.stringify({
          idempotencyKey: 'ios-device-04:servererr',
          type: 'PHOTO',
          imageUrl: 'https://example.com/image.jpg',
        }),
        headers: { 'x-user-id': '66666666-6666-6666-6666-666666666666' },
      } as any,
      {} as any,
      () => undefined
    )
  );

  assert.equal(response.statusCode, 500);
  const body = parseBody<{ error: { code: string } }>(response.body);
  assert.equal(body.error.code, 'INTERNAL_SERVER_ERROR');

  setRecommendationStore(null);
});
