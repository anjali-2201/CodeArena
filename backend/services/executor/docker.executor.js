'use strict';

/**
 * docker.executor.js  — Cross-platform, production-grade sandbox executor
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * WHY THE PREVIOUS APPROACHES FAILED
 * ───────────────────────────────────
 *
 * Attempt 1:  docker run --timeout 5 ...
 *   → CRASH: Docker has no --timeout flag. "unknown flag: --timeout"
 *
 * Attempt 2:  docker run ... image sh -c 'timeout 10 ./a.out < /input.txt'
 *   → CRASH on Windows: "The system cannot find the file specified"
 *   Two reasons:
 *     a) Node.js exec() on Windows uses cmd.exe, which does not recognise
 *        single-quoted strings. 'timeout 10 ./a.out' is treated as a literal
 *        filename, which obviously does not exist.
 *     b) Linux `timeout` is a GNU coreutils binary. cmd.exe has its own
 *        `timeout` command (used to wait N seconds before returning), with a
 *        completely different interface — it cannot wrap another command.
 *        Even on WSL, the host shell is not Linux, so the wrong `timeout`
 *        is resolved first.
 *
 * THE CORRECT CROSS-PLATFORM SOLUTION
 * ─────────────────────────────────────
 * Use Node.js's built-in exec({ timeout: N }) option.
 * When the child process exceeds N milliseconds, Node.js sends SIGTERM/SIGKILL
 * (on Linux) or TerminateProcess (on Windows) and sets err.killed = true.
 * This works identically on every platform.
 *
 * Additionally:
 *   • Split compile and run into separate docker calls → clean CE vs RE verdict
 *   • Feed input via child.stdin, not a shell redirect → no sh -c needed
 *   • Use dockerPath() to convert Windows backslashes → Docker volume mounts work
 *   • Never use sh -c for the run phase → no quoting issues
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { exec, execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { v4: uuidv4 } = require('uuid');
const { logger }          = require('../../utils/logger');
const { normalizeOutput } = require('./local.executor');

// ── Configuration ─────────────────────────────────────────────────────────

/** Execution time limit in milliseconds. Used directly with exec({ timeout }). */
const TIME_LIMIT_MS = parseInt(process.env.EXEC_TIME_LIMIT, 10) || 10000;

/** Compile phase has a generous fixed timeout — compilation is not user-bounded. */
const COMPILE_TIMEOUT_MS = 30_000;

const MEM_LIMIT = process.env.EXEC_MEM_LIMIT || '256m';
const CPU_LIMIT = process.env.EXEC_CPU_LIMIT || '0.5';

// ── Language → Docker image map ───────────────────────────────────────────

const IMAGES = {
  cpp:        'gcc:12',
  python:     'python:3.11-slim',
  java:       'eclipse-temurin:17-jdk-alpine',
  javascript: 'node:20-slim',
};

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Convert Windows backslash paths to forward slashes.
 * Docker Desktop on Windows requires forward slashes in -v volume flags.
 *
 *   C:\Users\anjal\AppData\Local\Temp\oj_abc
 *   → C:/Users/anjal/AppData/Local/Temp/oj_abc   ✓
 */
function dockerPath(p) {
  return p.replace(/\\/g, '/');
}

/**
 * Common Docker security flags applied to EVERY container.
 *
 * Security model (identical to LeetCode/Codeforces-style judges):
 *   --rm                        auto-remove container after exit
 *   --network=none              no inbound/outbound networking
 *   --memory / --memory-swap    hard RAM cap, swap disabled
 *   --cpus                      CPU fraction cap (e.g. 0.5 = half a core)
 *   --pids-limit                prevents fork bombs
 *   --cap-drop=ALL              drops every Linux capability
 *   --security-opt=no-new-privileges  blocks setuid escalation
 */
function baseDockerFlags() {
  return [
    '--rm',
    '--network=none',
    `--memory=${MEM_LIMIT}`,
    `--memory-swap=${MEM_LIMIT}`,
    `--cpus=${CPU_LIMIT}`,
    '--pids-limit=50',
    '--cap-drop=ALL',
    '--security-opt=no-new-privileges',
  ];
}

