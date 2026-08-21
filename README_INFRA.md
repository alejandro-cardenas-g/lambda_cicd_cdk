# CDK Infrastructure Setup - Project Status

## ✅ Completado

### 1. Estructura CDK Creada

```
infra/
├── lib/lambdas/
│   ├── service-a.ts      (ServiceA construct: SQS + Lambda)
│   └── service-b.ts      (ServiceB construct: API Gateway + Lambda)
├── lib/infra-stack.ts    (Main stack que orquesta todo)
├── bin/infra.ts          (CDK app entry point)
├── environments.ts       (Config para dev, staging, prod)
└── [Compilado ✓]
```

### 2. Constructs Reutilizables

**ServiceA.ts**

- SQS Queue con timeout configurable
- Lambda Node.js 20.x
- Event source configurada automáticamente
- Batch size de 10 mensajes

**ServiceB.ts**

- API Gateway REST API
- Lambda Node.js 20.x con handler Express
- CORS habilitado
- Proxy para rutas dinámicas

### 3. Configuración de Ambientes

Tres ambientes pre-configurados en `environments.ts`:

| Ambiente | Memory A | Memory B | Timeout A | Timeout B | DB Host             |
| -------- | -------- | -------- | --------- | --------- | ------------------- |
| dev      | 256 MB   | 512 MB   | 60s       | 60s       | localhost           |
| staging  | 512 MB   | 1GB      | 120s      | 120s      | staging-db.internal |
| prod     | 1GB      | 2GB      | 300s      | 300s      | prod-db.internal    |

### 4. Scripts de Despliegue

```bash
# Build automático y despliegue
./build-and-deploy.sh [dev|staging|prod]

# O manualmente:
npm run build              # En infra/
npm run cdk -- deploy      # En infra/
```

## 🚀 Próximos Pasos

### 1. Compilar los Servicios

```bash
cd serviceA && npm run build
cd ../serviceB && npm run build
cd ../infra
```

### 2. Configurar AWS

```bash
aws configure  # Configura tus credenciales
```

### 3. Desplegar (Dev)

```bash
./build-and-deploy.sh dev
```

### 4. Obtener Outputs

```bash
# Ver URL de API Gateway
aws cloudformation describe-stacks --stack-name InfraStack-dev --query 'Stacks[0].Outputs'
```

## 📊 Diagrama de Flujo

```
External Events
    ↓
┌─────────────────────────┐
│   SQS Queue (ServiceA)  │
│                         │
│  ← Messages from app    │
└───────────┬─────────────┘
            ↓
    ┌──────────────────┐
    │  Lambda ServiceA │  (Procesa eventos)
    │  Node.js 20.x    │
    └──────────────────┘

HTTP Clients
    ↓
┌─────────────────────────────┐
│  API Gateway (ServiceB)     │
│  CORS + Proxy               │
└───────────┬─────────────────┘
            ↓
    ┌──────────────────┐
    │  Lambda ServiceB │  (Express App)
    │  Node.js 20.x    │
    └──────────────────┘
```

## 🔧 Personalización

### Agregar Variable de Entorno

En `environments.ts`:

```typescript
serviceA: {
  environment: {
    LOG_LEVEL: 'debug',
    MY_VAR: 'value',  // ← Nueva
  },
}
```

### Aumentar Recursos

En `environments.ts`:

```typescript
serviceB: {
  memorySize: 2048,   // ← Aumenta memoria
  timeout: 300,       // ← Aumenta timeout
}
```

### Agregar Recurso (S3, DB, etc.)

1. Abre `service-a.ts` o `service-b.ts`
2. Agrega el construct (S3 Bucket, RDS, DynamoDB, etc.)
3. Pasa el nombre/URL como variable de entorno
4. Haz grant de permisos a la lambda

Ejemplo:

```typescript
const bucket = new s3.Bucket(this, "MyBucket", { versioned: true });
bucket.grantReadWrite(this.lambda);
this.lambda.addEnvironment("BUCKET_NAME", bucket.bucketName);
```

## 📚 Archivos de Referencia

- **DEPLOYMENT.md** - Guía completa de despliegue
- **INFRASTRUCTURE.md** - Detalles técnicos y arquitectura
- **environments.ts** - Configuraciones por ambiente
- **lib/lambdas/** - Constructs reutilizables

## ⚙️ Configuración Actual

**ServiceA**

- Tipo: SQS Event Source
- Runtime: Node.js 20.x
- Handler: `dist/index.handler`
- Batch: 10 mensajes
- Env vars: ENVIRONMENT + custom

**ServiceB**

- Tipo: API Gateway → Lambda
- Runtime: Node.js 20.x
- Handler: `dist/index.handler` (Express)
- CORS: Habilitado
- Env vars: ENVIRONMENT + custom

## Github actions

Es necesario configurar las siguientes secrets:

Estos datos los puedes obtener de la salida de cloudformation

SERVICE_A_LAMBDA_NAME
SERVICE_B_LAMBDA_NAME
AWS_ROLE_ARN
AWS_REGION
SERVICES_BUCKET_NAME

## 🎯 Listo para:

- ✅ Configurar variables de entorno por ambiente
- ✅ Desplegar múltiples ambientes
- ✅ Escalar recursos por ambiente
- ✅ Agregar recursos adicionales (DB, S3, etc.)
- ✅ Integrar con CI/CD

## 📞 Soporte

Para actualizar configuración:

1. Edita `environments.ts`
2. Ejecuta `npm run cdk -- diff`
3. Ejecuta `npm run cdk -- deploy`
