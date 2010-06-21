/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom */

dojo.provide("diom.connection.activityItem");

dojo.declare("diom.connection.ActivityItem", null, {

  constructor: function (cmd, nick, target, msg, user, host, altUser) {
    this.cmd = cmd;
    this.nick = nick;
    this.user = (user ? user : null);
    this.host = host;
    this.target = target;
    this.msg = msg;
    this.datetime = new Date();
    this.altDatetime = null;
    this.displayMsg = null;
    this.altUser = altUser;
    this._referencesUser = false;

    this._isServer = false; 
    this._isAction = false;
    this._showBrackets = true;
    this._isNotice = false;
    this._useAltUser = null;
    this._altMsg = null;
    this._setProperties();
  },

  clone: function () {
    var ai = new diom.connection.ActivityItem(this.cmd, this.nick, this.target, null, this.user, this.host, this.altUser);
    ai.msg = this.msg; //avoid resanitizing
    ai.setDateTime(this.datetime);
    ai.setAltUser(this.altUser);
    ai.setAltDatetime(this.altDatetime);
    ai._referencesUser = this._referencesUser;

    ai._isServer = this._isServer;
    ai._isAction = this._isAction;
    ai._showBrackets = this._showBrackets;
    ai._isNotice = this._isNotice;
    ai._useAltUser = false;
    ai._altMsg = this._altMsg;

    return ai;
  },

  isServer: function () {
    return this._isServer;
  },

  isAction: function () {
    return this._isAction;
  },

  showBrackets: function () {
    return this._showBrackets;
  },

  isNotice: function () {
    return this._isNotice;
  },

  getUser: function () {
    if (this._useAltUser) {
      return this.getAltUser();
    } else {
      return this.user;
    }
  },

  getMsg: function () {
    if (this._altMsg) {
      return this._altMsg;
    } else {
      return this.msg;
    }
  },

  getNickWithStatus: function (channelName) {
  	var user;
    if (!channelName) { 
      return null; 
    }
    user = this.getUser();
    if (this.isServer()) {
      return  "Server";
    } else if (user && user.isCreator(channelName)) {
      return "!" + this.nick;
    } else if (user && user.isOp(channelName)) {
      return "@" + this.nick;
    } else if (user && user.isHalfOp(channelName)) {
      return "%" + this.nick;
    } else if (user && user.isVoice(channelName)) {
      return "+" + this.nick;
    } 
    return this.nick;
  },

  _setProperties: function () {
  	var d;
    if (this.cmd) {
      //XXX: need to get rid of this switch statement some how
      switch (this.cmd.toLowerCase()) {
        case "mode":
          this._isServer = true;
          this._altMsg = this.nick + " has changed modes for " + this.target + " to: " + this.msg;
          break;
        case "action":
          this._isAction = true;
          this._showBrackets = false;
          break;
        case "kick":
          this._isServer = true;
          this._useAltUser = true;
          util.log("bef getAltUser");
          this._altMsg = this.nick + " has kicked " + this.makeFullID(this.getAltUser().nick, this.getAltUser()) + " from " + this.target + ": " + this.msg;
          util.log("after getAltUser");
          break;
        case "part":
          this._isServer = true;
          //XXX: make a pref here about showing quit messages
          this._altMsg = this.makeFullID(this.nick, this.user) + " has parted " + this.target + ": " + this.msg;
          break;
        case "topic":
          this._isServer = true;
          d = " On " + this.getAltDatetime().toUTCString() + " "; 
          this._altMsg = d + this.nick + " set the topic for " + this.target + " to: " + this.msg;
          break;
        case "notice":
          this._altMsg = this.target + ": - NOTICE - " + this.msg;
          this._isNotice = true;
          break;
        case "join":
          this._isServer = true;
          this._altMsg = this.makeFullID(this.nick, this.user) + " has joined " + this.target + ".";
          break;
        case "nick":
          this._altMsg = this.nick + " is now known as " + this.msg + ".";
          this._isServer = true;
          break;
        case "quit":
          this._altMsg = this.makeFullID(this.nick, this.user) + " has quit: " + this.msg;
          this._isServer = true;
          break;
        case "server":
          this._isServer = true;
          break;
      }
    }
  },

  makeFullID: function (nick, user) {
  	var host;
    if (user) {
      host = user.getHost();
      if (host) {
        nick = [nick, "!", host].join("");
      }
    }
    return nick;
  },

  setDateTime: function (datetime) {
    delete this.datetime;
    this.datetime = datetime;
  },

  setAltDatetime: function (datetime) {
    if (this.altDatetime) { delete this.altDatetime; }
    this.altDatetime = datetime;
  },

  getAltDatetime: function () {
    if (this.altDatetime) {
      return this.altDatetime;
    } else {
      return this.datetime;
    } 
  },

  setAltUser: function (altUser) {
    this.altUser = altUser;
  },

  setReferencesUser: function () {
    this._referencesUser = true;
  },

  referencesUser: function () {
    return this._referencesUser;
  },

  getAltUser: function () {
    return this.altUser;
  },

  setDisplay: function (display) {
    this.displayMsg = display;
  },

  getDisplay: function () {
    return this.displayMsg;
  },

  destroy: function () {
    delete this.datetime;
  }

});
