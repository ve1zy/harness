---
name: caveman-stats
description: >
  Show real token usage and estimated savings for the current session.
  Reads the opencode SQLite session DB directly via bun:sqlite — no AI estimation.
  Triggers on /caveman-stats.
---

When `/caveman-stats` fires, run the bundled script and print its output verbatim. Do
not estimate, do not recompute, do not add commentary.

```
bun <harness>/skills/caveman-stats/scripts/stats.ts [session-id]
```

Defaults to the current session. Override with `session-id` arg or `OPENCODE_SESSION_ID` env.

DB path default: `$HOME/.local/share/opencode/opencode.db` (override with `OPENCODE_DB`).

The script reads `message.tokens.input` and `message.tokens.output` from the opencode
SQLite store. Baseline is computed as `input * 1.6` (typical caveman compression
ratio) and savings vs. that baseline. No model involvement.
