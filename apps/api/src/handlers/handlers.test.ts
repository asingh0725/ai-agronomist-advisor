import test from 'node:test';
import assert from 'node:assert/strict';
import type { APIGatewayProxyResultV2 } from 'aws-lambda';
import { handler as healthHandler } from './health';
import { buildCreateInputHandler } from './create-input';
import { buildGetJobStatusHandler } from './get-job-status';
import { setRecommendationStore } from '../lib/store';
import { AuthError } from '../auth/errors';
import type { RecommendationQueue } from '../queue/recommendation-queue';

function expectApiResponse(
  response: void | APIGatewayProxyResultV2<never>
): Exclude<APIGatewayProxyResultV2<never>, string> {
  assert.ok(response && typeof response === 'object' && 'statusCode' in response);
  return response as Exclude<APIGatewayProxyResultV2<never>, string>;
}

function parseBody<T>(body: string | undefined): T {
  assert.ok(body, 'response body is missing');
  return JSON.parse(body) as T;
}

test('health handler returns 200', async () => {
  const response = expectApiResponse(
    await healthHandler({} as any, {} as any, () => undefined)
  );
  assert.equal(response.statusCode, 200);
  const body = parseBody<{ status: string }>(response.body);
  assert.equal(body.status, 'ok');
});

test('create input returns 202 and job id, then get status returns queued', async () => {
  setRecommendationStore(null);
  const authVerifier = async () => ({
    userId: '11111111-1111-4111-8111-111111111111',
    scopes: ['recommendation:write'],
  });
  let published = 0;
  const queue: RecommendationQueue = {
    publishRecommendationJob: async () => {
      published += 1;
    },
  };
  const createInputHandler = buildCreateInputHandler(authVerifier, queue);
  const getJobStatusHandler = buildGetJobStatusHandler(authVerifier);

  const createRes = expectApiResponse(
    await createInputHandler(
      {
        body: JSON.stringify({
          idempotencyKey: 'ios-device-01:abc12345',
          type: 'PHOTO',
          imageUrl: 'https://example.com/image.jpg',
        }),
        headers: { authorization: 'Bearer fake-token' },
      } as any,
      {} as any,
      () => undefined
    )
  );

  assert.equal(createRes.statusCode, 202);

  const accepted = parseBody<{ jobId: string; inputId: string }>(createRes.body);
  assert.ok(accepted.jobId);
  assert.ok(accepted.inputId);
  assert.equal(published, 1);

  const statusRes = expectApiResponse(
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
  const createInputHandler = buildCreateInputHandler(
    async () => ({
      userId: '11111111-1111-4111-8111-111111111111',
      scopes: ['recommendation:write'],
    }),
    {
      publishRecommendationJob: async () => undefined,
    }
  );

  const response = expectApiResponse(
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

test('create input returns 401 for failed auth', async () => {
  setRecommendationStore(null);
  const createInputHandler = buildCreateInputHandler(
    async () => {
      throw new AuthError('Token missing');
    },
    {
      publishRecommendationJob: async () => undefined,
    }
  );

  const response = expectApiResponse(
    await createInputHandler(
      {
        body: JSON.stringify({
          idempotencyKey: 'ios-device-01:abc12345',
          type: 'PHOTO',
        }),
        headers: {},
      } as any,
      {} as any,
      () => undefined
    )
  );

  assert.equal(response.statusCode, 401);
});

test('create input returns 500 when queue publish fails', async () => {
  setRecommendationStore(null);
  const createInputHandler = buildCreateInputHandler(
    async () => ({
      userId: '11111111-1111-4111-8111-111111111111',
      scopes: ['recommendation:write'],
    }),
    {
      publishRecommendationJob: async () => {
        throw new Error('queue unavailable');
      },
    }
  );

  const response = expectApiResponse(
    await createInputHandler(
      {
        body: JSON.stringify({
          idempotencyKey: 'ios-device-01:abc12345',
          type: 'PHOTO',
        }),
        headers: { authorization: 'Bearer fake-token' },
      } as any,
      {} as any,
      () => undefined
    )
  );

  assert.equal(response.statusCode, 500);
  const body = parseBody<{ error: { code: string } }>(response.body);
  assert.equal(body.error.code, 'PIPELINE_ENQUEUE_FAILED');
});
