# Tapza Care implementation plan

Build the mandatory assignment in bare React Native and strict TypeScript within the 48-hour submission window. Start with the UI design, then implement the mock API, configuration renderer, booking state, prescriptions, resilience, and Android delivery. The schedule below is a proposed allocation of elapsed hours from the assignment's actual sharing time, not a new deadline or a record of time spent.

## Current milestone

The project setup and config-driven home are implemented in bare React Native, following the user’s updated stack choice. Both native projects, strict TypeScript, React Navigation tabs, six home renderers, runtime configs, mock states and config caching are in place. Doctor/service booking is now implemented: date/slot selection, a gesture-driven sheet, optimistic pending records, success animation, generic failure and 409 recovery. Prescriptions now include list/detail screens, morning/afternoon/night dose tracking, dated local persistence, undo, shaped loaders and empty/error recovery. Final Android emulator QA and local packaging are documented in ASSIGNMENT_REVIEW.md. Publishing, source history and actual time accounting remain. The original UI preview remains a design reference.

## Delivery order and time budget

| Step | Window | Work | Completion check |
| --- | --- | --- | --- |
| 1. UI design | Hours 0–3 | Define normal and Diwali themes, design tokens, all six home sections, booking sheet, prescriptions, and loading/empty/error states. | Reviewable interactive mobile prototype and UI specification. |
| 2. Bare React Native foundation | Hours 3–5 | Scaffold React Native Community CLI with React Navigation; enable TypeScript strict; configure lint/typecheck/test scripts, providers, safe areas, and gesture root. Start Git history and AI log. Configure a Gradle review APK and attempt an early build. | App opens on Android; navigation and theme providers work; build setup is checked early. |
| 3. Contracts and mock data | Hours 5–8 | Define and validate the supplied models; add realistic Indian fixtures, both layout configs, exact endpoint contracts, latency/failure/empty switches, and deterministic 409 conflicts. | Valid fixtures; bad configs rejected; unknown section types preserved for safe skipping. |
| 4. Config and theme | Hours 8–11 | Fetch and validate config; derive colour, spacing, typography, and motion tokens; persist last good config and selected variant; render tabs from config. | Runtime switching changes colours, hero, order, items, and tabs without editing components. |
| 5. Home sections | Hours 11–18 | Implement a typed section registry and all six section renderers. Add independent solid/gradient/image backgrounds, horizontal rows, service grid, photos, next slots, header collapse, hero parallax, and viewport reveals. | Both configs render completely; unknown section renders null; scrolling is smooth on Android. |
| 6. Booking | Hours 18–25 | Doctor/service entry, date selection, slot query, draggable bottom sheet, review, optimistic pending booking, reconciliation, success animation, generic failure and 409 recovery. | Success confirms once; failure restores state; conflicts refresh slots and invite a new choice. |
| 7. Prescriptions | Hours 25–30 | List and detail, morning/afternoon/night schedule, dose-taking interaction, local persistence by patient/prescription/medicine/date/timing. | Taking a morning dose does not mark another time or day taken; restart restores tracking. |
| 8. Resilience and accessibility | Hours 30–35 | Content-shaped skeletons, empty/retry states, cached-config fallback, cold-start error, failed cache-write handling, large fonts, contrast, touch sizes and reduced motion. | Slow, failed, and empty mock scenarios remain usable in both themes. |
| 9. Tests and Android QA | Hours 35–39 | Required behaviour tests; typecheck/lint; small-screen and large-font checks; release-like Android scrolling and gesture check. Start final APK build. | Required tests pass; no clipped essential controls; no repeated bookings or scroll stutter. |
| 10. Submission | Hours 39–43 | Verify installable APK/build URL, README, AI log, screenshots, 2–3 minute demo, GitHub Release/repository link. | A reviewer can install and reproduce both themes, forced booking failure, and dose tracking. |
| 11. Reserve | Hours 43–48 | Build queue delays, device issues, fixes and final verification. | All mandatory deliverables complete; bonuses only if this reserve remains. |

