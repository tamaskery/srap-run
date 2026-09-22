# G4 architectural slice source card

Original project-authored geometry and canvas artwork; no downloaded models,
AI-generated textures, copied reference artwork, external fees or new licences.
Editable master and runtime generator: `src/architecture.ts`.
Rebuild: `npm run build`. No Blender or external tool is required for this kit.

## Inventory and boundaries

- Three pavilion meshes: 64-segment layered oval eaves, shallow standing-seam zinc
  roof, flashed rooflight, 32 opaque curved glazing bays, 16 structural mullions,
  bronze service panels and base/transom bands. 1,596 triangles each.
- One repeated façade kit on north-housing, south-housing and the unbranded
  lidl-background shell visible in the representative frame. Repeated window
  reveals/sills, curtain panes, balcony trays/screens, entry canopies, plinth and
  parapets. The historical commercial ID is retained; it receives no retailer logo.
- One shared 1024-square mipmapped RGBA atlas: original drawn metal joints,
  broad glass reflections, quiet plaster aggregate and framed curtain windows.
  Approximately 5.33 MiB uncompressed including mipmaps; this is an estimate,
  not measured GPU allocation. No transparency, normal map, reflection camera,
  postprocess or external texture requests.
- Each pavilion retains its existing independent cutaway owner and exact canopy
  envelope. Original low solid bases remain. Collision/LOS/nav proxies are never
  replaced or edited. Architecture cannot intercept picking.
- Only pavilion architecture casts into the existing shadow map. Background shells
  use sun/fill without sampling or enlarging the shadow map. G3 sun, fill,
  paving, trees, SRAP and contact strips are unchanged.

Babylon scene disposal owns the atlas, shared material and six region meshes.
There is no cross-scene cache. Geometry batches are built directly without
per-window runtime mesh/material objects.

Hero, watcher and G3 court GLBs are byte-identical to 650aef9; their established
CC0/source provenance remains in the existing G1/G2/G3 source cards.

The kit is an authored approximation, not surveyed Budapest architecture.
Repeated atlas detail improves structure but is not a substitute for site-specific
baked/painted surface assets. See docs/G4_FINAL_SLICE.md for the visual verdict.
