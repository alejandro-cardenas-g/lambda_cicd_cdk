#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { InfraStack } from "../lib/infra-stack";
import { getEnvironmentConfig } from "../environments";

const app = new cdk.App();

const environment = app.node.tryGetContext("environment") || "dev";
const cicdRepoStr = app.node.tryGetContext("CICD_REPOSITORY_STR");
if (!cicdRepoStr) throw new Error("CICD_REPOSITORY_STR missing");
const config = getEnvironmentConfig(environment);

new InfraStack(app, `InfraStack-${environment}`, {
  ...config,
  cicdRepoStr,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
    region:
      process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || "us-east-1",
  },
});
