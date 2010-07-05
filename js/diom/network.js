/*
  Copyright (c) 2010 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom */

dojo.provide("diom.network");


dojo.declare("diom.Network", null, {

  /**
  * @param {Object} data
  * @param {diom.model.Network} model
  * @param {diom.model.ChannelList} channelList
  * @param {Object} prefs
  * @param {string} appVersion
  * @param {Object} ignores
  * @constructor
  */
  constructor: function (data, model, channelList, prefs, appVersion, ignores) {

    var id;

    this.prefs = util.cloneObject(prefs.getPrefs());
    this.ignores = ignores;
    this.prefs.nick = data.nick;
    this.prefs.altNick = data.altNick;
    this.prefs.userName = data.userName;
    this.prefs.realName = data.realName;
    this.prefs.finger = data.finger;
    this.networkId = data.id;
    this.appVersion = appVersion;
    this.data = data;
    this.channelList = channelList;
    this.servers = [];
    this.channels = [];
    this.performs = [];
    this.performsProgress = 0;
    this.serverInfoReceived = false;
    this.channelInfoReceived = false;
    this.performInfoReceived = false;
    this.connection = null;
    this.currentHostIndex = null;
    this.currentHost = null;
    this.currentConnectionId = null;
    this.TEST_CONNECTION_TIME = 5000;
    id = data.id;
    model.getServers(id, dojo.hitch(this, "handleServerInfo"));
    model.getChannels(id, dojo.hitch(this, "handleChannelInfo"));
    model.getPerforms(id, dojo.hitch(this, "handlePerformInfo"));
    this.model = model;
    this.checkInfoProgress();
    dojo.subscribe( diom.topics.NETWORK_CHANGE, this, "handleNetworksChanged");
    dojo.subscribe( diom.topics.IGNORES_UPDATE, this, "handleIgnoresUpdate");
    dojo.subscribe( diom.topics.CHANNELS_CHANGED, this, "handleNetworkConnect");
  },

  handleIgnoresUpdate: function (ignores) {
    this.ignores = ignores;
  },

  /**
  * @param {string} type
  * @param {string} channelName
  * @param {string} host
  * @param {Object} arg
  * @param {string} connectionId
  * @private
  */
  handleNetworkConnect: function (type, channelName, host, arg, connectionId) {
    if (type === "connect" && connectionId === this.currentConnectionId) {
      this.perform();
    }
  },

  /**
  * @param {number} id
  * @private
  */
  handleNetworksChanged: function (id) {
    util.log("hnc in nn");
    if (id && id === this.data.id) {
      this.model.getNetwork(id, dojo.hitch(this, "handleNetworkInfo"));
      this.model.getServers(id, dojo.hitch(this, "handleServerInfo"));
      this.model.getChannels(id, dojo.hitch(this, "handleChannelInfo"));
      this.model.getPerforms(id, dojo.hitch(this, "handlePerformInfo"));
    }
  },

  /**
  * @param {Object} data
  * @private
  */
  handleNetworkInfo: function (data) {
    if (dojo.isObject(data) && data[0]) {
      data = data[0];
      this.prefs.nick = data.nick;
      this.prefs.altNick = data.altNick;
      this.prefs.userName = data.userName;
      this.prefs.realName = data.realName;
      this.prefs.finger = data.finger;
    }
  },

  /**
  * @param {Array} servers
  * @private
  */
  handleServerInfo: function (servers) {
    if (servers) {
      this.servers = servers;
    } else {
      this.servers = [];
    }
    this.serverInfoReceived = true;
  },

  handleChannelInfo: function (channels) {
    if (channels) {
      this.channels = channels;
    } else {
      this.channels = [];
    }
    this.channelInfoReceived = true;
  },

  handlePerformInfo: function (performs) {
    if (performs) {
      this.performs = performs;
    } else {
      this.performs = [];
    }
    this.performInfoReceived = true;
  },

  checkInfoProgress: function () {
    if (this.serverInfoReceived && this.channelInfoReceived && this.performInfoReceived) {
      this.autoConnect();
    } else {
      window.setTimeout(dojo.hitch(this, "checkInfoProgress"), 1000);
    }
  },

  autoConnect: function () {
    if (this.data && this.data.autoJoin && this.data.active) {
      this.connect();
    }
  },

  /**
  * public@
  */
  connect: function () {

    var parts, port;

    if (!this.servers.length) { return; }
    if (this.currentHost) {
      dojo.publish(diom.topics.CONNECTION_CLOSE, [this.currentHost, this.currentConnectionId]);
      this.connection = null;
      this.currentHost = null;
      this.currentConnectionId = null;
    }
    parts = this.getNextServer().split(":");
    this.currentHost = util.fromIndex(parts, 0);
    port = util.fromIndex(parts, 1);
    this.connection = this.channelList.createConnection(
      this.currentHost,
      port,
      this.isCurrentServerSecure(),
      this.prefs,
      this.appVersion,
      this.ignores,
      this.getPassword()
    );
    this.currentConnectionId = this.connection.getConnectionId();
    dojo.publish(diom.topics.CHANNELS_CHANGED, ["connect", this.currentHost, this.currentHost, null, this.currentConnectionId]);
  },

  getNextServer: function () {
    if (this.currentHostIndex === null || this.currentHostIndex === (this.servers.length - 1)) {
      this.currentHostIndex = 0;
    } else {
      do {
        this.currentHostIndex++;
      } while (!this.servers[this.currentHostIndex].active);
    }
    return this.getServer();
  },

  /**
  * @public
  * @return {String}
  */
  getConnectionId: function () {
    return this.currentConnectionId;
  },

  /**
  * @public
  * @return {String}
  */
  getHost: function () {
    return this.currentHost;
  },

  /**
  * @private
  * @return {boolean}
  */
  isCurrentServerSecure: function () {
    return this.servers[this.currentHostIndex].ssl;
  },

  /**
  * @private
  * @return {string}
  */
  getServer: function () {
    return this.servers[this.currentHostIndex].name;
  },

  getPassword: function () {
    if (this.servers && this.servers.length && (this.servers[this.currentHostIndex])) {
      return this.servers[this.currentHostIndex].password;
    } else {
      return "";
    }
  },

  getConnection: function () {
    return this.connection;
  },

  joinDefaultChannels: function () {
    var channelsData, channels, i, channel;
    channelsData = this.channels;
    channels = [];
    for (i = 0; i < channelsData.length; i ++) {
      channel = channelsData[i];
      channels.push(channel.name);
    }
    if (channels.length) {
      util.log("this.connection: " + this.connection);
      this.connection.sendCommand("join", channels, null);
    }
  },

  perform: function () {
    var performs = this.performs;
    if (this.performsProgress >= performs.length) {
      this.joinDefaultChannels();
      this.performsProgress = 0;
      return;
    }
    dojo.publish(diom.topics.USER_INPUT, [util.fromIndex(performs, this.performsProgress).command, this.currentHost, this.currentConnectionId]);
    this.performsProgress++;
    window.setTimeout(dojo.hitch(this, "perform"), 2500);
  },

  close: function () {
    if (this.currentHost) {
      dojo.publish(diom.topics.CONNECTION_CLOSE, [this.currentHost, this.currentConnectionId]);
      this.connection.destroy();
      this.connection = null;
      this.currentHost = null;
      this.currentConnectionId = null;
    }
  },

  destroy: function () {
    this.close();
  }

});
