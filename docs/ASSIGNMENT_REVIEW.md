# Assignment review — 13 October 2026

Reviewed against `documents/Tapza Care — React Native Assignment (1).pdf` and the user's later selection of **bare React Native with TypeScript**. Expo was superseded by that instruction.

| Mandatory area | Implementation / evidence |
| --- | --- |
| Config home | Six registered section renderers, validated items, unknown types skipped; JSON controls content, section order, tabs, colours and backgrounds. Everyday and Diwali themes switch live. |
| Motion | Reanimated header compression, hero parallax, viewport reveals and success check. Reduced motion respected. Tall-section viewability threshold corrected during review. |
| Doctor/service cards | Doctor photo/fallback, specialty, fee and live next availability; service cards resolve their configured provider and price. Availability refreshes after bookings/conflicts and expiry. |
| Booking | 14 IST dates, past/occupied slots disabled, native draggable sheet, pending optimistic record, 201 reconciliation, duplicate guard and success animation. Generic failure rolls back; 409 clears the lost slot and refreshes choices. |
| Prescriptions | List/detail, dose/duration, morning/afternoon/night, per-day mark/undo, versioned local persistence scoped by patient/prescription/medicine/day/timing. |
| Resilience | Loading/empty/error states, retry, last-good config cache, cancellation, malformed-payload validation, persisted-dose read/write failure recovery. Profile exposes reproducible mock scenarios. |
| API contract | Delayed in-process GET config/doctors/slots/prescriptions; POST bookings sends exactly doctorId and slotId. No real backend credentials needed. |
| Engineering | Strict TypeScript, central tokens, accessible labels/touch targets, scalable text, focused behavioural tests, Android/iOS native projects. |
| Delivery | Local universal review APK, README, AI_LOG, screenshots and demonstration under docs. Publishing/history/time accounting remain below. |

## Fixes from the final review

- Replaced static doctor availability copy with validated live slot queries and expiry/invalidation refresh.
- Fixed full-width gradient backgrounds and native fractional-width rounding that forced service cards into one column.
- Moved dynamic button styling inside Gesture Handler touchables so Confirm visibly enables after selection.
- Improved small-screen quick actions, wrapping prescription text and large-font tab sizing/labels.
- Added an explicit native accessibility container around background tabs while a booking sheet is open.
- Added Tapza Care Android name/launcher artwork and version 1.0.0 (2).
- Fixed an activity-recreation crash found in native logs by registering the installed Screens library’s RNScreensFragmentFactory before super.onCreate.

## Verification

- TypeScript and ESLint pass; Jest **73 tests / 15 suites** pass.
- Universal release build contains production JS and four Android ABIs. APK v2 signature verified; SHA-256 recorded in dist/SHA256SUMS. Installed the final APK successfully.
- Repeated density/activity recreation after the final fix: app remained running, with no AndroidRuntime or ReactNativeJS errors in the fresh log. Navigation restarts at Home; saved doses remain persisted.
- Android API 35 ARM64 emulator, 1080 × 2400, normal 420 dpi; additional 540 dpi (~320 dp wide) / 2× system-font review.
- Native interaction review: everyday/Diwali switching, two-column service grid, full-width backgrounds, service sheet/date/time selection, scrolling to Confirm, drag-down dismissal, generic booking failure/retry, native 409 refresh/reselection and successful confirmation.
- Marked a morning dose, force-stopped/relaunched the app, and verified the same checked dose and daily progress were restored. Automated tests additionally cover afternoon/night/date isolation, undo and storage failures.
- Automated tests exercise empty/error/loading states, one-shot 409 refresh/reselection, duplicate confirmations and late responses. Native demo adds selected scenarios, not exhaustive device coverage.

## Reproduce

Use Profile to set slow responses, endpoint empty/failure states, a one-shot 503/409 confirmation, or failed dose writes. Restore normal responses before normal use. See README for exact steps and build commands.

## Remaining submission facts and limits

- Supplied repository: https://github.com/NileshLachheta1/tapzacare-mobileapp. Source includes the initial reviewed app and a separate bonus implementation commit. Earlier milestones were not committed and have not been reconstructed. APK release publishing remains pending.
- Actual time spent was not supplied. The implementation plan's hour estimates are not actual elapsed time.
- APK uses the checked-in development signing key for internal review. It is not a store-signed production release.
- Physical midrange-device FPS, TalkBack/VoiceOver and iOS runtime review remain unverified. Emulator interactions do not establish a 60 fps result. Prior milestones verified iOS compilation.
- Online bookings/mock reservations are session-scoped; offline requests, doses, config and preferences persist locally. Fixtures are fictional. The optional features have now been implemented; see README’s version 1.1.0 bonus table.

## Native evidence

- [2 minute 38 second demo](demo/tapza-care-demo.mp4): festival/everyday switch, config-driven services/doctors, forced 409 conflict, reselection/success, bookings and morning/afternoon/night dose tracking. Silent native screen recording.
- [Everyday](screenshots/01-home-everyday.png), [Diwali](screenshots/02-home-diwali.png), [booking](screenshots/03-booking.png), [409](screenshots/04-slot-conflict.png), [success](screenshots/05-booking-success.png), [large text](screenshots/06-large-text.png), [prescriptions](screenshots/07-prescriptions.png), [dose tracking](screenshots/08-dose-tracking.png).
- Evidence was captured from the reviewed UI before the final native-only activity-restoration correction; the correction does not change screen content.

## Version 1.1.0 bonus update

See README for all ten optional categories, how to exercise them and explicit limits. New native dependencies: Notifee, NetInfo and react-native-haptic-feedback. Android dark/Hindi screenshots are under `screenshots/bonus`. Test-notification delivery was confirmed in Android notification records. Both custom link types are registered on Android/iOS; a startup-intent race found by Maestro was corrected. iOS generic Debug compilation passed.

New native screenshots: [Hindi and dark mode](screenshots/bonus/dark-hindi.png), [offline booking queued](screenshots/bonus/offline-queued.png). The existing demo above records the mandatory 1.0.0 flows.

Release artifact: `TapzaCare-1.1.0-universal.apk`, package `com.tapza.care`, version code 3, four ABIs, bundled production JS and verified APK v2 signature. SHA-256: `1a0bb47267c817d58f9b1fb051062f8ad9901e5787b4bf9214d959b7f189f84b`.

Maestro 2.11.0: smoke (53 s) and offline queue/restart sync (40 s) passed. Admin apply/persistence/reset assertions passed, but a final Home selector chose the OS button; replaced it with a restart assertion and verified that portion separately. The revised complete admin flow remains unverified as one uninterrupted run. TypeScript, ESLint and all 73 Jest tests passed on final source.
