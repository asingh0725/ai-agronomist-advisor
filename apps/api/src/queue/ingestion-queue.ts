import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import {
  IngestionBatchMessageSchema,
  type IngestionBatchMessage,
} from '@crop-copilot/contracts';

export interface IngestionQueue {
  publishIngestionBatch(message: IngestionBatchMessage): Promise<void>;
}

export class NoopIngestionQueue implements IngestionQueue {
  async publishIngestionBatch(_message: IngestionBatchMessage): Promise<void> {
    // Intentionally empty for local mode.
  }
}

export class SqsIngestionQueue implements IngestionQueue {
  constructor(
    private readonly queueUrl: string,
    private readonly client: SQSClient = new SQSClient({
      region: process.env.AWS_REGION ?? process.env.COGNITO_REGION ?? 'ca-west-1',
    })
  ) {}

  async publishIngestionBatch(message: IngestionBatchMessage): Promise<void> {
    const payload = IngestionBatchMessageSchema.parse(message);
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(payload),
      })
    );
  }
}

let sharedQueue: IngestionQueue | null = null;

export function getIngestionQueue(): IngestionQueue {
  if (!sharedQueue) {
    const queueUrl = process.env.SQS_INGESTION_QUEUE_URL;
    sharedQueue = queueUrl ? new SqsIngestionQueue(queueUrl) : new NoopIngestionQueue();
  }

  return sharedQueue;
}

export function setIngestionQueue(queue: IngestionQueue | null): void {
  sharedQueue = queue;
}
