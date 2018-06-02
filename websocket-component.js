/*
Copyright (c) 2016 Willem Burgers.
							2018 Sebastian Tilsch
All rights reserved.
This code may only be used under the BSD style license found at http://wburgers.github.io/LICENSE.txt
*/
import '@polymer/polymer/polymer-legacy.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
/**
 A Polymer wrapper for a websocket connection.

 Example:

 <websocket-component auto handle-visibility url="wss://echo.websocket.org"></websocket-component>

 @element websocket-component
 @demo demo/index.html
 */
export const WebsocketComponentBehavior = subclass =>class extends subclass {

  static get properties() {
    return {
      /**
       * The url to connect to
       */
      url: {
        type: String,
        value: "", observer: '_urlChange'
      },
      /**
       * An array of subprotocols for the websocket
       */
      protocols: {
        type: Array,
        value: () => []
      },
      /**
       * This status represents the websocket status. Any other element can bind to this status to get updates.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#Ready_state_constants
       */
      status: {
        type: Number,
        readOnly: true,
        notify: true,
        value: -1
      },
      /**
       * If this boolean is set, the websocket will automatically connect when the url is specified
       */
      auto: {
        type: Boolean,
        value: false,
        observer: '_autoChange'
      },
      /**
       * If this boolean is set, the websocket will automatically close and reopen when the tab/page is out of focus and focussed again respectively
       */
      handleVisibility: {
        type: Boolean,
        value: false,
      },
      _ws: {
        type: Object,
        observer: '_wsChange'
      },
      /**
       * If this boolean is set, a send-request will be queued, if it failed because of the
       * websocket not beeing ready. Once the websocket transits into the OPEN state, it sends them one by one
       */
      queueIfFailed: {
        type: Boolean,
        value: false
      },
      _sendQueue: {
        type: Array,
        value: () => []
      }
    }
  }

  static get observers() {
    return [
      '_computeStatus(_ws.readyState)'
    ]
  }

  constructor() {
    super();
  }

  ready() {
    super.ready();
    if (this.handleVisibility && typeof document.hidden !== 'undefined') {
      document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this), false);
    }
  }

  /**
   * Open the connection manually. May throw errors when already connected or no url is specified.
   */
  open() {
    if (!this || !this.url || this.url === "") {
      throw new Error("websocket-component(open): no url specified.");
    }
    if (this._ws) {
      throw new Error("websocket-component(open): already connected");
    }
    this._ws = new WebSocket(this.url, this.protocols);
    this._ws.onopen = this._onwsopen.bind(this);
    this._ws.onerror = this._onwserror.bind(this);
    this._ws.onmessage = this._onwsmessage.bind(this);
    this._ws.onclose = this._onwsclose.bind(this);
  }

  /**
   * Send data over the websocket. Throws an error when the websocket is not connected and sendIfFailed is not set.
   */
  send(data) {
    if (!this._ws || this.status !== 1) {
      if(!this.queueIfFailed) {
        throw new Error("websocket-component(send): not connected.");
      }
      this.push('_sendQueue', data);
    } else {
      try {
        this._ws.send(data);
      } catch(error) {
        if(this.queueIfFailed) {
          this.push('_sendQueue', data);
        } else {
          throw new Error("websocket-component(send): failed.", error);
        }
      }
    }
  }

  /**
   * Close the connection manually. Trows an error when the websocket is not connected.
   */
  close() {
    if (!this || !this._ws) {
      throw new Error("websocket-component(close): not connected.");
    }
    this._ws.close();
    this._ws = null;
  }

  /**
   * Try to send the send-queue
   */
  _processSendQueue() {
    //we use this iteration method to prevent an infinite loop if send, failes and queue isn't processed
    const queueLen = this._sendQueue.length;
    for(let i = queueLen; i > 0; i--) {
      this.send(this.pop('_sendQueue'));
    }
  }

  _onwsopen() {
    this._computeStatus(undefined); //compute status must be executed before any further processing because the send method relies on a correct status
    this.dispatchEvent(new CustomEvent("websocket-open"));
    this._processSendQueue();
  }

  _onwserror(error) {
    this._setStatus(-1);
    this.dispatchEvent(new CustomEvent("websocket-error", {detail: {data: error.data}}));
  }

  _onwsmessage(event) {
    this.dispatchEvent(new CustomEvent("websocket-message", {detail: {data: event.data}}));
  }

  _onwsclose(event) {
    this._setStatus(-1);
    this.dispatchEvent(new CustomEvent("websocket-close", {detail: {code: event.code, reason: event.reason}}));
  }

  _computeStatus(readyState) {
    if (this._ws) {
      this._setStatus(this._ws.readyState);
    }
    else {
      this._setStatus(-1);
    }
  }

  _urlChange() {
    if (this.auto && this.url.length > 0) {
      if (this._ws) {
        this.close();
      }
      this.open();
    }
  }

  _autoChange() {
    if (!this._ws && this.auto && this.url.length > 0) {
      this.open();
    }
  }

  _wsChange() {
    if (!this._ws) {
      this._computeStatus(undefined);
    }
  }

  _handleVisibilityChange() {
    if (document.hidden) {
      this.close();
    } else {
      this.open();
    }
  }
};

class WebsocketComponent extends WebsocketComponentBehavior(PolymerElement) {
  static get template() {
    return html`
        <style>
            :host {
                display: none;
            }
        </style>
`;
  }

  static get is() {
    return "websocket-component";
  }
}

window.customElements.define(WebsocketComponent.is, WebsocketComponent);
