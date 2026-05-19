const { logger } = require('../utils/logger');

let useQueue  = false;
let submissionQueue = null;

/**
 * Initialise BullMQ queue + worker.
 * Falls back gracefully if Redis is unavailable.
 */
async function initQueue() {
  if (process.env.USE_QUEUE !== 'true') {
    logger.info('[Queue] BullMQ disabled (USE_QUEUE=false). Running submissions inline.');
    return;
  }

  try {
    const { Queue } = require('bullmq');
    const connection = {
      host:     process.env.REDIS_HOST     || 'localhost',
      port:     parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 1,
    };

    submissionQueue = new Queue('submissions', { connection });
    // Ping Redis by getting queue info
    await submissionQueue.getJobCounts();
    useQueue = true;
    logger.info('[Queue] BullMQ submission queue initialised successfully.');

    // Start the in-process worker (lightweight alternative to a separate process)
    _startInlineWorker(connection);
  } catch (err) {
    useQueue        = false;
    submissionQueue = null;
    logger.warn('[Queue] Redis/BullMQ unavailable — running inline:', err.message);
  }
}

/**
 * Start a BullMQ Worker in the same process.
 * For production scale, extract judge.worker.js to a separate Node process.
 */
function _startInlineWorker(connection) {
  try {
    const { Worker } = require('bullmq');
    const { processJob } = require('./judge.worker');

    const worker = new Worker('submissions', processJob, {
      connection,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY) || 3,
    });

    worker.on('completed', (job) => logger.info(`[Queue] Job ${job.id} completed.`));
    worker.on('failed', (job, err) => logger.error(`[Queue] Job ${job?.id} failed:`, err.message));

    logger.info(`[Queue] Inline worker started (concurrency=${process.env.WORKER_CONCURRENCY || 3})`);
  } catch (err) {
    logger.error('[Queue] Failed to start inline worker:', err.message);
  }
}

/**
 * Add a submission job to the queue.
 * Returns jobId if queued, null if running inline (caller handles inline execution).
 */
async function enqueue(data) {
  if (!useQueue || !submissionQueue) return null;
  const job = await submissionQueue.add('judge', data, {
    attempts:   3,
    backoff:    { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 500 },
    removeOnFail:     { count: 100 },
  });
  return job.id;
}

const isQueueEnabled = () => useQueue;

module.exports = { initQueue, enqueue, isQueueEnabled };
