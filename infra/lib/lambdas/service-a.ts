import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import { Construct } from "constructs";
import { createDefaultTags } from "../../utils/addDefaultTags";

export interface ServiceAProps {
  environment?: Record<string, string>;
  queueProps?: sqs.QueueProps;
  lambdaTimeout?: cdk.Duration;
  lambdaMemorySize?: number;
}

export class ServiceA extends Construct {
  public readonly lambda: lambda.Function;
  public readonly queue: sqs.Queue;

  constructor(scope: Construct, id: string, props?: ServiceAProps) {
    super(scope, id);

    this.queue = new sqs.Queue(this, "Queue", {
      visibilityTimeout: cdk.Duration.seconds(300),
      ...props?.queueProps,
    });

    this.lambda = new lambda.Function(this, "Function", {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: "index.handler",
      timeout: props?.lambdaTimeout || cdk.Duration.seconds(60),
      memorySize: props?.lambdaMemorySize || 128,
      environment: {
        NODE_ENV: "production",
        ...props?.environment,
      },
      code: lambda.Code.fromInline(`
        exports.handler = async () => {
          throw new Error("Lambda code has not been deployed yet");
        };
      `),
    });

    const initialVersion = this.lambda.currentVersion;

    const prodAlias = new lambda.Alias(this, "ProdAlias", {
      aliasName: "prod",
      version: initialVersion,
    });

    // Permisos SQS para ServiceA
    this.queue.grantConsumeMessages(this.lambda); // ReceiveMessage, DeleteMessage, GetQueueAttributes

    prodAlias.addEventSource(
      new lambdaEventSources.SqsEventSource(this.queue, {
        batchSize: 10,
        reportBatchItemFailures: true,
      }),
    );

    createDefaultTags([this.lambda, this.queue]);
  }
}
