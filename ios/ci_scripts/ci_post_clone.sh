#!/bin/sh

# Fail on any error
set -e

echo "Starting ci_post_clone.sh..."

# Navigate to the root of the repository
# CI_PRIMARY_REPOSITORY_PATH is provided by Xcode Cloud
if [ -z "$CI_PRIMARY_REPOSITORY_PATH" ]; then
    echo "CI_PRIMARY_REPOSITORY_PATH is not set. Assuming local run or different CI."
    # If running locally for testing, assume script is in ios/ci_scripts
    cd "$(dirname "$0")/../.."
else
    cd "$CI_PRIMARY_REPOSITORY_PATH"
fi

echo "Current directory: $(pwd)"

# 1. Install Node dependencies
if [ -f "package-lock.json" ]; then
    echo "Installing Node dependencies with npm ci..."
    npm ci
else
    echo "Installing Node dependencies with npm install..."
    npm install
fi

# 2. Install Ruby dependencies (CocoaPods)
if [ -f "Gemfile" ]; then
    echo "Installing Ruby gems..."
    bundle install
else
    echo "Gemfile not found. Installing CocoaPods directly..."
    brew install cocoapods
fi

# 3. Install Pods
echo "Installing Pods..."
cd ios
if [ -f "../Gemfile" ]; then
    bundle exec pod install
else
    pod install
fi

echo "ci_post_clone.sh completed successfully."
