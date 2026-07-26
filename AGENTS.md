# Mini Dev-Loop Harness

**OpenCode only.** Targets opencode ≥ 1.0. Uses `opencode.json` + `.opencode/`
(plugins/, agents/, skills/). Claude Code's `hooks` schema and `$CLAUDE_PROJECT_DIR`
are NOT used; if you are on Claude Code, this harness needs a separate port.

A drop-in layout that gives any opencode project a deterministic development loop:
**/plan → /build → /review → /debug**.

It is *files*, not a CLI. There is no `harness do "build X"`. After you copy
`opencode.json`, `.opencode/`, and `AGENTS.md` into your project root, opencode
activates the harness on next launch.

## Install (manual, 30 seconds)

From PowerShell (target = your project root):

```powershell
$src = "C:\Users\PC\harness"          # this harness checkout
$dst = "C:\path\to\my-project"        # your project

Copy-Item "$src\opencode.json" "$dst\opencode.json" -Force
Copy-Item "$src\.opencode"   "$dst\.opencode"   -Recurse -Force
Copy-Item "$src\AGENTS.md"   "$dst\AGENTS.md"   -Force
```

From Git Bash / Linux / macOS:

```bash
SRC=/c/Users/PC/harness
DST=/c/path/to/my-project

cp "$SRC/opencode.json" "$DST/"
cp -R "$SRC/.opencode"   "$DST/"
cp "$SRC/AGENTS.md"     "$DST/"
```

That's it. Three files. Then:

```bash
cd $DST
opencode
# type your feature — harness routes plan → build → review → debug automatically
```

Optional: `bun install` in `$DST/.opencode/` to pre-install the test-gate plugin deps (not required — opencode runs `bun install` on first launch anyway).

Manual override: `/harness plan|build|review|debug [slug]`.

## The loop

The user does NOT type `/plan`, `/build`, `/review`, or `/debug`. The primary
agent (default = `harness`, see `.opencode/agents/harness.md`) classifies every
request and dispatches the right phase. State lives in
`swarm-report/.harness-state.json`.

1. `plan` — design before code. planner + skeptic read your Memory Bank,
   argue, and write a plan to `swarm-report/`.
2. `build` — the executing agents whose file scope the feature touches implement
   the approved plan and run the tests. Multi-layer feature → several exec agents in
   parallel.
3. `review` — the reviewer checks the diff against the plan and reports ship/rework.
4. `debug` — when a test fails, a build is blocked, or something breaks: the
   debugger reproduces, ladders hypotheses, isolates on evidence, applies the minimal fix.

Feature broke on test or review said `rework` → `debug` → back to `build`. The
**test-gate plugin** (`.opencode/plugins/test-gate.ts`) blocks `session.idle` until the
project's tests actually run and their output is cited — testing after every feature is
enforced, not optional.

## Agents

### Consilium (design + review + debug — diagnose, don't bulk-edit)
| Role     | Agent                        | Used by   |
|----------|------------------------------|-----------|
| planner  | `.opencode/agents/planner.md`  | `/plan`   |
| skeptic  | `.opencode/agents/skeptic.md`  | `/plan`   |
| reviewer | `.opencode/agents/reviewer.md` | `/review` |
| debugger | `.opencode/agents/debugger.md` | `/debug`  |

### Executing (write code — matched by file scope)
`/build` maps each plan task's affected files to an exec agent. A feature that touches
several layers runs several exec agents in parallel.

**Match order: stack-specific first, generic fallback last.** The specific agents carry
2026 best-practice rules for their stack; the generic ones catch anything not covered.
Confirm the actual stack from the repo (`package.json`, `pubspec.yaml`, `pyproject.toml`,
`*.xcodeproj`, `build.gradle.kts`, `*.tf`) before picking.

**Stack-specific:**
| Agent                              | Scope (signal files / globs)                              |
|------------------------------------|-----------------------------------------------------------|
| `.opencode/agents/react-ts.md`       | `**/*.{tsx,jsx}` + React in `package.json`                |
| `.opencode/agents/node-ts.md`        | server `**/*.ts` + `package.json` (Fastify/Nest/Hono, no React) |
| `.opencode/agents/python-fastapi.md` | `**/*.py`, `pyproject.toml` (FastAPI)                     |
| `.opencode/agents/flutter.md`        | `pubspec.yaml`, `**/*.dart`                               |
| `.opencode/agents/ios.md`            | `**/*.swift`, `*.xcodeproj`, `Package.swift`             |
| `.opencode/agents/android.md`        | `**/*.kt`, `build.gradle.kts`, `libs.versions.toml`      |
| `.opencode/agents/terraform-yandex.md` | `**/*.tf`, `.terraform.lock.hcl`                        |

**Generic fallback (stacks not covered above — e.g. Vue/Svelte, Go/Ruby, plain infra):**
| Agent                        | Scope                                                              |
|------------------------------|-------------------------------------------------------------------|
| `.opencode/agents/frontend.md` | `frontend/**`, `web/**`, `ui/**`, `**/*.{vue,svelte,css,scss}`     |
| `.opencode/agents/backend.md`  | `backend/**`, `api/**`, `server/**`, `**/*.{go,rb,java}`           |
| `.opencode/agents/devops.md`   | `Dockerfile`, `docker-compose*`, `.github/**`, `k8s/**`, `Makefile` |
| `.opencode/agents/mobile.md`   | other mobile not matched above                                    |

No scope matches → ask the user which exec agent should own the change. Edit these globs to
fit each project's real layout.

## Working agreement (every agent respects)

- **Accuracy > speed.** Verify before claiming done. Tests pass ≠ feature works.
- **Read the Memory Bank first.** `.memory-bank/index.md` is the source of truth for what
  the project is. Missing → say so, do not invent project facts.
- **Model is set once.** Pick a model in `opencode.json` (`"model": "..."`) or via
  `--model` flag. All 19 subagents inherit it. Do NOT add per-agent `model:` unless
  you have a real reason (e.g. cheap model for read-only lookups, stronger model for
  planning). The harness uses one model end-to-end.
- **Disagree loudly.** Request wrong, scope bloated, plan flawed → say it, offer one
  alternative. Do not play along.
- **Stay in your scope.** An exec agent touches only its layer. Cross-layer impact →
  note it in the return for the sibling agent, do not reach across.
- **Edit > Write.** Change existing files; add new ones only when the plan calls for them.
- **No comments that narrate code.** Only *why* comments for a non-obvious invariant.
- **Security by default.** No injection, no hardcoded secrets. Validate external input at
  the boundary.
- **Ask before risky actions:** deleting files/branches, force push, dropping deps,
  anything visible outside the repo.
- **Terse output.** Agents answer terse: drop filler, keep every technical fact. Code,
  commits, PRs: written normally.
