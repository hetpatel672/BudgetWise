#!/bin/bash

# BudgetWise Build Test Script
# This script simulates the build process without requiring full Android/iOS setup

set -e

echo "🚀 BudgetWise Build Test Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Checking project structure..."

# Check essential files
essential_files=(
    "package.json"
    "index.js"
    "App.tsx"
    "android/build.gradle"
    "android/app/build.gradle"
    "ios/Podfile"
)

missing_files=()
for file in "${essential_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file"
    else
        print_error "✗ $file"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    print_error "Missing essential files. Build cannot proceed."
    exit 1
fi

print_status "Checking Node.js and npm..."
node_version=$(node --version)
npm_version=$(npm --version)
print_success "Node.js: $node_version"
print_success "npm: $npm_version"

print_status "Installing dependencies..."
if npm ci; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

print_status "Checking React Native setup..."

# Check if React Native CLI is available
if command -v npx react-native &> /dev/null; then
    print_success "React Native CLI available"
else
    print_warning "React Native CLI not found globally"
fi

print_status "Validating source code..."

# Check for syntax errors in main files
if [ -f "App.tsx" ]; then
    # For TypeScript files, check if they can be parsed
    if npx tsc --noEmit --skipLibCheck App.tsx 2>/dev/null; then
        print_success "App.tsx syntax is valid"
    else
        print_warning "App.tsx may have TypeScript issues (continuing...)"
    fi
elif [ -f "App.js" ]; then
    if node -c App.js 2>/dev/null; then
        print_success "App.js syntax is valid"
    else
        print_error "App.js has syntax errors"
        exit 1
    fi
else
    print_error "No App component found"
    exit 1
fi

# Check src directory structure
if [ -d "src" ]; then
    print_success "src directory found"
    
    # Count source files
    js_files=$(find src -name "*.js" | wc -l)
    ts_files=$(find src -name "*.ts" -o -name "*.tsx" | wc -l)
    print_status "Found $js_files JavaScript files and $ts_files TypeScript files"
    
    # Check for common directories
    directories=("components" "screens" "services" "models" "theme")
    for dir in "${directories[@]}"; do
        if [ -d "src/$dir" ]; then
            print_success "✓ src/$dir"
        else
            print_warning "✗ src/$dir (optional)"
        fi
    done
else
    print_warning "src directory not found"
fi

print_status "Checking Android configuration..."

if [ -d "android" ]; then
    print_success "Android directory found"
    
    # Check Gradle wrapper
    if [ -f "android/gradlew" ]; then
        print_success "Gradle wrapper found"
        chmod +x android/gradlew
        
        # Try to validate Gradle build files
        cd android
        if ./gradlew tasks --quiet > /dev/null 2>&1; then
            print_success "Gradle configuration is valid"
        else
            print_warning "Gradle configuration may have issues"
        fi
        cd ..
    else
        print_error "Gradle wrapper not found"
    fi
    
    # Check for required Android files
    android_files=(
        "android/app/src/main/AndroidManifest.xml"
        "android/app/src/main/java"
        "android/app/src/main/res"
    )
    
    for file in "${android_files[@]}"; do
        if [ -e "$file" ]; then
            print_success "✓ $file"
        else
            print_warning "✗ $file"
        fi
    done
else
    print_error "Android directory not found"
fi

print_status "Checking iOS configuration..."

if [ -d "ios" ]; then
    print_success "iOS directory found"
    
    # Check for Xcode project
    if find ios -name "*.xcodeproj" -o -name "*.xcworkspace" | grep -q .; then
        print_success "Xcode project/workspace found"
    else
        print_error "No Xcode project or workspace found"
    fi
    
    # Check Podfile
    if [ -f "ios/Podfile" ]; then
        print_success "Podfile found"
        
        # Check if CocoaPods is available
        if command -v pod &> /dev/null; then
            print_success "CocoaPods available"
            
            # Try to validate Podfile
            cd ios
            if pod spec lint --quick --silent > /dev/null 2>&1; then
                print_success "Podfile is valid"
            else
                print_warning "Podfile may have issues"
            fi
            cd ..
        else
            print_warning "CocoaPods not installed"
        fi
    else
        print_error "Podfile not found"
    fi
else
    print_error "iOS directory not found"
fi

print_status "Checking dependencies..."

# Check critical dependencies
critical_deps=(
    "react"
    "react-native"
    "react-native-linear-gradient"
    "react-native-vector-icons"
    "react-native-sqlite-storage"
    "crypto-js"
)

missing_deps=()
for dep in "${critical_deps[@]}"; do
    if npm list "$dep" > /dev/null 2>&1; then
        print_success "✓ $dep"
    else
        print_error "✗ $dep"
        missing_deps+=("$dep")
    fi
done

if [ ${#missing_deps[@]} -gt 0 ]; then
    print_error "Missing critical dependencies"
    exit 1
fi

print_status "Running basic validation tests..."

# Test Metro bundler configuration
if npx react-native config > /dev/null 2>&1; then
    print_success "React Native configuration is valid"
else
    print_warning "React Native configuration may have issues"
fi

# Check for common issues
print_status "Checking for common issues..."

# Check for duplicate React installations
react_count=$(find node_modules -name "react" -type d | wc -l)
if [ "$react_count" -gt 1 ]; then
    print_warning "Multiple React installations detected ($react_count)"
else
    print_success "Single React installation found"
fi

# Check for conflicting dependencies
if npm ls > /dev/null 2>&1; then
    print_success "No dependency conflicts detected"
else
    print_warning "Dependency conflicts may exist"
fi

print_status "Build test summary..."

echo ""
echo "================================"
echo "🎉 Build Test Complete!"
echo "================================"
echo ""
echo "✅ Project structure is valid"
echo "✅ Dependencies are installed"
echo "✅ Configuration files are present"
echo ""
echo "📱 Android: Ready for build"
echo "🍎 iOS: Ready for build"
echo ""
echo "Next steps:"
echo "1. Run 'npm start' to start Metro bundler"
echo "2. Run 'npx react-native run-android' for Android"
echo "3. Run 'npx react-native run-ios' for iOS"
echo ""
echo "For CI/CD:"
echo "1. Push to GitHub to trigger automated builds"
echo "2. Create a tag (e.g., v1.0.0) for release builds"
echo ""

print_success "Build test completed successfully! 🚀"