# 🚀 CDK Infrastructure Setup - Resumen Completo

## ✅ Lo que se ha construido

### 1. **Constructs CDK Reutilizables**

#### `lib/lambdas/service-a.ts` - SQS Event Processing Lambda
```typescript
// Exporta: ServiceA construct
// Incluye:
// - SQS Queue con visibility timeout
// - Lambda función Node.js 20.x
// - Event source binding automático
// - Configuración de batch size

// Uso:
new ServiceA(this, 'ServiceA', {
  environment: { CUSTOM_VAR: 'value' },
  lambdaMemorySize: 256,
  lambdaTimeout: cdk.Duration.seconds(60),
})
```

#### `lib/lambdas/service-b.ts` - API Gateway + Lambda
```typescript
// Exporta: ServiceB construct
// Incluye:
// - Lambda función Node.js 20.x (Express compatible)
// - API Gateway REST API
// - CORS habilitado
// - Proxy routing para todas las rutas

// Uso:
new ServiceB(this, 'ServiceB', {
  environment: { CUSTOM_VAR: 'value' },
  lambdaMemorySize: 512,
  lambdaTimeout: cdk.Duration.seconds(60),
})
```

### 2. **Stack Principal**

#### `lib/infra-stack.ts`
- Orquesta ServiceA y ServiceB
- Configurable vía props
- Exports CloudFormation outputs
- Soporta múltiples ambientes

### 3. **Configuración de Ambientes**

#### `environments.ts` - Tres ambientes pre-configurados

| Aspecto | Dev | Staging | Prod |
|---------|-----|---------|------|
| Lambda Memory A | 256 MB | 512 MB | 1 GB |
| Lambda Memory B | 512 MB | 1 GB | 2 GB |
| Timeout | 60s | 120s | 300s |
| Log Level | debug | info | warn |
| DB Host | localhost | staging-db.internal | prod-db.internal |

### 4. **Scripts y Documentación**

```
project-cdk-cicd/
├── build-and-deploy.sh          # Script de build + deploy
├── DEPLOYMENT.md                # Guía de despliegue
├── INFRASTRUCTURE.md            # Detalles técnicos
├── README_INFRA.md             # Status y referencias
├── SETUP_SUMMARY.md            # Este archivo
└── infra/
    ├── environments.ts         # Configuración por ambiente
    ├── bin/infra.ts           # CDK app entry point
    ├── lib/infra-stack.ts     # Stack principal
    └── lib/lambdas/
        ├── service-a.ts       # SQS + Lambda construct
        └── service-b.ts       # API Gateway + Lambda construct
```

## 🎯 Flujo de Desarrollo

### Fase 1: Setup Inicial
```bash
# Clonar y navegar
cd project-cdk-cicd

# Ver estructura
cat README_INFRA.md
```

### Fase 2: Build
```bash
# Opción A - Script automatizado
./build-and-deploy.sh dev

# Opción B - Manual
cd serviceA && npm run build && cd ..
cd serviceB && npm run build && cd ..
cd infra && npm run build
```

### Fase 3: Deploy
```bash
# Desde infra/
npm run cdk -- deploy -c environment=dev
# O usar script:
./build-and-deploy.sh dev
```

### Fase 4: Test
```bash
# Obtener URL de API Gateway
aws cloudformation describe-stacks \
  --stack-name InfraStack-dev \
  --query 'Stacks[0].Outputs'

# Obtener URL de SQS
aws sqs get-queue-url --queue-name InfraStack-dev-ServiceA-Queue...
```

## 💡 Casos de Uso

### Caso 1: Agregar Variable de Entorno
```typescript
// En environments.ts
const devConfig: EnvironmentConfig = {
  environment: 'dev',
  serviceA: {
    environment: {
      LOG_LEVEL: 'debug',
      DB_HOST: 'localhost',
      API_KEY: 'dev-key-12345',  // ← NUEVA
    },
    // ...
  }
}
```

### Caso 2: Cambiar Recursos (dev → prod)
```typescript
// En environments.ts
const prodConfig: EnvironmentConfig = {
  environment: 'prod',
  serviceA: {
    environment: { /* ... */ },
    memorySize: 1024,  // ← Aumenta de 256 a 1GB
    timeout: 300,      // ← Aumenta de 60s a 300s
  },
  serviceB: {
    environment: { /* ... */ },
    memorySize: 2048,  // ← Aumenta de 512 a 2GB
    timeout: 300,
  }
}
```

