import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import {
  RecommendationReadyEventSchema,
  type RecommendationReadyEvent,
} from '@crop-copilot/contracts';

export interface PushEventPublisher {
  publishRecommendationReady(event: RecommendationReadyEvent): Promise<void>;
}

export class NoopPushEventPublisher implements PushEventPublisher {
  async publishRecommendationReady(_event: RecommendationReadyEvent): Promise<void> {
    // Intentionally empty in local/dev mode.
  }
}

export class SnsPushEventPublisher implements PushEventPublisher {
  constructor(
    private readonly topicArn: string,
    private readonly client: SNSClient = new SNSClient({
      region: process.env.AWS_REGION ?? process.env.COGNITO_REGION ?? 'ca-west-1',
    })
  ) {}

  async publishRecommendationReady(event: RecommendationReadyEvent): Promise<void> {
    const payload = RecommendationReadyEventSchema.parse(event);

    await this.client.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Subject: 'recommendation.ready',
        Message: JSON.stringify(payload),
        MessageAttributes: {
          eventType: {
            DataType: 'String',
            StringValue: payload.eventType,
          },
          userId: {
            DataType: 'String',
            StringValue: payload.userId,
          },
        },
      })
    );
  }
}

let singletonPublisher: PushEventPublisher | null = null;

export function getPushEventPublisher(): PushEventPublisher {
  if (!singletonPublisher) {
    const topicArn = process.env.SNS_PUSH_EVENTS_TOPIC_ARN;
    singletonPublisher = topicArn
      ? new SnsPushEventPublisher(topicArn)
      : new NoopPushEventPublisher();
  }

  return singletonPublisher;
}

export function setPushEventPublisher(publisher: PushEventPublisher | null): void {
  singletonPublisher = publisher;
}
