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
  templatePath: dojo.moduleUrl("diom.templates","channelButton.html"),
  /**
  * @constructor
  */
  constructor: function () {
  },
  /**
  * @private
  */
  postCreate: function () {
    this.btnLabel.innerHTML = "Moo";
  },
});

