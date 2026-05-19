const { execSync, exec } = require('child_process');
const fs   = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../../utils/logger');

const TEMP_DIR    = path.join(__dirname, '..', '..', 'temp');
const TIME_LIMIT  = parseInt(process.env.EXEC_TIME_LIMIT)  || 10000; // ms
const MEM_LIMIT   = process.env.EXEC_MEM_LIMIT || '256m';
const CPU_LIMIT   = process.env.EXEC_CPU_LIMIT || '0.5';

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// ── Helpers ───────────────────────────────────────────────────────────────

function cleanup(files) {
  files.forEach((f) => { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch { /**/ } });
}

function normalizeOutput(s) {
  return s
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .split('\n').map((l) => l.trimEnd()).join('\n')
    .trim();
}

function executeWithTimeout(command, input) {
  return new Promise((resolve, reject) => {
    const child = exec(command, { timeout: TIME_LIMIT, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        if (err.killed) reject({ type: 'TLE', message: 'Time Limit Exceeded' });
        else            reject({ type: 'RUNTIME', message: stderr || err.message });
      } else {
        resolve(stdout);
      }
    });
    if (input && child.stdin) { child.stdin.write(input); child.stdin.end(); }
  });
}

// ── Language runners ──────────────────────────────────────────────────────

async function runCpp(code, input) {
  const id  = uuidv4();
  const src = path.join(TEMP_DIR, `${id}.cpp`);
  const exe = path.join(TEMP_DIR, `${id}.exe`);
  const toClean = [src, exe];
  try {
    fs.writeFileSync(src, code);
    try {
      execSync(`g++ -o "${exe}" "${src}" -std=c++17`, { timeout: 15000, stdio: 'pipe' });
    } catch (ce) {
      cleanup(toClean);
      return { success: false, verdict: 'Compilation Error', output: ce.stderr?.toString() || 'Compilation failed' };
    }
    const out = await executeWithTimeout(`"${exe}"`, input);
    cleanup(toClean);
    return { success: true, output: normalizeOutput(out) };
  } catch (e) {
    cleanup(toClean);
    return e.type === 'TLE'
      ? { success: false, verdict: 'Time Limit Exceeded', output: '' }
      : { success: false, verdict: 'Runtime Error', output: e.message };
  }
}

async function runPython(code, input) {
  const id  = uuidv4();
  const src = path.join(TEMP_DIR, `${id}.py`);
  try {
    fs.writeFileSync(src, code);
    const out = await executeWithTimeout(`python "${src}"`, input);
    cleanup([src]);
    return { success: true, output: normalizeOutput(out) };
  } catch (e) {
    cleanup([src]);
    return e.type === 'TLE'
      ? { success: false, verdict: 'Time Limit Exceeded', output: '' }
      : { success: false, verdict: 'Runtime Error', output: e.message };
  }
}

async function runJava(code, input) {
  const id        = uuidv4().replace(/-/g, '');
  const className = `Sol${id.substring(0, 8)}`;
  const modified  = code.replace(/public\s+class\s+\w+/, `public class ${className}`);
  const src       = path.join(TEMP_DIR, `${className}.java`);
  const cls       = path.join(TEMP_DIR, `${className}.class`);
  try {
    fs.writeFileSync(src, modified);
    try {
      execSync(`javac "${src}"`, { timeout: 15000, stdio: 'pipe' });
    } catch (ce) {
      cleanup([src, cls]);
      return { success: false, verdict: 'Compilation Error', output: ce.stderr?.toString() || 'Compilation failed' };
    }
    const out = await executeWithTimeout(`java -cp "${TEMP_DIR}" ${className}`, input);
    cleanup([src, cls]);
    return { success: true, output: normalizeOutput(out) };
  } catch (e) {
    cleanup([src, cls]);
    return e.type === 'TLE'
      ? { success: false, verdict: 'Time Limit Exceeded', output: '' }
      : { success: false, verdict: 'Runtime Error', output: e.message };
  }
}

async function runJavaScript(code, input) {
  const id  = uuidv4();
  const src = path.join(TEMP_DIR, `${id}.js`);
  const wrapped = `
const input = ${JSON.stringify(input || '')};
const lines = input.split('\\n');
let _lineIdx = 0;
function readline() { return lines[_lineIdx++] || ''; }
${code}
`;
  try {
    fs.writeFileSync(src, wrapped);
    const out = await executeWithTimeout(`node "${src}"`, input);
    cleanup([src]);
    return { success: true, output: normalizeOutput(out) };
  } catch (e) {
    cleanup([src]);
    return e.type === 'TLE'
      ? { success: false, verdict: 'Time Limit Exceeded', output: '' }
      : { success: false, verdict: 'Runtime Error', output: e.message };
  }
}

// ── Public API ────────────────────────────────────────────────────────────

async function compileAndRun(language, code, input) {
  switch (language) {
    case 'cpp':        return runCpp(code, input);
    case 'python':     return runPython(code, input);
    case 'java':       return runJava(code, input);
    case 'javascript': return runJavaScript(code, input);
    default:
      return { success: false, verdict: 'Runtime Error', output: `Unsupported language: ${language}` };
  }
}

module.exports = { compileAndRun, normalizeOutput };
