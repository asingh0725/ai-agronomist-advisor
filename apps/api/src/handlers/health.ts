import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { jsonResponse } from '../lib/http';

export const handler: APIGatewayProxyHandlerV2 = async () =>
  jsonResponse(
    {
      service: '@crop-copilot/api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    { statusCode: 200 }
  );
