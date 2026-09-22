# G5 surface family — original authorship and reuse

Editable artwork: `src/surface-atlas.ts`, deterministic Canvas2D painting with
seed 2026. Produced for this project, with no downloaded/generated reference
pixels, copied commercial artwork, new external asset, or new dependency.
The supplied design-reference images guided palette and surface hierarchy only.

One 1024² opaque mipmapped atlas replaces G4's atlas at the same resolution:
zinc, felt membrane, plaster/weathering, opaque reflected glazing, apartment
window/reveal/curtain. The source is regenerated once per scene; it has no frame
observer, cache or animated noise. Rebuild with `npm run build`; scene creation
paints the texture. Existing scene disposal owns the result.

`src/architecture.ts` assigns regions and façade palette variants. `src/slice.ts`
maps the same texture onto existing SRAP surfaces and visible cover bases.
One additional StandardMaterial shares the atlas for restrained glass specular
response. Other atlas surfaces stay diffuse/matte. These are painted appearance
cues, not a physically based roughness map or baked GI solution.

G4 atlas storage remains ~5.33 MiB RGBA8 including mipmaps. There are no extra
colour textures, geometry triangles, GLB exports, transparency layers, shadow
passes or postprocessing. Existing unused source court materials/textures remain
scene-owned; this pass does not claim texture-memory savings.

Central/pavilion paving reuses the unchanged G3 **Concrete Tiles 02**, Charlotte
Baglioni / Poly Haven, CC0. Licence, source URL and original hashes remain in
`assets-source/g3/README.md`; no download or modification of that JPEG occurred.
The unchanged G3 court and G1/G2 actors retain their prior provenance.

Public asset bytes are unchanged from b465c29. Only runtime UVs/materials/colours
change. Visible wall clones get unique geometry buffers before UV/colour edits;
hidden navigation/LOS proxies retain their original buffers and ownership.
