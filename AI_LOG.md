# AI usage log

## 12 October 2026

**Request:** Read the assignment PDF and explain the exact requirements.

**Result:** Extracted and visually inspected all three pages; separated mandatory functionality, API shapes, technical rules, optional bonuses and submission requirements. Identified undefined Booking/section item/gradient/service mapping details.

**Request:** Create a step-by-step Expo and TypeScript implementation plan prioritising mandatory requirements, and create the UI design first.

**Result:** Created the implementation schedule, architecture decisions, UI specification and interactive design preview covering everyday/Diwali home, booking and prescriptions.

**Decisions:** Prioritise all six config-driven section types, mock state controls, optimistic booking with honest pending status, and daily dose state. Use an in-process mock transport and central design tokens. Keep platform versions unresolved until scaffolding so Expo installs compatible native packages.

**Rejected or deferred:** A full commerce flow, authentication, payments, full family management and unrequested backend infrastructure. Bonus notifications, i18n, offline booking queue and advanced animation remain behind completion of all mandatory requirements. Do not treat an interactive browser prototype as a completed React Native app or Android performance proof.


**Request:** Implement the design using bare React Native and TypeScript, starting with project setup and the config-driven home screen.

**Result:** Scaffolded React Native 0.87.1 with Android/iOS projects; installed compatible native dependencies and Node 24; implemented the six section types, native SVG art/backgrounds, config validation, central tokens, live normal/Diwali switching, config-driven tabs, information detail sheets, loading/empty/error states, abortable mocks and per-variant config caching. Replaced Expo-specific architecture and run instructions with bare setup.

**Decisions and fixes:** Keep this milestone focused on Home; bookings/prescriptions are route shells. Use React context instead of prematurely adding a query library. Add the Babel 7 export-namespace transform required by Zod’s current ESM build. Follow the current Worklets mock/Reanimated resolver guidance for Jest. Import only selected Lucide icons through public per-icon exports. Guard reveal reset by config variant so renderer mocks cannot repeatedly reset state.

**Rejected or deferred:** Expo and Expo Router after the user selected bare React Native. Slot selection, optimistic booking, dose tracking and bonus features belong to following milestones. Native device performance and screenshots still require a connected device or installed simulator runtime.

**Verification:** Typecheck and lint passed. All 20 tests across five suites passed, including startup, runtime theme switching and cached fallback. Android debug and standalone arm64 release APK builds succeeded; iOS CocoaPods installed. Device/simulator visual QA is pending because no usable runtime/device is available.

## 13 October 2026

**Request:** Fix Xcode's warning about unsupported iOS deployment targets in the Pods project.

**Result:** Added a Podfile post-install adjustment that raises older pod target deployment versions to React Native's minimum (currently iOS 15.1), preserving any higher requirements. This covers the AsyncStorage and SVG resource bundles that retained iOS 13.4 and 12.4 targets. Regenerated CocoaPods with Node 24.

**Verification:** Podfile Ruby syntax and `pod install` passed. All 196 explicit deployment target settings in the generated Pods project are now 15.1, including Debug and Release resource bundles. The lockfile matches the installed manifest; dependency versions did not change. A full iOS app build was not run for this configuration fix.

**Request:** Fix Gesture Handler's missing `React/RCTRootContentView.h` iOS build error.

**Result:** Updated the exact `react-native-gesture-handler` dependency from 2.32.0 to 2.33.0 and regenerated npm/CocoaPods lockfiles. The upstream React Native 0.87 compatibility fix removes the obsolete import and uses the supported JSI binding installation API: https://github.com/software-mansion/react-native-gesture-handler/pull/4497. No local dependency patches are needed.

**Verification:** CocoaPods installation, TypeScript, lint and all 20 tests in five suites passed. A full Debug iOS device build succeeded using `xcodebuild -workspace ios/TapzaCare.xcworkspace -scheme TapzaCare -configuration Debug -destination 'generic/platform=iOS' -derivedDataPath /tmp/tapza-care-ios-verification CODE_SIGNING_ALLOWED=NO build`. Both `RNGestureHandlerManager.mm` and `RNGestureHandlerModule.mm` compiled successfully. All generated pod deployment targets remain 15.1. This verifies compilation/linking; device and simulator runtime testing was not performed.


**Request:** Implement booking from doctor and service cards, with date/slot selection, a gesture-driven bottom sheet, optimistic confirmation, success animation and loading/empty/error/409 states.

**Result:** Added typed slot/booking contracts and delayed, abortable mock endpoints. Doctor and service cards open a Gorhom 5.2.14 sheet with 14 IST dates, selectable future slots, skeleton/empty/error/provider retry states and an accessible Close action. Added a shared booking controller and pure reducer, pending appointments, 201 reconciliation, generic rollback/retry, 409 availability refresh and slot reselection, a Reanimated spring/drawn-check success animation and a Bookings list. Profile has scoped slot scenarios and one-shot 503/409 confirmation controls.

**Decisions and fixes:** Keep POST bodies exactly `{doctorId, slotId}`; services use their configured provider and retain their service fee in the client summary. Lock dismissal and repeated submission while pending. Remove optimistic records on failures; preserve doctor/date but clear the taken slot on 409. Cancel superseded date/provider requests and ignore late responses even if a transport ignores AbortSignal. Reserve mock slots atomically. Use Gorhom touchables and a Gesture Handler horizontal date strip inside the sheet. Avoid refetching the doctor directory when only booking simulation controls change. Coordinate sheet dismissal/reopening so a closing animation cannot clear a newly opened flow.

