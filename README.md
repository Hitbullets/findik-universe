# Fındık Universe 🐾

**Fındık — The Little Explorer** is a mobile-first interactive character world designed as an installable iPhone PWA.

The goal is to turn a beloved sticker character into a tiny persistent universe: Fındık reacts to touch and time, goes on adventures, collects memories, unlocks achievements and stickers, and remembers progress on the device.

## Current stage

The active application is a Next.js App Router / React 19 local-first PWA. The current delivery milestone is the first Story → Adventure → Minigame vertical slice:

1. Preserve the existing five-adventure beta loop.
2. Run the Kayıp Kırmızı Balon Story through the shared progress/reward contract.
3. Keep Supabase optional and device-local progress functional.
4. Verify the PWA and mobile quality gates before calling it production-ready.

## Documentation

The [docs/](./docs/README.md) folder is the project’s source of truth:

- [Context](./docs/CONTEXT.md)
- [Product Vision](./docs/PRODUCT_VISION.md)
- [Character Bible](./docs/CHARACTER_BIBLE.md)
- [Handmade System](./docs/HANDMADE.md)
- [Rules](./docs/RULES.md)
- [Content Rules](./docs/CONTENT_RULES.md)
- [Technical Foundation](./docs/TECHNICAL_FOUNDATION.md)
- [Asset Pipeline](./docs/ASSET_PIPELINE.md)
- [Roadmap](./docs/ROADMAP.md)
- [Decisions](./docs/DECISIONS.md)
- [Active Sprint](./docs/SPRINT_01.md)

## Deployment

Next.js/Vercel-ready. Production readiness requires the quality gates in `docs/TECHNICAL_FOUNDATION.md`; a successful build alone is not physical iPhone or deployment evidence.