Commit at meaningful milestones throughout the actual work. Do not invent earlier commits or time spent. Keep README, AI log, and screenshots current rather than postponing all documentation until the end.

## Proposed stack

| Concern | Choice and reason |
| --- | --- |
| App and routes | React Native 0.87.1 Community CLI template and React Navigation 7 with config-driven bottom tabs. Android and iOS projects are included. |
| Type safety | `strict: true`; Zod schemas at the API boundary; discriminated item schemas for supported section types. |
| Styling | React Native StyleSheet factories consuming a theme; reusable AppText, Button, SectionSurface, Card, ScreenState and Skeleton primitives. |
| Server state | React context and a small repository for this first slice. Booking uses a shared controller, pure reducer and `useSyncExternalStore` for slot requests and optimistic reconciliation. |
| Storage | AsyncStorage for last good config, selected config and mock dose state. |
| Motion | Reanimated, its compatible Worklets dependency, and Gesture Handler. |
| Booking sheet | `@gorhom/bottom-sheet` 5.2.14 with existing Gesture Handler/Reanimated; Android emulator drag/scroll verified; physical-device QA remains. |
| Images and gradients | React Native Image, native SVG gradients and bundled vector illustrations; image failure fallbacks. |
| Tests | React Native Jest preset and React Native Testing Library, with official native-library mocks/resolvers. |
| Delivery | Gradle APK builds and a final GitHub Release, with a documented signing choice. |

Use npm for dependencies, autolinking for native modules, CocoaPods for iOS, and the Community CLI for Metro/device launch. Use Node 24 from `.nvmrc`. Keep Reanimated and Worklets compatible with the native template’s New Architecture.

## Project structure

```text
App.tsx
android/, ios/
src/
  navigation/          # Config-driven tabs and route shells
  config/              # Validation and atomic configuration provider
  theme/               # Theme derivation, tokens and hooks
  api/                 # Typed mock transport
  mocks/               # JSON config and doctor fixtures
  storage/             # Versioned local persistence
  components/ui/       # Theme-backed reusable primitives
  features/
    home/              # Section renderers and scroll motion
    profile/           # Patient context and demo controls
    booking/           # Date/slots, transaction controller, sheet and bookings
    prescriptions/     # List/detail, schedules and persistent dose state
__tests__/
docs/
AI_LOG.md
README.md
```

Keep route files thin. Feature components should not import mock fixture files directly; they call the same typed API functions that a future real transport would implement.

## Configuration implementation

1. Validate the LayoutConfig envelope before applying it. Validate a supported section's items with its type-specific schema. Skip unknown section types; do not reject the entire config because a future section was added.
2. Store normal and Diwali JSON fixtures. The selected fixture is returned by the simulated `GET /config`, rather than selected directly by the Home component.
3. Derive the complete theme from the validated payload. The required schema supplies colours; add an optional `designTokens` extension for spacing, type, radius and motion, with versioned central defaults when absent. Never place these literals inside screen components.
4. Encode gradient `background.value` as a JSON string containing colour stops; parse it in SectionSurface and document the convention. A malformed background falls back to a theme surface.
5. Apply a new config atomically only after validation succeeds. Cache only valid successful responses. Key caches by config variant; do not accidentally show a different variant's cache after switching.
6. On refresh failure with cached data, keep the last good layout and show a quiet retry banner. On first-launch failure without cache, show a designed retry screen and a bundled baseline config so core navigation remains usable.
7. Map tab screen values through a whitelist of route definitions. Build tab order, labels, visibility and icons from config; skip unsupported routes/icons safely.

## Mock API and scoped decisions

Implement `GET /config`, `GET /doctors`, `GET /slots?doctorId=&date=YYYY-MM-DD`, `POST /bookings {doctorId, slotId}` and `GET /prescriptions` with the supplied shapes. The mock may be an in-process transport; an external server is not required.

The assignment leaves these details open. Use these explicit conventions until clarified:

