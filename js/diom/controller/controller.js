/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air */

dojo.provide("diom.controller.controller");

dojo.declare("diom.controller.Controller", null, {

  constructor: function (model, view) {
    this.model = model;
    this.view = view;
    this.appVersion = null;
    this.setAppVersion();
    this.view.setAppVersion(this.appVersion);
    this.channelSubscription = null;
    this.channelList = new diom.controller.ChannelList();
    this.updater = new  diom.controller.Updater(this.model.prefs.getPrefs().updateDelay, this.model.prefs.getPrefs().updateURL);
    this.linkLog = new diom.controller.LinkLog();
    this.currentChannel = null;
    this.currentConnection = null;
    this.queryTimer = {};
    this.channelsWithActivity = {};
    this.channelsHighlighted  = {};

    this.ignores = [];
    this.getIgnores();

    this.aliases = {};
    this.getAliases();

    this.networks = {};
    this.getNetworks();

    dojo.subscribe( diom.topics.USER_INPUT, this, "handleInput");
    dojo.subscribe( diom.topics.CHANNELS_CHANGED, this, "handleChannelChange");
    dojo.subscribe( diom.topics.CHANNEL_SELECTED, this, "handleChannelSelect");
    dojo.subscribe( diom.topics.CHANNEL_ACTIVITY, this, "handleChannelActivity");
    dojo.subscribe( diom.topics.USER_HIGHLIGHT, this, "handleHighlight");
    dojo.subscribe( diom.topics.PREFS_SAVE, this, "handlePrefsSave");
    dojo.subscribe( diom.topics.NETWORK_ADD, this, "handleNetworkAdd");
    dojo.subscribe( diom.topics.NETWORK_EDIT, this, "handleNetworksEdit");
    dojo.subscribe( diom.topics.NETWORK_DELETE, this, "handleNetworksDelete");
    dojo.subscribe( diom.topics.NETWORK_CHANGE, this, "handleNetworksChanged");
    dojo.subscribe( diom.topics.NETWORK_CLOSE, this, "closeNetworkOrConnection");
    dojo.subscribe( diom.topics.SERVER_ADD, this, "handleServerAdd");
    dojo.subscribe( diom.topics.SERVER_DELETE, this, "handleServerDelete");
    dojo.subscribe( diom.topics.CHANNEL_ADD, this, "handleChannelAdd");
    dojo.subscribe( diom.topics.CHANNEL_DELETE, this, "handleChannelDelete");
    dojo.subscribe( diom.topics.PERFORM_ADD, this, "handlePerformAdd");
    dojo.subscribe( diom.topics.PERFORM_DELETE, this, "handlePerformDelete");
    dojo.subscribe( diom.topics.ALIAS_ADD, this, "handleAliasAdd");
    dojo.subscribe( diom.topics.ALIAS_DELETE, this, "handleAliasDelete");
    dojo.subscribe( diom.topics.ALIAS_CHANGE, this, "getAliases");
    dojo.subscribe( diom.topics.IGNORE_ADD, this, "handleIgnoreAdd");
    dojo.subscribe( diom.topics.IGNORE_DELETE, this, "handleIgnoreDelete");
    dojo.subscribe( diom.topics.IGNORES_CHANGE, this, "getIgnores");
    dojo.subscribe( diom.topics.CONNECTION_CLOSE, this, "closeConnection");
    dojo.subscribe( diom.topics.USER_ACTIVITY, this, "handleUserActivity");
  },

  setAppVersion: function () {
    var u, version;
    if (air) {
      //rhino tests don't have air
      u = new air.ApplicationUpdater();
      version = u.currentVersion;
    } else {
      version = "";
    }
    this.appVersion = "Diomedes IRC Version: " + version;
  },

  getIgnores: function () {
    this.model.ignores.getIgnores(dojo.hitch(this, "handleIgnores"));
  },

  handleIgnores: function (ignores) {
    var i, ignore, currentIgnores;
    if (!ignores) {
      this.ignores = [];
    } else {
      currentIgnores = {};
      for (i = 0; i < this.ignores.length; i++) {
        currentIgnores[this.ignores[i]] = 1;
      }
      for (i = 0; i < ignores.length; i++) {
        ignore = ignores[i].regex;
        if (!(ignore in currentIgnores)) {
          this.ignores.push(ignore);
        }
      }
    }
    dojo.publish(diom.topics.IGNORES_UPDATE, [this.ignores]);
  },

  getAliases: function () {
    this.model.aliases.getAliases(dojo.hitch(this, "handleAliases"));
  },

  handleAliases: function (aliases) {
    var i, alias;
    if (!aliases) {
      this.aliases = {};
      return;
    }
    for (i = 0; i < aliases.length; i++) {
      alias = aliases[i];
      this.aliases[alias.name] = alias;
    }
  },

  getNetworks: function () {
    this.model.networks.getNetworks(dojo.hitch(this, "handleGetNetworks"));
  },

  getNetwork: function (networkName) {
    networkName = this.formatNetworkName(networkName);
    if (networkName in this.networks) {
      return this.networks[networkName];
    } else {
      return null;
    }
  },

  /**
  * @param {String} connectionId
  * @private
  */
  getNetworkByConnectionId: function  (connectionId) {
    var networkName, network;
    for (networkName in this.networks) {
      if (this.networks.hasOwnProperty(networkName)) {
        network = this.networks[networkName];
        if (connectionId === network.getConnectionId()) {
          return network;
        }
      }
    }
    return null;
  },

  setNetwork: function (networkName, network) {
    networkName = this.formatNetworkName(networkName);
    this.networks[networkName] = network;
  },

  removeNetwork: function (networkName) {
    networkName = this.formatNetworkName(networkName);
    this.networks[networkName].destroy();
    delete this.networks[networkName] ;
  },

  formatNetworkName: function (networkName) {
    if (networkName) {
      return networkName.toLowerCase();
    } else {
      return null;
    }
  },

  handleGetNetworks: function (networks) {
    var i, network, connection;
    util.log("handleGetNetworks");
    if (!networks) { return; }
    for (i = 0; i < networks.length; i++) {
      network = networks[i];
      this.setNetwork(network.name, new diom.Network(network, this.model.networks, this.channelList, this.model.prefs, this.appVersion, this.ignores));
      connection = this.getNetwork(network.name).getConnection();
      if (connection) {
        this.currentConnection = connection;
        this.setCurrentChannel(this.currentConnection.getServerChannel());
      }
    }
  },

  handleNetworksChanged: function () {
    this.model.networks.getNetworks(dojo.hitch(this, "handleUpdateNetworks"));
  },

  handleUpdateNetworks: function (networks) {
    var networksFound = {},
      networkName, i, network, storedNetwork;
    for (networkName in this.networks) {
      if (this.networks.hasOwnProperty(networkName)) {
        networksFound[networkName] = 0;
      }
    }
    if (networks) {
      for (i = 0; i< networks.length; i++) {
        network = networks[i];
        networkName = this.formatNetworkName(networkName);
        storedNetwork = this.getNetwork(network.name);
        if (!(storedNetwork)) {
          this.setNetwork(network.name, new diom.Network(network, this.model.networks, this.channelList, this.model.prefs));
        } else {
          delete networksFound[this.formatNetworkName(network.name)];
        }
      }
    }
    for (networkName in networksFound) {
      if (networksFound.hasOwnProperty(networkName)) {
        this.removeNetwork(networkName);
      }
    }
  },

  handleIgnoreDelete: function (id) {
    this.model.ignores.remIgnore(id);
  },

  handleIgnoreAdd: function (data) {
    this.model.ignores.addIgnore(data.regex, data.active);
  },

  handleAliasDelete: function (id) {
    this.model.aliases.remAlias(id);
  },

  handleAliasAdd: function (data) {
    this.model.aliases.addAlias(data.name, data.command, data.active, 0);
  },

  handlePerformDelete: function (id, networkId) {
    this.model.networks.remPerform(id, networkId);
  },

  handlePerformAdd: function (data) {
    this.model.networks.addPerform(data.networkId, data.name, data.command, data.active);
  },

  handleChannelDelete: function (id, networkId) {
    this.model.networks.remChannel(id, networkId);
  },

  handleChannelAdd: function (data) {
    this.model.networks.addChannel(data.networkId, data.name, data.autoJoin);
  },

  handleServerDelete: function (id, networkId) {
    this.model.networks.remServer(id, networkId);
  },

  handleServerAdd: function (data) {
    this.model.networks.addServer(data.networkId, data.name, data.active, data.password);
  },

  handlePrefsSave: function (prefs) {
    this.model.prefs.setPrefs(prefs);
    this.model.prefs.savePrefs();
  },

  handleNetworkAdd: function (data) {
    this.model.networks.addNetwork(data.name, data.nick, data.altNick, data.userName, data.realName, data.finger, data.autoJoin, data.active);
  },

  handleNetworksEdit: function (id, data) {
    this.model.networks.editNetwork(id, data.name, data.nick, data.altNick, data.userName, data.realName, data.finger, data.autoJoin, data.active);
  },

  handleNetworksDelete: function (id) {
    this.model.networks.remNetwork(id);
  },

  /**
  * @param {String} server
  * @param {String} type
  * @param {String} name
  * @param {String} connectionId
  * @private
  */
  handleChannelSelect: function (server, type, name, connectionId) {
    util.log("handlechannelselect");
    delete this.currentConnection;
    this.currentConnection = this.channelList.getConnection(connectionId);
    if (type === "SERVER") {
      this.setCurrentChannel(this.channelList.getServerChannel(connectionId));
    } else {
      this.setCurrentChannel(this.channelList.getChannel(name, connectionId));
    }
  },

  /**
  * @param {String} input
  * @param {String} server
  * @param {String} connectionId
  * @private
  */
  handleInput: function (input, server, connectionId) {

    var argsR, cmd, nick, hostParts, host, port,
      networkName, network, connection;

    util.log("input: " + input + " server: " + server);
    if (input.search("/") === 0) {
      //it's a command
      argsR = input.substr(1).split(" ");
      cmd = argsR.shift().toLowerCase();
      util.log("cmd:" + cmd);
      if (cmd === "server") {
        util.log("Connecting to a server.");
        if (argsR.length > 0) {
          hostParts = argsR[0].split(":");
          host = hostParts[0];
          port = ((hostParts.length > 1) ? hostParts[1] : null);
          connection = this.channelList.createConnection(host, port, this.model.prefs.getPrefs(), this.appVersion, this.ignores);
          if (!this.currentConnection) {
            this.currentConnection = connection;
            this.setCurrentChannel(connection.getServerChannel());
          }
        } else {
          util.log("not enough args given to connect to server");
        }
      } else if (cmd === "w" || cmd === "win") {
        dojo.publish(diom.topics.INPUT_CHANNEL_INDEX, [parseInt(argsR.shift(), 10) - 1 ]);
      } else if (cmd === "network") {
        if (argsR.length > 0) {
          networkName = argsR.shift();
          network = this.getNetwork(networkName);
          if (network) {
            network.connect();
            this.currentConnection = network.getConnection();
            this.setCurrentChannel(this.currentConnection.getServerChannel());
          }
        }
      } else if (cmd === "exit") {
        if (this.view.getConfirmation("exit the application")) {
          window.close();
        }
      } else if (cmd === "close") {
        if (this.currentConnection) {
          this.closeNetworkOrConnection(this.currentConnection.server, this.currentConnection.getConnectionId());
        }
      } else if (cmd === "help") {
        this.view.displayHelp();
      } else if (cmd === "clear") {
        this.currentChannel.clearActivity();
        this.view.clearActivityView();
      } else if (cmd in this.aliases && server && connectionId) {
        dojo.publish(diom.topics.USER_INPUT, [this.createInputFromAlias(this.aliases[cmd], argsR), server, connectionId]);
      } else {
        //hand command over to currentConnection
        if (server && connectionId) {
          connection = this.channelList.getConnection(connectionId);
          if (connection) {
            connection.sendCommand(cmd, this.replaceTokens(argsR, connection), server);
          }
        } else if (this.currentConnection) {
          util.log("cascading cmd down to connection");
          this.currentConnection.sendCommand(cmd, this.replaceTokens(argsR, this.currentConnection), this.getCurrentChannelName());
        }
      }
    } else {
      //just a message, hand to currentConnection
      if (this.currentConnection) {
        this.currentConnection.sendMessage(this.getCurrentChannelName(), input);
      }
    }
  },

  /**
  * @param {String} host
  * @param {String} connectionId
  * @private
  */
  closeNetworkOrConnection: function (host, connectionId) {

    var network;

    if (this.view.getConfirmation("close a connection")) {
      network = this.getNetworkByConnectionId(connectionId);
      if (network) {
        network.close();
      } else {
        this.closeConnection(host, connectionId);
      }
    }
  },

  createInputFromAlias: function (alias, args) {
    var cmd, i, arg, token;
    if (!this.currentConnection) { return; }
    cmd = alias.command;
    args = this.replaceTokens(args, this.currentConnection);
    cmd = this.replaceTokens(cmd.split(" "), this.currentConnection).join(" ");
    for (i = 0; i < args.length; i++) {
      arg = args[i];
      token = "$" + (i + 1);
      cmd = cmd.split(token).join(arg);
    }
    return cmd;
  },

  replaceTokens: function (args, connection) {
    var tokens, newArgs, i, arg;
    if (!args || !args.length) { return args; }
    tokens = {
      "$nick" : connection.getNick(),
      "$channel" : (this.currentChannel && this.currentChannel.name ? this.currentChannel.name : connection.server),
      "$server" : connection
    };
    newArgs = [];
    for (i = 0; i < args.length; i++) {
      arg = args[i];
      if (arg in tokens) {
        newArgs[i] = tokens[arg];
      } else {
        newArgs[i] = arg;
      }
    }
    return newArgs;
  },

  /**
  * @param {String} host
  * @param {String} connectionId;
  */
  closeConnection: function (host, connectionId) {

    var currentHost, connection, currentConnectionId;

    if (!connectionId) { return; }
    currentHost = null;
    currentConnectionId = null;
    if (this.currentConnection) {
      currentHost = this.currentConnection.server;
      currentConnectionId = this.currentConnection.getConnectionId();
    }
    connection = this.channelList.getConnection(connectionId);
    connection.sendCommand("quit", ["Leaving."], this.getCurrentChannelName());
    this.channelList.destroyConnection(connectionId);
    this.handleChannelChange("destroy", null , host, null, connectionId);
    if (currentConnectionId === connectionId) {
      this.view.clearActivityView();
      this.view.clearNickView();
      delete this.currentConnection;
      delete this.currentChannel;
      this.currentConnection = null;
      this.currentChannel = null;
    }
  },

  /**
  * @param {String} type
  * @param {String} channelName
  * @param {String} serverName
  * @param {String} arg
  * @param {String} connectionId
  * @private
  */
  handleChannelChange: function (type, channelName, serverName, arg, connectionId) {

    var currentChannelName;

    //handles changes to channel list
    //XXX: this sucks, this special magical flag shit, how does handleChannelsChange have
    //any guarantee that these types wont change, etc
    this.view.updateChannelView(this.channelList.getChannels(), this.channelsWithActivity, this.channelsHighlighted, this.channelList.getServerChannels());
    if (this.currentConnection && type && type === "part") {
      currentChannelName = this.currentConnection.getChannelName(this.currentChannel.name);
      if (this.currentConnection.getConnectionId() === connectionId && currentChannelName === channelName) {
        this.setCurrentChannel(this.currentConnection.getServerChannel());
      }
    } else if (this.currentConnection && type && type === "nick"  && arg) {
      this.setCurrentChannel(this.currentConnection.getChannel(arg));
    } else if (type && type === "connect") {
      this.handleChannelSelect(serverName, "SERVER",  null, connectionId);
      this.currentConnection = this.channelList.getConnection(connectionId);
      this.setCurrentChannel(this.channelList.getServerChannel(connectionId));
    } else if (connectionId && type && type === "join") {
      this.currentConnection = this.channelList.getConnection(connectionId);
      this.setCurrentChannel(this.currentConnection.getChannel(channelName));
    } else if (this.currentConnection && type && type === "join") {
      this.setCurrentChannel(this.currentConnection.getChannel(channelName));
    }
  },

  /**
  * @param {Object} channel
  * @private
  */
  setCurrentChannel: function (channel) {

    var serverName, channelName, connectionId;

    if (this.currentConnection) {
      util.log("set currentChannel");
      if (this.channelSubscription) {
        dojo.unsubscribe(this.channelSubscription);
      }
      if (this.nickListSubscription) {
        dojo.unsubscribe(this.nickListSubscription);
      }
      delete this.currentChannel;
      serverName = this.currentConnection.server;
      channelName = this.currentConnection.getChannelName(channel.name);
      connectionId = this.currentConnection.getConnectionId();
      this.view.changeView(serverName, channelName, channel.getTopic(), connectionId);
      if (connectionId in this.channelsWithActivity  && channelName in this.channelsWithActivity[connectionId]) {
        delete this.channelsWithActivity[connectionId][channelName];
      }
      if (connectionId in this.channelsHighlighted  && channelName in this.channelsHighlighted[connectionId]) {
        delete this.channelsHighlighted[connectionId][channelName];
      }
      this.currentChannel = channel;
      this.currentChannel.publishUserActivity();
      this.view.finishChannelChange();
      this.handleChannelChange("set", channelName, serverName, null, connectionId);
    }
  },

  /**
  * @param {String} channelName
  * @param {String} serverName
  * @param {Boolean} isPam
  * @param {String} connectionId
  * @private
  */
  handleChannelActivity: function (channelName, serverName, isPM, connectionId) {
    if (!(connectionId in this.queryTimer)) {
      this.queryTimer[connectionId] = {};
    }
    if (!(channelName in this.queryTimer[connectionId])) {
      this.queryTimer[connectionId][channelName] = null;
    }
    if (this.queryTimer[connectionId][channelName]) {
      window.clearTimeout(this.queryTimer[connectionId][channelName]);
      this.queryTimer[connectionId][channelName] = null;
    }
    this.queryTimer[connectionId][channelName] = window.setTimeout(dojo.hitch(this, "updateChannelFromTimer", channelName, serverName, connectionId), 100);
    if (this.currentConnection && isPM) {
      if (!(this.currentConnection.getConnectionId() === connectionId && channelName === this.currentConnection.getChannelName(this.currentChannel.name))) {
        this.updateUnreadActivity(this.channelsWithActivity, channelName, serverName, connectionId);
      }
    }
  },

  /**
  * @param {String} channelName
  * @param {String} serverName
  * @param {String} nick
  * @param {String} connectionId
  * @private
  */
  handleHighlight: function (channelName, serverName, nick, connectionId) {
    if (this.currentConnection) {
      if (!(this.currentConnection.getConnectionId() === connectionId && channelName === this.currentConnection.getChannelName(this.currentChannel.name))) {
        this.updateUnreadActivity(this.channelsHighlighted, channelName, serverName, connectionId);
      }
    }
  },

  /**
  * @param {Object} channels
  * @param {String} channelName
  * @param {String} serverName
  * @param {String} connectionId
  * @private
  */
  updateUnreadActivity: function (channels, channelName, serverName, connectionId) {
      if (!(connectionId in channels)) {
        channels[connectionId] = {};
      }
      if (channelName in channels[connectionId]) {
        channels[connectionId][channelName]++;
      } else {
        channels[connectionId][channelName] = 1;
      }
      this.handleChannelChange("update", channelName, serverName, null, connectionId); //activity added to non current window;
  },

  /**
  * @param {String} channelName
  * @param {String} serverName
  * @param {String} connectionId
  * @private
  */
  updateChannelFromTimer: function (channelName, serverName, connectionId) {
    this.queryTimer[connectionId][channelName] = null;
    this.updateChannel(channelName, serverName, connectionId);
  },

  getCurrentChannelName: function () {
    if (this.currentChannel) {
      return this.currentChannel.name;
    } else {
      return null;
    }
  },

  /**
  * @param {String} serverName
  * @param {String} channelName
  * @param {String} connectionId A uuid.
  * @private
  */
  handleUserActivity: function (serverName, channelName, connectionId) {

    var connection, channel, users;

    connection = this.channelList.getConnection(connectionId);
    if (connection) {
      channel = this.channelList.getChannel(channelName, connectionId);
      if (!channel) {
        channel = connection.getServerChannel();
      }
      if (channel) {
        users = channel.getUsers();
        this.view.updateNickView(users, serverName, channelName, connectionId);
      }
    }
  },

  /**
  * @param {String} channelName
  * @param {String} serverName
  * @param {String} connectionId
  * @private
  */
  updateChannel: function (channelName, serverName, connectionId) {
    var connection, channel, nick;
    util.log("updateChannel channelName: " + channelName + " serverName: " + serverName + " connectionId: " + connectionId);
    connection = this.channelList.getConnection(connectionId);
    if (connection) {
      channel = this.channelList.getChannel(channelName, connectionId);
      if (!channel) {
        channel = connection.getServerChannel();
      }
      nick = connection.getNick();
      this.view.updateActivityView(channel.getActivity(), nick, channelName, serverName, connectionId);
    }
  },

  destroy: function () {
    util.log("destroying controller");
    delete this.channelList;
  }

});
