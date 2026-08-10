# Technical Foundation

## Current architecture
V1 is a no-build static PWA:
- `index.html` provides the single-page shell.
- `app.js` contains adventure data, rendering and local persistence.
- `styles.css` contains the mobile visual system.
- `manifest.webmanifest` declares installability.
- `sw.js` provides offline caching.
- `vercel.json` configures static hosting headers.

This is appropriate for the prototype but not yet production-complete.

## Required hardening
1. Add real 192px and 512px PWA icons plus Apple touch icon.
2. Version cache names with each release and provide a controlled update path.
3. Replace implicit global DOM references with explicit queried elements.
4. Version local progress data and provide safe migration/reset.
5. Split adventures, achievements and render/state code into modules.
6. Add reduced-motion behaviour and keyboard/dialog focus handling.
7. Validate at 375px and 430px iPhone portrait widths.
8. Publish through Vercel and verify install, offline reload and update behaviour on a physical iPhone.

## Data boundary
Until cloud backup is explicitly approved:
- all progression stays in localStorage/IndexedDB;
- no user identity is collected;
- no backend is required.

When backup is introduced, it must be opt-in, exportable and minimal.

## Quality gates
A release is ready only when:
- main path works with JavaScript enabled on mobile Safari;
- `scrollWidth === clientWidth` at target mobile widths;
- all five adventure paths persist correctly;
- offline reload works after first successful online visit;
- an old cache is replaced after a new deployment;
- PWA icon, title, theme and standalone mode are verified on iPhone.

## Scaling trigger
Move to a component framework only when scenes, map state or content tooling become painful to maintain in the static structure. A framework is not a milestone by itself.
