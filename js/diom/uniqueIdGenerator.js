/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint regexp: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, document */

dojo.provide("diom.uniqueIdGenerator");

dojo.declare("diom.UniqueIdGenerator", null, {

  /**
  * @constructor
  */
  constructor: function () {
    this.count = 0;
  },
  /**
  * @const
  * @type {string}
  */
  SEPARATOR: ":",
  /**
  * Returns an id in the ":#" format.
  * @public
  * @return {!string}
  */
  getNextId: function () {
    this.count += 1;
    return this.SEPARATOR + this.count;
  }

});
