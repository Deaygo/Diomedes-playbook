/*
  Copyright (c) 2010 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, dijit, util, diom */

dojo.provide("diom.view.channelButton");

dojo.declare("diom.view.ChannelButton", [dijit._Widget, dijit._Templated], {
  /**
  * @const
  * @type {string}
  */
  templatePath: dojo.moduleUrl("diom.templates","channelButton.html"),
  /**
  * Required properties:
  *   channelName: {!string}
  * @param {!Object} properties
  * @constructor
  */
  constructor: function (props) {
  },
  /**
  * @private
  * @type {string}
  */
  _id: null,
  /**
  * Returns the channel button's unique id.
  * @public
  * @return {!string}
  */
  getId: function () {
    return this._id;
  },
  /**
  * @param {!Object} event
  * @private
  */
  _handleClick: function (event) {
    alert("clicked");
  },
  /**
  * @param {!Object} event
  * @private
  */
  _handleClose: function (event) {
    alert("closed");
  },
  /**
  * @param {!number} count
  * @public
  */
  setActivity: function (count) {
    dojo.addClass(this.domNode, "hasActivity");
    this.channelActivity.innerHTML = count;
  },
  /**
  * @public
  */
  clearActivity: function () {
    dojo.removeClass(this.domNode, "hasActivity");
    this.channelActivity.innerHTML = "";
  },
  /**
  * Make channel button appear highlighted.
  * @public
  */
  highlight: function () {
    dojo.addClass(this.domNode, "highlight");
  },
  /**
  * Remove highlight appearance.
  * @public
  */
  removeHighlight: function () {
    dojo.removeClass(this.domNode, "highlight");
  },
  /**
  * Set active appearance, that is make it appear to be the current
  * active channel.
  * @public
  */
  setActive: function () {
    dojo.addClass(this.domNode, "currentChannel");
  },
  /**
  * Show as inactive channel.
  * @public
  */
  setInactive: function () {
    dojo.removeClass(this.domNode, "currentChannel");
  },
  /**
  * @private
  */
  postCreate: function () {
    if (!this.channelName) {
      throw "Missing required channelName in ChannelButton";
    }
    if (!this.channelKey) {
      throw "Missing required channelKey in ChannelButton";
    }
    if (!this.connectionId) {
      throw "Missing connection Id in ChannelButton";
    }
    this._id = this.channelKey + this.connectionId;
  }
});