| Open detail | Proposed implementation |
| --- | --- |
| Booking response fields | `{ id, doctorId, slotId, startsAt, endsAt, status: 'confirmed' }`; client-only temporary records support `pending`; failures remove them. |
| Service bookings use a doctor-shaped API | Each bookable service fixture supplies `doctorId`; select that provider's slots and submit the mandated request body. Document that services are provider-backed in this slice. |
| Doctor next available slot | Obtain slot summaries through the existing slots interface for candidate days; cache query results. Keep selection available if a summary cannot load. |
| Per-section item shapes | Define typed item schemas for hero, chips, actions, services, doctors and offers. Config items reference doctors/services by ID rather than duplicate full records. |
| Dose persistence | Local per-dose tracking is a design decision; no write-prescription endpoint is specified. Use the local calendar day in Asia/Kolkata for mock reminders. |
| Profile and Family | A small profile/settings route hosts runtime config and mock controls. Family action opens the current patient context; full dependent management is deferred and documented. |

Scenario controls should support normal delay, slow delay, endpoint failure, empty lists and next-booking conflict. Put simulation controls in a clearly identified demo/settings section so patient screens remain uncluttered.

## Booking state and recovery

Use `idle → selecting → submitting → confirmed`, with recoverable `error` and `conflict` paths. On confirm, create a temporary pending record immediately and prevent duplicate submission. Display “Confirming your visit…” until the mock reconciles; never label a pending appointment confirmed.

On 201, replace the temporary record and play the success animation. On 409, remove the pending record, invalidate slots, show “That time was just booked” and preserve doctor/date selection. On other failures, remove/mark the temporary record appropriately and show an explicit retry. Retrying creates a single logical pending booking. A required optimistic response does not require the optional offline queue.

## Mandatory tests

| Test | Behaviour to prove |
| --- | --- |
| Config validation | Both fixtures valid; invalid required colours/items rejected; unknown type skipped; malformed response cannot replace last good config. |
| One section renderer | ServiceGrid renders config title, supplied items and ₹ prices, uses the correct background, and opens the correct booking entry. |
| Booking state | Optimistic pending state, 201 reconciliation, duplicate-confirm prevention, generic rollback and 409 slot refresh. |

Additional targeted checks are justified for cache fallback and per-day dose state because incorrect state there can undermine the demo. Prefer assertions about behaviour to implementation snapshots.

## Android review and submission checklist

- Test normal and Diwali themes: different colours, hero artwork/greeting, item sets and section order.
- Scroll through all six sections; confirm header collapse, hero parallax, viewport reveals and working horizontal rows.
- Book from doctor and service, change date, drag sheet, confirm, retry failure and recover from 409.
- Open a prescription and mark individual morning/afternoon/night doses.
- Test slow network, config failure with/without cache, empty doctors/slots/prescriptions, and image failure.
- Check 320–430 dp widths, OS large fonts, TalkBack labels, 44 pt minimum targets and readable contrast in both themes. Use 48 dp touch targets in this design.
- Run typecheck, lint, required tests and native dependency checks. Verify gestures and list performance on a real mid-range Android device if available.
- Install the final APK; do not treat an AAB or Expo Go link as equivalent to a verified installable release build.
- Store screenshots and a 2–3 minute demo in `/docs`; show normal/festival, forced booking failure and reminders.
- Complete README, AI_LOG.md, honest scope cuts/time spent, meaningful commit history, repository link and APK Release URL.

## Bonus gate

Only after the above checks pass: add Hindi/Telugu, local notifications or haptics if time permits. Dark mode, offline booking queue, live config editor, deep links, shared-element transitions and E2E coverage are optional. A simple Reanimated success animation satisfies the required animation; advanced Lottie/custom presentation can be extra polish.

## Official implementation references

- [React Native TypeScript](https://reactnative.dev/docs/typescript)
- [React Native Community CLI](https://github.com/react-native-community/cli)
- [React Navigation](https://reactnavigation.org/docs/getting-started/)
- [Reanimated compatibility](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/)
- [Reanimated bare installation](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/)
- [Worklets Jest setup](https://docs.swmansion.com/react-native-worklets/docs/guides/testing/)
- [Reanimated Jest setup](https://docs.swmansion.com/react-native-reanimated/docs/guides/testing/)
