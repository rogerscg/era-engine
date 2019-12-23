/**
 * @author rogerscg / https://github.com/rogerscg
 */
import ErrorEvent from '../events/error_event.js';

/**
 * Core functionality for network procedures in the engine. Can be extended
 * in the case of different servers.
 */
class Network {
  constructor(protocol, host, port) {
    this.protocol = protocol;
    this.host = host;
    this.port = port;
    this.origin = this.createPath(protocol, host, port);
    this.pendingResponses = new Set();
    this.connectionResolve = null;
    this.socket = null;
    this.token = null;
    this.name = null;
  }

  /**
   * Give the server a name.
   * @param {string} name
   * @returns {Network}
   */
  withName(name) {
    this.name = name;
    return this;
  }

  /**
   * Disconnects the network instance.
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  /**
   * Creates a path given the protocol, host, and port.
   */
  createPath(protocol, host, port) {
    return `${protocol}://${host}:${port}`;
  }

  setAuthToken(token) {
    this.token = token;
  }

  /**
   * Creates and sends an HTTP POST request, awaiting for the response.
   * @param {string} path Endpoint path on the server, i.e. /path/to/endpoint.
   * @param {Object} data
   * @returns {Object}
   * @async
   */
  async createPostRequest(path, data) {
    const url = this.origin + path;
    const req = this.buildRequest('POST', url);
    const response = await this.sendRequest(req, data);
    return response;
  }

  /** 
   * Creates and sends an HTTP GET request, awaiting for the response.
   * @param {string} path Endpoint path on the server, i.e. /path/to/endpoint.
   * @returns {Object}
   * @async
   */
  async createGetRequest(path) {
    const url = this.origin + path;
    const req = this.buildRequest('GET', url);
    const response = await this.sendRequest(req);
    return response;
  }

  /**
   * Creates and sends an HTTP DELETE request, awaiting for the response.
   * @param {string} path Endpoint path on the server, i.e. /path/to/endpoint.
   * @returns {Object}
   * @async
   */
  async createDeleteRequest(path, data) {
    const url = this.origin + path;
    const req = this.buildRequest('DELETE', url);
    const response = await this.sendRequest(req, data);
    return response;
  }

  /**
   * Creates an error for a failed or invalid HTTP request.
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
    return new Promise((resolve) => {
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
      if (this.token) {
        query.set('token', this.token);
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
      this.socket = io.connect(this.origin, params);
      this.socket.on('connect', () => this.handleConnect(required));
    });
  }

  /**
   * Handles a successful connection to the WebSockets server.
   */
  handleConnect() {
    this.connectionResolver(this.socket);
    // TODO: Create base socket endpoints for easier registration of handlers.
    this.socket.on('error', (err) => {
      const message = 'Socket error:' + JSON.stringify(err);
      console.error(message);
      new ErrorEvent(message).fire();
    });
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
    return new Promise((resolve) => {
      this.socket.once(endpoint, (data) => {
        return resolve(data);
      });
    });
  }

  /**
   * Builds a request object given a method and url.
   * @param {string} method
   * @param {string} url
   */
  buildRequest(method, url) {
    const req = new XMLHttpRequest();
    req.open(method, url, true);
    req.setRequestHeader('Content-type', 'application/json');
    if(this.token) {
      req.setRequestHeader('Authorization', this.token);
    }
    return req;
  }

  /**
   * Sends the request and awaits the response.
   * @param {XMLHttpRequest} req
   * @param {Object=} data
   * @async
   */
  sendRequest(req, data = null) {
    return new Promise((resolve, reject) => {
      // Install load listener.
      req.addEventListener('load', () => {
        if (req.status == 200 || req.status == 304) {
          const responseStr = req.responseText;
          try {
            const response = JSON.parse(responseStr);
            resolve(response);
          } catch (e) {
            resolve(responseStr);
          }
        } else {
          reject(this.createError(req));
        }
      });
      // Install error listener.
      req.addEventListener('error', () => reject(this.createError(req)));
      // Send request.
      if (data) {
        req.send(JSON.stringify(data));
      } else {
        req.send();
      }
    });
  }
}

export default Network;
