# Cerulean branding

The silver coiffure is the project mark. Use it for project documentation, listings, avatars, and social artwork.

| Asset | Use |
|---|---|
| [cerulean.svg](cerulean.svg) | Canonical icon; scalable, with a rounded cerulean tile |
| [cerulean-wordmark.svg](cerulean-wordmark.svg) | Icon and project name on a light background |
| [cerulean-avatar.png](cerulean-avatar.png) | 512 × 512 opaque avatar for project-specific profiles and listings |
| [cerulean-social.png](cerulean-social.png) | 1280 × 640 social preview |
| [cerulean-social.svg](cerulean-social.svg) | Scalable social artwork |

Use cerulean `#0B7DA6` and silver `#F5F8F9` for the icon. Supporting text uses ink `#103747`. Keep the silhouette proportions and clear space; do not stretch it or add facial details. Display the standalone icon at 24 px or larger where possible; 16 px is suitable for constrained favicon use.

Edit only `cerulean.svg` to change the mark, then run `node scripts/build-branding.mjs --png` to regenerate the wordmark, social artwork, and raster exports. Chrome must be installed; set `CHROME_PATH` if needed. Run `node scripts/build-branding.mjs --check` to verify derived SVGs. Wordmark and social SVG text uses Georgia with serif fallbacks; the PNG preserves the exported rendering.

`icon-concepts/` contains historical exploration, not production branding.

The README and install guide use the canonical SVG. For hosted repository branding, upload `cerulean-social.png` as the repository social preview. Use the avatar only for a dedicated Cerulean profile or listing, not the owner's personal account. Local asset changes do not update hosted settings automatically.
