import { InfraStackProps } from "./lib/infra-stack";

export interface EnvironmentConfig extends InfraStackProps {
  environment: string;
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
}

const baseConfig: EnvironmentConfig = {
  environment: "dev",
  cicdRepoStr: "",
};

const devConfig: EnvironmentConfig = {
  ...baseConfig,
  environment: "dev",
  serviceA: {
    environment: {
      LOG_LEVEL: "debug",
      DB_HOST: "localhost",
    },
    memorySize: 128,
    timeout: 10,
  },
  serviceB: {
    environment: {
      LOG_LEVEL: "debug",
      DB_HOST: "localhost",
    },
    memorySize: 128,
    timeout: 10,
  },
};

const stagingConfig: EnvironmentConfig = {
  ...baseConfig,
  environment: "staging",
  serviceA: {
    environment: {
      LOG_LEVEL: "info",
      DB_HOST: "staging-db.internal",
    },
    memorySize: 128,
    timeout: 10,
  },
  serviceB: {
    environment: {
      LOG_LEVEL: "info",
      DB_HOST: "staging-db.internal",
    },
    memorySize: 128,
    timeout: 10,
  },
};

const prodConfig: EnvironmentConfig = {
  ...baseConfig,
  environment: "prod",
  serviceA: {
    environment: {
      LOG_LEVEL: "warn",
      DB_HOST: "prod-db.internal",
    },
    memorySize: 128,
    timeout: 10,
  },
  serviceB: {
    environment: {
      LOG_LEVEL: "warn",
      DB_HOST: "prod-db.internal",
    },
    memorySize: 128,
    timeout: 10,
  },
};

const configs: Record<string, EnvironmentConfig> = {
  dev: devConfig,
  staging: stagingConfig,
  prod: prodConfig,
};

export function getEnvironmentConfig(
  environment: string = "dev",
): EnvironmentConfig {
  const config = configs[environment];
  if (!config) {
    throw new Error(
      `Unknown environment: ${environment}. Available: ${Object.keys(configs).join(", ")}`,
    );
  }
  return config;
}

export const getEnvOrThrow = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Env ${key} not available`);
  return value;
};

export const ALL_ENVIRONMENTS = Object.keys(configs);
