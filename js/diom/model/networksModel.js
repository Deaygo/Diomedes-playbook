/*jslint white: false */
/*jslint nomen: false */
/*jslint regexp: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, document, DOMParser, XMLSerializer */

dojo.provide("diom.model.networksModel");

dojo.declare("diom.model.NetworksModel", null, {

  constructor: function (model, isCurrent) {
    util.log("NetworksModel");
    this.model = model;
    this.createTablesList = [];
    //check to see if tables exists by attempting to create them
    if (!isCurrent) {
      this.createTables();
    }
  },

  createTables: function () {
		var st, types, tableName;
    util.log("createTables");
    st = this.model.SQL_TYPES;
    types = {
      id : [st.INTEGER, st.PRIMARY_KEY, st.AUTOINCREMENT].join(" "),
      name : st.TEXT,
      nick : st.TEXT,
      altNick : st.TEXT,
      userName : st.TEXT,
      realName : st.TEXT,
      finger : st.TEXT,
      active : st.BOOL,
      autoJoin : st.BOOL,
      lastConnected : st.INTEGER
    };
    util.log("creating networks");
    tableName = "networks";
    this.createTablesList.push({ tableName : tableName, types : types });
    types = {
      id : [st.INTEGER, st.PRIMARY_KEY, st.AUTOINCREMENT].join(" "),
      networkId : st.INTEGER,
      name : st.TEXT,
      lastConnected : st.INTEGER,
      active : st.BOOL
    };
    util.log("creating servers");
    tableName = "servers";
    this.createTablesList.push({ tableName : tableName, types : types });
    types = {
      id : [st.INTEGER, st.PRIMARY_KEY, st.AUTOINCREMENT].join(" "),
      networkId : st.INTEGER,
      name : st.TEXT,
      lastConnected : st.INTEGER,
      autoJoin : st.BOOL
    };
    util.log("creating channels");
    tableName = "channels";
    this.createTablesList.push({ tableName : tableName, types : types });
    types = {
      id : [st.INTEGER, st.PRIMARY_KEY, st.AUTOINCREMENT].join(" "),
      networkId : st.INTEGER,
      name : st.TEXT,
      command : st.TEXT,
      active : st.BOOL
    };
    util.log("creating preforms");
    tableName = "performs";
    this.createTablesList.push({ tableName : tableName, types : types });
    this._handleCreateTable();
    this._alterTables();
  },

  getNetworks: function (resultsHandler) {
		var sql, p;
    util.log("getNetworks");
    sql = "SELECT * FROM networks";
    p = {};
    this.model._executeSQL(sql, air.SQLMode.READ, this.model._getResultHandler(resultsHandler), p);
  },

  addNetwork: function (name, nick, altNick, userName, realName, finger, autoJoin, active) {
		var sql, p;
    util.log("adding network.");
    sql = "INSERT INTO networks (name, nick, altNick, userName, realName, finger, autoJoin, active) " +
      "Values (:name, :nick, :altNick, :userName, :realName, :finger, :autoJoin, :active)";
    p = {
      name : name,
      nick : nick,
      altNick : altNick,
      userName : userName,
      realName : realName,
      finger: finger,
      autoJoin : autoJoin,
      active : active
    };
    this.model._executeSQL(sql, air.SQLMode.UPDATE, dojo.hitch(this, "_handleChange"), p);
    dojo.publish(diom.topics.NETWORK_CHANGE, [null]);
  },

  editNetwork: function (id, name, nick, altNick, userName, realName, finger, autoJoin, active) {
		var sql, p;
    util.log("Edit network.");
    sql = "UPDATE networks SET name = :name, nick = :nick, altNick = :altNick, userName = :userName, " +
      "realName = :realName, finger = :finger, autoJoin = :autoJoin, active = :active  " +
      "WHERE id = :id ";
    p = {
      id : id,
      name : name,
      nick : nick,
      altNick : altNick,
      userName : userName,
      realName : realName,
      finger: finger,
      autoJoin : autoJoin,
      active : active
    };
    this.model._executeSQL(sql, air.SQLMode.UPDATE, dojo.hitch(this, "_handleChange"), p);
    dojo.publish(diom.topics.NETWORK_CHANGE, [id]);
  },

  remNetwork: function (id) {
		var sql, p;
    util.log("Removing network.");
    p = { id : id };
    sql = "DELETE FROM networks WHERE id = :id";
    this.model._executeSQL(sql, air.SQLMode.UPDATE, dojo.hitch(this, "_handleChange"), p);
    sql = "DELETE FROM servers WHERE networkId = :id";
    this.model._executeSQL(sql, air.SQLMode.UPDATE, dojo.hitch(this, "_handleChange"), p);
    sql = "DELETE FROM channels WHERE networkId = :id";
    this.model._executeSQL(sql, air.SQLMode.UPDATE, dojo.hitch(this, "_handleChange"), p);
    sql = "DELETE FROM performs WHERE networkId = :id";
    this.model._executeSQL(sql, air.SQLMode.UPDATE, dojo.hitch(this, "_handleChange"), p);
    dojo.publish(diom.topics.NETWORK_CHANGE, [null]);
    //rem servers, channels and performs too
  },

  getServers: function (networkId, resultsHandler) {
		var sql, p;
    sql = "SELECT * FROM servers WHERE networkId = :networkId";
    p = { networkId : networkId };
    this.model._executeSQL(sql, air.SQLMode.READ, this.model._getResultHandler(resultsHandler), p);
  },

  addServer: function (networkId, name, active, password) {
		var sql, p;
    sql = "INSERT INTO servers (networkId, name, active, password) " +
      "Values (:networkId, :name, :active, :password)";
    p = {
      networkId : networkId,
      name : name,
      active : active,
      password: password
    };
    this.model._executeSQL(sql, air.SQLMode.UPDATE, dojo.hitch(this, "_handleChange"), p);
    dojo.publish(diom.topics.NETWORK_CHANGE, [networkId]);
  },

  editServer: function (id, networkId, name, autoJoin, active) {
		var sql, p;
    sql = "UPDATE servers SET networkId = :networkId, name = :name, autoJoin = :autoJoin, active = :active " +
      "WHERE id = :id ";
    p = {
      id : id,
      networkId : networkId,
      name : name,
      autoJoin : autoJoin,
      active : active
    };
    this.model._executeSQL(sql, air.SQLMode.UPDATE, dojo.hitch(this, "_handleChange"), p);
    dojo.publish(diom.topics.NETWORK_CHANGE, [networkId]);
  },

  remServer: function (id, networkId) {
		var sql, p;
    sql = "DELETE FROM servers WHERE id = :id";
    p = { id : id };
    this.model._executeSQL(sql, air.SQLMode.UPDATE, dojo.hitch(this, "_handleChange"), p);
    dojo.publish(diom.topics.NETWORK_CHANGE, [networkId]);
  },

  getChannels: function (networkId, resultsHandler) {
		var sql, p;
    sql = "SELECT * FROM channels WHERE networkId = :networkId";
    p = { networkId : networkId };
    this.model._executeSQL(sql, air.SQLMode.READ, this.model._getResultHandler(resultsHandler), p);
  },

  addChannel: function (networkId, name, autoJoin) {
		var sql, p;
    sql = "INSERT INTO channels (networkId, name, autoJoin) " +
      "VALUES (:networkId, :name, :autoJoin)";
    p = { networkId : networkId, name : name, autoJoin : autoJoin };
    this.model._executeSQL(sql, air.SQLMode.UPDATE, dojo.hitch(this, "_handleChange"), p);
    dojo.publish(diom.topics.NETWORK_CHANGE, [networkId]);
  },

  remChannel: function (id, networkId) {
		var sql, p;
    sql = "DELETE FROM channels WHERE id = :id";
    p = { id : id };
    this.model._executeSQL(sql, air.SQLMode.UPDATE, dojo.hitch(this, "_handleChange"), p);
    dojo.publish(diom.topics.NETWORK_CHANGE, [networkId]);
  },

  getPerforms: function (networkId, resultsHandler) {
		var sql, p;
    sql = "SELECT * FROM performs WHERE networkId = :networkId";
    p = { networkId : networkId };
    this.model._executeSQL(sql, air.SQLMode.READ, this.model._getResultHandler(resultsHandler), p);
  },

  addPerform: function (networkId, name, command, active) {
    //XXX: maybe use default names such as performX where X is a number
    //so as to not force people to think up a name for each perform
		var sql, p;
    sql = "INSERT INTO performs (networkId, name, command, active) " +
      "VALUES (:networkId, :name, :command, :active)";
    p = {
      networkId : networkId,
      name : name,
      command : command,
      active : active
    };
    this.model._executeSQL(sql, air.SQLMode.UPDATE, dojo.hitch(this, "_handleChange"), p);
    dojo.publish(diom.topics.NETWORK_CHANGE, [networkId]);
  },

  editPerform: function (id, networkId, name, command, active) {
		var sql, p;
    sql = "UPDATE performs SET networkId = :networkId, name = :name " +
      "command = :command, active = :active WHERE id = :id";
    p = {
      id : id,
      networkId : networkId,
      name : name,
      command : command,
      active : active
    };
    this.model._executeSQL(sql, air.SQLMode.UPDATE, dojo.hitch(this, "_handleChange"), p);
    dojo.publish(diom.topics.NETWORK_CHANGE, [networkId]);
  },

  remPerform: function (id, networkId) {
		var sql, p;
    sql = "DELETE FROM performs WHERE id = :id";
    p = { id : id };
    this.model._executeSQL(sql, air.SQLMode.UPDATE, dojo.hitch(this, "_handleChange"), p);
    dojo.publish(diom.topics.NETWORK_CHANGE, [networkId]);
  },

  _handleCreateTable: function (e, tableName) {
		var args;
    if (tableName) {
      this.model.log("Created NetworksModel table: "  + tableName);
    }
    if (this.createTablesList.length) {
      args = this.createTablesList.shift();
      this.model._createTable(args.tableName, args.types, dojo.hitch(this, "_handleCreateTable", [args.tableName], null));
    }
  },

  _alterTables: function () {
    if (this.model.currentVersion < 1) {
      //added password options for servers (v 1, first time versioning the database):
      this.model._addColumn("servers", "password", "TEXT", dojo.hitch(this, "_handleChange"), dojo.hitch(this, "_handleError"));
    }
  },

  _handleError: function (e) {
    util.log("Database error:" + e);
  },

  _handleChange: function (e) {
    util.log("Database changed.");
  }

});
