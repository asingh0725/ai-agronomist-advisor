import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
  SyncPullRequestSchema,
  SyncPullResponseSchema,
  type SyncPullRequest,
} from '@crop-copilot/contracts';
import { withAuth } from '../auth/with-auth';
import type { AuthVerifier } from '../auth/types';
import { jsonResponse } from '../lib/http';
import { getRecommendationStore } from '../lib/store';

export function buildSyncPullHandler(verifier?: AuthVerifier): APIGatewayProxyHandlerV2 {
  return withAuth(async (event, auth) => {
    let request: SyncPullRequest;
    try {
      request = SyncPullRequestSchema.parse({
        limit: event.queryStringParameters?.limit,
        cursor: event.queryStringParameters?.cursor,
        includeCompletedJobs: event.queryStringParameters?.includeCompletedJobs,
      });
    } catch (error) {
      return jsonResponse(
        {
          error: {
            code: 'BAD_REQUEST',
            message: (error as Error).message,
          },
        },
        { statusCode: 400 }
      );
    }

    try {
      const response = await getRecommendationStore().pullSyncRecords(auth.userId, request);
      return jsonResponse(SyncPullResponseSchema.parse(response), {
        statusCode: 200,
      });
    } catch (error) {
      const message = (error as Error).message;
      const statusCode = message.startsWith('Invalid sync cursor') ? 400 : 500;
      const code = statusCode === 400 ? 'BAD_REQUEST' : 'SYNC_PULL_FAILED';

      return jsonResponse(
        {
          error: {
            code,
            message,
          },
        },
        { statusCode }
      );
    }
  }, verifier);
}

export const handler = buildSyncPullHandler();
