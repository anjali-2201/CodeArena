const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '..', 'temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const TIME_LIMIT = 10000; // 10 seconds

/**
 * Normalize output: convert \r\n → \n, trim each line's trailing spaces,
 * then trim the whole string. This prevents false Wrong Answer verdicts
 * caused by OS-level line-ending differences (Windows vs Linux).
 */
function normalizeOutput(output) {
  return output
    .replace(/\r\n/g, '\n')   // Windows CRLF → LF
    .replace(/\r/g, '\n')     // old Mac CR → LF
    .split('\n')
    .map((line) => line.trimEnd()) // strip trailing spaces per line
    .join('\n')
    .trim();                   // strip leading/trailing blank lines
}

/**
 * Clean up temporary files after execution
 */
function cleanup(files) {
  files.forEach((file) => {
    try {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } catch (e) {
      // Ignore cleanup errors
    }
  });
}

/**
 * Execute a command with a time limit
 */
function executeWithTimeout(command, input, timeLimit = TIME_LIMIT) {
  return new Promise((resolve, reject) => {
    const child = exec(command, { timeout: timeLimit, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        if (error.killed) {
          reject({ type: 'TLE', message: 'Time Limit Exceeded' });
        } else {
          reject({ type: 'RUNTIME', message: stderr || error.message });
        }
      } else {
        resolve(stdout);
      }
    });

    if (input) {
      child.stdin.write(input);
      child.stdin.end();
    }
  });
}

/**
 * Compile and run C++ code
 */
async function runCpp(code, input) {
  const id = uuidv4();
  const srcFile = path.join(TEMP_DIR, `${id}.cpp`);
  const exeFile = path.join(TEMP_DIR, `${id}.exe`);
  const filesToClean = [srcFile, exeFile];

  try {
    fs.writeFileSync(srcFile, code);

    // Compile
    try {
      execSync(`g++ -o "${exeFile}" "${srcFile}" -std=c++17`, {
        timeout: 15000,
        stdio: 'pipe',
      });
    } catch (compileError) {
      cleanup(filesToClean);
      return {
        success: false,
        verdict: 'Compilation Error',
        output: compileError.stderr?.toString() || 'Compilation failed',
      };
    }

    // Run
    const output = await executeWithTimeout(`"${exeFile}"`, input);
    cleanup(filesToClean);
    return { success: true, output: normalizeOutput(output) };
  } catch (error) {
    cleanup(filesToClean);
    if (error.type === 'TLE') {
      return { success: false, verdict: 'Time Limit Exceeded', output: '' };
    }
    return {
      success: false,
      verdict: 'Runtime Error',
      output: error.message || 'Runtime error occurred',
    };
  }
}

/**
 * Run Python code
 */
async function runPython(code, input) {
  const id = uuidv4();
  const srcFile = path.join(TEMP_DIR, `${id}.py`);
  const filesToClean = [srcFile];

  try {
    fs.writeFileSync(srcFile, code);
    const output = await executeWithTimeout(`python "${srcFile}"`, input);
    cleanup(filesToClean);
    return { success: true, output: normalizeOutput(output) };
  } catch (error) {
    cleanup(filesToClean);
    if (error.type === 'TLE') {
      return { success: false, verdict: 'Time Limit Exceeded', output: '' };
    }
    return {
      success: false,
      verdict: 'Runtime Error',
      output: error.message || 'Runtime error occurred',
    };
  }
}

/**
 * Compile and run Java code
 */
async function runJava(code, input) {
  const id = uuidv4().replace(/-/g, '');
  const className = `Solution${id.substring(0, 8)}`;
  // Replace any public class name with our generated class name
  const modifiedCode = code.replace(/public\s+class\s+\w+/, `public class ${className}`);
  const srcFile = path.join(TEMP_DIR, `${className}.java`);
  const classFile = path.join(TEMP_DIR, `${className}.class`);
  const filesToClean = [srcFile, classFile];

  try {
    fs.writeFileSync(srcFile, modifiedCode);

    // Compile
    try {
      execSync(`javac "${srcFile}"`, { timeout: 15000, stdio: 'pipe' });
    } catch (compileError) {
      cleanup(filesToClean);
      return {
        success: false,
        verdict: 'Compilation Error',
        output: compileError.stderr?.toString() || 'Compilation failed',
      };
    }

    // Run
    const output = await executeWithTimeout(
      `java -cp "${TEMP_DIR}" ${className}`,
      input
    );
    cleanup(filesToClean);
    return { success: true, output: normalizeOutput(output) };
  } catch (error) {
    cleanup(filesToClean);
    if (error.type === 'TLE') {
      return { success: false, verdict: 'Time Limit Exceeded', output: '' };
    }
    return {
      success: false,
      verdict: 'Runtime Error',
      output: error.message || 'Runtime error occurred',
    };
  }
}

/**
 * Run JavaScript code
 *
 * Input is piped to the child process via stdin (child.stdin.write).
 * The preamble reads stdin synchronously with fs.readFileSync(0, 'utf8'),
 * which blocks until stdin is closed — that happens immediately after
 * executeWithTimeout() calls child.stdin.end().
 *
 * Exposed globals (visible to user code):
 *   input      → full stdin string, trailing whitespace removed
 *   lines      → input.split(/\r?\n/) array
 *   readline() → returns lines[i++] one at a time (competitive-style)
 */
async function runJavaScript(code, input) {
  const id = uuidv4();
  const srcFile = path.join(TEMP_DIR, `${id}.js`);
  const filesToClean = [srcFile];

  const preamble = [
    "'use strict';",
    "const fs = require('fs');",
    "const input = fs.readFileSync(0, 'utf8').trimEnd();",
    "const lines = input.split(/\\r?\\n/);",
    "let _rl = 0;",
    "function readline() { return lines[_rl++] ?? ''; }",
    '',
  ].join('\n');

  try {
    fs.writeFileSync(srcFile, preamble + code);
    const output = await executeWithTimeout(`node "${srcFile}"`, input);
    cleanup(filesToClean);
    return { success: true, output: normalizeOutput(output) };
  } catch (error) {
    cleanup(filesToClean);
    if (error.type === 'TLE') {
      return { success: false, verdict: 'Time Limit Exceeded', output: '' };
    }
    return {
      success: false,
      verdict: 'Runtime Error',
      output: error.message || 'Runtime error occurred',
    };
  }
}

/**
 * Main compiler entry point
 */
async function compileAndRun(language, code, input) {
  switch (language) {
    case 'cpp':
      return runCpp(code, input);
    case 'python':
      return runPython(code, input);
    case 'java':
      return runJava(code, input);
    case 'javascript':
      return runJavaScript(code, input);
    default:
      return {
        success: false,
        verdict: 'Runtime Error',
        output: `Unsupported language: ${language}`,
      };
  }
}

module.exports = { compileAndRun };
