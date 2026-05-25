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

**Recurrence 2026-05-25 (later, same day):** banner came back. Diagnosis refined — `gh api user` alternated 0.6s success / 10s `TLS handshake timeout`. Root cause this time was **broken-IPv6 DNS resolution, not the IPv6 connect path**: Ethernet 2 (the only Up interface; IP 192.168.0.2 / GW 192.168.0.1) had both IPv4 ISP nameservers (`200.83.1.5, 190.160.0.15, 200.30.192.14` — all fast when queried directly) AND dead IPv6 ISP nameservers (`2800:150:e:*` Telefónica Chile, unreachable). `getaddrinfo` intermittently queried the dead IPv6 NS → ~10s stall → fell back. Proof: pinning `curl --resolve api.github.com:443:<IPv4>` = 100% fast; full 1500-byte DF-ping = OK (ruled out MTU); single-interface, single default route (ruled out competing paths); all 3 IPv4 NS fast when queried directly (ruled out flaky ISP DNS).

**No-reboot fix applied (Carlos chose "elevated fix now" over reboot):** elevated `Disable-NetAdapterBinding -Name 'Ethernet 2' -ComponentID ms_tcpip6` + `Clear-DnsClientCache`. This removed the IPv6 NS from the active path (Ethernet 2 now IPv4-DNS-only). Result: gh failures dropped ~50% → ~20%, git `ls-remote` 100% clean, and stalls that remain mostly recover. **Ceiling without reboot is ~80% gh success** — the last ~20% (10s TLS-handshake timeout to GitHub's IPv4 Azure edge `4.228.31.x`) persists even with no IPv6 route, no AAAA, and Teredo/6to4 disabled. Only the OS-level prefer-IPv4 (`DisabledComponents=0x20`, already staged in registry) clears it fully — **and that needs a reboot to activate**. Helper script lives at `C:\Users\Usuario\AppData\Local\Temp\nwm-ipv6-fix.ps1`. Reverse with `Enable-NetAdapterBinding -Name 'Ethernet 2' -ComponentID ms_tcpip6`.

**Why:** explains otherwise-surprising config (plaintext gh token; an IPv6-disabling registry key; IPv6 unbound on Ethernet 2) and prevents re-diagnosing the same GitHub flakiness next time it surfaces.
**How to apply:** if GitHub/gh acts flaky again, run `gh auth status` + a 10x `gh api user` loop. A 10s-timeout subset = IPv6 DNS again: check Ethernet 2 still has IPv6 unbound (`Get-NetAdapterBinding -ComponentID ms_tcpip6`) and IPv4-only DNS; the *complete* fix is a reboot (activates the staged `DisabledComponents=0x20`). A `(keyring)` source = token reverted to keyring. Note adapter-disable alone tops out ~80%; don't expect 100% until the reboot.