/**
 * Promisified exec with:
 *   • Configurable timeout  →  err.killed = true on TLE
 *   • Input piped via stdin  →  no shell redirects, no sh -c, cross-platform
 *   • 2 MB output cap
 *
 * Rejects with { err, stdout, stderr } so callers can inspect all three.
 *
 * @param {string}  cmd
 * @param {string|null} input  - fed to stdin; null/undefined skips write
 * @param {number}  timeoutMs
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
function runExec(cmd, input, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = exec(
      cmd,
      { timeout: timeoutMs, maxBuffer: 2 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) return reject({ err, stdout: stdout || '', stderr: stderr || '' });
        resolve({ stdout: stdout || '', stderr: stderr || '' });
      }
    );

    // Feed input via stdin pipe — works on Windows and Linux without any
    // shell redirect syntax (< file) or sh -c wrapper.
    if (input != null && child.stdin) {
      try {
        child.stdin.write(String(input));
        child.stdin.end();
      } catch {
        // stdin may already be closed if the process exited instantly
      }
    }
  });
}

/**
 * Build a verdict from a caught exec rejection.
 * Handles TLE (err.killed), OOM, and generic Runtime Error.
 */
function runtimeVerdict(err, stderr) {
  if (err.killed) {
    return { success: false, verdict: 'Time Limit Exceeded', output: '' };
  }
  const s = String(stderr || err.message || '').toLowerCase();
  if (s.includes('oom') || s.includes('out of memory') || s.includes('memory')) {
    return { success: false, verdict: 'Memory Limit Exceeded', output: '' };
  }
  return {
    success: false,
    verdict: 'Runtime Error',
    output: String(stderr || err.message || 'Process exited with non-zero code').slice(0, 3000),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Language executors  (all use the two-phase compile → run pattern for
// compiled languages so CE is always reliably separated from RE)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * C++ executor
 * Phase 1 — docker run gcc:12 g++ ...          (writes /out/a.out)
 * Phase 2 — docker run gcc:12 /out/a.out       (Node.js timeout → TLE)
 */
async function executeCpp(code, input, tmpDir) {
  const srcDir = tmpDir;
  const outDir = path.join(tmpDir, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(srcDir, 'main.cpp'), code);

  // ── Phase 1: Compile ────────────────────────────────────────────────────
  const compileCmd = [
    'docker run',
    ...baseDockerFlags(),
    '--read-only',
    '--tmpfs /tmp:size=128m',
    `-v "${dockerPath(srcDir)}:/code:ro"`,  // source (read-only)
    `-v "${dockerPath(outDir)}:/out"`,       // output dir (writable for binary)
    IMAGES.cpp,
    'g++ -O2 -std=c++17 -o /out/a.out /code/main.cpp',
  ].join(' ');

  try {
    await runExec(compileCmd, null, COMPILE_TIMEOUT_MS);
  } catch ({ err, stderr }) {
    return {
      success: false,
      verdict: 'Compilation Error',
      output: (stderr || err.message || 'g++ compilation failed').slice(0, 3000),
    };
  }

  // ── Phase 2: Run ────────────────────────────────────────────────────────
  // Input is piped via stdin — no sh -c, no shell redirects, works on Windows.
  const runCmd = [
    'docker run',
    '-i',                                    // keep stdin open for piping
    ...baseDockerFlags(),
    '--read-only',
    '--tmpfs /tmp:size=64m',
    `-v "${dockerPath(outDir)}:/out:ro"`,    // compiled binary (read-only)
    IMAGES.cpp,
    '/out/a.out',
  ].join(' ');

  try {
    const { stdout } = await runExec(runCmd, input, TIME_LIMIT_MS);
    return { success: true, verdict: 'Accepted', output: normalizeOutput(stdout) };
  } catch ({ err, stderr }) {
    return runtimeVerdict(err, stderr);
  }
}

/**
 * Java executor
 * Phase 1 — docker run eclipse-temurin javac -d /out /code/Main.java
 * Phase 2 — docker run eclipse-temurin java -cp /out Main
 *
 * The public class is always renamed to "Main" so the filename is predictable.
 */
async function executeJava(code, input, tmpDir) {
  const srcDir = tmpDir;
  const outDir = path.join(tmpDir, 'out');
  fs.mkdirSync(outDir, { recursive: true });

  // Rename the public class to Main so javac is happy with the filename
  const finalCode = code.replace(/public\s+class\s+\w+/, 'public class Main');
  fs.writeFileSync(path.join(srcDir, 'Main.java'), finalCode);

  // ── Phase 1: Compile ────────────────────────────────────────────────────
  const compileCmd = [
    'docker run',
    ...baseDockerFlags(),
    '--read-only',
    '--tmpfs /tmp:size=128m',
    `-v "${dockerPath(srcDir)}:/code:ro"`,
    `-v "${dockerPath(outDir)}:/out"`,
    IMAGES.java,
    'javac -d /out /code/Main.java',
  ].join(' ');

  try {
    await runExec(compileCmd, null, COMPILE_TIMEOUT_MS);
  } catch ({ err, stderr }) {
    return {
      success: false,
      verdict: 'Compilation Error',
      output: (stderr || err.message || 'javac compilation failed').slice(0, 3000),
    };
  }

  // ── Phase 2: Run ────────────────────────────────────────────────────────
  // java needs /tmp for JVM scratch files, so we give it a writable tmpfs.
  const runCmd = [
    'docker run',
    '-i',
    ...baseDockerFlags(),
    '--read-only',
    '--tmpfs /tmp:size=128m',
    `-v "${dockerPath(outDir)}:/out:ro"`,
    IMAGES.java,
    'java -cp /out Main',
  ].join(' ');

  try {
    const { stdout } = await runExec(runCmd, input, TIME_LIMIT_MS);
    return { success: true, verdict: 'Accepted', output: normalizeOutput(stdout) };
  } catch ({ err, stderr }) {
    return runtimeVerdict(err, stderr);
  }
}

/**
 * Python executor  (interpreted — single phase)
 * No compilation step. Node.js timeout handles TLE.
 */
async function executePython(code, input, tmpDir) {
  fs.writeFileSync(path.join(tmpDir, 'main.py'), code);

  const runCmd = [
    'docker run',
    '-i',
    ...baseDockerFlags(),
    '--read-only',
    '--tmpfs /tmp:size=64m',
    `-v "${dockerPath(tmpDir)}:/code:ro"`,
    IMAGES.python,
    'python /code/main.py',
  ].join(' ');

  try {
    const { stdout } = await runExec(runCmd, input, TIME_LIMIT_MS);
    return { success: true, verdict: 'Accepted', output: normalizeOutput(stdout) };
  } catch ({ err, stderr }) {
    return runtimeVerdict(err, stderr);
  }
}

/**
 * JavaScript executor  (interpreted — single phase)
 *
 * WHY WE USE fs.readFileSync(0) INSTEAD OF INJECTING A STRING LITERAL
 * ───────────────────────────────────────────────────────────────────
 * Old approach: bake the input into the source file as a JS string literal.
 *   const _inp = "line1\nline2\n...";   ← injected by the runner
 *
 * Problems:
 *   1. Large inputs (10^5+ lines) produce a multi-MB JS source file that is
 *      slow for v8 to parse before a single line of user code runs.
 *   2. Special characters (backslashes, quotes, null bytes) can corrupt the
 *      literal or throw a SyntaxError before user code is reached.
 *   3. Users who write `fs.readFileSync(0, 'utf8')` (the idiomatic Node.js
 *      way to read stdin) would get an empty string, because stdin was never
 *      actually written to — the data lived only in a JS variable.
 *
 * Correct approach:
 *   • Write user code exactly as submitted — zero mutations.
 *   • Pipe the real input bytes to the container's stdin via child.stdin
 *     (already done in runExec — the `-i` flag keeps Docker's stdin open).
 *   • Prepend a tiny preamble that synchronously drains stdin once into a
 *     shared buffer, then exposes three helpers that cover every common
 *     competitive-programming I/O pattern:
 *
 *       const input    = fs.readFileSync(0, 'utf8').trimEnd();  // full string
 *       const lines    = input.split(/\r?\n/);                  // line array
 *       function readline() { return lines[_rl++] ?? ''; }      // pop a line
 *
 * This works identically inside Docker (Linux) and in local child_process
 * (Windows/Linux) because Node.js's fs.readFileSync(fd) is cross-platform.
 */
async function executeJavaScript(code, input, tmpDir) {
  // ── Preamble: read stdin once, expose input / lines[] / readline() ────────
  const preamble = [
    "'use strict';",
    "const fs = require('fs');",
    // fd 0 = stdin; synchronous read blocks until stdin is closed.
    // runExec() calls child.stdin.end() after writing, so this never hangs.
    "const input = fs.readFileSync(0, 'utf8').trimEnd();",
    "const lines = input.split(/\\r?\\n/);",
    "let _rl = 0;",
    "function readline() { return lines[_rl++] ?? ''; }",
    '',
  ].join('\n');

  // Write the preamble + user code as-is (no string escaping of user content)
  fs.writeFileSync(path.join(tmpDir, 'main.js'), preamble + code);

  // -i keeps Docker's stdin pipe open so runExec can write to it
  const runCmd = [
    'docker run',
    '-i',
    ...baseDockerFlags(),
    '--read-only',
    '--tmpfs /tmp:size=64m',
    `-v "${dockerPath(tmpDir)}:/code:ro"`,
    IMAGES.javascript,
    'node /code/main.js',
  ].join(' ');

  try {
    const { stdout } = await runExec(runCmd, input, TIME_LIMIT_MS);
    return { success: true, verdict: 'Accepted', output: normalizeOutput(stdout) };
  } catch ({ err, stderr }) {
    return runtimeVerdict(err, stderr);
  }
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Run code in a fully sandboxed Docker container.
 *
 * Returns a verdict object:
 *   { success: boolean, verdict: string, output: string }
 *
 * Possible verdicts:
 *   'Accepted'             — program ran, output is in .output
 *   'Compilation Error'    — compiler rejected the code
 *   'Time Limit Exceeded'  — Node.js exec timeout fired (err.killed = true)
 *   'Runtime Error'        — non-zero exit, not TLE
 *   'Memory Limit Exceeded' — OOM detected in stderr
 *
 * Note: 'Wrong Answer' is NOT returned here — it is determined in
 * judge.worker.js by comparing normalizeOutput(actual) vs normalizeOutput(expected).
 *
 * @param {'cpp'|'java'|'python'|'javascript'} language
 * @param {string} code
 * @param {string} [input]
 * @returns {Promise<{success: boolean, verdict: string, output: string}>}
 */
async function runInDocker(language, code, input = '') {
  if (!IMAGES[language]) {
    return { success: false, verdict: 'Runtime Error', output: `Unsupported language: ${language}` };
  }

  const id     = uuidv4();
  const tmpDir = path.join(os.tmpdir(), `oj_${id}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  logger.debug(`[DockerExecutor] lang=${language} id=${id}`);

  try {
    switch (language) {
      case 'cpp':        return await executeCpp(code, input, tmpDir);
      case 'java':       return await executeJava(code, input, tmpDir);
      case 'python':     return await executePython(code, input, tmpDir);
      case 'javascript': return await executeJavaScript(code, input, tmpDir);
    }
  } catch (unexpectedErr) {
    // Catch-all — should never reach here, but log if it does
    logger.error('[DockerExecutor] Unexpected error:', unexpectedErr);
    return { success: false, verdict: 'Runtime Error', output: String(unexpectedErr.message || unexpectedErr) };
  } finally {
    // Always clean up the temp workspace, even on error
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

/**
 * Returns true if the Docker daemon is accessible.
 * Called once at startup by initExecutor().
 */
function isDockerAvailable() {
  try {
    execSync('docker info', { stdio: 'ignore', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

module.exports = { runInDocker, isDockerAvailable };
