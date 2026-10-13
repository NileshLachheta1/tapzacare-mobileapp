# Tapza Care

Bare React Native 0.87.1 and strict TypeScript implementation of the Tapza Care design. The app implements the config-driven home, appointment booking and prescriptions with locally saved daily dose tracking. Android and iOS native projects are checked in; Expo is not used.

## Implemented

- Six home sections: hero banner, category chips, quick actions, service grid, doctor carousel and offer strip.
- Normal and Diwali JSON layouts. Switch at runtime from Home or Profile; colours, hero artwork, section order and items change together.
- Config-driven bottom tabs, central theme-derived colours/spacing/type sizes, and validated section-specific item shapes.
- Solid, gradient and image section backgrounds, including bundled SVG illustration references.
- Reanimated header compression, hero parallax and first-viewport section reveals, respecting reduced motion.
- Doctor and service cards open a draggable date/slot booking sheet, with 14 clinic dates, unavailable times, rupee prices and accessible image fallbacks.
- Optimistic pending appointments, 201 reconciliation, duplicate-tap protection, rollback, a Reanimated success check and confirmed visits in Bookings.
- Slot skeletons, empty/error retries, service-provider retries and 409 conflict recovery that preserves the doctor/date and refreshes availability.
- Content-shaped skeletons, pull-to-refresh, empty and retry states, per-variant last-good config caches and a bundled cold-start fallback.
- Prescription list and native-stack detail screens with morning/afternoon/night schedules, date navigation, per-day progress, mark-taken/undo and AsyncStorage persistence.
- Prescription skeletons, empty/error retries, preserved list on refresh failure, and safe dose-history read/save failure recovery.
- Profile controls for latency, endpoint failures, empty responses, one-shot booking outcomes and failed dose saves.
- Tests for config validation, renderer actions, caching, startup/theme switching, booking screens, optimistic reconciliation, rollback, conflicts and stale-request cancellation.

Dose history survives app restarts on this device. Online booking history and mock reservations remain session-scoped. Offline booking requests and their reconciled results persist locally.

