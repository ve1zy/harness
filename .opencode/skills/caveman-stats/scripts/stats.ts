#!/usr/bin/env bun
import { Database } from "bun:sqlite"

const dbPath = process.env.OPENCODE_DB ?? `${process.env.HOME}/.local/share/opencode/opencode.db`
const argSession = process.argv[2] ?? process.env.OPENCODE_SESSION_ID

const db = new Database(dbPath, { readonly: true })

let sessionId = argSession
if (!sessionId || sessionId === "current") {
  const row = db.query<{ id: string }, []>("SELECT id FROM session ORDER BY time_updated DESC LIMIT 1").get()
  if (!row) {
    console.error("no sessions found")
    process.exit(1)
  }
  sessionId = row.id
}

const row = db
  .query<
    { title: string | null; tokens_input: number; tokens_output: number; tokens_reasoning: number },
    [string]
  >("SELECT title, tokens_input, tokens_output, tokens_reasoning FROM session WHERE id = ?")
  .get(sessionId)

if (!row) {
  console.error(`session not found: ${sessionId}`)
  process.exit(1)
}

const turnsRow = db
  .query<{ n: number }, [string]>("SELECT COUNT(*) AS n FROM message WHERE session_id = ?")
  .get(sessionId)

const inp = row.tokens_input || 0
const out = row.tokens_output || 0
const reasoning = row.tokens_reasoning || 0
const turns = turnsRow?.n ?? 0

const baseline = Math.round((inp + reasoning) * 1.6)
const saved = Math.max(0, baseline - out)

console.log(`Session: ${row.title ?? sessionId}`)
console.log(`ID:      ${sessionId}`)
console.log(`Turns:   ${turns}`)
console.log(`Input:   ${inp.toLocaleString()} tokens (incl. ${reasoning.toLocaleString()} reasoning)`)
console.log(`Output:  ${out.toLocaleString()} tokens (caveman)`)
console.log(`Baseline: ${baseline.toLocaleString()} tokens (estimated without caveman)`)
console.log(`Saved:   ${saved.toLocaleString()} tokens (~${Math.round((saved / Math.max(baseline, 1)) * 100)}%)`)
