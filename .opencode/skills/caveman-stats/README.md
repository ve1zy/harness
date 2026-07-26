# caveman-stats

Real session token receipts. No AI estimation.

## What it does

Reads the current opencode session directly from the SQLite store and reports
actual input/output token usage plus estimated savings versus a non-caveman baseline.
Numbers come from `~/.local/share/opencode/opencode.db` — the model itself does not
compute or estimate them. The skill triggers `bun scripts/stats.ts`; the script
opens the DB with `bun:sqlite`, queries `session.tokens_input` /
`session.tokens_output`, and prints the report.

## How to invoke

```
/caveman-stats
```

## Example output

```
Session: Review harness
ID:      ses_06252a60bffeJBIpL8MoYXI1dG
Turns:   61
Input:   484,028 tokens (incl. 0 reasoning)
Output:  28,001 tokens (caveman)
Baseline: 774,445 tokens (estimated without caveman)
Saved:   746,444 tokens (~96%)
```

## Requirements

- `bun` (ships with opencode)
- `OPENCODE_DB` env var override if you moved the opencode data directory

## See also

- [`SKILL.md`](./SKILL.md) — skill contract
- [`scripts/stats.ts`](./scripts/stats.ts) — the script
