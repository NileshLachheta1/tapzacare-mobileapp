# Tapza Care recordings

- [Bonus walkthrough — v1.1.0](tapza-care-bonus-demo.mp4): new 2 minute 54 second native Android recording covering the optional features, with chapter captions.
- [Core assignment walkthrough](tapza-care-demo.mp4): the original 2 minute 38 second mandatory-feature demo.

## Bonus walkthrough chapters

| Time | Demonstration |
| --- | --- |
| 00:00 | Version and recording context |
| 00:04 | Hindi i18n, config-driven dark mode, haptic setting |
| 00:25 | Local medicine reminder scheduling and delivered test notification |
| 00:42 | Prescription shared-element transition and dose tracking |
| 00:55 | Doctor deep link, date/slot selection and custom success animation |
| 01:16 | Offline queue, saved request and confirmed result after reconnection |
| 02:01 | Direct prescription deep link |
| 02:05 | Live config edit, applied layout, persistence after restart and reset |
| 02:46 | Test evidence and scope notes |

Recorded on 13 October 2026 using the v1.1.0 release APK on an Android API 35 emulator. The silent video contains real native screen captures; chapter captions and an ending evidence card are added during editing. Idle time and long JSON typing are trimmed. Application animations retain their original speed.

The haptics setting is visible, but a recording cannot demonstrate physical sensation. The E2E bonus is represented by the repository’s Maestro flows and the ending test-result card: the smoke and offline flows passed; the admin UI was exercised directly for this recording. No complete admin Maestro pass is claimed. Offline sync uses the assignment mock backend. The delivered notification is the app’s local 10-second test reminder.

Delivery: MP4/H.264, 720 × 1760 including captions, 30 fps output, silent, 173.9 seconds. The entire file passed an FFmpeg decode check; selected frames were visually reviewed for legibility and the demonstrated outcomes.
