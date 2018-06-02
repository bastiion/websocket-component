import '@polymer/polymer/polymer-legacy.js';
/** @polymerBehavior */
export const WebsocketSharingBehavior = subclass => class extends subclass {

  static get properties() {
    return {
      /**
       * The socketId is the identifier for the shared socket, if a socket with the given identifier exists it
       * will be used, if not, a new one will be created.
       */
      socketId: {
        type: String
      },
      /**
       * a Map of websockets ( identifier -> WebScoket ) that is shared across all instances
       */
      _websockets: {
        type: Object,
        value: new Map()
      }
    }
  }


  /**
   * Tries to get an instance of a websocket by the socketId
   * If it does not exist it creates a new Websocket
   * @param socketId
   * @param socketUrl
   * @param socketProtocols
   */
  getOrCreateSocket(socketUrl, socketProtocols, _socketId) {
    const socketId = _socketId | this.socketId;
    if (!this._websockets.has(socketId)) {
      this._websockets.set(socketId, new WebSocket(socketUrl, socketProtocols));
    }
    return this._websockets.get(socketId);
  }

  removeWebsocket(_socketId) {
    const socketId = _socketId | this.socketId;
    this._websockets.delete(socketId)
  }
}