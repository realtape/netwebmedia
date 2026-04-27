"""
NWM Reels - Fix Compositions
1. Fix `const tl` TDZ error (caption code references tl before declaration)
2. Add <audio> narration element to each composition

Run with: "C:\Program Files\Python311\python" fix_compositions.py
"""
import re
import pathlib

BASE = pathlib.Path(__file__).parent
COMP_DIR = BASE / "compositions"

# Total durations per composition (in seconds)
DURATIONS = {
    "reel-01-ai-sdr":       82,
    "reel-02-seo-dead":     68,
    "reel-03-80-hours":     71,
    "reel-04-roas-playbook": 86,
    "reel-05-2m-teardown":  79,
    "reel-06-aeo-audit":    75,
    "reel-07-agency-freelancer": 70,
    "reel-08-340k-pipeline": 70,
    "reel-09-cac-62":       80,
    "reel-10-apollo-teardown": 75,
}

def fix_tl_init_order(html: str, reel_id: str) -> str:
    """
    Move `window.__timelines = ...; const tl = gsap.timeline(...)`
    to BEFORE the first `tl.to(` usage in the script block.

    This prevents TDZ errors when caption GSAP code is injected
    before the original tl declaration.
    """
    # Pattern: the two init lines that appear AFTER caption code
    init_pattern = re.compile(
        r'(\s*window\.__timelines\s*=\s*window\.__timelines\s*\|\|\s*\{\};\s*\n'
        r'\s*const tl\s*=\s*gsap\.timeline\(\{[^}]*\}\);)',
        re.MULTILINE
    )

    # Find the init block
    m = init_pattern.search(html)
    if not m:
        print(f"  WARN [{reel_id}] could not find tl init block")
        return html

    init_block = m.group(1)

    # Check if caption code precedes tl declaration
    first_tl_use = html.find("tl.to(")
    init_pos = m.start()

    if first_tl_use >= init_pos:
        print(f"  OK   [{reel_id}] tl already declared before first use")
        return html

    # Remove the init block from its current position
    html_without_init = html[:m.start()] + html[m.end():]

    # Find the script tag that contains the caption code
    # We need to insert just after `<script>` or just before the first `tl.to(`
    # Strategy: find first `tl.to(` in the modified html and insert init block just before it

    # But first, trim the init_block to remove leading newlines for clean insertion
    init_lines = init_block.strip()

    # Find the first tl.to( position in the modified html
    first_use_pos = html_without_init.find("tl.to(")
    if first_use_pos == -1:
        print(f"  WARN [{reel_id}] no tl.to( found after removing init")
        return html

    # Find the start of that line
    line_start = html_without_init.rfind("\n", 0, first_use_pos) + 1

    # Get the indentation of the first tl.to line
    line_text = html_without_init[line_start:first_use_pos]
    indent = len(line_text) - len(line_text.lstrip())
    indent_str = " " * indent

    # Insert init block before the first tl.to( line
    insertion = f"{indent_str}{init_lines.replace(chr(10), chr(10) + indent_str)}\n\n"

    result = html_without_init[:line_start] + insertion + html_without_init[line_start:]
    print(f"  FIX  [{reel_id}] moved tl init before first caption use")
    return result


def add_audio_element(html: str, reel_id: str, duration: int) -> str:
    """
    Add <audio> narration element inside the composition root div.
    Inserts before the closing </div> of the composition root (before </body>).
    Skips if already present.
    """
    audio_id = f"narration-{reel_id}"
    src = f"../assets/tts/{reel_id}.wav"

    # Check if already present
    if f'id="{audio_id}"' in html or 'id="narration"' in html:
        print(f"  SKIP [{reel_id}] audio element already present")
        return html

    audio_tag = (
        f'\n      <audio id="{audio_id}" src="{src}"'
        f' data-start="0" data-duration="{duration}"'
        f' data-track-index="0" data-volume="1"></audio>'
    )

    # Insert before the last </div> before </body>
    # The composition root ends with </div>\n  </body>
    insert_before = "\n  </body>"
    pos = html.rfind(insert_before)
    if pos == -1:
        insert_before = "</body>"
        pos = html.rfind(insert_before)
    if pos == -1:
        print(f"  WARN [{reel_id}] could not find </body> to insert audio")
        return html

    # Find the </div> just before </body>
    div_close = html.rfind("</div>", 0, pos)
    if div_close == -1:
        print(f"  WARN [{reel_id}] could not find closing </div>")
        return html

    result = html[:div_close] + audio_tag + "\n    " + html[div_close:]
    print(f"  ADD  [{reel_id}] audio narration ({duration}s)")
    return result


def process_composition(reel_id: str, duration: int):
    path = COMP_DIR / f"{reel_id}.html"
    if not path.exists():
        print(f"  ERROR [{reel_id}] file not found")
        return

    html = path.read_text(encoding="utf-8")
    original = html

    html = fix_tl_init_order(html, reel_id)
    html = add_audio_element(html, reel_id, duration)

    if html != original:
        path.write_text(html, encoding="utf-8")
    else:
        print(f"  NOOP [{reel_id}] no changes needed")


def main():
    print("=== NWM Compositions Fix ===\n")
    for reel_id, duration in DURATIONS.items():
        print(f"Processing {reel_id}...")
        process_composition(reel_id, duration)
        print()
    print("Done.")


if __name__ == "__main__":
    main()
