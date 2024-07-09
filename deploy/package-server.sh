#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define variables
OUTPUT_FILE="medplum-server.tar.gz"
BUILD_DIR="build"

# Clean up previous build artifacts
echo "Cleaning up previous build artifacts..."
rm -rf ${BUILD_DIR}
rm -f ${OUTPUT_FILE}

# Create build directory
echo "Creating build directory..."
mkdir -p ${BUILD_DIR}

# Copy necessary files to build directory
echo "Copying necessary files to build directory..."
cp -R packages/server ${BUILD_DIR}/server
cp -R node_modules ${BUILD_DIR}/node_modules
cp package.json ${BUILD_DIR}/
cp package-lock.json ${BUILD_DIR}/
cp packages/core/package.json ${BUILD_DIR}/
cp -R packages/core/dist ${BUILD_DIR}/core/
cp packages/definitions/package.json ${BUILD_DIR}/
cp -R packages/definitions/dist ${BUILD_DIR}/definitions/
cp packages/fhir-router/package.json ${BUILD_DIR}/
cp -R packages/fhir-router/dist ${BUILD_DIR}/fhir-router/

# Ensure entire dist directory for the server is copied
cp -R packages/server/dist ${BUILD_DIR}/server/

# Navigate to build directory
cd ${BUILD_DIR}

# Install production dependencies
echo "Installing production dependencies..."
npm ci --only=production

# Package files into tar.gz
echo "Packaging files into ${OUTPUT_FILE}..."
tar -czf ../${OUTPUT_FILE} .

# Navigate back to original directory
cd ..

# Clean up build directory
echo "Cleaning up build directory..."
#rm -rf ${BUILD_DIR}

echo "Build complete. Output file: ${OUTPUT_FILE}"
