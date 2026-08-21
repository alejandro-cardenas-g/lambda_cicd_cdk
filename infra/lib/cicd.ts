import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { createDefaultTags } from "../utils/addDefaultTags";

export interface CICDProps {
  serviceALambdaArn: string;
  serviceBLambdaArn: string;
  cicdRepositoryStr: string;
}

export class CICD extends Construct {
  private readonly props: CICDProps;

  constructor(scope: Construct, id: string, props: CICDProps) {
    super(scope, id);
    this.props = props;

    const cicdBucket = new s3.Bucket(this, "CicdBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: false,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(30),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    createDefaultTags([cicdBucket]);

    const githubProvider = new iam.OpenIdConnectProvider(
      this,
      "GitHubOIDCProvider",
      {
        url: "https://token.actions.githubusercontent.com",
        clientIds: ["sts.amazonaws.com"],
      },
    );

    const cicdRole = new iam.Role(this, "cicdRole", {
      roleName: "services_cicd_role",
      assumedBy: new iam.WebIdentityPrincipal(
        githubProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          StringLike: {
            "token.actions.githubusercontent.com:sub":
              this.props.cicdRepositoryStr,
          },
        },
      ),
    });

    cicdRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "lambda:UpdateFunctionCode",
          "lambda:PublishVersion",
          "lambda:UpdateAlias",
          "lambda:GetFunctionConfiguration",
        ],
        resources: [this.props.serviceALambdaArn, this.props.serviceBLambdaArn],
      }),
    );

    cicdRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject", "s3:GetObject"],
        resources: [cicdBucket.arnForObjects("*")],
      }),
    );

    new cdk.CfnOutput(this, "CicdBucketName", {
      value: cicdBucket.bucketName,
      description: "S3 bucket used to store CI/CD Lambda artifacts",
    });

    new cdk.CfnOutput(this, "CicdRoleArn", {
      value: cicdRole.roleArn,
      description: "cicdRole Arn",
    });
  }
}
