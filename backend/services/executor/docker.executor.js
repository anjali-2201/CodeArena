const { exec } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../../utils/logger');
const { normalizeOutput } = require('./local.executor');

const TIME_LIMIT_SEC = Math.ceil((parseInt(process.env.EXEC_TIME_LIMIT) || 10000) / 1000);
const MEM_LIMIT      = process.env.EXEC_MEM_LIMIT  || '256m';
const CPU_LIMIT      = process.env.EXEC_CPU_LIMIT  || '0.5';

const IMAGES = {
  cpp:        'gcc:12',
  python:     'python:3.11-slim',
  java:       'openjdk:17-slim',
  javascript: 'node:20-slim',
};

const COMPILE_CMDS = {
  cpp:    (f) => `g++ -O2 -o /tmp/a.out /code/${f} -std=c++17 && /tmp/a.out`,
  python: (f) => `python /code/${f}`,
  java:   (f) => `javac /code/${f} && java -cp /code Main`,
  javascript: (f) => `node /code/${f}`,
};

const FILENAMES = {
  cpp: 'main.cpp', python: 'main.py', java: 'Main.java', javascript: 'main.js',
};

/**
 * Run code inside a Docker container with all security restrictions applied.
 */
async function runInDocker(language, code, input) {
  const id      = uuidv4();
  const tmpDir  = path.join(os.tmpdir(), `oj_${id}`);
  const file    = FILENAMES[language];
  const imgName = IMAGES[language];

  if (!imgName) {
    return { success: false, verdict: 'Runtime Error', output: `Unsupported language: ${language}` };
  }

  fs.mkdirSync(tmpDir, { recursive: true });
  const codePath  = path.join(tmpDir, file);
  const inputPath = path.join(tmpDir, 'input.txt');
  fs.writeFileSync(codePath, code);
  fs.writeFileSync(inputPath, input || '');

  // Java: class must be named Main
  let finalCode = code;
  if (language === 'java') {
    finalCode = code.replace(/public\s+class\s+\w+/, 'public class Main');
    fs.writeFileSync(codePath, finalCode);
  }

  const cmd = [
    'docker run --rm',
    '--network=none',                           // no network
    `--memory=${MEM_LIMIT}`,                    // memory cap
    `--memory-swap=${MEM_LIMIT}`,               // disable swap
    `--cpus=${CPU_LIMIT}`,                      // CPU cap
    '--read-only',                              // read-only root fs
    '--tmpfs /tmp:size=64m,noexec',             // writable tmp only
    '--pids-limit=50',                          // prevent fork bomb
    '--cap-drop=ALL',                           // drop all capabilities
    '--security-opt=no-new-privileges',         // no privilege escalation
    `--env-file=/dev/null`,                     // no env leakage (Linux only)
    `-v "${tmpDir}:/code:ro"`,                  // mount code read-only
    `-v "${inputPath}:/input.txt:ro"`,          // mount input
    `--timeout ${TIME_LIMIT_SEC}`,
    imgName,
    `sh -c "${COMPILE_CMDS[language](file)} < /input.txt"`,
  ].join(' ');

  return new Promise((resolve) => {
    const child = exec(cmd, { timeout: (TIME_LIMIT_SEC + 5) * 1000, maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) => {
      // Cleanup
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /**/ }

      if (!err) {
        return resolve({ success: true, output: normalizeOutput(stdout) });
      }

      // Killed by timeout
      if (err.killed || err.code === 124) {
        return resolve({ success: false, verdict: 'Time Limit Exceeded', output: '' });
      }

      // OOM
      if (stderr && (stderr.includes('OOM') || stderr.includes('memory'))) {
        return resolve({ success: false, verdict: 'Memory Limit Exceeded', output: '' });
      }

      // Compilation error (detected from stderr)
      if (stderr && (stderr.includes('error:') || stderr.includes('error:'))) {
        return resolve({ success: false, verdict: 'Compilation Error', output: stderr.slice(0, 2000) });
      }

      return resolve({ success: false, verdict: 'Runtime Error', output: stderr || err.message });
    });
  });
}

/**
 * Check if Docker daemon is accessible.
 */
function isDockerAvailable() {
  try {
    require('child_process').execSync('docker info', { stdio: 'ignore', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

module.exports = { runInDocker, isDockerAvailable };
