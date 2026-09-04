"""Remove a solid white background from an AI-generated character PNG,
turning it into a transparent-background sprite ready for the game.

Usage:
    python3 tools/remove_white_bg.py input.png output.png

Assumes the source image was generated on a plain white (#FFFFFF)
background, per the prompts in ANIMAL_ART_PIPELINE.md. Uses a soft
threshold so anti-aliased fur/edge pixels fade out smoothly instead of
leaving a hard white halo.
"""
import sys
from PIL import Image

THRESHOLD = 18
FEATHER = 40


def remove_white_bg(in_path, out_path, threshold=THRESHOLD, feather=FEATHER):
    img = Image.open(in_path).convert("RGBA")
    pixels = img.getdata()
    new_pixels = []
    for r, g, b, a in pixels:
        dist_from_white = 255 - min(r, g, b)
        if dist_from_white <= threshold:
            new_pixels.append((r, g, b, 0))
        elif dist_from_white <= threshold + feather:
            alpha = int(255 * (dist_from_white - threshold) / feather)
            new_pixels.append((r, g, b, alpha))
        else:
            new_pixels.append((r, g, b, a))
    img.putdata(new_pixels)
    img.save(out_path)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 tools/remove_white_bg.py input.png output.png")
        sys.exit(1)
    remove_white_bg(sys.argv[1], sys.argv[2])
    print(f"Saved: {sys.argv[2]}")
