import type { APIGatewayProxyResultV2 } from 'aws-lambda';

export interface JsonResponseInit {
  statusCode: number;
  headers?: Record<string, string>;
}

export function jsonResponse<T>(
  payload: T,
  init: JsonResponseInit
): APIGatewayProxyResultV2 {
  return {
    statusCode: init.statusCode,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
    body: JSON.stringify(payload),
  };
}

export function parseJsonBody<T>(body: string | undefined | null): T {
  if (!body) {
    throw new Error('Request body is required');
  }

  return JSON.parse(body) as T;
}
