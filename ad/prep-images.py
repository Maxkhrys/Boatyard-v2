#!/usr/bin/env python3
"""Prepare the photography for the social ad.

Source photos live in src/assets/images at full resolution and in mixed aspect
ratios. The renderer wants portrait plates it can push and pan across without
softening, so each selected frame is cropped to 9:16 around a focus point and
written at 1.3x the 1080x1920 output size. A handful of landscape cards are
also cut for the pricing / locations panels.

Outputs land in ad/assets (git-ignored — rebuild with `python3 prep-images.py`).
"""

from __future__ import annotations

import os
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "src", "assets", "images")
OUT = os.path.join(HERE, "assets")

# Output plate size: 1.3x the 1080x1920 frame, so a 1.0->1.14 push-in and a
# small pan both stay above 1:1 pixel density.
PLATE = (1404, 2496)
CARD = (1080, 720)

# name -> (source file, focus x, focus y) as fractions of the source frame.
PLATES = {
    "sea-steps": ("sea-steps-sunrise.jpeg", 0.38, 0.55),
    "kayak": ("aerial-kayak.jpg", 0.50, 0.50),
    "rowers": ("aerial-rowers-emerald.jpg", 0.50, 0.50),
    "swimmers": ("sea-swim-friends.jpg", 0.50, 0.55),
    "plunge": ("plunge-tank-splash.jpg", 0.46, 0.55),
    "ice-baths": ("ice-baths.jpg", 0.50, 0.50),
    "chimney": ("sauna-chimney-smoke.jpg", 0.50, 0.45),
    "interior": ("sauna-interior-rest.jpg", 0.55, 0.50),
    "hat-profile": ("sauna-hat-profile.jpg", 0.50, 0.50),
    "cedar-door": ("sauna-hats-cedar-door.jpeg", 0.50, 0.50),
    # Shot from behind the sign, so the lettering reads backwards — mirror it.
    "gate-harbour": ("sauna-gate-harbour.jpeg", 0.50, 0.58, True),
    "barrel": ("sauna-flower-planter.jpg", 0.50, 0.50),
    "courtyard-night": ("sauna-courtyard-night.jpg", 0.50, 0.50),
    "aerial-dusk": ("wicklow-aerial-dusk.jpg", 0.45, 0.50),
    "lighthouse-sunrise": ("pier-lighthouse-sunrise.jpeg", 0.50, 0.50),
    "lighthouse-moonrise": ("pier-lighthouse-moonrise.jpeg", 0.50, 0.50),
    "coast-golden": ("aerial-coast-golden.jpg", 0.50, 0.50),
    "incense": ("ritual-oils-incense.jpeg", 0.50, 0.50),
    "tide-clock": ("tide-clock-cedar.jpg", 0.50, 0.50),
}

CARDS = {
    "card-wicklow": ("wicklow-aerial-dusk.jpg", 0.45, 0.50),
    "card-arklow": ("arklow-aerial-quay.jpg", 0.44, 0.66),
    "card-harbour": ("aerial-wicklow-harbour.jpg", 0.50, 0.50),
    "card-barrel": ("sauna-flower-planter.jpg", 0.50, 0.50),
    "card-plunge": ("plunge-tank-splash.jpg", 0.46, 0.55),
    "card-interior": ("sauna-interior-rest.jpg", 0.55, 0.50),
}


def crop_to(im: Image.Image, size: tuple[int, int], fx: float, fy: float) -> Image.Image:
    """Crop `im` to the aspect of `size` around a focus point, then resize."""
    target = size[0] / size[1]
    w, h = im.size
    if w / h > target:
        cw, ch = int(round(h * target)), h
    else:
        cw, ch = w, int(round(w / target))
    left = min(max(int(round(w * fx - cw / 2)), 0), w - cw)
    top = min(max(int(round(h * fy - ch / 2)), 0), h - ch)
    return im.crop((left, top, left + cw, top + ch)).resize(size, Image.LANCZOS)


def load(name: str, flip: bool = False) -> Image.Image:
    im = Image.open(os.path.join(SRC, name))
    im = ImageOps.exif_transpose(im).convert("RGB")
    return ImageOps.mirror(im) if flip else im


def main() -> None:
    os.makedirs(OUT, exist_ok=True)

    for key, spec in PLATES.items():
        fname, fx, fy = spec[0], spec[1], spec[2]
        flip = len(spec) > 3 and spec[3]
        crop_to(load(fname, flip), PLATE, fx, fy).save(
            os.path.join(OUT, f"{key}.jpg"), quality=90, subsampling=1, optimize=True
        )
        print("plate", key)

    for key, (fname, fx, fy) in CARDS.items():
        crop_to(load(fname), CARD, fx, fy).save(
            os.path.join(OUT, f"{key}.jpg"), quality=88, subsampling=1, optimize=True
        )
        print("card ", key)

    # The end card needs the mark knocked out on transparency. Key the version
    # that is already drawn in white on navy: luminance becomes alpha, so the
    # navy field drops away and the ring, boat and lettering survive with their
    # anti-aliasing intact as a soft alpha ramp.
    import numpy as np

    src = Image.open(os.path.join(SRC, "logo-boatyard.jpeg")).convert("RGB")
    lum = np.asarray(src, dtype=np.float32).mean(axis=2)
    alpha = np.clip((lum - 96.0) / (216.0 - 96.0), 0.0, 1.0)
    rgba = np.zeros(alpha.shape + (4,), dtype=np.uint8)
    rgba[..., 0:3] = (247, 250, 249)
    rgba[..., 3] = (alpha * 255).round().astype(np.uint8)
    logo = Image.fromarray(rgba, "RGBA")
    logo = logo.crop(logo.getchannel("A").getbbox())
    logo.thumbnail((1024, 1024), Image.LANCZOS)
    logo.save(os.path.join(OUT, "logo-white.png"))
    print("logo  logo-white.png", logo.size)


if __name__ == "__main__":
    main()