Repository: [NileshLachheta1/tapzacare-mobileapp](https://github.com/NileshLachheta1/tapzacare-mobileapp). Final local APK: [`dist/TapzaCare-1.1.0-universal.apk`](dist/TapzaCare-1.1.0-universal.apk), with [`SHA256SUMS`](dist/SHA256SUMS). See [`docs/ASSIGNMENT_REVIEW.md`](docs/ASSIGNMENT_REVIEW.md) for the requirement audit and evidence. The initial reviewed application and subsequent bonus implementation are separate source commits; earlier development milestones were not reconstructed. APK release publishing remains pending. Actual time spent was not supplied and is not estimated.

## Demo Video

[Demo Video](https://raw.githubusercontent.com/NileshLachheta1/tapzacare-mobileapp/main/docs/demo/tapza-care-bonus-demo.mp4) · [Core Demo Video](https://raw.githubusercontent.com/NileshLachheta1/tapzacare-mobileapp/main/docs/demo/tapza-care-demo.mp4) · [Recording Notes](docs/demo/README.md)

## Run on Android

Use Node 24 (`.nvmrc` is included), npm, a JDK and the Android SDK. This machine was built with JDK 21, Android SDK 37, Build Tools 37.0.0 and NDK 27.1.12297006. The default target SDK is 36 and minimum SDK is 24.

```sh
nvm install
nvm use
npm ci
npm start
```

In another terminal, select the same Node version, connect an Android device with USB debugging or start an Android emulator, then:

```sh
nvm use
npm run android
```

For a USB-connected device, `adb reverse tcp:8081 tcp:8081` makes Metro accessible. Configure `ANDROID_HOME` and Java using your local Android Studio setup. `android/local.properties` may contain your local `sdk.dir`; it is ignored by Git.

React Native requires a newer Node than this machine's original Node 20. Node 24 has been installed through nvm for this project; use `nvm use` in each project terminal. No default Node alias needs to be changed.

## Run on iOS

Xcode and CocoaPods are required. After selecting Node 24 and installing npm dependencies:

```sh
cd ios
pod install
cd ..
npm run ios
```

Open `ios/TapzaCare.xcworkspace` in Xcode when running manually. CocoaPods installed successfully on this machine. Install a simulator runtime in Xcode or select a connected device before launching. The local `ios/.xcode.env.local` points to the installed Node 24 executable and is ignored; other machines should set `NODE_BINARY` through their local Xcode environment when necessary.

## Build an APK

For a development APK that uses Metro:

```sh
npm run android:apk
```

For an internal review APK that includes the production JS bundle:

```sh
cd android
./gradlew assembleRelease
```

The output is `android/app/build/outputs/apk/release/app-release.apk`. Install with:

```sh
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

The final review build includes arm64-v8a, armeabi-v7a, x86 and x86_64, uses the template's development signing key, and does not require Metro. Package: `com.tapza.care`; version: `1.1.0` (code `3`). Use a private production key for store distribution. APK binaries are excluded from Git; upload the named file as a release asset when publishing.

## Check the code

```sh
npm run typecheck
npm run lint
npm test
npm run bundle:android
```

Jest uses the official Worklets mock and Reanimated resolver. Only the native bottom-sheet gesture/portal boundary is replaced for screen tests; the booking UI, controller and mock API remain real. Native animations and drag/scroll behaviour require device review. The bundling script writes temporary verification outputs under `/tmp`. Required native dependencies are autolinked.

## Change the layout without changing a component

Edit `src/mocks/everyday.json` or `src/mocks/diwali.json` and reload the app. The in-process `GET /config` mock returns that document, then the configuration repository validates it and the provider applies it atomically. In a real integration only the transport would change; screens do not import fixture data directly.

A section uses this envelope:

```json
{
  "id": "services",
  "type": "service_grid",
  "title": "Care, close to home",
  "background": { "kind": "color", "value": "#EDF1EB" },
  "columns": 2,
  "items": []
}
```

- Required theme fields follow the assignment. Optional surface/border colours and `designTokens` extend them; all defaults live in `src/theme/tokens.ts`.
- `designTokens.spacingScale`, `fontScale` and `radiusScale` control the central scales. OS font scaling remains enabled independently.
- Gradient `background.value` is a JSON string containing two or more six-digit hex colours, e.g. `["#E3F0E8","#EDF1EB"]`. Malformed gradients use the theme surface.
- Image backgrounds accept an HTTPS image or `asset://clinic-pattern`. Hero and service media also support bundled `asset://` illustration references.
- Unknown section types are skipped. Invalid known section items reject that response and preserve the last good config.
- Tab screen values are `home`, `bookings`, `prescriptions`, `profile`. Icons come from a finite whitelist; unfamiliar icons use a safe fallback.
- Unique section/tab IDs and unique tab screen values are required, with a reachable Home tab.
- Caches are keyed separately by variant and validated again on read. Corrupt/absent cache falls back to the matching bundled config.

Mock APIs now cover `GET /config → LayoutConfig`, `GET /doctors → Doctor[]`, `GET /slots?doctorId=&date=YYYY-MM-DD → Slot[]`,  `POST /bookings {doctorId, slotId} → 201 + Booking` and `GET /prescriptions → Prescription[]`. Carousel next-slot labels query live mock availability over the next 14 clinic dates, omit expired/occupied times, and refresh after confirmations/conflicts and when the displayed slot expires. Loading, unavailable and error copy replaces stale sample times.

## Booking behaviour

Tap a doctor or service, choose a date and available time, then confirm. Services use their configured `doctorId`; their fee remains the service price. The POST body contains exactly `doctorId` and `slotId`, with the selected service retained in the client appointment summary.

Dates and times use **Asia/Kolkata (IST)** regardless of the phone timezone. Dates cover today plus 13 days; past times and occupied slots are disabled. Today can have no remaining times after clinic hours. Changing the date clears the selection and cancels the previous slot request. Responses are validated before they enter UI state.

Confirmation creates a pending appointment immediately and locks dismissal/duplicate submission until the request resolves. A 201 replaces that record with the server booking and plays the success animation, respecting reduced motion. A 503 removes the pending appointment and allows retry with the same selection. A 409 removes it, clears the taken time, preserves doctor/date and reloads slots. No other slot is selected automatically. The mock reserves a slot atomically, so simultaneous confirmations cannot both succeed.

The sheet supports handle/content dragging, two snap points, swipe-down dismissal, backdrop dismissal and Android Back, with an accessible Close action. Controls inside the sheet use Gorhom's gesture-compatible touchables; the horizontal date strip uses Gesture Handler's ScrollView. During confirmation, close gestures/backdrop dismissal are disabled and Android Back is consumed. Bookings displays pending and confirmed records from the same shared state.

Online booking history remains session-scoped. Offline requests persist and sync on reconnection/app resume, with explicit queued, syncing, confirmed, conflict and retry states. No payment is taken.

## Prescriptions and daily doses

Open **Medicines**, then a dated prescription card. The detail screen groups scheduled medicines by Morning, Afternoon and Night, showing the supplied dose and duration. **Mark taken** saves that individual dose; **Taken · Undo** reverses it. The list and detail progress update after storage succeeds.

Dose identities include patient, prescription, medicine, IST calendar date and timing. Taking a morning dose cannot mark its afternoon/night dose, another prescription with the same medicine ID, or another day. History is versioned in AsyncStorage at `tapza.doses.v1.<patientId>` and restored before editing is allowed. Quick edits to different doses are serialized so writes cannot overwrite each other. Failed saves retain the prior state and show a retryable error; read/corrupt-data errors disable editing until history loads successfully.

Each medicine's course starts on the prescription issue date and lasts its `days` count. Date controls allow review of the course, including past days. Future dates are read-only. Today updates at IST midnight and on app resume. An ended course opens on its last date for history review. Empty medicine schedules are supported. Prescription content is fictional demo data; medicine reminders are optional local notifications; no server-side dose write is implemented.

## Review failure states

1. Launch Home successfully to populate its cache.
2. Open Profile and enable **Fail configuration fetch**; return Home to see the cached layout and Retry banner.
3. Switch theme while failure is enabled. The matching variant's cache is used, or its built-in fallback on a first visit.
4. Enable **Slow network** and pull to refresh. Existing content remains available.
5. Enable **Fail doctor fetch** to see doctor retry/stale-list treatment.
6. Enable **Return empty lists** for the empty home and doctor list.
7. Enable **Fail available times fetch** or **Return no available times**, then open a doctor/service to see slot error or empty states.
8. Choose **Fail next confirmation (503)** or **Conflict next slot (409)** under **Next booking confirmation**. Return Home, select an available time and confirm. The chosen outcome is consumed once, so retry can succeed. A forced conflict marks that exact slot unavailable for this session.
9. Enable **Fail prescriptions fetch** or **Return no prescriptions**, then open Medicines for retry/empty states. A failed refresh preserves the previously loaded list.
10. Enable **Fail dose history saves**, mark a dose and inspect its unchanged state/error. Disable the switch and retry; restart the app to verify persistence.
11. Use **Slow network** to inspect slot skeletons and the optimistic pending summary. Use **Restore normal responses** to clear forced response settings; confirmed appointments and occupied slots remain until restart.

## Structure and decisions

```text
App.tsx                     Providers and gesture/safe-area roots
android/, ios/              Community CLI native projects
src/config/                 Runtime schemas, config state and request cancellation
src/theme/                  Config-derived tokens and theme hooks
src/api/                    Typed, delayed and abortable mock transport
src/mocks/                  Layout and doctor JSON fixtures
src/storage/                Config cache, variant and versioned dose persistence
src/components/ui/          Theme-backed reusable text, button, icons, media and states
src/features/home/          Virtualised home, sections, viewport reveals, doctor directory
src/features/profile/       Patient context and assignment demo controls
src/features/booking/       Contracts, clinic dates, reducer/controller, sheet and bookings list
src/features/prescriptions/ Schedules, shared directory, dose tracker and list/detail screens
src/navigation/             Config-driven tabs, shared sheet and prescription native stack
__tests__/                  Behaviour tests outside application code
```

React context owns one booking controller, observed with `useSyncExternalStore`. Its pure reducer handles pending/reconciled appointments; the controller owns cancellation, validation and synchronous submission guards. This keeps the small in-process API independent of rendering and native gestures without adding a query framework. Zod guards mock/remote payloads. Native SVG gives deterministic offline artwork and backgrounds. Only selected icons are imported through public per-icon exports to keep the bundle small. Reanimated runs scroll motion on the UI thread. Config requests are aborted/superseded on changes so old responses cannot overwrite the selected layout.

Doctor names, availability and prices are fictional demo content. The Unsplash photos in `src/mocks/doctors.json` are illustrative and do not identify the named doctors; native image failures fall back to initials. Replace with appropriate licensed clinic assets for a real deployment.

See `docs/IMPLEMENTATION_PLAN.md` for the implementation plan and `docs/UI_DESIGN.md` for design decisions. Actual assignment time spent has not yet been totalled; record it honestly before submission.

## Final verification — 13 October 2026

Strict TypeScript and ESLint pass. **73 tests in 15 suites** pass, covering configuration, rendering, state recovery, optimistic reconciliation, 409 slot conflicts, request cancellation, live next availability, dose persistence/isolation, course dates and adaptive tab layout.

Android review uses a release build on an API 35 ARM64 emulator, including native sheet scrolling/drag dismissal, service booking, dose tracking and restoration after a force-stop. The review corrected full-width gradients, two-column grid rounding, disabled-button opacity, large-font tab labels, live next-slot labels and Android activity restoration. See the audit for completed scenarios and evidence. The bonus implementation also passed a generic iOS Debug native build; iOS runtime QA and physical midrange-device frame-rate/TalkBack/VoiceOver review remain unverified. No 60 fps claim is made from emulator testing.

The APK is an internal review build signed with a development key. The repository contains the reviewed source, tests, documentation, screenshots and demo. APK release publishing and the author's actual time total remain submission steps; no historical commits or elapsed hours have been fabricated.

## Optional bonus features — version 1.1.0

All ten bonus categories have an implementation:

| Bonus | Where to try it |
| --- | --- |
| Local medicine notifications | Profile → Enable reminders. Grants permission on demand; schedules untaken doses at 08:00 / 14:00 / 21:00 IST within each medicine’s course for the next seven days (up to 48 notifications). Refreshes on dose changes/app resume. Open weekly to renew; device battery settings can delay delivery. Includes a 10-second test and cancellation. |
| Hindi i18n | Profile → हिन्दी / English. A shared translation layer covers navigation and primary Home/booking/prescription/settings copy and interpolated dose progress. Language persists. Supplied names, medication instructions and unmatched/admin diagnostic copy retain English. |
| Config-driven dark mode | Profile → Dark mode. Each JSON config supplies `darkTheme` and `darkBackgrounds`; preference persists. |
| Shared-element detail transition | Open a prescription card. Its doctor header moves from its measured list position into the detail header with a custom Reanimated overlay. Reduced motion bypasses it. |
| Haptics | Buttons and booking success/error use native haptic feedback. Profile toggle persists and system haptic settings are respected. |
| Offline booking queue | Load a doctor/date online, enable Profile → Simulate offline (or disconnect), reopen that cached date, select a slot and Queue booking. Requests remain unconfirmed until sync. Restore connectivity or relaunch online; Bookings shows sync results. Conflicts require a new time. |
| Deep links | `tapzacare://doctor/ananya` and `tapzacare://prescription/rx-family-care` work from cold/warm launches. Unknown IDs show recoverable errors. Android and iOS custom schemes are registered. |
| Live admin editor | Profile → Edit configuration. Edit validated JSON and apply immediately. Each variant’s override persists locally; restore returns to its normal mock config. Profile must remain reachable. |
| Native end-to-end tests | `.maestro/smoke.yaml`, `offline.yaml`, and `admin.yaml`: doses/restart, links, Hindi/dark mode, booking, queued sync and persistent config edits. Install Maestro and the APK, then `npm run test:e2e`. Tests clear app data on the selected test device. |
| Custom success animation | Reanimated spring/checkmark on booking success, respecting reduced motion. |

Offline mode uses previously fetched doctor/date availability; unseen dates require a connection. Sync retries reuse saved mock receipts. This remains an in-process mock backend: a real API must supply server-side idempotency and authoritative reservations, especially for process death between server acceptance and saving the receipt. Queue sync runs while the app is active/on resume; it is not a background network service.

Native haptics require a capable device; an emulator cannot establish how they feel. Android notification delivery is verified with a local test notification; physical-device scheduling/battery behaviour and iOS runtime remain separate from compilation checks.

Bonus verification: 73 Jest tests and strict TypeScript/ESLint pass; Android universal release and generic iOS Debug builds pass. Maestro 2.11.0 completed the smoke and offline flows. Admin live edit, restart persistence and reset passed their device assertions; its final ambiguous Home selector was replaced with a restart check, which passed in isolation. The entire revised admin flow has not been rerun as one uninterrupted pass.
