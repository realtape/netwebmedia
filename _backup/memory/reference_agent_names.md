---
name: NetWebMedia agent human names
description: Human first-name aliases Carlos uses to refer to the 12 Claude Code sub-agents in his .claude/agents directory
type: reference
originSessionId: c571c3a1-cd50-4c44-8258-610401e24cb2
---
Carlos refers to his 12 agents by human first names. When he says "Marcus said X" or "ask Priya", map to the agent slug.

| Name | Agent slug | Role | Model tier |
|---|---|---|---|
| Sofia | carlos-ceo-assistant | Chief of Staff | Sonnet |
| Marcus | cmo | CMO | Opus |
| Priya | product-manager | Product | Opus |
| Diego | sales-director | Sales | Haiku |
| Elena | operations-manager | Operations | Haiku |
| Isabel | content-strategist | Content | Haiku |
| Aria | creative-director | Creative | Haiku |
| David | engineering-lead | Engineering | Opus |
| Rachel | project-manager | Project Mgmt | Haiku |
| Maya | customer-success | Customer Success | Haiku |
| James | finance-controller | Finance | Haiku |
| Liam | data-analyst | Data | Haiku |

Carlos himself = CEO (not an agent).

**How to apply:** When Carlos asks to delegate to a name, route to that agent. When agents report back, surface their output prefixed with the name (e.g. "Marcus flagged Meta verification") rather than the bracketed role tag.

**Source:** Established in the 2026-05-12 multi-agent demo session; visualized in `plans/agents-flowchart.html` (deployed to netwebmedia.com/plans/agents-flowchart.html).
