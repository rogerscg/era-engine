/**
 * A pool for maintaining WebWorkers in order to prevent creating too many
 * workers at once.
 */
class WorkerPool {
  constructor() {
    this.capacity = 20;
    // Set of workers currently in use.
    this.workers = new Set();
    // A queue of resolvers.
    this.queue = new Array();
  }

  /**
   * Builds a worker. Otherwise, waits for one to be free.
   * @return {Worker}
   * @async
   */
  buildWorker() {
    // If there is capacity in the pool, make a new worker immediately.
    if (this.workers.size < this.capacity) {
      return this.registerWorker_();
    }
    // Otherwise, we need to queue to wait for a worker slot to open up.
    const promise = new Promise((resolve) => {
      this.queue.push(resolve);
    });
    return promise;
  }

  /**
   * Releases a worker from the pool.
   * @param {Worker} worker
   */
  releaseWorker(worker) {
    if (!this.workers.has(worker)) {
      return console.warn('Worker pool does not contain this worker');
    }
    this.workers.delete(worker);
    worker.terminate();
    const resolver = this.queue.shift();
    if (resolver) {
      resolver(this.registerWorker_());
    }
  }

  /**
   * Registers a worker to the pool.
   * @return {Worker}
   * @private
   */
  registerWorker_() {
    const worker = new Worker('terrain/texture_worker.js', {
      type: 'module'
    });
    this.workers.add(worker);
    return worker;
  }
}

export default new WorkerPool();
