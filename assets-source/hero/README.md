# G1 hero source and licence

Source: **Casual Character**, by **Quaternius**, from Ultimate Modular Men (2022).

- Author's pack and licence: https://quaternius.com/packs/ultimatemodularcharacters.html
- Downloaded model listing: https://poly.pizza/m/kZ3DmIoGip
- Download: https://static.poly.pizza/90a9e2d4-053f-42f1-99a2-8f5e1180ea7f.glb
- Source licence: **CC0 1.0 Universal**, https://creativecommons.org/publicdomain/zero/1.0/
- Retrieved 2026-09-21. Both the author pack and model listing identify CC0. CC0 permits modification and commercial distribution. No purchase, account, paid service or proprietary animation library was used.

`casual.glb` is the unmodified download, SHA-256:
`FEA7E71271203E7073F1A073FA1208DE7402DF276F87F80E149BF7589B5D46B4`.

`hero.blend` is the editable adapted master. `scripts/author-hero.py` reproduces it and `public/assets/hero/hero.glb` from the source with Blender 5.2:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python scripts/author-hero.py
```

Adaptation: teal civilian T-shirt, charcoal trousers, neutral trainers, shortened back hair, grey temples, broad moustache, compact tan recycling daypack and rigid chest-weighted straps. No real person's likeness or clothing logos. Source idle-neutral, walk and run clips are retained and renamed; other clips are removed. Body scale is approximately 1.86 m, slim proportions. The face remains stylised and its age reads ambiguously.

Runtime export: 933,492 bytes; 6,460 triangles; 11 meshes / 18 material primitives; 12 flat PBR materials; zero textures; one skeleton with 62 joints; maximum four weights per vertex. Three in-place animation groups. Root translation is constant throughout every clip (regression checked). Blender Z-up/-Y-forward exports as glTF Y-up/+Z-forward. The source's nested 100x armature/unit conversion is retained consistently; net world height is metric, without negative scale. The runtime visual offset compensates the existing controller centre at ground + 0.9; it does not change the controller.

Runtime export SHA-256:
`D3F89F5FB2CB3FD2257795207366FD745FD2DBD287373CE53597D4BC4150A327`.

The imported source model and animations retain their CC0 status. Original adaptation work is stored here for further modification as part of SRAP Run. This notice does not imply endorsement by Quaternius.

Source/master files stay outside the public bundle. The public asset directory also carries a source/licence notice.
