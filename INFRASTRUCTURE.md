# Infrastructure Overview

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      AWS CDK Stack                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          ServiceA - SQS Processing Lambda            │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Node.js 20.x                                  │  │  │
│  │  │  Memory: 256MB (configurable)                  │  │  │
│  │  │  Timeout: 60s (configurable)                   │  │  │
│  │  │  Handler: index.handler (processes SQS msgs)   │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                        ▲                              │  │
│  │                        │                              │  │
│  │              ┌─────────┴──────────┐                  │  │
│  │              │   SQS Queue        │                  │  │
│  │              │ Visibility: 300s   │                  │  │
│  │              │ Batch Size: 10     │                  │  │
│  │              └────────────────────┘                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      ServiceB - REST API Lambda                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Node.js 20.x                                  │  │  │
│  │  │  Memory: 512MB (configurable)                  │  │  │
│  │  │  Timeout: 60s (configurable)                   │  │  │
│  │  │  Handler: index.handler (Express app)          │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                        ▲                              │  │
│  │                        │                              │  │
│  │              ┌─────────┴──────────┐                  │  │
│  │              │  API Gateway       │                  │  │
│  │              │  CORS: Enabled     │                  │  │
│  │              │  Proxy: /proxy+    │                  │  │
│  │              └────────────────────┘                  │  │
│  │                        ▲                              │  │
│  │              HTTP Requests from Clients              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Estructura de Carpetas

```
infra/
├── bin/
│   └── infra.ts                    # CDK app entry point
├── lib/
│   ├── infra-stack.ts              # Main stack definition
│   └── lambdas/
│       ├── service-a.ts            # ServiceA construct
│       └── service-b.ts            # ServiceB construct
├── environments.ts                 # Environment configurations
├── cdk.json                        # CDK configuration
└── package.json
```

## Configuración de Ambientes

El archivo `environments.ts` define configuraciones para **dev**, **staging**, y **prod**.

### Dev Environment

```typescript
{
  environment: 'dev',
  serviceA: {
    environment: {
      LOG_LEVEL: 'debug',
      DB_HOST: 'localhost',
    },
    memorySize: 256,
    timeout: 60,
  },
  serviceB: {
    environment: {
      LOG_LEVEL: 'debug',
      DB_HOST: 'localhost',
    },
    memorySize: 512,
    timeout: 60,
  }
}
```

### Staging & Prod

Aumentan memoria, timeout, y ajustan variables de entorno para bases de datos de staging/prod.

## Cómo Personalizar

### 1. Agregar Nueva Variable de Entorno

En `environments.ts`:

```typescript
const prodConfig: EnvironmentConfig = {
  ...baseConfig,
  environment: 'prod',
  serviceA: {
    environment: {
      LOG_LEVEL: 'warn',
      DB_HOST: 'prod-db.internal',
      MY_NEW_VAR: 'my-value',  // ← Nueva variable
    },
    // ...
  },
  // ...
};
```

### 2. Aumentar Recursos de Lambda

En `environments.ts`:

```typescript
serviceB: {
  environment: { /* ... */ },
  memorySize: 2048,  // ← Aumenta memoria
  timeout: 300,      // ← Aumenta timeout
}
```

### 3. Agregar un Nuevo Recurso (Database, S3, etc.)

En `infra/lib/lambdas/service-a.ts`:

```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';

export class ServiceA extends Construct {
  public readonly lambda: lambda.Function;
  public readonly queue: sqs.Queue;
  public readonly bucket: s3.Bucket;  // ← Nuevo

  constructor(scope: Construct, id: string, props?: ServiceAProps) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, 'Bucket', {
      versioned: true,
    });

    // Grant lambda permission to access bucket
    this.bucket.grantReadWrite(this.lambda);

    this.lambda = new lambda.Function(this, 'Function', {
      // ...
      environment: {
        NODE_ENV: 'production',
        BUCKET_NAME: this.bucket.bucketName,  // ← Pasa nombre del bucket
        ...props?.environment,
      },
    });
  }
}
```

### 4. Agregar Outputs al Stack

En `infra/lib/infra-stack.ts`:

```typescript
new cdk.CfnOutput(this, 'MyCustomOutput', {
  value: this.serviceA.bucket.bucketName,
  description: 'Bucket name for ServiceA',
  exportName: `ServiceABucket-${environment}`,
});
```

## Variables de Entorno Disponibles

Cada lambda recibe automáticamente:

- `ENVIRONMENT`: dev, staging, o prod (según la configuración)
- `NODE_ENV`: siempre es 'production'
- Plus cualquier variable definida en `environments.ts`

## Despliegue

### Desarrollo

```bash
./build-and-deploy.sh dev
```

### Staging

```bash
./build-and-deploy.sh staging
```

### Producción

```bash
./build-and-deploy.sh prod
```

## Acceso a Recursos desde Code

### ServiceA - Acceder a SQS Queue URL

```typescript
const queueUrl = process.env.QUEUE_URL;
const sqsClient = new SQSClient();
await sqsClient.send(new SendMessageCommand({
  QueueUrl: queueUrl,
  MessageBody: JSON.stringify({ /* ... */ }),
}));
```

### ServiceB - Acceder a Variables de Entorno

```typescript
const dbHost = process.env.DB_HOST;
const logLevel = process.env.LOG_LEVEL;
```

## Monitoreo

### CloudWatch Logs

Todas las lambdas envían logs a CloudWatch automáticamente:

```bash
# Ver logs de ServiceA
aws logs tail /aws/lambda/InfraStack-dev-ServiceA-Function --follow

# Ver logs de ServiceB
aws logs tail /aws/lambda/InfraStack-dev-ServiceB-Function --follow
```

### CloudWatch Metrics

- Invocations
- Duration
- Errors
- Throttles
- Concurrent Executions

## Costos Estimados (AWS Free Tier)

- **Lambda**: 1M invocaciones/mes gratis + 400K GB-seconds/mes
- **API Gateway**: 1M API calls/mes gratis
- **SQS**: 1M requests/mes gratis
- **CloudWatch Logs**: 5GB ingestion gratis

Para este proyecto con uso moderado (dev/staging), típicamente dentro del free tier.

## Próximos Pasos

1. Implementar autenticación en API Gateway (Cognito, API Key, etc.)
2. Agregar base de datos (RDS, DynamoDB)
3. Configurar Dead Letter Queues para SQS
4. Agregar X-Ray para tracing
5. Configurar alarms en CloudWatch
6. Implementar canary deployments
