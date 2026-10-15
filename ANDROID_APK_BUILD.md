# Build ZA Biweekly Timesheet for Android

App name: **ZA Biweekly Timesheet**  
Android application ID: **za.timesheet**

## Easiest option: build APK in GitHub Actions (cloud)

1. Create a GitHub repository and upload the contents of this project folder.
2. Open the repository's **Actions** tab.
3. Select **Build Android APK** and click **Run workflow**.
4. When the workflow finishes, open the successful run and download the `za-timesheet-debug-apk` artifact.
5. Extract the downloaded artifact; it contains `app-debug.apk`. Transfer it to your Android phone and open it to install. If prompted, allow installation from that source.

The workflow uses GitHub-hosted build machines and does not require Android Studio on your own computer. The repository must have Actions enabled.

## Build locally on Windows

Requirements: Node.js 20+, Java JDK 17 or 21, and Android SDK/Android Studio.

1. Extract the ZIP and open a terminal in this folder.
2. Run `npm install`.
3. Run `npx cap add android` (only once, if the `android` folder does not exist).
4. Run `npm run build`, then `npx cap sync android`.
5. Run `cd android` then `gradlew.bat assembleDebug`.
6. The APK is at `android\app\build\outputs\apk\debug\app-debug.apk`.

## Notes

This archive contains the app source and cloud-build workflow, not a compiled APK. The APK must be produced by a machine with Android build tools (locally or through GitHub Actions). A debug APK is suitable for testing and direct installation; publishing to Google Play normally requires a signed release build.
