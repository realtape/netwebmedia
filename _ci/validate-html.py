#!/usr/bin/env python3
"""
HTML validation guards for netwebmedia.com root HTML.

Runs as CI step (.github/workflows/validate-html.yml) on every push to main
and every PR, BEFORE the deploy workflow fires. Failure here halts the deploy.

Each check exists because a real production regression slipped through without
it. The git blame for each check should reference the commit that caused the
incident -- when adding a new guard, document the incident.

Run locally:  python3 _ci/validate-html.py
Exit code:    0 = all checks passed, 1 = one or more failed
"""
from __future__ import annotations
import glob
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML_FILES = sorted(p.relative_to(ROOT).as_posix() for p in ROOT.glob("*.html"))

# Track failures across all checks before exiting (don't bail on first failure --
# we want a complete list of problems, not just the first one).
failures: list[str] = []


def fail(check_id: str, msg: str) -> None:
    failures.append(f"[{check_id}] {msg}")


# -----------------------------------------------------------------------------
# Guard 1 -- pixel-init.js MUST be sync-loaded.
#
# Incident: 2026-05-04 commit 4a5b3bd8b added `defer` to <script src="/js/pixel-
# init.js"> across 7 root pages as a "render-blocking fix". The deploy-time
# generator at .github/workflows/deploy-site-root.yml:277 sets
# window.NWM_META_PIXEL_ID inside that script, and an inline <script> right
# after it gates fbq('init') on the var. defer postponed the assignment until
# after HTML parsing, so the inline gate evaluated `undefined → falsy` and
# Meta Pixel never initialized on /, /about, /analytics, /blog, /contact,
# /pricing, /services. Caught by gsd-code-reviewer the same day; fixed in
# a0f1e3242. This guard prevents the regression class.
# -----------------------------------------------------------------------------
def guard_pixel_init_sync() -> None:
    pattern = re.compile(
        r"<script[^>]*\bsrc=[\"']/?js/pixel-init\.js[\"'][^>]*\b(defer|async)\b",
        re.IGNORECASE,
    )
    for fp in HTML_FILES:
        text = (ROOT / fp).read_text(encoding="utf-8")
        m = pattern.search(text)
        if m:
            line_no = text[: m.start()].count("\n") + 1
            fail(
                "F-07-PIXEL-SYNC",
                f"{fp}:{line_no} -- pixel-init.js loaded with `{m.group(1)}` "
                f"attribute. The deploy generator sets window.NWM_META_PIXEL_ID "
                f"in this file, and the inline fbq('init') block immediately "
                f"after depends on it being defined synchronously. Remove "
                f"`{m.group(1)}`.",
            )


# -----------------------------------------------------------------------------
# Guard 2 -- SearchAction urlTemplate must point to a canonical (non-301) URL.
#
# Incident: 2026-05-04 commit 4a5b3bd8b changed index.html SearchAction
# urlTemplate from /blog.html?q= to /blog/?q= claiming "blog hub is a
# directory". Reality: /blog/ is 301-redirected to /blog.html by
# blog/.htaccess line 2 and root .htaccess. The schema would have routed
# every search action through a redirect (and meta-refresh in blog/index.html
# would have stripped the ?q= query). Fixed in a0f1e3242.
# -----------------------------------------------------------------------------
def guard_search_action_canonical() -> None:
    # Currently only one known bad pattern. Add others as they're discovered.
    bad_patterns: list[tuple[str, str]] = [
        (
            r'"urlTemplate"\s*:\s*"https://netwebmedia\.com/blog/\?q=',
            "/blog/?q=... is a 301 redirect. Use /blog.html?q=... (canonical).",
        ),
    ]
    for fp in HTML_FILES:
        text = (ROOT / fp).read_text(encoding="utf-8")
        for pat, hint in bad_patterns:
            m = re.search(pat, text)
            if m:
                line_no = text[: m.start()].count("\n") + 1
                fail("F-07-SEARCH-CANON", f"{fp}:{line_no} -- {hint}")


