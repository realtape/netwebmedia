# NetWebMedia runs on Claude Pro Max, not ChatGPT

Carlos clarified (2026-04-21): NetWebMedia's internal AI tool is **Claude Pro Max (Anthropic)**. ChatGPT is NOT part of the NWM stack as an internal operator tool.

## The distinction

- **Internal thinking engine (what we use):** Claude Pro Max. For server-side/agent work, the Anthropic Claude API.
- **Answer engines we optimize for (AEO targets, external):** ChatGPT, Perplexity, Claude.ai, Google AI Overviews. These are channels where clients' buyers search — we engineer content to get cited there. Referencing ChatGPT/Perplexity as citation targets is legitimate and should stay in all customer-facing copy.

## Implications for content/copy

- Never claim "we use ChatGPT" or imply OpenAI is our primary. If a context needs to name our operational AI, it's Claude Pro Max (or Anthropic/Claude API for technical contexts).
- Cost-model/bear-case statements about AI provider risk should reference **Anthropic API costs**, not ChatGPT API costs.
- Trust-strip logos and integration partners: lead with **Anthropic**; OpenAI can be included only as an optional integration.
- "We name the stack" voice attribute in the brand book is a good place to explicitly state Claude Pro Max as the internal engine.

## Files already corrected (2026-04-21)

- `BUSINESS_PLAN.md` §Scenario — bear case: ChatGPT API → Anthropic (Claude) API
- `plans/business-plan.html` — matching HTML update
- `BRAND.md` Voice attributes — "Technical" row rewritten to name Claude Pro Max as internal engine and ChatGPT/Perplexity/AI Overviews as AEO targets
- `.claude/agents/engineering-lead.md` — AI integrations line rewritten to state Claude as primary
