#!/usr/bin/env python3
"""
Composite the NetWebMedia logo lockup onto Higgsfield-generated carousel slides.

Usage:
    python scripts/composite_nwm_logo.py <input_image> [<input_image> ...]
    python scripts/composite_nwm_logo.py --in-place <input_image>   # overwrite original
    python scripts/composite_nwm_logo.py <dir>                       # all PNGs in dir

Output: <input>_logo.png next to each input (or overwrite if --in-place).

Logo placement:
    - Position: bottom-left, 6% inset from left + bottom edges
    - Width: 22% of slide width (lockup native aspect ratio preserved)
    - Opacity: 92% (subtle, doesn't fight the headline)
"""

import sys
import os
from pathlib import Path
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
LOGO_PATH = REPO_ROOT / "assets" / "nwm-logo-lockup.png"

LOGO_WIDTH_RATIO = 0.22   # 22% of slide width
INSET_RATIO = 0.06        # 6% inset from edges
LOGO_OPACITY = 0.92       # 92% opacity


def composite_logo(input_path: Path, output_path: Path) -> None:
    """Place the NWM logo lockup on the bottom-left of input_path, save to output_path."""
    base = Image.open(input_path).convert("RGBA")
    logo = Image.open(LOGO_PATH).convert("RGBA")

    # Scale logo to LOGO_WIDTH_RATIO of base width, preserve aspect ratio
    target_w = int(base.width * LOGO_WIDTH_RATIO)
    target_h = int(logo.height * (target_w / logo.width))
    logo = logo.resize((target_w, target_h), Image.LANCZOS)

    # Apply opacity to the logo's alpha channel
    if LOGO_OPACITY < 1.0:
        alpha = logo.split()[3]
        alpha = alpha.point(lambda p: int(p * LOGO_OPACITY))
        logo.putalpha(alpha)

    # Place at bottom-left with INSET_RATIO inset
    inset_x = int(base.width * INSET_RATIO)
    inset_y = int(base.height * INSET_RATIO)
    x = inset_x
    y = base.height - target_h - inset_y

    # Paste with alpha mask
    base.alpha_composite(logo, dest=(x, y))
    base.convert("RGB").save(output_path, "PNG", optimize=True)
    try:
        print(f"  [OK] {output_path.relative_to(REPO_ROOT)}  ({base.width}x{base.height})")
    except UnicodeEncodeError:
        print(f"  [OK] {output_path}  ({base.width}x{base.height})")


def main() -> int:
    args = sys.argv[1:]
    in_place = False
    if "--in-place" in args:
        in_place = True
        args.remove("--in-place")
    if not args:
        print(__doc__)
        return 1
    if not LOGO_PATH.exists():
        print(f"ERROR: logo not found at {LOGO_PATH}")
        return 2

    targets = []
    for a in args:
        p = Path(a)
        if p.is_dir():
            targets.extend(sorted(p.glob("*.png")))
        elif p.suffix.lower() == ".png":
            targets.append(p)
        else:
            print(f"skipping non-PNG: {p}")

    if not targets:
        print("no PNGs to process")
        return 1

    print(f"compositing NWM logo onto {len(targets)} file(s):")
    for src in targets:
        if in_place:
            dst = src
        else:
            dst = src.with_name(src.stem + "_logo.png")
        composite_logo(src, dst)
    print("done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
