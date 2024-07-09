#!/usr/bin/env bash

#if [[ -z "${DOCKERHUB_REPOSITORY}" ]]; then
#  echo "DOCKERHUB_REPOSITORY is missing"
#  exit 1
#fi

DOCKERHUB_REPOSITORY=491707605280.dkr.ecr.us-east-1.amazonaws.com/phasezero-medplum

# Fail on error
set -e

# Echo commands
set -x

# Build server tarball
tar \
  --exclude='*.ts' \
  --exclude='*.tsbuildinfo' \
  -czf medplum-server.tar.gz \
  package.json \
  package-lock.json \
  packages/core/package.json \
  packages/core/dist \
  packages/definitions/package.json \
  packages/definitions/dist \
  packages/fhir-router/package.json \
  packages/fhir-router/dist \
  packages/server/package.json \
  packages/server/dist

# Target platforms
PLATFORMS="--platform linux/amd64,linux/arm64"

# Build tags
TAGS="--tag $DOCKERHUB_REPOSITORY:latest --tag $DOCKERHUB_REPOSITORY"

# If this is a release, tag with version
# Release is specified with a "--release" argument
for arg in "$@"; do
  if [[ "$arg" == "--release" ]]; then
    VERSION=$(node -p "require('./package.json').version")
    TAGS="$TAGS --tag $DOCKERHUB_REPOSITORY:$VERSION"
    break
  fi
done

# Create and use Docker Buildx builder instances
docker buildx create --name mybuilder19 --driver docker-container --use

# Ensure we are using the correct builder instance for each build
docker buildx use mybuilder19

# Build and push Docker images using Docker version 19.03.6
docker buildx build $PLATFORMS $TAGS --push --build-arg DOCKER_VERSION=19.03.6 .

# Remove the builder instances
docker buildx rm mybuilder19
