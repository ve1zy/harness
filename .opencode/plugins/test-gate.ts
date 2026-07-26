import type { Plugin } from "@opencode-ai/plugin"

const XDG_STATE = process.env.XDG_STATE_HOME || joinPath(process.env.HOME || "", ".local/state")
const STATE_DIR = `${XDG_STATE}/harness/test-gate`
const MAX_BLOCKS_PER_HEAD = 2

interface SessionState {
  edited: boolean
  testRan: boolean
  lastEditedFile: string
  blockedAt: string
  blockedCount: number
}

const states = new Map<string, SessionState>()

interface TestDetector {
  file: string
  cmd: string
  pat: RegExp
  extraCheck?: (text: string) => boolean
}

const TEST_DETECTORS: TestDetector[] = [
  { file: "pubspec.yaml", cmd: "flutter test", pat: /flutter\s+test/ },
  { file: "pyproject.toml", cmd: "pytest", pat: /(\bpytest\b|uv\s+run\s+pytest)/ },
  { file: "go.mod", cmd: "go test ./...", pat: /\bgo\s+test\b/ },
  { file: "build.gradle.kts", cmd: "./gradlew test", pat: /gradle(w)?\s+test/ },
  { file: "build.gradle", cmd: "./gradlew test", pat: /gradle(w)?\s+test/ },
  {
    file: "package.json",
    cmd: "npm test",
    pat: /\b(npm\s+(test|run\s+test)|npx\s+(vitest|jest)|node\s+--test)\b/,
    extraCheck: (t) => /"test"\s*:/.test(t),
  },
  {
    file: "Makefile",
    cmd: "make test",
    pat: /\bmake\s+test\b/,
    extraCheck: (t) => /^test:/m.test(t),
  },
]

function joinPath(a: string, b: string): string {
  if (!a) return b
  if (a.endsWith("/") || a.endsWith("\\")) return a + b
  return a + "/" + b
}

function isCodeFile(path: string): boolean {
  return /\.(ts|tsx|js|jsx|py|dart|swift|kt|kts|go|rb|java|tf|hcl)$/i.test(path)
}

async function detectTestCommand(directory: string): Promise<TestDetector | null> {
  for (const d of TEST_DETECTORS) {
    const fp = joinPath(directory, d.file)
    const file = Bun.file(fp)
    if (!(await file.exists())) continue
    if (d.extraCheck) {
      const text = await file.text()
      if (!d.extraCheck(text)) continue
    }
    return d
  }
  return null
}

async function getHead(directory: string): Promise<string> {
  try {
    const proc = Bun.spawn(["git", "-C", directory, "rev-parse", "HEAD"], {
      stdout: "pipe",
      stderr: "pipe",
    })
    const out = await new Response(proc.stdout).text()
    return out.trim() || "no-git"
  } catch {
    return "no-git"
  }
}

function getState(sessionID: string): SessionState {
  let st = states.get(sessionID)
  if (!st) {
    st = { edited: false, testRan: false, lastEditedFile: "", blockedAt: "", blockedCount: 0 }
    states.set(sessionID, st)
  }
  return st
}

function filePathOf(args: any): string {
  return String(args?.filePath ?? args?.file_path ?? args?.path ?? "")
}

function bashCmdOf(args: any): string {
  return String(args?.command ?? args?.cmd ?? "")
}

export const TestGatePlugin: Plugin = async (ctx) => {
  const { directory, client } = ctx
  const test = await detectTestCommand(directory)

  if (!test) {
    await client.app.log({
      body: {
        service: "test-gate",
        level: "debug",
        message: "no test command detected, plugin inert",
        extra: { directory },
      },
    })
  } else {
    await client.app.log({
      body: {
        service: "test-gate",
        level: "info",
        message: "armed",
        extra: { cmd: test.cmd, directory },
      },
    })
  }

  return {
    "tool.execute.after": async (input, _output) => {
      const sid = (input as any).sessionID ?? (input as any).session_id
      if (!sid) return
      const st = getState(sid)
      const tool = (input as any).tool
      const args = (input as any).args ?? (input as any).input ?? {}

      if (tool === "edit" || tool === "write") {
        const fp = filePathOf(args)
        if (isCodeFile(fp)) {
          st.edited = true
          st.lastEditedFile = fp
        }
      }
      if (tool === "bash" && test) {
        const cmd = bashCmdOf(args)
        if (test.pat.test(cmd)) st.testRan = true
      }
    },

    "session.idle": async (input, _output) => {
      if (!test) return
      const sid = (input as any).sessionID ?? (input as any).session_id
      if (!sid) return
      const st = getState(sid)
      if (!st.edited || st.testRan) return

      const head = await getHead(directory)

      if (st.blockedAt === head && st.blockedCount >= MAX_BLOCKS_PER_HEAD) {
        await client.app.log({
          body: {
            service: "test-gate",
            level: "warn",
            message: "loop-cap reached, failing open",
            extra: { sessionID: sid, head, count: st.blockedCount },
          },
        })
        return
      }

      if (st.blockedAt !== head) {
        st.blockedAt = head
        st.blockedCount = 0
      }
      st.blockedCount++

      const fname = st.lastEditedFile ? st.lastEditedFile.split(/[\\/]/).pop() : "code"
      const msg =
        `You edited code (\`${fname}\`) but ran no tests this session. ` +
        `Run \`${test.cmd}\` and cite the real output before declaring done. ` +
        `Build-green is not tested. ` +
        `(test-gate ${st.blockedCount}/${MAX_BLOCKS_PER_HEAD} at this commit)`

      await client.app.log({
        body: {
          service: "test-gate",
          level: "info",
          message: "blocking session.idle",
          extra: { sessionID: sid, head, count: st.blockedCount, file: st.lastEditedFile },
        },
      })

      throw new Error(msg)
    },
  }
}
