import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ServiceA } from "./lambdas/service-a";
import { ServiceB } from "./lambdas/service-b";
import { CICD } from "./cicd";
import { getEnvOrThrow } from "../environments";

export interface InfraStackProps extends cdk.StackProps {
  environment?: string;
  serviceA?: {
    environment?: Record<string, string>;
    memorySize?: number;
    timeout?: number;
  };
  serviceB?: {
    environment?: Record<string, string>;
    memorySize?: number;
    timeout?: number;
  };
  cicdRepoStr: string;
}

export class InfraStack extends cdk.Stack {
  public readonly serviceA: ServiceA;
  public readonly serviceB: ServiceB;
  public readonly cicd: CICD;

  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);

    const environment = props?.environment || "dev";

    this.serviceA = new ServiceA(this, "ServiceA", {
      environment: {
        ENVIRONMENT: environment,
        ...props?.serviceA?.environment,
      },
      lambdaMemorySize: props?.serviceA?.memorySize || 128,
      lambdaTimeout: props?.serviceA?.timeout
        ? cdk.Duration.seconds(props.serviceA.timeout)
        : undefined,
    });

    this.serviceB = new ServiceB(this, "ServiceB", {
      environment: {
        ENVIRONMENT: environment,
        SQS_RESERVATION_QUEUE: this.serviceA.queue.queueUrl,
        SQS_RESERVATION_QUEUE_ARN: this.serviceA.queue.queueArn,
        ...props?.serviceB?.environment,
      },
      lambdaMemorySize: props?.serviceB?.memorySize || 128,
      lambdaTimeout: props?.serviceB?.timeout
        ? cdk.Duration.seconds(props.serviceB.timeout)
        : undefined,
      queueToWrite: this.serviceA.queue,
    });

    this.cicd = new CICD(this, "S3CiCd", {
      serviceALambdaArn: this.serviceA.lambda.functionArn,
      serviceBLambdaArn: this.serviceB.lambda.functionArn,
      cicdRepositoryStr: props.cicdRepoStr,
    });

    new cdk.CfnOutput(this, "ServiceAQueueUrl", {
      value: this.serviceA.queue.queueUrl,
      description: "Service A SQS Queue URL",
      exportName: `ServiceAQueueUrl-${environment}`,
    });

    new cdk.CfnOutput(this, "ServiceAQueueArn", {
      value: this.serviceA.queue.queueArn,
      description: "Service A SQS Queue ARN",
      exportName: `ServiceAQueueArn-${environment}`,
    });

    new cdk.CfnOutput(this, "ServiceBApiUrl", {
      value: this.serviceB.api.url,
      description: "Service B API Gateway Base URL",
      exportName: `ServiceBApiUrl-${environment}`,
    });

    new cdk.CfnOutput(this, "ServiceBApiEndpoint", {
      value: `${this.serviceB.api.url}prod`,
      description: "Service B API Gateway Full Endpoint URL (with stage)",
      exportName: `ServiceBApiEndpoint-${environment}`,
    });
  }
}
