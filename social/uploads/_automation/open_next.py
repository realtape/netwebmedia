#!/usr/bin/env python3
"""open_next.py — Find the next upcoming post folder and open it in Explorer.

Called by OPEN-NEXT.bat. Stdlib only.
"""

import os
import sys
from datetime import date
from pathlib import Path

UPLOADS = Path(__file__).resolve().parents[1]


def find_next_upcoming():
    today_iso = date.today().isoformat()
    candidates = []
    for week_dir in sorted(UPLOADS.glob("week-*")):
        for post in sorted(week_dir.iterdir()):
            if not post.is_dir():
                continue
            # Folder names start with "YYYY-MM-DD_"
            name = post.name
            if len(name) < 10 or name[4] != "-" or name[7] != "-":
                continue
            post_date = name[:10]
            if post_date >= today_iso:
                candidates.append((post_date, post))
    candidates.sort(key=lambda x: x[0])
    return candidates[0][1] if candidates else None


def main():
    nxt = find_next_upcoming()
    if nxt is None:
        print("No upcoming post folders found. Opening uploads README instead.")
        readme = UPLOADS / "README.md"
        if readme.exists():
            os.startfile(str(readme))
        return

    print(f"Opening next upcoming post:")
    print(f"  {nxt}")
    print()
    # Open the folder
    os.startfile(str(nxt))
    # Also surface INSTRUCTIONS.md so it's read-first
    instructions = nxt / "INSTRUCTIONS.md"
    if instructions.exists():
        print(f"  See INSTRUCTIONS.md inside the folder for step-by-step.")


if __name__ == "__main__":
    main()
