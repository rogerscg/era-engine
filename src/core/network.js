import ErrorEvent from '../events/error_event.js';

const GAMEHOST_KEY = 'gamehost';
const GAMEPORT_KEY = 'gameport';

/**
 * Core functionality for network procedures in the game. Can be extended
 * in the case of different servers.
 */

let networkInstance = null;

class Network {

  /**
   * Enforces singleton instance, if no other subclasses.
   */
  static get() {
    if (!networkInstance) {
      let host = localStorage.getItem(GAMEHOST_KEY);
      let port = localStorage.getItem(GAMEPORT_KEY);
      if (!host) {
        port = 5000;
        if(isBeta()) {
          host = 'ec2-18-197-111-163.eu-central-1.compute.amazonaws.com';
        } else {
          host = 'ec2-54-172-65-111.compute-1.amazonaws.com';
        }
      }
      networkInstance = new Network(host, port);
      //if (window.devMode) {
      //  networkInstance = new Network('localhost', 5000);
      //}
    }
    return networkInstance;
  }

  /**
   * Clears the registered singleton instance.
   */
  static clear() {
    if (!networkInstance) {
      return;
    }
    networkInstance.disconnect();
    networkInstance = null;
  }

  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.path = this.createPath(host, port);
    this.cleared = false;
    this.shouldReload = true;
    this.pendingResponses = new Set();
  }

  /**
   * Disconnects the network instance.
   */
  disconnect() {
    this.cleared = true;
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  /**
   * Creates a path given the host and port
   */
  createPath(host, port) {
    return `${host}:${port}`;
  }

  setAuthToken(token) {
    this.token = token;
  }

  /**
   * Creates and sends an HTTP POST request.
   */
  createPostRequest(path, data) {
    path = 'http://' + this.path + path;
    return new Promise((resolve, reject) => {
      let req = new XMLHttpRequest();
      req.open('POST', path, true);
      req.setRequestHeader('Content-type', 'application/json');
      if (this.token)
        req.setRequestHeader('Authorization', this.token);
      req.addEventListener('load', () => {
        if (req.status == 200 || req.status == 304) {
          let response = JSON.parse(req.responseText);
          resolve(response);
        } else {
          reject(this.createError(req));
        }
      });
      req.addEventListener('error', () => {
        reject(this.createError(req));
      });
      req.send(JSON.stringify(data));
    });
  }

  /** 
   * Creates and sends an HTTP GET request.
   */
  createGetRequest(path) {
    path = 'http://' + this.path + path;
    return new Promise((resolve, reject) => {
      let req = new XMLHttpRequest();
      req.open('GET', path, true);
      req.setRequestHeader('Content-type', 'application/json');
      if (this.token)
        req.setRequestHeader('Authorization', this.token);
      req.addEventListener('load', () => {
        if (req.status == 200) {
          let response = JSON.parse(req.responseText);
          resolve(response);
        } else {
          reject(this.createError(req));
        }
      });
      req.addEventListener('error', () => {
        reject(this.createError(req));
      });
      req.send();
    });
  }

  /**
   * Creates and sends an HTTP DELETE request.
   */
  createDeleteRequest(path, data) {
    path = 'http://' + this.path + path;
    return new Promise((resolve, reject) => {
      let req = new XMLHttpRequest();
      req.open('DELETE', path, true);
      req.setRequestHeader('Content-type', 'application/json');
      if (this.token)
        req.setRequestHeader('Authorization', this.token);
      req.addEventListener('load', () => {
        if (req.status == 200) {
          let response = JSON.parse(req.responseText);
          resolve(response);
        } else {
          reject(this.createError(req));
        }
      });
      req.addEventListener('error', () => {
        reject(this.createError(req));
      });
      req.send(JSON.stringify(data));
    });
  }

  /**
   * Creates an ERA error for a failed or invalid HTTP request.
   */
  createError(req) {
    let message;
    try {
      message = JSON.parse(req.responseText).message;
    } catch (e) {
      message = req.responseText;
    }
    return new Error(message);
  }

  /**
   * Begins to establish a WebSockets connection to the server. The query
   * parameter is a map of query params used in the connection string.
   * Returns a promise with the resolver set in a field. Once the connection
   * is successful, it resolves.
   */
  async createSocketConnection(query, required = false) {
    return new Promise((resolve, reject) => {
      if (this.socket) {
        return resolve(this.socket);
      }
      this.connectionResolver = resolve;
      const params = {
        reconnection: false
      };
      if (!query) {
        query = new Map();
      }
      query.set('token', this.token);
      if (window.devMode) {
        query.set('dev', '1');
      }
      let queryString = '';
      for (let pair of query) {
        let pairString = pair[0] + '=' + pair[1];
        if (queryString) {
          pairString = '&' + pairString;
        }
        queryString += pairString;
      }
      if (queryString) {
        params.query = queryString;
      }
      const path = 'ws://' + this.createPath(this.host, this.port);
      this.socket = io.connect(path, params);
      this.socket.on('connect', () => this.handleConnect(required));
    });
  }

  /**
   * Handles a successful connection to the WebSockets server.
   */
  handleConnect(required) {
    this.connectionResolver(this.socket);
    this.socket.on('error', (err) => {
      const message = 'Socket error:' + JSON.stringify(err);
      console.error(message);
      new ErrorEvent(message).fire();
    });
    if (required) {
      this.socket.once('disconnect', (reason) => {
        console.error('Disconnecting from socket', reason);
        new ErrorEvent(reason).fire();
        if (!this.cleared) {
          window.location.reload();
        }
      });
    }
  }

  /**
   * Sends a WS message and waits for a specific reply indicating that the
   * message was received. The key is the socket endpoint, so only one call
   * to a certain endpoint can be awaited at once.
   * @param {string} endpoint The emitted endpoint name.
   * @param {*} sentData The data to emit, if any.
   * @param {string=} responseEndpoint Optional response endpoint name.
   */
  async emitAndAwaitResponse(endpoint, sentData, responseEndpoint) {
    if (!this.socket) {
      throw new Error('No socket installed.');
    }
    // Default the response endpoint to the emitted endpoint.
    if (!responseEndpoint) {
      responseEndpoint = endpoint;
    }
    // Don't install a listener for something twice.
    if (this.pendingResponses.has(endpoint) ||
        this.pendingResponses.has(responseEndpoint)) {
      throw new Error('Listener already installed.');
    }
    this.pendingResponses.add(endpoint);
    this.pendingResponses.add(responseEndpoint);
    this.socket.removeAllListeners(endpoint);
    this.socket.removeAllListeners(responseEndpoint);

    return new Promise((resolve, reject) => {
      this.socket.once(responseEndpoint, (data) => {
        resolve(data);
      });
      this.socket.emit(endpoint, sentData);
    });
  }

  /**
   * Waits for a message to be received, then resolves.
   * @param {string} endpoint
   */
  async waitForMessage(endpoint) {
    if (!this.socket) {
      throw new Error('No socket installed.');
    }
    if (this.pendingResponses.has(endpoint)) {
      throw new Error('Listener already installed.');
    }
    this.pendingResponses.add(endpoint);
    this.socket.removeAllListeners(endpoint);
    return new Promise((resolve, reject) => {
      this.socket.once(endpoint, (data) => {
        return resolve(data);
      });
    });
  }
}

export default Network;
