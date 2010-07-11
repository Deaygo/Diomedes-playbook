/*
  Copyright (c) 2010 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, dijit, util, diom */

dojo.provide("diom.view.channelButton");

dojo.declare("diom.view.ChannelButton", null, {
  /**
  * @constructor
  */
  constructor: function () {
    this._channels = {};
    this._channelList = [];
  },
  /**
  * The current active channelButton id.
  * @private
  * @type {string}
  */
  _activeChannelButtonId: null,
  /**
  * Keeps the order of buttons.
  * An array of button ids.
  * @type {Array.<string>}
  * @private
  */
  _channelList: null,
  /**
  * The actuall map of buttons.
  * @type {Object}
  * @private
  */
  _channels: null,
  /**
  * @param {!diom.view.ChannelButton} button
  * @public
  */
  addButton: function (button) {

    var id;

    id = button.getId();
    if (!(id in this._channels)) {
      this._channels[id] = button;
    }
    this._channelList.push(id);
  },
  /**
  * @param {!string} id
  * @public
  * @return {diom.view.ChannelButton}
  */
  getButtonWithId: function (id) {
    if (id in this._channels) {
      return this._channels[id];
    } else {
      return null;
    }
  },
  /**
  * @param {!string} id
  * @public
  */
  removeButtonWithId: function (id) {

    var pos, newR;

    if (id in this._channels) {
      this._channels[id].destroy();
      delete this._channels[id];
      pos = this._channelList.indexOf(id);
      if (pos !== -1) {
        newR = [].concat(this.channelList.slice(0, pos), this.channelList.slice(pos+1));
        this._channelList = newR;
      }
    }
    if (id === this._activeChannelButtonId) {
      this._activeChannelButtonId = null;
    }
  },
  /**
  * @public
  */
  removeAllButtons: function () {

    var i, button;

    for( i in this._channels) {
      if (this._channels.hasOwnProperty(i)) {
        button = this.channels[i];
        this.removeButtonWithId(button.getId());
      }
    }
  },
  /**
  * @param {Array.string} ids An array of ChannelButton ids in the proper order.
  * @public
  */
  updateChannelOrder: function(ids) {
    this._channelList = ids;
  },
  /**
  * @param {!string} id
  * @public
  */
  setActiveButton: function (id) {
    if (!(id in this._channels)) {
      throw "Invalid ChannelButton id";
    }
    this._activeChannelButtonId = id;
  },
  /**
  * Get a diom.view.ChannelButton's id by providing
  * channelName and connection Id.
  * @param {!string} channelName A properly formatted channel name.
  * @param {!string} connectionId
  * @public
  * @return {string}
  */
  getButtonIdWithInfo: function (channelName, connectionId) {

    var i, button;

    for (i in this._channels) {
      if (this._channels.hasOwnProperty(i)) {
        button  = this._channels[i];
        if (button.channelName === channelName && button.connectionId === connectionId) {
          return button.id;
        }
      }
    }
    return null;
  },
  /**
  * Get the next button id, the one after the active button id in the
  * ordered list of available buttons. Returns the active button id if
  * there's only one button available.
  * @public
  * @return {string}
  */
  getNextButtonId: function () {

    var index;

    if (!this._activeChannelButtonId) {
      throw "Active button not set";
    }
    if (!this._channelList.length) {
      return null;
    }
    if (this._channelList.length === 1) {
      return this._activeChannelButtonId;
    }
    index = this._channelList.indexOf(this._activeChannelButtonId);
    if (index === -1) {
      throw "Invalid button id in channel list.";
    }
    index++;
    if (index >= this._channelList.length) {
      return this._channelList[0];
    }
    return this._channelList[index];
  },
  /**
  * Get the previous button id, the one before the active button id in the
  * ordered list of available buttons. Returns the active button id if
  * there's only one button available.
  * @public
  * @return {string}
  */
  getPreviousButtonId: function () {

    var index;

    if (!this._activeChannelButtonId) {
      throw "Active button not set";
    }
    if (!this._channelList.length) {
      return null;
    }
    if (this._channelList.length === 1) {
      return this._activeChannelButtonId;
    }
    index = this._channelList.indexOf(this._activeChannelButtonId);
    if (index === -1) {
      throw "Invalid button id in channel list.";
    }
    index--;
    if (index <= 0) {
      return this._channelList[this._channelList.length - 1];
    }
    return this._channelList[index];
  }
});

