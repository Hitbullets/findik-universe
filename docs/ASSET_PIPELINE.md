# Asset Pipeline

## Asset groups
- `assets/character/`: canonical Fındık poses, expressions and animation frames
- `assets/scenes/`: location backgrounds and interactive layers
- `assets/stickers/`: unlocked shareable sticker art
- `assets/icons/`: PWA and interface icons
- `assets/ui/`: small decorative or interaction assets

## Naming
Use lowercase kebab-case and meaningful variants:
- `findik-idle-front-v01.webp`
- `findik-blink-front-v01.webp`
- `tram-stop-day-v01.webp`
- `sticker-yoldayim-v01.webp`

## Asset record
Every production asset needs:
- source/reference
- creator or generation workflow
- approval date
- character-canon check
- intended scene and resolution
- license/usage confirmation when relevant

Keep the record in an asset manifest once real production art begins.

## Current reference decision

The original user-supplied sticker capture is the visual canon reference for Fındık's face, coat, long dachshund ears, oversized dark eyes, blue denim overalls and two green leaf accessories. The editorial boards are mood and pose references only. Their written biographical details, especially exact birth dates, must never enter product copy unless independently confirmed.

## Approval checklist
- Brown dachshund proportions are clear.
- Blue overalls and leaf motif remain recognisable.
- Face and silhouette match approved canonical art.
- Transparent assets have clean edges at 1x and 2x.
- Scene crop works in portrait without hiding Fındık.
- File size is suitable for mobile loading.
- Placeholder status is explicit if not final.

## Animation delivery
Prefer sprite sheets or compact WebP sequences for simple character loops. Use Lottie only for UI-like vector motion, not as a substitute for authored character animation.
