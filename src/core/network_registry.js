/**
 * @author rogerscg / https://github.com/rogerscg
 */

 import Network from './network.js';

 /**
  * A map of all network instances, keyed by their server name. This is useful
  * when a client has to track multiple servers with which it communicates.
  */
class NetworkRegistry extends Map {
  /**
   * Creates a new network instance for a server.
   * @param {string} name
   * @param {string} protocol
   * @param {string} host
   * @param {number} port
   * @returns {Network}
   */
  registerNewServer(name, protocol, host, port) {
    if (this.has(name)) {
      console.warn(`Server with name ${name} already registered.`);
      return this.get(name);
    }
    const server = new Network(protocol, host, port).withName(name);
    this.set(name, server);
    return server;
  }
}

export default new NetworkRegistry();