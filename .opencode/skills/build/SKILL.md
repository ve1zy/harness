---
name: build
description: >
  Implement an approved plan. Loads the plan, groups affected files by
  executing-agent scope, dispatches ONE specialist at a time (sequential by
  default — backend before frontend, schema before UI), runs tests, writes
  the build report. Called by the `harness` agent, not directly by the user.
---

# Skill: build

You are invoked by the `harness` agent after a plan is approved. The harness
passes you the slug. You do the build, return control. Do not loop into
review or debug — that is the harness's job.

## Input

- `<slug>` — the plan identifier
- Plan file: `swarm-report/<slug>-plan.md` (must exist)
- State: `swarm-report/.harness-state.json` should show `current: "build"`

If the plan file is missing, abort with: `Run \`/plan "<feature>"\` first or
let the harness route to plan.`

If `Blockers` is non-empty in the plan, abort and name the HIGH blockers.

## Steps

1. **Read the plan.** Extract `affected_files` and the ordered list of
   execution steps. The plan dictates order (e.g. db schema before API
   before UI). If order is ambiguous, use the order in the plan's
   `## Plan` section.

2. **Group by scope.** For each file in `affected_files`, pick the
   executing agent from the table in `AGENTS.md` (Stack-specific first,
   generic fallback last). One file → one agent. No match → tell the
   harness "no scope match for <file>", let the harness surface to user.

3. **Dispatch sequentially.** For each scope group, in plan order:
   - Announce the handoff: `→ build / <scope> — <agent-name>` with a one-line
     "why this comes now".
   - Spawn EXACTLY ONE Task call. Prompt:
     ```
     Answer TERSE. Read `.opencode/agents/<agent>.md` and follow it exactly.
     Plan: swarm-report/<slug>-plan.md. Your scope: <files>. Apply <plan step>.
     Return: changed_files, tests_result (real command + real output).
     ```
   - Wait for the result. Read it. If `status: blocked` or any test failed,
     stop and return the failure to harness — harness routes to `debug`.

4. **Cross-layer contract check.** After each specialist, if the next
   specialist needs the previous one's output (e.g. frontend needs the
   backend's `api_changes` block from the plan), thread it into the next
   prompt. Do not guess.

5. **Write the report.** `swarm-report/<slug>-build.md` with:
   - Per-scope: agent, files changed, test command + REAL output (no
     "passed" without the line), duration estimate
   - Cross-layer notes for the reviewer
   - Open items the user should know about

6. **Return to harness.** Report TL;DR: scope count, all tests pass yes/no,
   report path. Harness will route to `review`.

## Rules

- One specialist at a time. Sequential, not parallel. The harness may
  override to parallel only when the plan scopes are provably independent —
  that is not your call.
- No code edits in the main loop. The specialists edit; you orchestrate and
  write the report.
- No `done` without quoted real test output. "All tests pass" is a lie if
  the command did not run.
- No retry loops. If a specialist fails, surface to harness and stop.
- Sequential does not mean slow. Dispatch one, get result, dispatch next.
  Never wait for the user between specialists.
