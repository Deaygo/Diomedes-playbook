/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, runtime */

dojo.provide("diom.controller.updater");

dojo.declare("diom.controller.Updater", null, {

  constructor: function (updateDelay, updateURL) {
    var file;
    this.updateURL = updateURL;
    if (air) {
      this.appUpdater = new runtime.air.update.ApplicationUpdaterUI(); 
      file = new air.File("app:/updateConfig.xml");
    } else {
      this.appUpdater = null;
      file = null;
    }
    this.didCheckNow = false;
    if (air) {
      this.appUpdater.configurationFile = file;
      this.appUpdater.updateURL = this.updateURL;
      this.appUpdater.delay = updateDelay;
      this.appUpdater.addEventListener(air.StatusUpdateEvent.UPDATE_STATUS, dojo.hitch(this, "onStatus")); 
      this.appUpdater.initialize();
    }
    dojo.subscribe( diom.topics.UPDATE_CHECK, this, "checkNow");
    dojo.subscribe( diom.topics.UPDATE_DELAY_CHANGE, this, "changeUpdateDelay");
    dojo.subscribe( diom.topics.UPDATE_URL_CHANGE, this, "changeUpdateURL");
  },

  onStatus: function (event) {
    if (this.didCheckNow && !event.available) {
      this.didCheckNow = false;
      dojo.publish(diom.topics.UPDATE_NO_NEW_UPDATES);
    }
  },

  changeUpdateURL: function (updateURL) {
    if (this.appUpdater) {
      this.appUpdater.updateURL = updateURL;
      this.appUpdater.initialize();
    }
  },

  changeUpdateDelay: function (updateDelay) {
    if (this.appUpdater) {
      this.appUpdater.delay = updateDelay;
      this.appUpdater.initialize();
    }
  },

  checkNow: function () {
    this.didCheckNow = true;
    if (this.appUpdater) {
      this.appUpdater.checkNow();
    }
  },

  destroy: function () {
    if (this.appUpdater) {
      delete this.appUpdater;
    }
  }

});
