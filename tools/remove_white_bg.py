"""Remove a solid white background from an AI-generated character PNG,
turning it into a transparent-background sprite ready for the game.

Usage:
    python3 tools/remove_white_bg.py input.png output.png

Assumes the source image was generated on a plain white (#FFFFFF)
background, per the prompts in ANIMAL_ART_PIPELINE.md.

Uses a flood fill from the four corners instead of a global color
threshold: a global threshold would also punch holes through any
near-white fur *inside* the animal (belly, chin, paws). Flood fill
only removes white that is connected to the outer border, leaving
interior white/cream fur intact.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

THRESHOLD = 26
MARKER = (255, 0, 255)


def remove_white_bg(in_path, out_path, threshold=THRESHOLD):
    img = Image.open(in_path).convert("RGB")
    w, h = img.size

    work = img.copy()
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(work, seed, MARKER, thresh=threshold)

    work_arr = np.array(work)
    is_bg = np.all(work_arr == np.array(MARKER), axis=-1)

    rgba = np.array(img.convert("RGBA"))
    rgba[..., 3] = np.where(is_bg, 0, 255)

    out = Image.fromarray(rgba, mode="RGBA")
    alpha = out.getchannel("A").filter(ImageFilter.GaussianBlur(1.2))
    out.putalpha(alpha)
    out.save(out_path)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 tools/remove_white_bg.py input.png output.png")
        sys.exit(1)
    remove_white_bg(sys.argv[1], sys.argv[2])
    print(f"Saved: {sys.argv[2]}")
