import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { CreateInputCommandSchema } from '@crop-copilot/contracts';
import { isBadRequestError, jsonResponse, parseJsonBody } from '../lib/http';
import { getRecommendationStore } from '../lib/store';

function extractUserId(headers: Record<string, string | undefined>): string {
  const userId = headers['x-user-id'] || headers['X-User-Id'];
  return userId || '00000000-0000-0000-0000-000000000000';
}

function isValidationError(error: unknown): error is Error {
  return error instanceof Error && error.name === 'ZodError';
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const payload = parseJsonBody<unknown>(event.body);
    const command = CreateInputCommandSchema.parse(payload);

    const response = getRecommendationStore().enqueueInput(
      extractUserId(event.headers),
      command
    );

    return jsonResponse(response, { statusCode: 202 });
  } catch (error) {
    if (isValidationError(error) || isBadRequestError(error)) {
      return jsonResponse(
        {
          error: {
            code: 'BAD_REQUEST',
            message: error.message,
          },
        },
        { statusCode: 400 }
      );
    }

    console.error('Failed to enqueue recommendation input', error);

    return jsonResponse(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        },
      },
      { statusCode: 500 }
    );
  }
};
