/*
Copyright (c) 2016 Willem Burgers.
							2017 Sebastian Tilsch
All rights reserved.
This code may only be used under the BSD style license found at http://wburgers.github.io/LICENSE.txt
*/
import '@polymer/polymer/polymer-legacy.js';

import { WebsocketComponentBehavior} from "./websocket-component";
import { WebsocketSharingBehavior} from "./websocket-sharing-behavior";
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
/**
 A Polymer wrapper for a websocket connection that is shared among certain instances by a ID.

 Example:

 <shared-websocket-component socket-id="someID" auto handle-visibility url="wss://echo.websocket.org"></websocket-component>

 @element shared-websocket-component
 @demo demo/index.html
 */
export class SharedWebsocketComponent extends WebsocketSharingBehavior( WebsocketComponentBehavior(PolymerElement) ) {

  static get is() {
    return "shared-websocket-component";
  }

  static get properties() {
    return {
      _wsReadyFired: {
        type: Boolean,
        value: false
      }
    };
  }

  /**
   * Open the connection manually. May throw errors when already connected or no url is specified.
   */
  open() {
    if (!this.url || this.url === "") {
      throw new Error("shared-websocket-component(open): no url specified.");
    }
    if (!this.socketId || this.socketId === "") {
      throw new Error("shared-websocket-component(open): no socketId specified.");
    }
    if (this._ws) {
      throw new Error("shared-websocket-component(open): already connected");
    }
    this._ws = this.getOrCreateSocket(this.url, this.protocols)
    const addEvent = (name, callback) => {
      //TODO: strange workaround for the test case to pass, why is addEventListener undefined???!!
      if(this._ws.addEventListener) {
        this._ws.addEventListener(name, callback.bind(this));
      } else {
        this._ws['on' + name] = callback.bind(this);
      }
    };
    addEvent("open", this._onwsopen);
    addEvent("error", this._onwserror);
    addEvent("message", this._onwsmessage);
    addEvent("close", this._onwsclose);
    if(this.status === 1 && !this._wsReadyFired) {
      this._wsReadyFired = true;
      this.dispatchEvent(new CustomEvent("websocket-ready"));
    }
  }

  /**
   * Close the connection manually. Trows an error when the websocket is not connected.
   */
  close() {
    if (!this._ws) {
      throw new Error("shared-websocket-component(close): not connected.");
    }
    this._ws.close();
    this._ws = null;
    this.removeWebsocket()
  }
  _onwsopen() {
    super._onwsopen();
    if(!this._wsReadyFired) {
      this._wsReadyFired = true;
      this.dispatchEvent(new CustomEvent("websocket-ready"));
    }
  }
}

window.customElements.define(SharedWebsocketComponent.is, SharedWebsocketComponent);
