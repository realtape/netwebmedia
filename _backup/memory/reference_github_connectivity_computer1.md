---
name: github-connectivity-computer1
description: "Why GitHub/gh shows \"unreachable\" on Computer 1 and how it was fixed (keyring→file token + prefer-IPv4 registry)"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 363ae0c0-bf17-4c1d-bf1f-b4c4d447a72f
---

On Computer 1 (this Windows machine, see [[user-computers]]), Claude Code's "GitHub is unreachable" banner had two root causes, both fixed 2026-05-25:

1. **gh token was in the Windows keyring; keyring reads intermittently stalled (~20s).** Fixed by migrating the token to plaintext file storage: `gh auth login --with-token --insecure-storage`. Token now lives in `C:\Users\Usuario\AppData\Roaming\GitHub CLI\hosts.yml` under account **`netwebmedia`** (the old `realtape` label was stale/orphaned and was removed). Verify source via `gh auth status` — parenthetical should say `(hosts.yml)`, not `(keyring)`.

2. **This network's IPv6 is broken, but GitHub publishes AAAA records**, so gh's Go HTTP client tried IPv6 ~20% of calls and timed out at exactly 10s (curl dodged it via fast IPv4 fallback). Fixed by setting `HKLM\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters\DisabledComponents = 0x20` (REG_DWORD = prefer IPv4 over IPv6 system-wide). **Requires a reboot to take effect.** Reversible: delete the value + reboot to restore default.

**Why:** explains otherwise-surprising config (plaintext gh token; an IPv6-disabling registry key) and prevents re-diagnosing the same GitHub flakiness next time it surfaces.
**How to apply:** if GitHub/gh acts flaky again, first run `gh auth status` and a 10x `gh api user` loop; a consistent 10s-timeout subset = IPv6 again (re-check `DisabledComponents` survived / reboot happened); a `(keyring)` source = token reverted to keyring.
