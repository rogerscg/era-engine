/**
 * @author rogerscg / https://github.com/rogerscg
 */
import { WorkerPool } from '../../build/era';
import * as Comlink from 'comlink';

/**
 * Controls pre-warmed texture workers and their usage by tiles.
 */
class TextureWorkerPool {
  constructor() {
    this.capacity = 20;
    this.workers = new Set();
    // Set of available workers.
    this.availableWorkers = [];
    // A queue of resolvers.
    this.queue = [];
    // A set of reservations from the core worker pool.
    this.reservations = new Set();
  }

  /**
   * Loads `capacity` number of workers.
   */
  async prewarm() {
    for (let i = 0; i < this.capacity; i++) {
      const reservation = await WorkerPool.get().getWorkerReservation();
      this.reservations.add(reservation);
      const worker = new Worker('./texture_worker.js', {
        type: 'module',
      });
      const TextureGenerator = Comlink.wrap(worker);
      this.workers.add(worker);
      this.availableWorkers.push(TextureGenerator);
    }
  }

  /**
   * Destroys the pool.
   */
  drain() {
    this.workers.forEach((worker) => worker.terminate());
    this.reservations.forEach((uuid) => WorkerPool.get().releaseWorker(uuid));
    this.availableWorkers = [];
    this.queue = [];
  }

  /**
   * Checks if there is an available worker.
   * @returns {boolean}
   */
  hasAvailability() {
    return this.availableWorkers.length > 0;
  }

  /**
   * Waits for an open worker slot. Returns a worker when available.
   * @returns {Worker}
   * @async
   */
  async getWorker() {
    if (this.hasAvailability()) {
      return this.availableWorkers.shift();
    }
    await this.waitForOpening_();
    return this.availableWorkers.shift();
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
   * Releases a worker back into the pool.
   * @param {Worker} worker
   */
  releaseWorker(worker) {
    this.availableWorkers.push(worker);
    const resolver = this.queue.shift();
    if (resolver) {
      resolver();
    }
  }
}

export default new TextureWorkerPool();
