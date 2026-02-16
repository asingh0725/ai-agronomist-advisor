import test from 'node:test';
import assert from 'node:assert/strict';
import type { APIGatewayProxyResultV2 } from 'aws-lambda';
import { withAuth } from './with-auth';
import { jsonResponse } from '../lib/http';
import { AuthError } from './errors';

function expectApiResponse(
  response: void | APIGatewayProxyResultV2<never>
): Exclude<APIGatewayProxyResultV2<never>, string> {
  assert.ok(response && typeof response === 'object' && 'statusCode' in response);
  return response as Exclude<APIGatewayProxyResultV2<never>, string>;
}

test('withAuth passes auth context to secured handler', async () => {
  const handler = withAuth(
    async (_event, auth) =>
      jsonResponse(
        {
          userId: auth.userId,
        },
        { statusCode: 200 }
      ),
    async () => ({ userId: 'user-1', scopes: ['scope:read'] })
  );

  const response = expectApiResponse(
    await handler({ headers: {} } as any, {} as any, () => undefined)
  );
  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body || '{}').userId, 'user-1');
});

test('withAuth returns error response when verifier fails', async () => {
  const handler = withAuth(
    async () => jsonResponse({ ok: true }, { statusCode: 200 }),
    async () => {
      throw new AuthError('Token missing');
    }
  );

  const response = expectApiResponse(
    await handler({ headers: {} } as any, {} as any, () => undefined)
  );
  assert.equal(response.statusCode, 401);
  assert.equal(JSON.parse(response.body || '{}').error.code, 'UNAUTHORIZED');
});
