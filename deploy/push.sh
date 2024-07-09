#!/usr/bin/env bash

# Push image to ECR
tag="${1}"
environment="${2:-development}"
environment=$(echo "${environment}" | tr A-Z a-z)

if [[ -z "${tag}" ]]; then
  echo "No tag specified"
  exit 1
fi

echo "Pushing image tag ${tag} to ECR..."

repo_name="phasezero-medplum"
#if [[ "${environment}" == "development" ]]; then
#  repo_name="phasezero-medplum-dev"
#fi

ecr_repo_uri="491707605280.dkr.ecr.us-east-1.amazonaws.com/${repo_name}"

# Run package-server.sh to create medplum-server.tar.gz
echo "Running package-server.sh to create medplum-server.tar.gz..."
./deploy/package-server.sh

# Login to ECR
aws ecr get-login-password --region "us-east-1" | docker login --username AWS --password-stdin "${ecr_repo_uri}"

# Run ls -a to see the files in the current directory
ls -a

echo "Building Docker image..."


# Build the Docker image
docker build -t "${repo_name}:${tag}" -f ./Dockerfile .

# Tag the Docker image
docker tag "${repo_name}:${tag}" "${ecr_repo_uri}:${tag}"


# Push the Docker image to ECR
docker push "${ecr_repo_uri}:${tag}"

echo "Image pushed to ${ecr_repo_uri}:${tag}"
