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

import hashlib
import os
import urllib.request
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "src", "assets", "images")
OUT = os.path.join(HERE, "assets")
CACHE = os.path.join(HERE, ".cache", "stock")

# Output plate size: 1.3x the 1080x1920 frame, so a 1.0->1.14 push-in and a
# small pan both stay above 1:1 pixel density.
PLATE = (1404, 2496)
CARD = (1080, 720)

# Four plates are licensed stock (Pexels — free to use, no attribution
# required) rather than site photography: the repo has nothing sharp for
# "clear head", nothing that crops to 9:16 for "the harbour's edge" (the
# source is near-square and the sign gets cut in half), and the HEAT/REPEAT
# ritual beats read better on a premium sauna and a genuinely dynamic swim
# than the dim interior and distant swimmers actually on hand. Fetched by
# URL and cached locally rather than committed, since these aren't ours.
STOCK = {
    # Tiemy Pixel — sunrise over calm water. Centred on the sun itself,
    # narrow enough at 9:16 to miss the industrial silhouette on both edges.
    "sea-steps": ("https://images.pexels.com/photos/34089633/pexels-photo-34089633.jpeg", 0.47, 0.5),
    # HUUM-brand sauna heater shots were the sharpest hit in this search but
    # carry the manufacturer's logo twice in frame — wrong to run someone
    # else's brand mark. This one is soft-focus. Went with a plain cedar
    # bench + amber wall sconces instead: sharp, warm, no visible branding.
    "interior": ("https://images.pexels.com/photos/25084818/pexels-photo-25084818.jpeg", 0.664, 0.5),
    # Valera Rychman — pier at golden hour, Kemer. Framed on the far end
    # (flags, rail, the silhouette at the edge) rather than the boardwalk,
    # since that is what "on the harbour's edge" is actually about.
    "gate-harbour": ("https://images.pexels.com/photos/20615294/pexels-photo-20615294.jpeg", 0.664, 0.5),
    # ozanyavuzphoto — two open-water swimmers mid-stroke, close and wet.
    "swimmers": ("https://images.pexels.com/photos/29280139/pexels-photo-29280139.jpeg", 0.42, 0.5),
}

# name -> (source file, focus x, focus y) as fractions of the source frame.
PLATES = {
    "sea-steps": STOCK["sea-steps"],
    "kayak": ("aerial-kayak.jpg", 0.50, 0.50),
    "rowers": ("aerial-rowers-emerald.jpg", 0.50, 0.50),
    "swimmers": STOCK["swimmers"],
    "plunge": ("plunge-tank-splash.jpg", 0.46, 0.55),
    "ice-baths": ("ice-baths.jpg", 0.50, 0.50),
    "chimney": ("sauna-chimney-smoke.jpg", 0.50, 0.45),
    "interior": STOCK["interior"],
    "hat-profile": ("sauna-hat-profile.jpg", 0.50, 0.50),
    "cedar-door": ("sauna-hats-cedar-door.jpeg", 0.50, 0.50),
    "gate-harbour": STOCK["gate-harbour"],
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


def fetch(url: str) -> str:
    """Download a stock photo once and cache it locally by URL hash."""
    os.makedirs(CACHE, exist_ok=True)
    dest = os.path.join(CACHE, hashlib.sha1(url.encode()).hexdigest() + ".jpg")
    if not os.path.exists(dest):
        req = urllib.request.Request(url, headers={"User-Agent": "boatyard-ad-build/1.0"})
        with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
            f.write(r.read())
    return dest


def load(name: str, flip: bool = False) -> Image.Image:
    path = fetch(name) if name.startswith("http") else os.path.join(SRC, name)
    im = Image.open(path)
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
