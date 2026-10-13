# Tapza Care recordings

- [Download bonus walkthrough — v1.1.0](https://raw.githubusercontent.com/NileshLachheta1/tapzacare-mobileapp/main/docs/demo/tapza-care-bonus-demo.mp4): 2 minute 42 second native Android screen recording covering the optional features.
- [Download core assignment walkthrough](https://raw.githubusercontent.com/NileshLachheta1/tapzacare-mobileapp/main/docs/demo/tapza-care-demo.mp4): the original 2 minute 38 second mandatory-feature demo.

The download links bypass GitHub’s file-preview page. Opening an MP4 from the repository file tree still opens GitHub’s preview; the repository cannot change that page’s download behaviour. Browser settings may prompt for a save location.

## Bonus walkthrough chapters

| Time | Demonstration |
| --- | --- |
| 00:00 | Hindi i18n, config-driven dark mode, haptic setting |
| 00:21 | Local medicine reminder scheduling and delivered test notification |
| 00:38 | Prescription shared-element transition and dose tracking |
| 00:51 | Doctor deep link, date/slot selection and custom success animation |
| 01:12 | Offline queue, saved request and confirmed result after reconnection |
| 01:57 | Direct prescription deep link |
| 02:01 | Live config edit, applied layout, persistence after restart and reset |

Recorded on 13 October 2026 using the v1.1.0 release APK on an Android API 35 emulator. The silent video shows only the native app screen, without opening/closing cards or added caption bars. Idle time and long JSON typing are trimmed. Application animations retain their original speed.

The haptics setting is visible, but a recording cannot demonstrate physical sensation. E2E results are documented separately: the repository’s Maestro smoke and offline flows passed; the admin UI was exercised directly for this recording. No complete admin Maestro pass is claimed. Offline sync uses the assignment mock backend. The delivered notification is the app’s local 10-second test reminder.

Delivery: MP4/H.264, 720 × 1600, 30 fps output, silent, 161.9 seconds. The entire file passed an FFmpeg decode check; selected frames were visually reviewed for legibility and the demonstrated outcomes.