# -----------------------------------------------------------------------------
# Guard 3 -- Schema Facebook URL must be the correct active Page.
#
# Incident: 2026-05-04 the audit-fix commit changed FB URL to a vanity URL
# (facebook.com/net.webmedia/) which is a 301 redirect to nothing/orphan per
# plans/audits/RATING-FINAL-social-2026-04-29.md. Subsequent reverts landed
# on a different wrong URL (id=100026159352754, the personal-profile orphan).
# The CORRECT Page ID is 61573687500626 (33 followers, real NetWebmedia FB
# Page). Fixed in a0f1e3242.
# -----------------------------------------------------------------------------
CORRECT_FB_PAGE_ID = "61573687500626"
KNOWN_BAD_FB_URLS = [
    "facebook.com/profile.php?id=100026159352754",  # personal-profile orphan
    "facebook.com/net.webmedia/",                   # 301-redirect vanity orphan
]


def guard_facebook_page_id() -> None:
    for fp in HTML_FILES:
        text = (ROOT / fp).read_text(encoding="utf-8")
        for bad in KNOWN_BAD_FB_URLS:
            if bad in text:
                line_no = text[: text.find(bad)].count("\n") + 1
                fail(
                    "F-07-FB-PAGE-ID",
                    f"{fp}:{line_no} -- uses known-orphan Facebook URL "
                    f"`{bad}`. Use facebook.com/profile.php?id={CORRECT_FB_PAGE_ID} "
                    f"(per plans/audits/RATING-FINAL-social-2026-04-29.md).",
                )


# -----------------------------------------------------------------------------
# Guard 4 -- Every JSON-LD block in every root HTML file must parse.
#
# Incident: 2026-05-04 audit found faq.html block 3 had an orphan
# `{"@type":"Question","name":` stub at position 10668 -- a half-finished
# Question entry with no value for `name`. It broke schema parse for the
# entire FAQPage block; Google Rich Results would have rejected it. The bug
# pre-dated the audit-fix commit but wasn't caught for an unknown duration.
# Fixed in a0f1e3242. This guard prevents any future schema regressions
# from reaching production.
# -----------------------------------------------------------------------------
JSON_LD_RE = re.compile(
    r'<script\s+type="application/ld\+json">(.*?)</script>',
    re.DOTALL | re.IGNORECASE,
)


def guard_jsonld_validity() -> None:
    for fp in HTML_FILES:
        text = (ROOT / fp).read_text(encoding="utf-8")
        for idx, blk in enumerate(JSON_LD_RE.findall(text), start=1):
            try:
                json.loads(blk)
            except json.JSONDecodeError as e:
                # Find which line in the file the block starts on (rough)
                block_pos = text.find(blk)
                line_no = text[:block_pos].count("\n") + 1 + blk[: e.pos].count("\n")
                fail(
                    "F-07-JSONLD-PARSE",
                    f"{fp}:{line_no} -- JSON-LD block {idx} fails to parse: "
                    f"{e.msg} at block-pos {e.pos}. Schema is invisible to "
                    f"Google Rich Results until fixed.",
                )


# -----------------------------------------------------------------------------
# Run all guards.
# -----------------------------------------------------------------------------
GUARDS = [
    guard_pixel_init_sync,
    guard_search_action_canonical,
    guard_facebook_page_id,
    guard_jsonld_validity,
]


def main() -> int:
    # ASCII-only output -- runs cleanly on Windows cp1252 consoles and Linux CI.
    print(f"Validating {len(HTML_FILES)} root HTML files...")
    for guard in GUARDS:
        guard()

    if failures:
        print(f"\n{len(failures)} validation failure(s):\n")
        for f in failures:
            print(f"  FAIL: {f}")
        print(
            "\nFix the issues above and re-run.  "
            "To run locally: python3 _ci/validate-html.py"
        )
        return 1

    print(f"\nAll {len(GUARDS)} guards passed across {len(HTML_FILES)} files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
