import { createUUID } from './util.js';

/**
 * @author rogerscg / https://github.com/rogerscg
 */
let instance = null;
/**
 * A pool for maintaining WebWorkers in order to prevent creating too many
 * workers at once.
 */
class WorkerPool {
  static get() {
    if (!instance) {
      instance = new WorkerPool();
    }
    return instance;
  }

  constructor() {
    this.capacity = 20;
    // Set of workers currently in use.
    this.workers = new Set();
    // A queue of resolvers.
    this.queue = new Array();
  }

  /**
   * Checks if there is an available worker.
   * @returns {boolean}
   */
  hasAvailability() {
    return this.workers.size < this.capacity;
  }

  /**
   * Waits for an open worker slot. Returns a reservation UUID in order to track
   * reservation release, once available.
   * @returns {string} UUID of the reservation.
   * @async
   */
  async getWorkerReservation() {
    const uuid = createUUID();
    if (this.hasAvailability()) {
      this.workers.add(uuid);
      return uuid;
    }
    await this.waitForOpening_();
    this.workers.add(uuid);
    return uuid;
  }

  /**
   * Adds a reservation to the queue, whose promise resolves when an opening is
   * available.
   * @private
   * @async
   */
  async waitForOpening_() {
    return new Promise((resolve) => this.queue.push(resolve));
  }

  /**
   * Releases a worker from the pool.
   * @param {string} reservationUUID
   */
  releaseWorker(reservationUUID) {
    if (!this.workers.has(reservationUUID)) {
      return console.warn('Worker pool does not contain this reservation');
    }
    this.workers.delete(reservationUUID);
    const resolver = this.queue.shift();
    if (resolver) {
      resolver();
    }
  }
}

export default WorkerPool;
