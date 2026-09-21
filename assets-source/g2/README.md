# G2 source cards and provenance

## Eastern court / SRAP

Original SRAP Run geometry and procedural surface artwork authored by this task.
No asset pack, stock texture, downloaded photograph, generated reference image,
paid service or copied Commandos asset is embedded in these files. Original work
remains under the project's terms; no third-party attribution obligation applies.
The design-guide centre and eastern study were visual direction only, not textures.

`court.blend` is the editable master; `scripts/author-g2.py` reproduces it and
`public/assets/g2/court.glb`. Blender 5.2.2 LTS, game metres, Y-up, right-handed.
Authoring converts `(x,y,z)` to Blender `(x,-z,y)` before the normal glTF export.
Mesh names retain `fixed:` or `srap:` ownership; SRAP meshes join the existing cutaway.
Opaque leaf sprays avoid alpha sorting and transparency layers. Four embedded
512-square colour textures use ordinary mipmapped glTF sampling. No normal/AO atlas
is claimed. Material base colours use linear values; colour textures are sRGB.

Inventory: 37,122 triangles, 15 meshes, 17 material primitives, 15 materials,
four 512-square images, 3,525,128-byte GLB. Texture storage is approximately
5.33 MiB RGBA8 including full mip chains, excluding pre-existing scene textures.
This is a deliberately bounded art study, not an optimised production kit.

Scope: x=-2..34, z=-23.5..16 paving (1 x .5 m nominal slabs), two original tree
anchors, two existing ellipse planters, the existing north hedge, two wall-mounted
benches, SRAP front/back/roof. Existing outside lamps remain M4. No bins or new props
were added to routes. Planter proxy shape/height and all openings remain authoritative.

SHA-256 court.glb: `399EBF7A04E789CA60AB047C4C2907C0E66E416828EC99ED767C4938E7B97BA8`.

## Watcher

Adaptation of the retained **Casual Character by Quaternius**, CC0 1.0 Universal.
Source: `assets-source/hero/casual.glb`; full retrieval record and source hash remain
in [the G1 provenance](../hero/README.md). Author's pack:
https://quaternius.com/packs/ultimatemodularcharacters.html ; model:
https://poly.pizza/m/kZ3DmIoGip ; licence:
https://creativecommons.org/publicdomain/zero/1.0/ . No additional acquisition or cost.

Olive outer torso/hem, charcoal trousers and knit cap, folded canvas hip tote.
The source's physical height and rig scale remain unchanged. Three original clips
are retained as `hostile_idle`, `hostile_walk`, `hostile_sprint`; no root motion.
The current controller alone decides position, facing, chase, contact and damage.
Idle/walk/run sampling uses the proven G1 approach without editing G1's source or GLB.
`watcher.blend` is the editable master. Runtime: 895,944 bytes, 6,132 triangles,
8 meshes / 14 primitives, 12 materials, 62 joints, no textures. The guide's proposed
35–55 joints / 1–2 materials budget is exceeded, as with G1; this is disclosed.

SHA-256 watcher.glb: `C4C44D4F983A595E0E70B69AA2B46138718DBD0A406CCC118099BA81FD15A201`.

## Containers

Original authored lathe profiles in `src/art.ts`: green PET, amber long-neck glass,
silver/red can. Stable ID-to-variant mapping reuses these across the eight existing
items. Heights .65/.72/.45 m are a documented approximately 2x display boost over
large real containers, smaller than M4's previous metre-high bottle. Actor scale
is unchanged. All visible parts retain the same semantic target and collect once.
Opaque colours, labels and caps avoid costly refraction; existing marker retained.

## Rebuild

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python scripts/author-g2.py
npm run build
npm test
```

Only the GLBs and licence notice are runtime deliverables. Masters and original
texture PNGs remain outside the public directory. No new dependency was installed.
