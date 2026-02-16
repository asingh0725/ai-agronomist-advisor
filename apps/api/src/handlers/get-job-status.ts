import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { RecommendationJobStatusResponseSchema } from '@crop-copilot/contracts';
import { jsonResponse } from '../lib/http';
import { getRecommendationStore } from '../lib/store';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const jobId = event.pathParameters?.jobId;

  if (!jobId) {
    return jsonResponse(
      {
        error: {
          code: 'MISSING_JOB_ID',
          message: 'jobId path parameter is required',
        },
      },
      { statusCode: 400 }
    );
  }

  const status = getRecommendationStore().getJobStatus(jobId);
  if (!status) {
    return jsonResponse(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'recommendation job not found',
        },
      },
      { statusCode: 404 }
    );
  }

  return jsonResponse(RecommendationJobStatusResponseSchema.parse(status), {
    statusCode: 200,
  });
};
