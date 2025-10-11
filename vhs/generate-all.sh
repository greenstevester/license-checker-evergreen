#!/bin/bash
# Script to generate all VHS animations

set -e

echo "🎬 Generating VHS animations for license-checker-evergreen..."
echo ""

# Ensure demos directory exists
mkdir -p demos

# List of tape files
tapes=(
    "basic-usage"
    "json-output"
    "production-only"
    "csv-output"
    "markdown-output"
    "unknown-licenses"
    "fail-on-licenses"
    "direct-deps"
)

# Generate each animation
for tape in "${tapes[@]}"; do
    echo "📼 Generating $tape.gif..."
    vhs "vhs/$tape.tape"
    echo "✅ Generated $tape.gif"
    echo ""
done

echo "🎉 All animations generated successfully!"
echo "📁 Output location: demos/"
