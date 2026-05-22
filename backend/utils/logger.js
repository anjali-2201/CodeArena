const morgan   = require('morgan');
const fs       = require('fs');
const path     = require('path');

// Ensure logs directory exists
const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// Write access logs to file
const accessLogStream = fs.createWriteStream(
  path.join(LOG_DIR, 'access.log'),
  { flags: 'a' }
);

// Custom token: request body preview (safe, truncated)
morgan.token('body', (req) => {
  if (!req.body) return '';
  const safe = { ...req.body };
  delete safe.password;
  delete safe.code; // don't log submitted code
  const str = JSON.stringify(safe);
  return str.length > 200 ? str.slice(0, 200) + '...' : str;
});

const FORMAT_DEV  = ':method :url :status :response-time ms';
const FORMAT_FILE = ':remote-addr - :method :url :status :response-time ms :date[iso]';

/**
 * Returns [consoleLogger, fileLogger] middlewares
 */
function createLoggers() {
  const consoleLogger =
  process.env.ENABLE_REQUEST_LOGS === 'true'
    ? morgan(FORMAT_DEV, {
        skip: (req) => req.url === '/api/health',
      })
    : (req, res, next) => next();

  const fileLogger = morgan(FORMAT_FILE, {
    stream:   accessLogStream,
    skip:     (req) => req.url === '/api/health',
  });

  return [consoleLogger, fileLogger];
}

/**
 * Simple structured logger for app-level messages
 */
const logger = {
  info:  (...args) => console.log(`[INFO]`,  new Date().toISOString(), ...args),
  warn:  (...args) => console.warn(`[WARN]`, new Date().toISOString(), ...args),
  error: (...args) => console.error(`[ERR]`, new Date().toISOString(), ...args),
  debug: (...args) => {
    if (process.env.ENABLE_DEBUG_LOGS === 'true'){
      console.log(`[DEBUG]`, new Date().toISOString(), ...args);
    }
  },
};

module.exports = { createLoggers, logger };
