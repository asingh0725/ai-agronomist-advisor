import test from 'node:test';
import assert from 'node:assert/strict';
import type { APIGatewayProxyResultV2 } from 'aws-lambda';
import { buildCreateUploadUrlHandler } from './create-upload-url';

function expectApiResponse(
  response: void | APIGatewayProxyResultV2<never>
): Exclude<APIGatewayProxyResultV2<never>, string> {
  assert.ok(response && typeof response === 'object' && 'statusCode' in response);
  return response as Exclude<APIGatewayProxyResultV2<never>, string>;
}

test('create upload url handler returns signed url payload', async () => {
  process.env.S3_UPLOAD_BUCKET = 'crop-copilot-dev-uploads';

  const handler = buildCreateUploadUrlHandler(
    async () => ({
      userId: '11111111-1111-4111-8111-111111111111',
      scopes: ['upload:write'],
    }),
    async (_userId, _payload) => ({
      uploadUrl: 'https://example.com/upload',
      objectKey: '11111111-1111-4111-8111-111111111111/object.jpg',
      expiresInSeconds: 900,
    })
  );

  const response = expectApiResponse(
    await handler(
      {
        body: JSON.stringify({
          fileName: 'field-photo.jpg',
          contentType: 'image/jpeg',
        }),
        headers: { authorization: 'Bearer fake-token' },
      } as any,
      {} as any,
      () => undefined
    )
  );

  assert.equal(response.statusCode, 200);
  const body = JSON.parse(response.body || '{}');
  assert.equal(body.uploadUrl, 'https://example.com/upload');
  assert.equal(body.expiresInSeconds, 900);
});
