#!/bin/bash
set -e

echo "Running post-merge setup..."

# Install/update npm dependencies
npm install

echo "Post-merge setup complete."
