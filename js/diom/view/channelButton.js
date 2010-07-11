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
    this._id = diom.idGenerator.getNextId();
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
    //alert("clicked");
  },
  /**
  * @private
  */
  postCreate: function () {
    if (!this.channelName) {
      throw "Missing required channelName in ChannelButton";
    }
    if (!this.connectionId) {
      throw "Missing connection Id in ChannelButton";
    }
  }
});

