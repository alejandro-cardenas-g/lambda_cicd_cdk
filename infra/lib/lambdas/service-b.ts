import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { createDefaultTags } from "../../utils/addDefaultTags";

export interface ServiceBProps {
  environment?: Record<string, string>;
  lambdaTimeout?: cdk.Duration;
  lambdaMemorySize?: number;
  apiStageOptions?: Partial<apigateway.StageOptions>;
  queueToWrite?: sqs.IQueue;
}

export class ServiceB extends Construct {
  public readonly lambda: lambda.Function;
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props?: ServiceBProps) {
    super(scope, id);

    this.lambda = new lambda.Function(this, "Function", {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: "index.handler",
      timeout: props?.lambdaTimeout || cdk.Duration.seconds(60),
      memorySize: props?.lambdaMemorySize || 256,
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

    this.api = new apigateway.RestApi(this, "Api", {
      restApiName: "ServiceB API",
      description: "Service B REST API",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const resource = this.api.root.addResource("{proxy+}");

    const lambdaIntegration = new apigateway.LambdaIntegration(prodAlias);

    resource.addMethod("ANY", lambdaIntegration, {
      requestParameters: {
        "method.request.path.proxy": true,
      },
    });

    this.api.root.addMethod("ANY", lambdaIntegration);

    // Permisos para enviar mensajes a ServiceA queue
    if (props?.queueToWrite) {
      props.queueToWrite.grantSendMessages(this.lambda);
    }

    new cdk.CfnOutput(this, "ApiUrl", {
      value: this.api.url,
      description: "Service B API URL",
    });

    createDefaultTags([this.lambda, this.api]);
  }
}
