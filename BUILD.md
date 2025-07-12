# BudgetWise Build Guide

This guide provides instructions for building BudgetWise for Android and iOS platforms.

## Prerequisites

### General Requirements
- Node.js 18+ 
- npm or yarn
- Git

### Android Requirements
- Java Development Kit (JDK) 17 or 20
- Android Studio
- Android SDK (API level 34)
- Android SDK Build-Tools
- Android Emulator or physical device

### iOS Requirements (macOS only)
- Xcode 14+
- iOS Simulator or physical device
- CocoaPods
- iOS deployment target: 12.0+

## Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/hetpatel672/BudgetWise.git
cd BudgetWise
npm install
```

### 2. Run Build Test
```bash
./scripts/build-test.sh
```

This script validates your environment and project setup.

## Platform-Specific Builds

### Android Build

#### Debug Build
```bash
# Start Metro bundler
npm start

# In a new terminal, build and run
npx react-native run-android
```

#### Release Build
```bash
cd android
./gradlew assembleRelease

# APK will be generated at:
# android/app/build/outputs/apk/release/app-release.apk
```

#### Signed Release Build
1. Generate a signing key:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. Place the keystore in `android/app/`

3. Add to `android/gradle.properties`:
```properties
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=*****
MYAPP_UPLOAD_KEY_PASSWORD=*****
```

4. Build signed APK:
```bash
cd android
./gradlew assembleRelease
```

### iOS Build

#### Debug Build
```bash
# Install CocoaPods dependencies
cd ios
pod install
cd ..

# Start Metro bundler
npm start

# In a new terminal, build and run
npx react-native run-ios
```

#### Release Build
```bash
cd ios
xcodebuild -workspace BudgetWiseBare.xcworkspace \
  -scheme BudgetWiseBare \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath $PWD/build/BudgetWiseBare.xcarchive \
  archive
```

#### App Store Build
1. Open `ios/BudgetWiseBare.xcworkspace` in Xcode
2. Select "Any iOS Device" as the destination
3. Product → Archive
4. Use Organizer to upload to App Store Connect

## Troubleshooting

### Common Android Issues

#### Gradle Build Fails
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

#### Metro bundler issues
```bash
npx react-native start --reset-cache
```

#### ADB device not found
```bash
adb devices
adb kill-server
adb start-server
```

### Common iOS Issues

#### CocoaPods issues
```bash
cd ios
pod deintegrate
pod install
```

#### Xcode build fails
1. Clean build folder: Product → Clean Build Folder
2. Delete derived data: Xcode → Preferences → Locations → Derived Data → Delete
3. Restart Xcode

#### Simulator issues
```bash
xcrun simctl erase all
```

## Environment Variables

Create a `.env` file in the project root for environment-specific configurations:

```env
# API Configuration
API_BASE_URL=https://api.budgetwise.com
API_KEY=your_api_key_here

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_CRASH_REPORTING=true

# Build Configuration
BUILD_NUMBER=1
VERSION_NAME=1.0.0
```

## Build Optimization

### Bundle Size Optimization
```bash
# Analyze bundle size
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android-bundle.js \
  --assets-dest android-assets

# Enable Hermes (already enabled in template)
# Check android/app/build.gradle:
# enableHermes: true
```

### Performance Optimization
1. Enable Hermes JavaScript engine
2. Use ProGuard for Android (already configured)
3. Optimize images and assets
4. Remove unused dependencies

## Continuous Integration

### GitHub Actions
The project includes GitHub Actions workflows:

- `.github/workflows/ci.yml` - Continuous Integration
- `.github/workflows/build-and-release.yml` - Build and Release

### Triggering Builds
```bash
# Push to trigger CI
git push origin main

# Create tag for release
git tag v1.0.0
git push origin v1.0.0
```

## Code Signing

### Android
1. Generate upload key (see Android Release Build section)
2. Configure signing in `android/app/build.gradle`
3. Store keystore securely

### iOS
1. Create Apple Developer account
2. Generate certificates and provisioning profiles
3. Configure in Xcode project settings

## Distribution

### Android
- **Google Play Store**: Upload AAB file
- **Direct Distribution**: Share APK file
- **Internal Testing**: Use Google Play Console

### iOS
- **App Store**: Upload through Xcode or Application Loader
- **TestFlight**: Beta testing through App Store Connect
- **Enterprise**: Requires Apple Developer Enterprise Program

## Build Scripts

The project includes helpful build scripts in the `scripts/` directory:

- `build-test.sh` - Validates build environment
- Additional scripts can be added for automation

## Dependencies

### Core Dependencies
- React Native 0.72+
- React 18+
- TypeScript 5+

### Native Dependencies
- react-native-linear-gradient
- react-native-vector-icons
- react-native-sqlite-storage
- react-native-encrypted-storage
- react-native-chart-kit

### Linking
Most dependencies are auto-linked. For manual linking:
```bash
npx react-native link
```

## Support

For build issues:
1. Check this guide
2. Review GitHub Issues
3. Check React Native documentation
4. Contact the development team

## Version History

- v1.0.0 - Initial release
- Future versions will be documented here

---

**Note**: This guide assumes you have the necessary development environment set up. For detailed environment setup, refer to the [React Native Environment Setup](https://reactnative.dev/docs/environment-setup) guide.