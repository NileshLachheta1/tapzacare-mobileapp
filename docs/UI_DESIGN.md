# Tapza Care UI design

Create a calm, accessible patient app for Indian families, with a configuration-driven storefront for care and direct access to bookings and prescriptions. The original interactive design is a review prototype. The native app now implements Home, booking, and prescription schedules in bare React Native and TypeScript. Dose history is saved locally for each date and scheduled time. Android emulator visual and gesture review is recorded in ASSIGNMENT_REVIEW.md; physical-device performance remains unverified.

## Visual direction

Everyday uses deep teal, mint surfaces and warm neutral backgrounds. Diwali uses warm auburn, cream and saffron accents. Both retain readable dark text, simple labelled controls, generous spacing and a stable bottom navigation. The festival changes real content and section order, not only the palette.

Design for a 390 dp Android viewport, supporting 320–430 dp. Use system sans-serif type, 16 sp body text, 14 sp supporting text and 28 sp hero text. Preserve OS font scaling; do not cap essential text scaling. Use a 4 dp spacing scale, 20 dp page insets, 16 dp card padding, 20 dp card radius and 48 dp minimum touch targets. These become central tokens in the config-derived theme.

| Token | Everyday | Diwali |
| --- | --- | --- |
| Primary | `#145C50` | `#8A3B18` |
| Secondary | `#E3F0E8` | `#F9E6CA` |
| Background | `#F7F8F4` | `#FFFAF2` |
| Surface | `#FFFFFF` | `#FFFFFF` |
| Text primary | `#172E29` | `#38291F` |
| Text secondary | `#5C6C65` | `#716052` |
| Accent | `#C6E7AC` | `#F5CB77` |

Keep success and error semantic tokens stable across both themes. Colours shown above are design inputs, not component literals. Recheck text/surface pairs with a contrast checker during implementation.

## Screen and interaction map

| View | Design and primary action |
| --- | --- |
| Home | Location and patient context, greeting hero, category chips, quick actions, services, doctors and offer band. Primary action: Book a visit. |
| Doctor detail | Portrait, specialty, language, clinic, fee and availability. Primary action: Choose a time. |
| Booking sheet | Drag handle, provider summary, horizontal dates, large slot buttons, visit summary, fee and confirm action. Preserve context on errors. |
| Booking result | Animated check after successful reconciliation, date/time and clinic, then View booking. Pending state is clearly labelled before confirmation. |
| Bookings | Upcoming appointment cards; empty state offers Book a visit. |
| Prescriptions | Dated prescription cards with doctor, clinic and medicine count. Primary action: View medicines. |
| Prescription detail | Morning/afternoon/night schedule with dose text and Taken/Mark taken controls; progress reflects this day's individual dose instances. |
| Profile | Patient information plus clearly separated theme/demo controls. Full family management is outside the mandatory scope. |

## Normal home section order

1. `hero_banner`: greeting and “A little care. A healthier day.” with a gradient and illustrative health motif.
2. `category_chips`: Consult, Lab tests, Pharmacy, Vaccines; horizontal scrolling.
3. `quick_actions`: Book, Prescriptions, Reminders, Family.
4. `service_grid`: Health check, Blood tests, Doctor visit, Vaccination; two columns with illustrative media, price and optional badges.
5. `doctor_carousel`: realistic Indian doctor names, specialty, language, fee and next slot; horizontal cards.
6. `offer_strip`: clinic message in a contrasting calm band.

## Diwali home section order

1. `hero_banner`: “A brighter Diwali starts with good health.” with a warm gradient and festival illustration.
2. `offer_strip`: a festival checkup offer.
3. `service_grid`: festival family health check, screening and vaccination items.
4. `category_chips`: reordered categories with relevant content.
5. `doctor_carousel`: reordered providers and availability.
6. `quick_actions`: unchanged familiar actions, later in the layout.

A runtime theme switch is available from the compact header/settings control. It applies a complete config. Navigation remains familiar so older users do not lose their place.

## States

| Context | Loading | Empty | Error |
| --- | --- | --- | --- |
| Home/config | Hero and section-shaped skeletons. | Missing section items are skipped or use a compact section-specific empty view. | Cached content with “Showing your saved home” and Retry; first-launch fallback with clear retry. |
| Doctors/services | Cards with matching media/text placeholders. | “No visits available right now” with retry/other care entry. | Inline retry with unaffected navigation still available. |
| Slots | Date row plus slot-shaped skeletons. | “No times on this date” and another date. | Retry; 409 says “That time was just booked” and refreshes slots. |
| Booking submit | Immediate pending card/confirmation progress. | Not applicable. | No false confirmed state; keep doctor/date, show recovery action. |
| Prescriptions | Prescription-card skeletons. | “Your prescriptions will appear here” and Home action. | Retry while cached dose records remain usable. |

Error copy should explain the next action. Avoid raw status codes or technical network messages in patient-facing screens.

## Motion and access

- Header compresses on scroll; hero artwork moves subtly for parallax.
- Sections use a restrained translate/fade when first entering the viewport; avoid rerunning on every scroll.
- Sheet opens/closes with a spring and supports a downward drag plus a visible close button.
- Success check animates only after the request succeeds. Pending confirmation responds immediately.
- Respect reduced motion and preserve essential content when animations are disabled.
- Use labels with icons, legible colour contrast, TalkBack state announcements and focus return after the sheet closes.
- Keep critical actions reachable with large fonts; allow sheet content to scroll rather than clip.

## Prototype scope

The interactive design supports config switching, section-order changes, Home/Bookings/Prescriptions/Profile navigation, doctor and service booking entry, date/slot selection, sheet dragging, pending/success/conflict presentation and dose toggles. Design controls also expose loading, empty, cached-config failure and booking conflict previews.

Illustrative doctor avatars in the prototype are placeholders. The bare React Native implementation must use realistic licensed/bundled photo assets through each Doctor's `photoUrl`, plus accessible fallbacks. Service media and hero art can remain native illustrations/gradients where the required fields support them.

The prototype's state is local to the preview. API transport, durable config caching, Android gestures/performance and the required tests belong to the implementation milestones; they are not proved by browser preview behaviour.
