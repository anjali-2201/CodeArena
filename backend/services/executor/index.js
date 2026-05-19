const { logger } = require('../../utils/logger');

let useDocker = false;

/**
 * Auto-detect which executor to use:
 *   - USE_DOCKER=true in env  AND  Docker daemon available → Docker
 *   - Otherwise → local child_process (safe fallback)
 *
 * Call initExecutor() once at app startup.
 */
async function initExecutor() {
  if (process.env.USE_DOCKER === 'true') {
    const { isDockerAvailable } = require('./docker.executor');
    if (isDockerAvailable()) {
      useDocker = true;
      logger.info('[Executor] Docker is available — using sandboxed Docker execution.');
    } else {
      logger.warn('[Executor] USE_DOCKER=true but Docker is not running. Falling back to local execution.');
    }
  } else {
    logger.info('[Executor] Using local child_process execution (set USE_DOCKER=true to enable Docker).');
  }
}

/**
 * Main execution entry point.
 * Automatically routes to Docker or local executor.
 */
async function compileAndRun(language, code, input) {
  if (useDocker) {
    const { runInDocker } = require('./docker.executor');
    return runInDocker(language, code, input);
  }
  const { compileAndRun: runLocal } = require('./local.executor');
  return runLocal(language, code, input);
}

/**
 * Re-export normalizeOutput for controllers that need it.
 */
const { normalizeOutput } = require('./local.executor');

module.exports = { initExecutor, compileAndRun, normalizeOutput };
