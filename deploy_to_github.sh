#!/bin/bash
set -e

echo "=== GitHub Deployment Helper ==="

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: git command not found. Please install Git first."
    exit 1
fi

# Initialize git if not present
if [ ! -d ".git" ]; then
    echo "Initializing new git repository..."
    git init
else
    echo "Git repository already initialized."
fi

# Add changes
echo "Adding files..."
git add .

# Status check
git status

# Commit
echo "Committing..."
git commit -m "Initial deploy of PriceCheckApp" || echo "Nothing to commit"

# Branch rename
git branch -M main

# Remote Setup
echo ""
echo "---------------------------------------------------------"
echo "Please create a NEW repository on GitHub named 'PriceCheckApp'"
echo "Make sure it is Public and Empty (no README, no license)."
echo "---------------------------------------------------------"
echo "Enter your GitHub Repository URL (e.g. https://github.com/H-Zer0/PriceCheckApp.git):"
read -r REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "Error: Repository URL cannot be empty."
    exit 1
fi

# Remove existing origin if any
git remote remove origin 2>/dev/null || true

# Add new origin
git remote add origin "$REPO_URL"

# Push
echo "Pushing to GitHub..."
git push -u origin main

echo ""
echo "=== Deployment Code Uploaded! ==="
echo "Now, enable GitHub Pages:"
echo "1. Go to your Repository Settings -> Pages"
echo "2. Under 'Source', select 'Deploy from a branch'"
echo "3. Select 'main' branch and '/ (root)' folder"
echo "4. Click Save"
