---
name: harness
description: >
  Force-dispatch a specific loop phase regardless of classifier output.
  Use only when the auto-router picked wrong. Prefer letting the harness
  agent decide.
---

Manually invoke a phase. Normally you do not need this — the `harness` agent
classifies intent and dispatches automatically. Use this skill when:

- The router picked the wrong phase
- You want to re-run a phase that was already done
- You are debugging the loop itself

## Invocation

`/harness <phase> [slug]`

`<phase>` ∈ `plan` | `build` | `review` | `debug`

## Steps

1. Validate phase. Reject if not in the four above.
2. Resolve slug:
   - from arg, or
   - from `swarm-report/.harness-state.json`, or
   - ask the user.
3. Set `swarm-report/.harness-state.json` `current` to the chosen phase, `slug`
   to the resolved slug.
4. Load the matching skill (`plan` / `build` / `review` / `debug`) and follow it
   exactly.
5. After completion, the skill will return control to `harness` agent for the
   next transition.
