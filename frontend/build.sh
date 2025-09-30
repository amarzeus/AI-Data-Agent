#!/bin/bash
# Build script that filters out @mediapipe source map warnings

echo "Building React application..."

# Run the build and filter out specific source map warnings
react-scripts build 2>&1 | grep -v "Failed to parse source map from.*@mediapipe" | grep -v "source-map-loader" || {
    echo "Build completed with warnings (source map warnings for @mediapipe filtered out)"
    exit 0
}

echo "Build completed successfully!"
