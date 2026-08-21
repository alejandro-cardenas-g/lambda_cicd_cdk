# Deployment Guide

Este proyecto usa AWS CDK para desplegar dos lambdas serverless: ServiceA y ServiceB.

## Estructura del Proyecto

```
project-cdk-cicd/
├── infra/                  # CDK Infrastructure
│   ├── lib/
│   │   ├── infra-stack.ts  # Main stack
│   │   └── lambdas/        # Lambda constructs
│   │       ├── service-a.ts
│   │       └── service-b.ts
│   └── bin/
│       └── infra.ts        # CDK app entry point
├── serviceA/               # Lambda function code
│   ├── src/
│   ├── dist/               # Compiled output
│   └── esbuild.config.js
├── serviceB/               # Lambda function code
│   ├── src/
│   ├── dist/               # Compiled output
│   └── esbuild.config.js
```

## Pasos para Desplegar

### 1. Compilar los Servicios

Primero, compila el código de ambas lambdas:

```bash
# Desde la carpeta del proyecto raíz
cd serviceA && npm run build && cd ..
cd serviceB && npm run build && cd ..
```

### 2. Construir y Desplegar el CDK

```bash
cd infra

# Ver qué se va a desplegar
npm run cdk -- diff

# Desplegar
npm run cdk -- deploy

# Desplegar a un entorno específico (con context)
npm run cdk -- deploy -c environment=prod
```

### 3. Obtener Outputs

Después del despliegue, obtén las URLs y recursos:

```bash
npm run cdk -- list-stacks
```

## Variables de Entorno

Puedes configurar variables de entorno para cada servicio en el CDK. Edita `infra/lib/infra-stack.ts`:

```typescript
this.serviceA = new ServiceA(this, 'ServiceA', {
  environment: {
    ENVIRONMENT: environment,
    MY_CUSTOM_VAR: 'value',
  },
  lambdaMemorySize: 256,
  lambdaTimeout: cdk.Duration.seconds(60),
});
```

## ServiceA - SQS Trigger Lambda

- **Trigger**: SQS Queue
- **Runtime**: Node.js 20.x
- **Memory**: 256 MB
- **Timeout**: 60s
- **Batch Size**: 10

El output del CDK incluirá:
- `ServiceAQueueUrl`: URL de la SQS queue
- `ServiceAQueueArn`: ARN de la SQS queue

## ServiceB - API Gateway + Lambda

- **Trigger**: HTTP (API Gateway)
- **Runtime**: Node.js 20.x
- **Memory**: 512 MB
- **Timeout**: 60s
- **CORS**: Habilitado para todos los orígenes

El output del CDK incluirá:
- `ServiceBApiUrl`: URL base del API

## Configuración de CI/CD

Para un pipeline CI/CD, asegúrate de:

1. Compilar los servicios antes de ejecutar CDK
2. Usar contexto de CDK para diferentes ambientes (dev, staging, prod)
3. Configurar credenciales de AWS antes de ejecutar CDK

Ejemplo con GitHub Actions:

```yaml
- name: Build Services
  run: |
    cd serviceA && npm run build && cd ..
    cd serviceB && npm run build && cd ..

- name: Deploy Infrastructure
  run: |
    cd infra
    npm run cdk -- deploy --require-approval never
  env:
    CDK_DEFAULT_ACCOUNT: ${{ secrets.AWS_ACCOUNT_ID }}
    CDK_DEFAULT_REGION: ${{ secrets.AWS_REGION }}
```

## Limpiar

Para destruir la infraestructura:

```bash
cd infra
npm run cdk -- destroy
```

## Troubleshooting

### Error: "Cannot find module 'serviceA/dist'"

- Verifica que hayas compilado ambos servicios con `npm run build`
- Asegúrate de que los archivos existan en `serviceA/dist` y `serviceB/dist`

### Error: "No valid credentials found"

- Configura tus credenciales de AWS: `aws configure`
- O usa variables de entorno: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`

### Lambda timeout o errores de ejecución

- Revisa los logs en CloudWatch
- Aumenta el timeout o memoria en los props del construct
- Verifica que el código compilado sea válido
