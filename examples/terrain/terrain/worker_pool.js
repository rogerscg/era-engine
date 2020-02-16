/**
 * A pool for maintaining WebWorkers in order to prevent creating too many
 * workers at once.
 */
class WorkerPool {
  constructor() {
    this.capacity = 20;
    // Set of workers currently in use.
    this.workers = new Set();
    // Available workers.
    this.availableWorkers = new Array();
    // A queue of resolvers.
    this.queue = new Array();
    // Initialize workers.
    for (let i = 0; i < this.capacity; i++) {
      this.registerWorker_();
    }
  }

  /**
   * Builds a worker. Otherwise, waits for one to be free.
   * @return {Worker}
   * @async
   */
  async getWorker() {
    // If there is capacity in the pool, make a new worker immediately.
    if (this.availableWorkers.length > 0) {
      return this.availableWorkers.shift();
    }
    // Otherwise, we need to queue to wait for a worker slot to open up.
    return new Promise((resolve) => this.queue.push(resolve));
  }

  /**
   * Releases a worker from the pool.
   * @param {Worker} worker
   */
  releaseWorker(worker) {
    if (!this.workers.has(worker)) {
      return console.warn('Worker pool does not contain this worker');
    }
    const resolver = this.queue.shift();
    if (resolver) {
      resolver(worker);
      return;
    }
    this.availableWorkers.push(worker);
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
    this.availableWorkers.push(worker);
    return worker;
  }
}

export default new WorkerPool();
