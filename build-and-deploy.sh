#!/bin/bash

set -e

# Parse arguments
ENVIRONMENT=${1:-dev}
PROFILE=${2:-}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
  echo "❌ Error: ENVIRONMENT must be dev, staging, or prod"
  echo "Usage: ./build-and-deploy.sh [environment] [aws-profile]"
  echo "Example: ./build-and-deploy.sh dev my-aws-profile"
  exit 1
fi

# Set AWS_PROFILE if provided
if [ -n "$PROFILE" ]; then
  export AWS_PROFILE=$PROFILE
  echo "📋 Using AWS Profile: $PROFILE"
else
  echo "📋 Using default AWS Profile"
fi

echo "====== Building Services ======"

cd serviceA
echo "🔨 Building Service A..."
npm run build > /dev/null 2>&1
cd ..

cd serviceB
echo "🔨 Building Service B..."
npm run build > /dev/null 2>&1
cd ..

echo "✅ Services built successfully"
echo ""

cd infra

echo "====== Deploying Infrastructure ($ENVIRONMENT) ======"
echo ""

# Synthesize CloudFormation template
npm run cdk -- synth --profile=this-profile -c CICD_REPOSITORY_STR=repo:github_name/lambda_cicd_cdk:*
echo "📝 Synthesizing CloudFormation template..."
npm run cdk -- synth -c environment=$ENVIRONMENT > /dev/null 2>&1

# Show diff
echo ""
echo "====== Changes to be deployed ======"
npm run cdk -- diff -c environment=$ENVIRONMENT || true

echo ""
echo "====== Deploying ======"
npm run cdk -- deploy -c environment=$ENVIRONMENT --require-approval never

echo ""
echo "====== ✅ Deployment Complete ======"
echo ""
echo "📊 To view outputs:"
echo "   npm run cdk -- list -c environment=$ENVIRONMENT"
echo ""
echo "🗑️  To destroy:"
echo "   npm run cdk -- destroy -c environment=$ENVIRONMENT"
