# 5GieAEOU production artwork

These are deterministic derivatives of the user-supplied `image (1).png`
(634 × 300 px), the Bilateral Monogram reference. No artwork was redrawn.

- `monogram.png`: crop (245, 64)–(385, 188), original 140 × 124 px.
- `wordmark.png`: crop (168, 201)–(468, 250), original 300 × 49 px.
- The dark screenshot canvas is color-keyed to transparency; the title,
  decorative frame and margins are excluded.
- `horizontal.png` and `stacked.png` compose those crops. Artwork is never
  enlarged. Icon and Open Graph derivatives use the same supplied mark.
- `derive-assets.py` records the process; run with Pillow and the original
  source path. Its Open Graph text uses Windows Consolas/Segoe UI.

The supplied reference is raster artwork. The small original monogram limits
sharpness at large display sizes; a genuine source SVG would improve this.
The application therefore displays the mark at or below its native dimensions.

Geist Sans/Mono webfonts are copied from the installed Next.js 16.2.9 package
(`dist/next-devtools/server/font/`) to avoid runtime/build font downloads.
They include Latin and Latin Extended for Lithuanian text. Their SIL Open Font
License is in `fonts/OFL.txt`.
