import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import {
  RecommendationJobRequestedSchema,
  type RecommendationJobRequested,
} from '@crop-copilot/contracts';

export interface RecommendationQueue {
  publishRecommendationJob(message: RecommendationJobRequested): Promise<void>;
}

export class NoopRecommendationQueue implements RecommendationQueue {
  async publishRecommendationJob(_message: RecommendationJobRequested): Promise<void> {
    // Intentionally no-op for local development and tests without SQS.
  }
}

export class SqsRecommendationQueue implements RecommendationQueue {
  constructor(
    private readonly queueUrl: string,
    private readonly client: SQSClient = new SQSClient({
      region: process.env.AWS_REGION ?? process.env.COGNITO_REGION ?? 'ca-west-1',
    })
  ) {}

  async publishRecommendationJob(message: RecommendationJobRequested): Promise<void> {
    const payload = RecommendationJobRequestedSchema.parse(message);

    await this.client.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(payload),
      })
    );
  }
}

let sharedQueue: RecommendationQueue | null = null;

export function getRecommendationQueue(): RecommendationQueue {
  if (!sharedQueue) {
    const queueUrl = process.env.SQS_RECOMMENDATION_QUEUE_URL;
    sharedQueue = queueUrl ? new SqsRecommendationQueue(queueUrl) : new NoopRecommendationQueue();
  }

  return sharedQueue;
}

export function setRecommendationQueue(queue: RecommendationQueue | null): void {
  sharedQueue = queue;
}