**Testing adjustment:** Full Home screen tests need simulated list layout and scroll events to reach doctor/service cards beyond the initial virtualised batch. Mock only the bottom sheet's native portal/gesture boundary; exercise actual controls, state and mock API. Tests assert behaviours rather than animation snapshots.

**Rejected or deferred:** A query framework, external backend, payments, durable booking history and offline queues are unnecessary for this session-scoped mock flow. Prescription data and dose tracking remain the next mandatory milestone. Device gesture/visual/performance QA and submission screenshots still require a usable runtime/device.

**Verification:** TypeScript and lint passed; all 40 tests in eight suites passed. Android standalone arm64 release APK built successfully with bundled JS. iOS production JS bundling passed, and the existing generic iOS Debug build succeeded. Metro reports a dependency's private React Native feature-flag import and falls back to file resolution; bundling succeeds. No device/runtime interaction tests were performed.


**Request:** Implement prescriptions list/detail, morning/afternoon/night tracking, local persistence, and loading/empty/error states; finish quickly.

**Result:** Added the assignment's validated Prescription/Medicine shapes, fictional clinic fixtures and `GET /prescriptions`. Replaced the tab shell with a native stack for list/detail. Schedules show dose/duration, grouped timings, daily progress, dated history and mark-taken/undo controls. Added versioned AsyncStorage records, a shared dose tracker, scoped prescription empty/failure/save controls and shaped skeletons/retries.

**Decisions:** Store each dose under patient/prescription/medicine/IST-date/timing. Hydrate before permitting edits; serialize writes and publish taken/undo only after persistence succeeds. Retain the previous state on save failure and allow retry. Preserve a loaded prescription list on fetch failure. Start each medicine's course on issue date, use its supplied duration, keep future dates read-only, and refresh Today at IST midnight/app resume. Keep React Navigation native-stack compatible with existing Screens/Safe Area dependencies; no new native modules are required.

**Rejected or deferred:** Server-side dose writes and medicine notifications are outside the specified mock endpoint contract; notifications remain optional. Durable booking history, device screenshots/video, release publishing and final time accounting remain submission work. Native visual/gesture/performance QA remains pending.

**Verification:** TypeScript passed; all 61 tests in twelve suites passed. Coverage includes list/detail navigation, morning/afternoon/night and date isolation, restart/undo, patient/prescription boundaries, serialized writes, save/read/corrupt-history failure recovery, future/course guards, midnight/resume, and API loading/empty/error states. Android standalone arm64 release APK built with bundled JS. Two screen assertions were corrected: partial card text matching and an ambiguous duplicate Back label. No physical-device or simulator interaction review was performed.

**Request:** Review the complete assignment, fix remaining UI/functional issues, prepare the APK, and update README/AI_LOG; prioritise speed.

**Result:** Audited the supplied PDF requirements against the implementation. Added live next-slot queries with cancellation, expiry and booking/conflict invalidation; corrected tall-section reveals and small-screen wrapping. Native emulator review exposed full-width gradient, service-grid fractional rounding and Gesture Handler button-opacity defects; fixed each. Added adaptive font-scaled tab labels, an explicit accessibility container for background navigation, branded Android launcher resources and version 1.0.0 (2). Updated the requirement audit, run/build instructions and supplied repository URL.

**Native review:** Installed official Android command-line tools and an API 35 ARM64 system image, created a temporary review AVD and exercised the production JS APK. Verified everyday/Diwali themes, service booking, scroll/drag dismissal, 503 rollback/retry/success and dose persistence after force-stop. Inspected a narrow viewport with 2× system text. Screenshots/demo are native emulator evidence, not browser mockups.

**Verification:** TypeScript and ESLint pass; 65 tests in 14 suites pass. Built a universal Android release APK with four ABIs. Final artifacts/signature/checksum and native evidence are documented in docs/ASSIGNMENT_REVIEW.md and README.

**Honest limits:** No physical-device frame-rate measurement, TalkBack/VoiceOver session or iOS runtime test. The supplied GitHub repository URL is recorded, but no source push/release publishing or fabricated historical commits were performed. The user did not provide actual time spent; no estimate is presented as an actual total. Review APK uses the development key. Optional notifications, localization and durable/offline bookings remain deferred.

**Final native correction:** Logcat exposed an Android activity-recreation crash (Screen fragments should never be restored) when display density changed. Registered RNScreensFragmentFactory before super.onCreate, following the installed react-native-screens README, and rebuilt the universal APK. Native 409 was also exercised: the taken slot became unavailable, next-slot copy advanced, reselection succeeded, and the final booking matched the new time.

**Final retest:** Installed the corrected universal APK and repeated display-density changes in both directions. The app remained running and the fresh AndroidRuntime/ReactNativeJS error log was empty. Regenerated the artifact checksum and verified its APK signature. Saved demo duration is 157.5 seconds.

**Follow-up request:** Update the code on the supplied GitHub repository.

**Action:** Prepared an initial commit containing the reviewed source, Android/iOS projects, tests, lockfiles, assignment document, screenshots, demo and documentation, and configured the supplied repository as origin. Generated build directories, dependencies, local SDK/Xcode settings and dist APK artifacts remain ignored. This is the actual first source snapshot; earlier development history is not fabricated. The GitHub source push is authorised by this follow-up; a hosted APK release is not part of this code update.