### Caso 3: Agregar Recurso Nuevo (S3, DB, etc.)
```typescript
// En service-a.ts o service-b.ts
import * as s3 from 'aws-cdk-lib/aws-s3';

export class ServiceA extends Construct {
  public readonly bucket: s3.Bucket;  // ← NUEVA

  constructor(scope: Construct, id: string, props?: ServiceAProps) {
    super(scope, id);

    // Crear bucket
    this.bucket = new s3.Bucket(this, 'MyBucket', {
      versioned: true,
    });

    // Dar permisos a lambda
    this.bucket.grantReadWrite(this.lambda);

    // Pasar nombre del bucket como env var
    this.lambda.addEnvironment('BUCKET_NAME', this.bucket.bucketName);
  }
}
```

### Caso 4: Diferentes Configuraciones por Ambiente
```typescript
// En environments.ts
const stagingConfig: EnvironmentConfig = {
  environment: 'staging',
  serviceA: {
    environment: {
      DB_HOST: 'staging-db.example.com',
      CACHE_TTL: '3600',
      DEBUG: 'false',
    },
    memorySize: 512,
  },
  serviceB: {
    environment: {
      DB_HOST: 'staging-db.example.com',
      CACHE_TTL: '3600',
      DEBUG: 'false',
    },
    memorySize: 1024,
  }
}
```

## 🔐 Seguridad

### Variables Sensibles
Usa AWS Secrets Manager para credenciales:

```typescript
// En lib/infra-stack.ts
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

const secret = new secretsmanager.Secret(this, 'DbPassword', {
  secretName: `db-password-${environment}`,
});

this.serviceA.lambda.addEnvironment('DB_PASSWORD_ARN', secret.secretArn);
```

### IAM Permissions
Todas las lambdas tienen permisos mínimos. Para agregar más:

```typescript
// En service-a.ts
bucket.grantRead(this.lambda);      // Solo lectura
sqsQueue.grantSendMessages(this.lambda);  // Solo enviar
```

## 📊 Monitoreo

### CloudWatch Logs
```bash
# Ver logs en real-time
aws logs tail /aws/lambda/InfraStack-dev-ServiceA-Function --follow
aws logs tail /aws/lambda/InfraStack-dev-ServiceB-Function --follow
```

### CloudWatch Metrics
- Duration
- Invocations
- Errors
- Throttles
- ConcurrentExecutions

### X-Ray Tracing (Opcional)
```typescript
// En service-a.ts
import * as xray from 'aws-cdk-lib/aws-xray';

this.lambda = new lambda.Function(this, 'Function', {
  // ...
  tracingConfig: lambda.TracingConfig.ACTIVE,
});
```

## 🎓 Próximas Mejoras

1. **Autenticación API Gateway**
   - Agregar Cognito User Pool
   - O API Keys

2. **Base de Datos**
   - RDS PostgreSQL
   - DynamoDB

3. **Ciencia de Datos**
   - Dead Letter Queue (DLQ) para ServiceA
   - Retry policies

4. **CI/CD**
   - GitHub Actions
   - Automated tests
   - Canary deployments

5. **Observabilidad**
   - X-Ray tracing
   - CloudWatch alarms
   - SNS notifications

## 📞 Comandos Útiles

```bash
# Build y deploy
./build-and-deploy.sh dev

# Ver qué va a cambiar
cd infra && npm run cdk -- diff -c environment=dev

# Validar template
npm run cdk -- synth

# Listar stacks
npm run cdk -- list-stacks

# Destruir stack
npm run cdk -- destroy -c environment=dev

# Ver contexto disponible
npm run cdk -- context
```

## 🏁 Listo para Empezar

```bash
# 1. Compilar servicios
cd serviceA && npm run build && cd ..
cd serviceB && npm run build && cd ..

# 2. Ir a infra
cd infra

# 3. Ver cambios
npm run cdk -- diff

# 4. Desplegar
npm run cdk -- deploy

# 5. Ver outputs
npm run cdk -- list-stacks
```

---

**Última actualización**: 2026-08-20
**Estado**: ✅ Listo para desplegar
**Ambientes soportados**: dev, staging, prod
