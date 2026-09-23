# G3 court production source

Continues the preserved G2 source. Game metres, Y-up/right-handed; original
geometry authored with the local Blender 5.2.2 installation. No purchases.

## Acquired surface, verified before integration (2026-09-22)

Concrete Tiles 02, Charlotte Baglioni / Poly Haven.
Asset: https://polyhaven.com/a/concrete_tiles_02
License: CC0 1.0 Universal; https://polyhaven.com/license and
https://creativecommons.org/publicdomain/zero/1.0/
Poly Haven explicitly permits modification and redistribution in products.

Downloaded diffuse map only, 1024 x 1024 JPEG, 599451 bytes:
https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/concrete_tiles_02/concrete_tiles_02_diff_1k.jpg
Retained unchanged in `polyhaven/concrete_tiles_02_diff_1k.jpg`.
MD5 matches the publisher's API metadata: `14703e48d201d2c252fc3f43d44f6d14`.
SHA-256: `2b0af74cd45e3e0e31ad309499929b8957eab624994e820ac39ed4c0d1022b39`.
Published physical repeat: 1.8 metres. The authored ground uses a 2.7-metre
repeat for tactical readability, with 1.70 diffuse gain in `src/slice.ts`.
No website preview/render is shipped as a texture.

All other geometry and surface artwork is original SRAP Run work. Existing
hero/watcher assets and their CC0 provenance remain unchanged in G1/G2.

## Rebuild

`scripts/author-g3.py` produces `court.blend` and `public/assets/g3/court.glb`.
Run with the same local Blender command documented in the G2 source card,
substituting `scripts/author-g3.py`, then `npm run build`.
The script is deterministic and has no network access. Source textures and
Blender masters stay outside the public bundle.

Final export: 22,710 triangles, 20 meshes / 22 primitives, 15 material families,
four embedded images (one 1024-square JPEG, three 512-square PNGs), 2,632,748 bytes.
Approximate colour texture storage with mipmaps: 9.33 MiB RGBA8. Court material
wrappers are converted to the existing StandardMaterial path; textures are loaded
without PBR's GPU sRGB decode. Unused imported PBR wrappers are disposed.

SHA-256 court.glb: `58da37a9b71dde7c7c36b3a5fb4b3fc61888d125b167eae391d8165cf6acc939`.
The planting geometry was relocated with the pavilion/garden layout correction;
the texture source and license remain unchanged.
The G2 runtime court remains available as a historical asset; the normal game
loads only G3 court, the unchanged G1 hero, and the unchanged G2 watcher.
