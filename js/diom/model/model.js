/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint regexp: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, document */

dojo.provide("diom.model.model");

dojo.declare("diom.model.Model", null, {

  CURRENT_DB_VERSION: 3,

  /**
  * @constructor
  */
  constructor: function () {

    var isCurrent;

    this.SQL_TYPES = {
      "INTEGER" : "INTEGER",
      "TEXT" : "TEXT",
      "BOOL" : "BOOLEAN",
      "PRIMARY_KEY" : "PRIMARY KEY",
      "AUTOINCREMENT" : "AUTOINCREMENT"
    };
    this.statement = null;
    this.DATABASE_NAME = "diomedesModel.db";
    this.prefs = new diom.model.PrefModel(this);
    this.currentVersion = parseInt(this.prefs.getPref("databaseVersion"), 10);
    util.log("dbversion: " + this.currentVersion);
    isCurrent = this.CURRENT_DB_VERSION === this.currentVersion;
    util.log("is database current: " + isCurrent);
    this.aliases = new diom.model.AliasModel(this, isCurrent);
    this.networks = new diom.model.NetworksModel(this, isCurrent);
    this.ignores = new diom.model.IgnoresModel(this, isCurrent);
    this.conn = null;
    if (!isCurrent) {
      this.prefs.setPref("databaseVersion", this.CURRENT_DB_VERSION);
      this.prefs.savePrefs();
    }
  },

  _openSQLConn: function (type, errorHandler) {
    var dbFile;
    if (!type) {
      this.log("Required params missing for _openSQLConn");
      return;
    }
    if (!errorHandler) {
      errorHandler = dojo.hitch(this, "_handleError", ["openSQLConnection"]);
    }
    if (this.conn) { this.closeConnection(); }
    this.conn = new air.SQLConnection();
    dbFile = air.File.applicationStorageDirectory.resolvePath(this.DATABASE_NAME);
    try {
      this.conn.open(dbFile, type);
    } catch (error) {
      errorHandler(error);
    }
  },

  _executeSQL: function (sql, type, resultsHandler, parameters, errorHandler, isRexecution) {
    var s, i;
    if (!sql || !type || !resultsHandler) {
      this.log("Required params missing for _executeSQL");
      return;
    }
    if (!errorHandler) {
      errorHandler = dojo.hitch(this, "_handleError", ["SQL: " + sql]);
    }
    if (!this.conn || !this.conn.connected) {
      this._openSQLConn(type, errorHandler);
    }
    s = new air.SQLStatement();
    s.sqlConnection = this.conn;
    this.statement = s;
    this.log("executing sql: " + sql);
    s.text = sql;
    if (parameters) {
      for (i in parameters) {
        if (parameters.hasOwnProperty(i) && i !== "prototype") {
          s.parameters[":" + i] = parameters[i];
        }
      }
    }
    try {
      s.execute();
    } catch (error) {
      this._statementResultHandler(error, errorHandler);
      return;
    }
    this._statementResultHandler(null, resultsHandler);
  },

  _statementResultHandler: function (e, resultsHandler) {
    var result;
    result = this.statement.getResult();
    delete this.statement;
    this.statement = null;
    this.closeConnection();
    resultsHandler(e, result);
  },

  _getResult: function (e, result, resultsHandler) {
    resultsHandler(result.data);
  },

  _getFilterResult: function (args, e,  results) {
    var resultsHandler = args[0];
    resultsHandler(results.data);
  },

  _getResultHandler: function (resultsHandler) {
    //filters the event, and returns just the data;
    return dojo.hitch(this, "_getFilterResult", [resultsHandler]);
  },

  _addColumn: function (tableName, columnName, type, resultsHandler, errorHandler) {

    var sql;

    sql = [];
    sql = sql.concat(["ALTER TABLE", tableName, "ADD COLUMN", columnName, type]);
    this._executeSQL(sql.join(" "), air.SQLMode.UPDATE, resultsHandler, null, errorHandler);

  },

  _createTable: function (name, types, resultsHandler, parameters, errorHandler) {

    var sql, typeNames;

    this.log("Creating Table.");
    sql = [];
    sql = sql.concat(["CREATE TABLE IF NOT EXISTS ", name, " ("]);
    for (typeNames in types) {
      if (types.hasOwnProperty(typeNames)) {
        sql.push([typeNames, types[typeNames]].join(" "));
        sql.push(", ");
      }
    }
    sql.pop(); //get rid of last comma
    sql.push(")");
    this._executeSQL(sql.join(""), air.SQLMode.CREATE, resultsHandler, parameters, errorHandler);
  },

  _handleError: function (e, msg) {
    this.log("error: " + e);
    this.log("message: " + msg);
    this.log("Error message:", e.error.message);
    this.log("Details:", e.error.details);
  },

  log: function (msg) {
    util.log("\nSQL LOG: " + msg);
  },

  closeConnection: function () {
    if (this.conn && this.conn.connected) {
      this.conn.close();
    }
    this.conn = null;
  }

});


