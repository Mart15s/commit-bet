"""Deterministic derivatives of the supplied 634x300 Bilateral Monogram reference.

Usage: python public/brand/derive-assets.py path/to/reference.png
Requires Pillow. No tracing, redrawing, or generated replacement artwork.
"""

from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFont

out = Path(__file__).resolve().parent
source = Image.open(sys.argv[1]).convert("RGB")
if source.size != (634, 300):
    raise ValueError("Expected the original 634x300 reference; do not guess crop coordinates.")


def isolate(box, kind):
    image = source.crop(box).convert("RGBA")
    # Remove only the dark screenshot canvas. Preserve the supplied artwork's
    # colors and antialiasing; the pale wordmark and mint monogram stay intact.
    pixels = []
    for red, green, blue, _ in image.getdata():
        if kind == "mark":
            alpha = round(255 * max(0, min(1, (green - red - 22) / 65, (green - 55) / 65)))
        else:
            alpha = round(255 * max(0, min(1, (min(red, green, blue) - 55) / 70)))
        pixels.append((red, green, blue, alpha))
    image.putdata(pixels)
    return image


mark = isolate((245, 64, 385, 188), "mark")
wordmark = isolate((168, 201, 468, 250), "wordmark")
mark.save(out / "monogram.png", optimize=True)
wordmark.save(out / "wordmark.png", optimize=True)
stacked = Image.new("RGBA", (300, 196))
stacked.alpha_composite(mark, (80, 0))
stacked.alpha_composite(wordmark, (0, 147))
stacked.save(out / "stacked.png", optimize=True)
horizontal = Image.new("RGBA", (368, 56))
horizontal.alpha_composite(mark.resize((63, 56), Image.Resampling.LANCZOS), (0, 0))
horizontal.alpha_composite(wordmark, (68, 4))
horizontal.save(out / "horizontal.png", optimize=True)

# Icon artwork is never enlarged. The larger Apple icon adds breathing room.
icon = Image.new("RGBA", (180, 180), "#0B0F14")
icon.alpha_composite(mark, (20, 28))
icon.save(out / "apple-touch-icon.png", optimize=True)
icon.save(out / "icon.png", optimize=True)
icon.save(out / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

# Social preview uses original-size art on a full-size branded canvas.
og = Image.new("RGBA", (1200, 630), "#0B0F14")
og.alpha_composite(stacked, (450, 88))
draw = ImageDraw.Draw(og)
font_dir = Path("C:/Windows/Fonts")
headline = ImageFont.truetype(str(font_dir / "consolab.ttf"), 42)
body = ImageFont.truetype(str(font_dir / "segoeui.ttf"), 23)
draw.line((100, 338, 1100, 338), fill="#1E293B", width=2)
draw.text((600, 397), "Ship or explain.", font=headline, fill="#F8FAFC", anchor="mm")
draw.text((600, 457), "AI audits, humans decide.", font=body, fill="#94A3B8", anchor="mm")
draw.text((600, 549), "PUBLIC BETA / VIRTUAL COMMITMENT POINTS ONLY", font=body, fill="#94A3B8", anchor="mm")
og.convert("RGB").save(out / "opengraph.png", optimize=True)
