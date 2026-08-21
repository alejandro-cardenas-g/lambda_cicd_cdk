import { Tags } from "aws-cdk-lib";
import { Construct } from "constructs";

export const createDefaultTags = (
  resources: Construct[],
  env: string = "dev",
) => {
  for (const resource of resources) {
    Tags.of(resource).add("IAC", "CDK");
    Tags.of(resource).add("Environment", env);
  }
};
