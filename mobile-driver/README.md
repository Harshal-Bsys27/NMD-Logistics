# NMD Logistics Driver

Standalone native Android application for NMD delivery personnel. This is a
bare React Native project and builds a regular APK; Expo Go is not used.

## Backend

The app connects directly to the existing NMD Supabase project. It uses
Supabase Auth, the existing `users`, `delivery_personnel`, `orders`, and
`order_assignments` tables, the `complete_assignment_with_proof` RPC, and the
private `delivery-proofs` storage bucket.

The current Supabase row-level security policies scope driver reads and
assignment updates to the signed-in driver's account. The Android app also
checks the account role before showing driver data, but database policies and
workflow triggers remain the authorization boundary.

Use only the Supabase project URL and public anon/publishable key in this app.
Never put `SUPABASE_SERVICE_ROLE_KEY` or another server secret in the Android
project or APK.

## Enable native Google sign-in

The Google button opens the native Google account picker and passes the returned
ID token to Supabase; it does not open a browser. Configure both Android and
Web OAuth clients before expecting Google sign-in to work:

1. In Google Cloud Console, configure the OAuth consent screen.
2. Create an **Android** OAuth client for package `com.nmddriver`. Add the
   SHA-1 fingerprint of the key used to sign the APK. For the current local
   debug-signed APK, get it with:

   ```powershell
   keytool -list -v -keystore android\app\debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

3. Create a **Web application** OAuth client and add your Supabase project's
   callback URL to its authorized redirect URIs:
   `https://<project-ref>.supabase.co/auth/v1/callback`
4. In Supabase Dashboard, open **Authentication → Providers → Google**, enable
   Google, and enter the Web client ID and client secret.
5. Add the Web client ID as `GOOGLE_WEB_CLIENT_ID` in `mobile-driver/.env`.
   Keep the client secret only in Google Cloud/Supabase; never add it to the app.
6. Rebuild and reinstall the APK after changing `.env` or native app code.
   The Google provider configuration itself is hosted in Supabase and does not
   require an APK rebuild.

Google sign-in does not grant driver access by itself. The Google identity must
resolve to an existing active NMD driver account; the app checks the same
driver role and account status after authentication.

## Local setup

1. Install Node.js 22.11 or newer, Android Studio, Android SDK Platform 37,
   Android SDK Build-Tools 37, and NDK 27.1.12297006.
2. Copy `.env.example` to `.env` and set `SUPABASE_URL`,
   `SUPABASE_ANON_KEY`, `GOOGLE_WEB_CLIENT_ID`, and `NMD_WEB_APP_URL` to the
   values from the existing Supabase/Google projects. Set `NMD_WEB_APP_URL` to
   the public HTTPS origin of the deployed dashboard; localhost feedback links
   cannot be opened by customers. `.env` is ignored by Git. Google sign-in can
   be configured later; email/password sign-in remains available without it.
3. From this folder, install dependencies with `npm install`.
4. Connect an Android phone with USB debugging enabled, or start an Android
   emulator.
5. Build and install a development APK with `npm run android`.

To build a debug APK without installing it, run:

```powershell
npm run build:apk
```

The debug APK is written to
`android/app/build/outputs/apk/debug/app-debug.apk`. It is for development and
requires Metro; use a release APK for a standalone install.

To build a standalone release APK, run:

```powershell
npm run build:release-apk
```

On Windows, the build script also works around the CMake 260-character path
limit by using temporary short drive mappings and a pre-generated JS bundle; it
restores the Android project files and removes those temporary mappings when
the build finishes.

The release APK is written to
`android/app/build/outputs/apk/release/app-release.apk`. With a
USB-debugging-enabled phone connected, install it with:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r android\app\build\outputs\apk\release\app-release.apk
```

The generated release currently uses the template's debug signing key and is
suitable for local sideloading only. Configure a private release keystore
outside source control before distributing it or publishing it to Google Play.

## First-version workflow

- Sign in with an existing active driver account.
- Sign in with email/password or the native Google account picker after
  configuring the provider.
- View assignments and client, pickup, delivery, and package details.
- Receive assignment and driver-status changes through Supabase Realtime, with
  periodic and pull-to-refresh fallbacks when the live connection is unavailable.
- Accept or decline pending assignments and start accepted deliveries.
- Record recipient and notes, capture the recipient's signature, or record a
  no-signature reason with a required proof photo, then complete delivery.
- Review saved delivery proofs and private proof photos.
- After completion, the server sends a one-time feedback link by email only
  when the order has an email address and recorded customer consent. Drivers do
  not generate or share feedback links.
- Update profile photo and availability; view the profile photo full-screen or
  in the deliveries header, and review availability history, delivery totals,
  and customer feedback.
- Navigate between active deliveries, delivery history, proofs, and your
  driver profile.

Push notifications, offline queueing, and background location are intentionally
not enabled in this first version.

Customer email delivery also requires the database migration and server-side
`GMAIL_SMTP_USER`, `GMAIL_APP_PASSWORD`, and `NEXT_PUBLIC_APP_URL` settings. See
the [customer delivery feedback guide](../docs/user-guides/CUSTOMER-DELIVERY-FEEDBACK.md).
